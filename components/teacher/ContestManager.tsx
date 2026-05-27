
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, ArrowRight, Eye, EyeOff, BookOpen, Search, X, Check, ClipboardList, Download, ExternalLink, Save, Users, CalendarClock, FileDown, ArrowLeft, Building2, GraduationCap, Award, PenTool, Sparkles, Image as ImageIcon, Stamp, Upload, ChevronDown, Filter, Settings, FileArchive } from 'lucide-react';
import { Contest, Problem, ProblemBank, ContestType, ProjectSubmission, User, CertificateConfig, ContestResult } from '../../types';
import { generateCertificateBackground, createContest, updateContest, deleteContest, getProjectSubmissions, gradeProjectSubmission, unregisterStudent } from '../../services/api';
import { Button, Modal, DifficultyBadge, StatusBadge, Card, Pagination } from '../UiComponents';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// Helper to download CSV
const downloadCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Helper to download image from canvas
const downloadImage = (canvas: HTMLCanvasElement, filename: string) => {
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- ASSETS & CONSTANTS ---
const DEFAULT_BG_PLACEHOLDER = "https://placehold.co/800x600/fffbf0/e2e8f0.png?text=Certificate+Background";
const DEFAULT_SEAL = "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Seal_of_the_University_of_Chicago.svg/480px-Seal_of_the_University_of_Chicago.svg.png";

const INITIAL_CERT_CONFIG: CertificateConfig = {
    bgUrl: DEFAULT_BG_PLACEHOLDER,
    sealUrl: DEFAULT_SEAL,
    items: [
        { id: 'title', type: 'static-text', text: '荣誉证书', x: 400, y: 120, fontSize: 48, color: '#333333', fontFamily: 'serif', fontWeight: 'bold' },
        { id: 'subtitle', type: 'variable-text', field: 'contestName', x: 400, y: 180, fontSize: 24, color: '#555555', fontFamily: 'serif' },
        { id: 'body1', type: 'static-text', text: '特此表彰', x: 400, y: 240, fontSize: 18, color: '#666666', fontFamily: 'sans-serif' },
        { id: 'name', type: 'variable-text', field: 'name', x: 400, y: 300, fontSize: 56, color: '#1e3a8a', fontFamily: 'serif', fontWeight: 'bold' },
        { id: 'body2', type: 'static-text', text: '在本次比赛中表现优异，荣获', x: 400, y: 380, fontSize: 18, color: '#666666', fontFamily: 'sans-serif' },
        { id: 'award', type: 'variable-text', field: 'award', x: 400, y: 440, fontSize: 32, color: '#b45309', fontFamily: 'serif', fontWeight: 'bold' },
        { id: 'date', type: 'variable-text', field: 'date', x: 600, y: 500, fontSize: 14, color: '#888888', fontFamily: 'sans-serif' },
    ]
};

export const ContestManager = ({
    contests,
    setContests,
    problems,
    banks,
    students,
    showToast
}: {
    contests: Contest[],
    setContests: React.Dispatch<React.SetStateAction<Contest[]>>,
    problems: Problem[],
    banks: ProblemBank[],
    students: any[],
    showToast: (msg: string, type?: 'success' | 'info' | 'error') => void
}) => {
    const [view, setView] = useState<'list' | 'registration' | 'certificate' | 'award_management' | 'grading'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Date formatting helpers
    const toLocalInputFormat = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const pad = (n: number) => n < 10 ? '0' + n : n;
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const [form, setForm] = useState<Partial<Contest>>({ title: '', description: '', type: ContestType.CODING, startTime: '', endTime: '' });
    const [selectedProblems, setSelectedProblems] = useState<string[]>([]);

    // Pagination for Contest List
    const [contestPage, setContestPage] = useState(1);
    const contestsPerPage = 8;

    // Selector Overlay State
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [activeBankId, setActiveBankId] = useState<string>('all');
    const [problemSearch, setProblemSearch] = useState('');

    // Grading Modal State
    const [isGradingOpen, setIsGradingOpen] = useState(false);
    const [gradingContest, setGradingContest] = useState<Contest | null>(null);
    const [gradingSubmissions, setGradingSubmissions] = useState<ProjectSubmission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<ProjectSubmission | null>(null);


    // Registration View State
    const [regContest, setRegContest] = useState<Contest | null>(null);
    const [regSearchTerm, setRegSearchTerm] = useState('');
    const [regPage, setRegPage] = useState(1); // Pagination for registration list
    const regItemsPerPage = 10;

    // Certificate Designer & Award Logic State
    const [certContest, setCertContest] = useState<Contest | null>(null);
    const [certConfig, setCertConfig] = useState<CertificateConfig>(INITIAL_CERT_CONFIG);
    const [isGeneratingBg, setIsGeneratingBg] = useState(false);
    const [selectedCertItemId, setSelectedCertItemId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sealInputRef = useRef<HTMLInputElement>(null);

    // Award Management State
    const [awardStudents, setAwardStudents] = useState<ContestResult[]>([]); // Working copy of results
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [awardInput, setAwardInput] = useState('');

    // --- Helpers ---
    const handleSaveCertificate = async () => {
        if (!certContest) return;
        setLoading(true);
        try {
            const updatedContest = await updateContest(certContest.id, {
                ...certContest,
                certificateConfig: certConfig
            });
            setContests(prev => prev.map(c => c.id === certContest.id ? { ...c, ...updatedContest } : c));
            setCertContest(prev => ({ ...prev, ...updatedContest })); // Keep local state in sync but preserve other props if needed

            showToast("证书配置已保存");
            setView('list');
        } catch (error) {
            showToast("保存失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAiGenerateBg = async () => {
        if (!certContest) return;
        setIsGeneratingBg(true);
        try {
            const bgDataUrl = await generateCertificateBackground(certContest.title);
            if (bgDataUrl) {
                setCertConfig(prev => ({ ...prev, bgUrl: bgDataUrl }));
            } else {
                showToast("生成失败，请重试", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("AI 服务暂时不可用", "error");
        }
        setIsGeneratingBg(false);
    };

    const exportRegistrations = () => {
        if (!regContest || !regContest.registeredStudentIds) return;
        const data = regContest.registeredStudentIds.map(id => {
            const s = students.find(u => u.id === id);
            return {
                ID: id,
                Name: s?.name || 'Unknown',
                Class: s?.className || '',
                Major: s?.major || ''
            };
        });
        downloadCSV(data, `${regContest.title}_报名名单`);
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!regContest) return;
        if (window.confirm("确定要移除该学生的报名吗？")) {
            setLoading(true);
            try {
                await unregisterStudent(regContest.id, studentId);
                setContests(prev => prev.map(c => {
                    if (c.id !== regContest.id) return c;
                    const updatedIds = (c.registeredStudentIds || []).filter(id => id !== studentId);
                    return {
                        ...c,
                        registeredStudentIds: updatedIds,
                        participantCount: updatedIds.length
                    };
                }));
                setRegContest(prev => prev ? {
                    ...prev,
                    registeredStudentIds: (prev.registeredStudentIds || []).filter(id => id !== studentId),
                    participantCount: (prev.participantCount || 0) - 1
                } : null);
                showToast("学生已从比赛中移除");
            } catch (error) {
                showToast("移除失败", "error");
            } finally {
                setLoading(false);
            }
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setForm({
            title: '',
            description: '',
            type: ContestType.CODING,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 86400000).toISOString(),
            problemIds: []
        });
        setSelectedProblems([]);
        setIsModalOpen(true);
    };

    const openRegistration = (c: Contest) => {
        setRegContest(c);
        setRegSearchTerm('');
        setRegPage(1);
        setView('registration');
    };

    const toggleLeaderboard = async (contestId: string) => {
        const contest = contests.find(c => c.id === contestId);
        if (!contest) return;
        try {
            const newValue = !contest.isLeaderboardOpen;
            await updateContest(contestId, {
                ...contest, // Send other fields if needed, or API needs to support partial updates better. 
                // Currently updateContest expects a full body or at least mostly full. 
                // Ideally PATCH, but currently PUT. Let's send what we have.
                isLeaderboardOpen: newValue
            });
            setContests(prev => prev.map(c => c.id === contestId ? { ...c, isLeaderboardOpen: newValue } : c));
            showToast(newValue ? "榜单已发布" : "榜单已隐藏");
        } catch (error) {
            console.error("Failed to toggle leaderboard");
            showToast("操作失败", "error");
        }
    };

    const openGrading = async (c: Contest) => {
        setGradingContest(c);
        try {
            const subs = await getProjectSubmissions(c.id);
            setGradingSubmissions(subs || []);
            setIsGradingOpen(true);
        } catch (error) {
            showToast("加载数据失败", "error");
        }
    };

    const openCertificateDesigner = (c: Contest) => {
        setCertContest(c);
        if (c.certificateConfig) {
            setCertConfig(c.certificateConfig);
        } else {
            setCertConfig(INITIAL_CERT_CONFIG);
        }
        setView('certificate');
    };

    const openEditModal = (c: Contest) => {
        setEditingId(c.id);
        setForm({ ...c });
        setSelectedProblems(c.problemIds || []);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("确定要删除这个比赛吗？")) {
            try {
                await deleteContest(id);
                setContests(prev => prev.filter(c => c.id !== id));
                showToast("比赛已删除");
            } catch (error) {
                showToast("删除失败", "error");
            }
        }
    };

    const handleSave = async () => {
        if (!form.title) {
            showToast("请输入比赛名称", "error");
            return;
        }

        const contestData = {
            ...form,
            problemIds: form.type === ContestType.CODING ? selectedProblems : undefined
        };

        setLoading(true);
        try {
            if (editingId) {
                const updated = await updateContest(editingId, contestData);
                setContests(prev => prev.map(c => c.id === editingId ? { ...c, ...updated } : c));
                showToast("更新成功");
            } else {
                const created = await createContest(contestData); // Changed back to createContest as per original logic
                setContests(prev => [...prev, { ...created, participantCount: 0, registeredStudentIds: [], problemIds: selectedProblems }]);
                showToast("创建成功");
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            showToast("保存失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleProblemSelection = (problemId: string) => {
        setSelectedProblems(prev => prev.includes(problemId) ? prev.filter(id => id !== problemId) : [...prev, problemId]);
    };

    const batchDownload = async () => {
        if (!gradingContest || gradingSubmissions.length === 0) {
            showToast("没有可下载的作品", "info");
            return;
        }
        showToast("正在打包所有作品，请稍候...", "info");
        setLoading(true);
        try {
            const zip = new JSZip();
            const folder = zip.folder(`${gradingContest.title}_Submissions`);

            await Promise.all(gradingSubmissions.map(async (sub) => {
                const studentFolder = folder?.folder(`${sub.userName}_${sub.userId}`);

                // Info Request
                studentFolder?.file('info.txt',
                    `Name: ${sub.userName}\n` +
                    `ID: ${sub.userId}\n` +
                    `Score: ${sub.score || 'Not Graded'}\n` +
                    `Video URL: ${sub.videoUrl}\n` +
                    `Submitted: ${new Date(sub.submittedAt).toLocaleString()}`
                );

                // Code File
                if (sub.codeUrl) {
                    try {
                        const response = await fetch(sub.codeUrl);
                        const blob = await response.blob();
                        const filename = sub.codeUrl.split('/').pop() || 'code.zip';
                        studentFolder?.file(filename, blob);
                    } catch (e) {
                        console.error(`Failed to download code for ${sub.userName}`, e);
                        studentFolder?.file('code_download_failed.txt', 'Failed to fetch code file.');
                    }
                }

                // Doc File
                if (sub.docUrl) {
                    try {
                        const response = await fetch(sub.docUrl);
                        const blob = await response.blob();
                        const filename = sub.docUrl.split('/').pop() || 'doc.pdf';
                        studentFolder?.file(filename, blob);
                    } catch (e) {
                        console.error(`Failed to download doc for ${sub.userName}`, e);
                        studentFolder?.file('doc_download_failed.txt', 'Failed to fetch doc file.');
                    }
                }
            }));

            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${gradingContest.title}_Submissions.zip`);
            showToast("下载已开始", "success");
        } catch (error) {
            console.error(error);
            showToast("打包失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const exportGrades = () => {
        if (!gradingContest) return;
        const data = gradingSubmissions.map(s => ({
            ID: s.userId,
            Name: s.userName,
            Score: s.score || 0,
            Feedback: s.feedback || ''
        }));
        downloadCSV(data, `${gradingContest.title}_成绩单`);
    };

    const handleSaveGrade = async () => {
        if (!gradingContest) return;
        setLoading(true);
        try {
            // Save all grades that have a score
            const promises = gradingSubmissions.map(sub => {
                if (sub.score !== undefined) {
                    return gradeProjectSubmission(gradingContest.id, sub.userId, {
                        score: Number(sub.score),
                        feedback: sub.feedback
                    });
                }
                return Promise.resolve();
            });

            await Promise.all(promises);
            showToast('成绩保存成功', 'success');
            setIsGradingOpen(false);
        } catch (error) {
            console.error(error);
            showToast('保存成绩失败', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleScoreChange = (userId: string, score: string) => {
        const numScore = parseInt(score);
        setGradingSubmissions(prev => prev.map(s => s.userId === userId ? { ...s, score: isNaN(numScore) ? undefined : numScore } : s));
    };

    const filteredProblems = problems.filter(p => {
        const matchesBank = activeBankId === 'all' || p.bankId === activeBankId;
        const matchesSearch = p.title.toLowerCase().includes(problemSearch.toLowerCase()) || p.tags?.some(t => t.includes(problemSearch));
        return matchesBank && matchesSearch;
    });

    // --- Certificate Rendering & Logic (Omitted for brevity, same as before) ---
    // ... (keeping previous certificate logic) ...
    const drawCertificate = (ctx: CanvasRenderingContext2D, config: CertificateConfig, previewName = "张三", previewAward = "一等奖") => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const drawContent = () => {
            config.items.forEach(item => {
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.font = `${item.fontWeight || 'normal'} ${item.fontSize}px ${item.fontFamily === 'serif' ? 'STSong, serif' : 'Arial, sans-serif'}`;
                ctx.fillStyle = item.color;
                let text = "";
                if (item.type === 'static-text') {
                    text = item.text || "";
                } else {
                    if (item.field === 'contestName') text = certContest?.title || "编程比赛";
                    if (item.field === 'name') text = previewName;
                    if (item.field === 'award') text = previewAward;
                    if (item.field === 'date') text = new Date().toLocaleDateString();
                }
                ctx.fillText(text, item.x, item.y);
                if (item.id === selectedCertItemId) {
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = "#3b82f6";
                    const metrics = ctx.measureText(text);
                    const w = metrics.width;
                    const h = item.fontSize;
                    ctx.strokeRect(item.x - w / 2 - 5, item.y - h / 2, w + 10, h + 5);
                }
            });
            if (config.sealUrl) {
                const seal = new Image();
                seal.crossOrigin = "anonymous";
                seal.src = config.sealUrl;
                seal.onload = () => {
                    ctx.globalAlpha = 0.9;
                    ctx.drawImage(seal, 580, 350, 120, 120);
                    ctx.globalAlpha = 1.0;
                };
            }
        };
        if (config.bgUrl) {
            const bg = new Image();
            bg.crossOrigin = "anonymous";
            bg.src = config.bgUrl;
            bg.onload = () => {
                ctx.drawImage(bg, 0, 0, ctx.canvas.width, ctx.canvas.height);
                drawContent();
            };
            bg.onerror = () => {
                drawFallbackBackground(ctx);
                drawContent();
            };
        } else {
            drawFallbackBackground(ctx);
            drawContent();
        }
    };

    const drawFallbackBackground = (ctx: CanvasRenderingContext2D) => {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        ctx.fillStyle = "#fffbf0";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 10;
        ctx.strokeRect(10, 10, w - 20, h - 20);
    };

    useEffect(() => {
        if (view === 'certificate' && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                drawCertificate(ctx, certConfig);
            }
        }
    }, [view, certConfig, certContest, selectedCertItemId]);

    const updateCertItem = (id: string, updates: any) => {
        setCertConfig(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, ...updates } : item)
        }));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'bg' | 'seal') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                const url = event.target.result as string;
                setCertConfig(prev => ({
                    ...prev,
                    [type === 'bg' ? 'bgUrl' : 'sealUrl']: url
                }));
            }
        };
        reader.readAsDataURL(file);
    };

    const openAwardManagement = () => {
        if (!certContest) return;
        if (certContest.results && certContest.results.length > 0) {
            setAwardStudents(certContest.results);
        } else {
            const initialResults: ContestResult[] = (certContest.registeredStudentIds || []).map(id => {
                const student = students.find(s => s.id === id);
                const projectSub = certContest.projectSubmissions?.find(s => s.userId === id);
                return {
                    userId: id,
                    userName: student?.name || '未知',
                    score: projectSub?.score || (Math.floor(Math.random() * 100)),
                    awardName: undefined
                };
            });
            setAwardStudents(initialResults);
        }
        setView('award_management');
    };

    const toggleStudentSelection = (id: string) => {
        setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]);
    };

    const selectAllStudents = () => {
        if (selectedStudentIds.length === awardStudents.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(awardStudents.map(s => s.userId));
        }
    };

    const applyAwardToSelection = (awardName: string) => {
        if (selectedStudentIds.length === 0) {
            showToast("请先选择学生", "info");
            return;
        }
        setAwardStudents(prev => prev.map(s => selectedStudentIds.includes(s.userId) ? { ...s, awardName: awardName } : s));
        setSelectedStudentIds([]);
    };

    const autoAssignAwards = (config: { topPct: number, awardName: string }) => {
        const sorted = [...awardStudents].sort((a, b) => (b.score || 0) - (a.score || 0));
        const count = Math.ceil(sorted.length * (config.topPct / 100));
        const targetIds = sorted.slice(0, count).map(s => s.userId);
        setAwardStudents(prev => prev.map(s => targetIds.includes(s.userId) ? { ...s, awardName: config.awardName } : s));
        showToast(`已根据排名将前 ${config.topPct}% (${count}人) 设置为 ${config.awardName}`);
    };

    const saveAwardsAndPublish = async () => {
        if (!certContest) return;
        const updatedContest = {
            ...certContest,
            results: awardStudents,
            certificateConfig: certConfig
        };
        setLoading(true);
        try {
            // FIX: Ensure we call backend API to persist awards
            await updateContest(certContest.id, updatedContest);

            setContests(prev => prev.map(c => c.id === certContest.id ? { ...c, ...updatedContest } : c));
            setCertContest(prev => ({ ...prev, ...updatedContest })); // Update local state fully

            showToast("颁奖信息已保存！学生现在可以在个人中心查看证书。");
            setView('certificate');
        } catch (error) {
            console.error(error);
            showToast("保存失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const batchDownloadCertificates = async () => {
        const awarded = awardStudents.filter(s => s.awardName);
        if (awarded.length === 0) {
            showToast("暂无学生获得奖项，无法导出", "info");
            return;
        }
        showToast(`正在生成 ${awarded.length} 张证书，这可能需要一点时间...`, "info");
        setLoading(true);

        try {
            const zip = new JSZip();
            const folder = zip.folder(`${certContest?.title || 'Certificates'}_Awards`);

            // 1. Pre-load images
            const bgImg = new Image();
            bgImg.crossOrigin = "anonymous";
            const sealImg = new Image();
            sealImg.crossOrigin = "anonymous";

            await new Promise((resolve) => {
                let loaded = 0;
                let total = 0;
                if (certConfig.bgUrl) total++;
                if (certConfig.sealUrl) total++;

                if (total === 0) { resolve(null); return; }

                const check = () => { if (++loaded >= total) resolve(null); };

                if (certConfig.bgUrl) {
                    bgImg.src = certConfig.bgUrl;
                    bgImg.onload = check;
                    bgImg.onerror = check; // proceed even if error
                }
                if (certConfig.sealUrl) {
                    sealImg.src = certConfig.sealUrl;
                    sealImg.onload = check;
                    sealImg.onerror = check;
                }
            });

            // 2. Draw for each student
            for (const student of awarded) {
                const canvas = document.createElement('canvas');
                canvas.width = 800;
                canvas.height = 600;
                const ctx = canvas.getContext('2d');
                if (!ctx) continue;

                // Draw Background
                if (certConfig.bgUrl && bgImg.complete && bgImg.naturalWidth > 0) {
                    ctx.drawImage(bgImg, 0, 0, 800, 600);
                } else {
                    ctx.fillStyle = "#fffbf0"; ctx.fillRect(0, 0, 800, 600);
                    ctx.strokeStyle = "#d4af37"; ctx.lineWidth = 10; ctx.strokeRect(10, 10, 780, 580);
                }

                // Draw Items
                certConfig.items.forEach(item => {
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.font = `${item.fontWeight || 'normal'} ${item.fontSize}px ${item.fontFamily === 'serif' ? 'STSong, serif' : 'Arial, sans-serif'}`;
                    ctx.fillStyle = item.color;
                    let text = "";
                    if (item.type === 'static-text') {
                        text = item.text || "";
                    } else {
                        if (item.field === 'contestName') text = certContest?.title || "编程比赛";
                        if (item.field === 'name') text = student.userName || "未知";
                        if (item.field === 'award') text = student.awardName || "奖项";
                        if (item.field === 'date') text = new Date().toLocaleDateString();
                    }
                    ctx.fillText(text, item.x, item.y);
                });

                // Draw Seal
                if (certConfig.sealUrl && sealImg.complete && sealImg.naturalWidth > 0) {
                    ctx.globalAlpha = 0.9;
                    ctx.drawImage(sealImg, 580, 350, 120, 120);
                    ctx.globalAlpha = 1.0;
                }

                // Add to Zip
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                if (blob) {
                    folder?.file(`${student.userName}_${student.awardName}.png`, blob);
                }
            }

            // 3. Download
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `${certContest?.title}_Certificates.zip`);
            showToast("下载请求已发送", 'success');

        } catch (e) {
            console.error(e);
            showToast("批量生成失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const generateAndDownloadCert = (studentName: string, awardName: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Re-use logic (simplified call if drawCertificate was outside component, but it's inside)
        // Since drawCertificate is closed over the component scope, we need to call it or copy logic.
        // Calling drawCertificate uses the 'ctx' passed to it.
        drawCertificate(ctx, certConfig, studentName, awardName);

        // Give it a moment for images to draw? 
        // drawCertificate handles image loading async if not cached, but browser cache should handle it for preview items.
        // However, bg/seal images might take time. 
        // Best approach: Ensure images are loaded.

        // Since we are inside the component where validation already happened, assuming images are cached or quick.
        setTimeout(() => {
            downloadImage(canvas, `${studentName}_荣誉证书`);
        }, 500);
    };

    const handleSingleDownload = (name: string, award: string) => {
        showToast(`正在生成 ${name} 的证书...`, "info");
        generateAndDownloadCert(name, award);
    };

    // --- VIEW: REGISTRATION MANAGEMENT ---
    if (view === 'registration' && regContest) {
        // Logic to filter and paginate students for the registration list
        const registeredList = students.filter(s => regContest.registeredStudentIds?.includes(s.id));
        const filteredRegList = registeredList.filter(s =>
            s.name.includes(regSearchTerm) || s.id.includes(regSearchTerm) || (s.className || '').includes(regSearchTerm)
        );
        const totalRegPages = Math.ceil(filteredRegList.length / regItemsPerPage);
        const paginatedRegList = filteredRegList.slice((regPage - 1) * regItemsPerPage, regPage * regItemsPerPage);

        return (
            <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">报名管理</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-medium text-slate-600">{regContest.title}</span>
                                <span className="text-slate-400">|</span>
                                <span className="text-slate-500 text-sm">共 {registeredList.length} 人报名</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="搜索学生..."
                                value={regSearchTerm}
                                onChange={(e) => { setRegSearchTerm(e.target.value); setRegPage(1); }}
                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
                            />
                        </div>
                        <Button variant="secondary" onClick={exportRegistrations} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                            <FileDown size={16} /> 导出名单
                        </Button>
                    </div>
                </div>

                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left min-w-[600px]">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4">学号</th>
                                    <th className="px-6 py-4">姓名</th>
                                    <th className="px-6 py-4">班级</th>
                                    <th className="px-6 py-4">学院/专业</th>
                                    <th className="px-6 py-4 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedRegList.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-slate-400">暂无相关学生信息</td></tr>
                                ) : (
                                    paginatedRegList.map(student => (
                                        <tr key={student.id} className="hover:bg-slate-50 transition">
                                            <td className="px-6 py-4 font-mono text-slate-600">{student.id}</td>
                                            <td className="px-6 py-4 font-medium text-slate-800">{student.name}</td>
                                            <td className="px-6 py-4 text-slate-600">{student.className || '-'}</td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                {student.college} / {student.major}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleRemoveStudent(student.id)}
                                                    className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 transition"
                                                >
                                                    移除
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        currentPage={regPage}
                        totalPages={totalRegPages}
                        onPageChange={setRegPage}
                        totalItems={filteredRegList.length}
                    />
                </div>
            </div>
        );
    }




    // --- VIEW: AWARD MANAGEMENT ---
    if (view === 'award_management' && certContest) {
        return (
            <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('certificate')} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition">
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-slate-800">颁奖管理</h2>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={batchDownloadCertificates} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                            <FileArchive size={16} /> 批量导出证书 (ZIP)
                        </Button>
                        <Button onClick={saveAwardsAndPublish} className="bg-green-600 hover:bg-green-700">
                            <Save size={16} /> 保存并发布证书
                        </Button>
                    </div>
                </div>

                <div className="flex gap-6 h-full overflow-hidden">
                    {/* Left: Controls */}
                    <div className="w-80 space-y-6 flex-shrink-0">
                        <Card className="p-5">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Award size={18} className="text-blue-500" /> 批量设置奖项</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">手动设置选定学生</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={awardInput}
                                            onChange={e => setAwardInput(e.target.value)}
                                            placeholder="例如：一等奖"
                                            className="flex-1 px-3 py-2 border rounded text-sm outline-none focus:border-blue-500"
                                        />
                                        <Button onClick={() => applyAwardToSelection(awardInput)} className="px-3 text-xs" disabled={!awardInput}>应用</Button>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <label className="text-xs text-slate-500 mb-2 block">快捷自动筛选 (按分数)</label>
                                    <div className="space-y-2">
                                        <button onClick={() => autoAssignAwards({ topPct: 10, awardName: '一等奖' })} className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 rounded text-sm text-slate-600 transition flex justify-between">
                                            <span>前 10% -一等奖</span> <ChevronDown size={14} />
                                        </button>
                                        <button onClick={() => autoAssignAwards({ topPct: 30, awardName: '二等奖' })} className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 rounded text-sm text-slate-600 transition flex justify-between">
                                            <span>前 30% - 二等奖</span> <ChevronDown size={14} />
                                        </button>
                                        <button onClick={() => autoAssignAwards({ topPct: 60, awardName: '三等奖' })} className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 rounded text-sm text-slate-600 transition flex justify-between">
                                            <span>前 60% - 三等奖</span> <ChevronDown size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                        <div className="text-xs text-slate-400 p-2">
                            * 提示：可以通过点击表头排序，然后手动勾选。
                        </div>
                    </div>

                    {/* Right: Table */}
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <span className="text-sm text-slate-500">已选: <span className="font-bold text-blue-600">{selectedStudentIds.length}</span> 人</span>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-white text-slate-500 text-xs font-semibold border-b border-slate-200 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 w-12 text-center">
                                            <input type="checkbox" onChange={selectAllStudents} checked={selectedStudentIds.length > 0 && selectedStudentIds.length === awardStudents.length} />
                                        </th>
                                        <th className="px-4 py-3">学号</th>
                                        <th className="px-4 py-3">姓名</th>
                                        <th className="px-4 py-3">成绩/评分</th>
                                        <th className="px-4 py-3">获奖等级</th>
                                        <th className="px-4 py-3 text-right">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {awardStudents.map(s => (
                                        <tr key={s.userId} className={`hover:bg-slate-50 ${selectedStudentIds.includes(s.userId) ? 'bg-blue-50/30' : ''}`}>
                                            <td className="px-4 py-3 text-center">
                                                <input type="checkbox" checked={selectedStudentIds.includes(s.userId)} onChange={() => toggleStudentSelection(s.userId)} />
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">{s.userId}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{s.userName}</td>
                                            <td className="px-4 py-3 font-bold text-slate-600">{s.score}</td>
                                            <td className="px-4 py-3">
                                                {s.awardName ? (
                                                    <span className="inline-block px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-bold border border-yellow-200">
                                                        {s.awardName}
                                                    </span>
                                                ) : <span className="text-slate-300 text-xs">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right flex justify-end gap-2 items-center">
                                                {s.awardName && (
                                                    <button onClick={() => handleSingleDownload(s.userName, s.awardName!)} className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 mr-2" title="下载证书图片">
                                                        <Download size={14} /> 下载
                                                    </button>
                                                )}
                                                <button onClick={() => {
                                                    setAwardStudents(prev => prev.map(st => st.userId === s.userId ? { ...st, awardName: undefined } : st));
                                                }} className="text-red-400 hover:text-red-600 text-xs">清除</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: CERTIFICATE DESIGNER (Main) ---
    if (view === 'certificate' && certContest) {
        const selectedItem = certConfig.items.find(i => i.id === selectedCertItemId);

        return (
            <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('list')} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">证书颁发中心</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-medium text-slate-600">{certContest.title}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => openAwardManagement()}>
                            <Award size={16} /> 颁奖管理
                        </Button>
                        <Button onClick={handleSaveCertificate} disabled={loading}>
                            <Save size={16} /> {loading ? '保存中...' : '保存模板'}
                        </Button>
                    </div>
                </div>

                <div className="flex gap-6 h-full overflow-hidden">
                    {/* Left Controls */}
                    <div className="w-80 bg-white border border-slate-200 rounded-xl p-4 overflow-y-auto shrink-0 flex flex-col gap-4">
                        <div className="space-y-3 pb-4 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                <Settings size={16} className="text-slate-500" /> 全局设置
                            </h3>
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">背景图片</label>
                                <div className="flex gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, 'bg')}
                                    />
                                    <Button variant="secondary" className="flex-1 text-xs h-8" onClick={() => fileInputRef.current?.click()}>
                                        <Upload size={12} /> 上传背景
                                    </Button>
                                    <Button
                                        onClick={() => handleAiGenerateBg()}
                                        disabled={isGeneratingBg}
                                        className="flex-1 text-xs h-8 bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200"
                                    >
                                        <Sparkles size={12} /> AI 生成
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-600 mb-1 block">公章图片 (透明底)</label>
                                <div className="flex gap-2">
                                    <input
                                        ref={sealInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleFileUpload(e, 'seal')}
                                    />
                                    <Button variant="secondary" className="flex-1 text-xs h-8" onClick={() => sealInputRef.current?.click()}>
                                        <Stamp size={12} /> 上传公章
                                    </Button>
                                    {certConfig.sealUrl && (
                                        <button onClick={() => setCertConfig(p => ({ ...p, sealUrl: undefined }))} className="text-red-500 p-1 hover:bg-red-50 rounded">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Item Editor */}
                        <div className="space-y-3 flex-1">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                                <PenTool size={16} className="text-blue-500" />
                                {selectedItem ? '编辑选中元素' : '点击画布元素编辑'}
                            </h3>

                            {selectedItem ? (
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3 animate-fade-in">
                                    {selectedItem.type === 'static-text' && (
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase font-bold">文字内容</label>
                                            <input
                                                value={selectedItem.text}
                                                onChange={e => updateCertItem(selectedItem.id, { text: e.target.value })}
                                                className="w-full px-2 py-1 text-sm border rounded mt-1"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase font-bold">字号</label>
                                            <input
                                                type="number" value={selectedItem.fontSize}
                                                onChange={e => updateCertItem(selectedItem.id, { fontSize: Number(e.target.value) })}
                                                className="w-full px-2 py-1 text-sm border rounded mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase font-bold">颜色</label>
                                            <input
                                                type="color" value={selectedItem.color}
                                                onChange={e => updateCertItem(selectedItem.id, { color: e.target.value })}
                                                className="w-full h-8 p-0 border rounded mt-1 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase font-bold">X 坐标</label>
                                            <input
                                                type="number" value={selectedItem.x}
                                                onChange={e => updateCertItem(selectedItem.id, { x: Number(e.target.value) })}
                                                className="w-full px-2 py-1 text-sm border rounded mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-500 uppercase font-bold">Y 坐标</label>
                                            <input
                                                type="number" value={selectedItem.y}
                                                onChange={e => updateCertItem(selectedItem.id, { y: Number(e.target.value) })}
                                                className="w-full px-2 py-1 text-sm border rounded mt-1"
                                            />
                                        </div>
                                    </div>

                                    <button onClick={() => setSelectedCertItemId(null)} className="w-full text-xs text-slate-400 hover:text-slate-600 mt-2">取消选择</button>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-xs">
                                    在右侧预览图中点击文字即可修改位置、大小和内容。
                                </div>
                            )}

                            {/* Layer List (Simple) */}
                            <div className="mt-4 border-t border-slate-100 pt-4">
                                <h4 className="text-xs font-bold text-slate-500 mb-2">图层列表</h4>
                                <div className="space-y-1">
                                    {certConfig.items.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedCertItemId(item.id)}
                                            className={`text-xs px-2 py-1.5 rounded cursor-pointer flex justify-between items-center ${selectedCertItemId === item.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
                                        >
                                            <span>{item.type === 'static-text' ? item.text : `{${item.field}}`}</span>
                                            {selectedCertItemId === item.id && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Preview */}
                    <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                        <div className="mb-4 text-slate-500 text-sm font-medium flex items-center gap-2">
                            <Eye size={16} /> 实时预览 (点击文字可编辑)
                        </div>
                        <canvas
                            ref={canvasRef}
                            width={800}
                            height={600}
                            className="bg-white shadow-2xl rounded max-w-full max-h-full object-contain cursor-crosshair"
                            onClick={(e) => {
                                const rect = canvasRef.current!.getBoundingClientRect();
                                const scaleX = canvasRef.current!.width / rect.width;
                                const scaleY = canvasRef.current!.height / rect.height;
                                const x = (e.clientX - rect.left) * scaleX;
                                const y = (e.clientY - rect.top) * scaleY;
                                for (let i = certConfig.items.length - 1; i >= 0; i--) {
                                    const item = certConfig.items[i];
                                    if (Math.abs(item.x - x) < 100 && Math.abs(item.y - y) < 20) {
                                        setSelectedCertItemId(item.id);
                                        return;
                                    }
                                }
                                setSelectedCertItemId(null);
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // --- LIST View (Default) ---
    const filteredContests = contests;
    const totalContestPages = Math.ceil(filteredContests.length / contestsPerPage);
    const paginatedContests = filteredContests.slice((contestPage - 1) * contestsPerPage, contestPage * contestsPerPage);

    return (
        <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">比赛管理</h2>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">管理编程比赛与作品提交</p>
                </div>
                <Button onClick={openCreateModal} className="!rounded-xl shadow-xl shadow-blue-500/10 w-full sm:w-auto">
                    <Plus size={16} /> 创建比赛
                </Button>
            </div>

            <div className="bg-white/5 rounded-2xl border border-white/10 shadow-3xl overflow-hidden flex-1 flex flex-col backdrop-blur-md">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-4">比赛名称</th>
                                <th className="px-6 py-4">类型</th>
                                <th className="px-6 py-4">时间/状态</th>
                                <th className="px-6 py-4 text-center">内容</th>
                                <th className="px-6 py-4">报名/管理</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {paginatedContests.map((c) => (
                                <tr key={c.id} className="hover:bg-white/5 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">{c.title}</div>
                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">ID: #{c.id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {c.type === ContestType.PROJECT ? (
                                            <span className="text-[10px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full uppercase tracking-widest">作品赛</span>
                                        ) : (
                                            <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full uppercase tracking-widest">编程赛</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={c.status} />
                                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 flex items-center gap-1.5">
                                            <CalendarClock size={12} className="text-blue-500/50" />
                                            {new Date(c.endTime).toLocaleDateString()} 截止
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {c.type === ContestType.PROJECT ? (
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">{c.projectSubmissions?.length || 0} 份作品</span>
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">{c.problemIds?.length || 0} 题</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2 items-start">
                                            <button
                                                onClick={() => openRegistration(c)}
                                                className="text-[10px] font-black uppercase tracking-widest bg-white/5 text-slate-400 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <Users size={12} /> 报名 ({c.registeredStudentIds?.length || 0}人)
                                            </button>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleLeaderboard(c.id)}
                                                    className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all ${c.isLeaderboardOpen ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10 hover:text-white'}`}
                                                    title={c.isLeaderboardOpen ? "点击隐藏成绩" : "点击发布成绩"}
                                                >
                                                    {c.isLeaderboardOpen ? <Eye size={12} /> : <EyeOff size={12} />}
                                                    {c.isLeaderboardOpen ? '榜单已发' : '榜单隐藏'}
                                                </button>
                                                {c.type === ContestType.PROJECT && (
                                                    <button
                                                        onClick={() => openGrading(c)}
                                                        className="text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white px-3 py-1.5 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
                                                    >
                                                        <ClipboardList size={12} /> 评分
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openCertificateDesigner(c)}
                                                    className="text-[10px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-xl hover:bg-purple-500/20 transition-all"
                                                >
                                                    <Award size={12} /> 证书
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => openEditModal(c)} className="p-2 bg-white/5 border border-white/10 hover:bg-blue-500/10 rounded-xl text-slate-400 hover:text-blue-400 transition shadow-sm backdrop-blur-md">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} className="p-2 bg-white/5 border border-white/10 hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-400 transition shadow-sm backdrop-blur-md">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination
                    currentPage={contestPage}
                    totalPages={totalContestPages}
                    onPageChange={setContestPage}
                    totalItems={filteredContests.length}
                />
            </div>

            {/* Modals remain the same... */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingId ? "编辑比赛信息" : "创建新比赛"}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
                        <Button onClick={handleSave} disabled={loading}>{editingId ? (loading ? "保存中..." : "保存修改") : (loading ? "发布中..." : "发布比赛")}</Button>
                    </>
                }
            >
                <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">比赛类型</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition flex items-center justify-center gap-2 ${form.type === ContestType.CODING ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                <input
                                    type="radio"
                                    name="contestType"
                                    className="hidden"
                                    checked={form.type === ContestType.CODING}
                                    onChange={() => setForm({ ...form, type: ContestType.CODING })}
                                />
                                <span className="font-bold text-sm">编程赛 (ACM)</span>
                            </label>
                            <label className={`flex-1 border rounded-lg p-3 cursor-pointer transition flex items-center justify-center gap-2 ${form.type === ContestType.PROJECT ? 'border-purple-500 bg-purple-50 text-purple-700 ring-1 ring-purple-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                <input
                                    type="radio"
                                    name="contestType"
                                    className="hidden"
                                    checked={form.type === ContestType.PROJECT}
                                    onChange={() => setForm({ ...form, type: ContestType.PROJECT })}
                                />
                                <span className="font-bold text-sm">作品赛 (创意)</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">比赛名称</label>
                        <input
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="例如：2024秋季期中考试"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">开始时间</label>
                            <input
                                type="datetime-local"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={toLocalInputFormat(form.startTime || '')}
                                onChange={e => setForm({ ...form, startTime: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">结束时间</label>
                            <input
                                type="datetime-local"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={toLocalInputFormat(form.endTime || '')}
                                onChange={e => setForm({ ...form, endTime: new Date(e.target.value).toISOString() })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">比赛/作品要求描述</label>
                        <textarea
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder={form.type === ContestType.PROJECT ? "请详细说明作品提交要求，如文件格式、视频内容等。" : "输入比赛规则、注意事项等"}
                        />
                    </div>
                    {form.type === ContestType.CODING && (
                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-medium text-slate-700">比赛题目 ({selectedProblems.length})</label>
                                <Button onClick={() => setIsSelectorOpen(true)} className="text-xs h-8 px-3">
                                    <Plus size={14} /> 选择题目
                                </Button>
                            </div>
                            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 min-h-[100px] max-h-[200px] overflow-y-auto">
                                {selectedProblems.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">暂无题目，请点击右上角选择</div>
                                ) : (
                                    problems.filter(p => selectedProblems.includes(p.id)).map((p, idx) => (
                                        <div key={p.id} className="flex items-center justify-between p-3 border-b border-slate-100 bg-white last:border-0">
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-slate-400 text-xs w-4">{idx + 1}.</span>
                                                <span className="text-sm font-medium text-slate-700">{p.title}</span>
                                                <DifficultyBadge level={p.difficulty} />
                                            </div>
                                            <button onClick={() => toggleProblemSelection(p.id)} className="text-slate-400 hover:text-red-500">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Grading Modal */}
            {isGradingOpen && (
                <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col animate-fade-in">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">作品评分: {gradingContest?.title}</h3>
                                <p className="text-sm text-slate-500">共收到 {gradingSubmissions.length} 份提交</p>
                            </div>
                            <div className="flex gap-3">
                                <Button onClick={batchDownload} className="bg-slate-700 hover:bg-slate-800 shadow-slate-300">
                                    <Download size={16} /> 一键下载所有作品
                                </Button>
                                <Button variant="secondary" onClick={exportGrades}>
                                    <FileDown size={16} /> 导出成绩单
                                </Button>
                                <div className="w-px h-8 bg-slate-200 mx-2"></div>
                                <Button variant="secondary" onClick={() => setIsGradingOpen(false)}>取消</Button>
                                <Button onClick={handleSaveGrade} disabled={loading} className="bg-green-600 hover:bg-green-700"><Save size={16} /> {loading ? '保存中...' : '保存成绩'}</Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-2 sm:p-6 bg-slate-50">
                            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                                <table className="w-full bg-white text-left min-w-[700px]">
                                    <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200 text-left">
                                        <tr>
                                        <th className="px-6 py-3">学生姓名</th>
                                        <th className="px-6 py-3">提交时间</th>
                                        <th className="px-6 py-3">代码包</th>
                                        <th className="px-6 py-3">文档</th>
                                        <th className="px-6 py-3">视频链接</th>
                                        <th className="px-6 py-3 w-32">评分 (0-100)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {gradingSubmissions.length === 0 ? (
                                        <tr><td colSpan={6} className="p-8 text-center text-slate-400">暂无学生提交作品</td></tr>
                                    ) : (
                                        gradingSubmissions.map(sub => (
                                            <tr key={sub.userId} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-medium text-slate-800">{sub.userName}</td>
                                                <td className="px-6 py-4 text-slate-500 text-xs">{new Date(sub.submittedAt).toLocaleString()}</td>
                                                <td className="px-6 py-4">
                                                    <button type="button" onClick={(e) => { e.preventDefault(); sub.codeUrl ? window.open(sub.codeUrl, '_blank') : showToast('未提交代码', 'info'); }} className={`${sub.codeUrl ? 'text-blue-600 hover:underline' : 'text-slate-400 cursor-not-allowed'} flex items-center gap-1`}>
                                                        <Download size={14} /> 下载
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button type="button" onClick={(e) => { e.preventDefault(); sub.docUrl ? window.open(sub.docUrl, '_blank') : showToast('未提交文档', 'info'); }} className={`${sub.docUrl ? 'text-blue-600 hover:underline' : 'text-slate-400 cursor-not-allowed'} flex items-center gap-1`}>
                                                        <Download size={14} /> 下载
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <a href={sub.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                        <ExternalLink size={14} /> 观看
                                                    </a>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        min="0" max="100"
                                                        className="w-20 px-2 py-1 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-right font-bold text-slate-700"
                                                        value={sub.score === undefined ? '' : sub.score}
                                                        onChange={e => handleScoreChange(sub.userId, e.target.value)}
                                                        placeholder="-"
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FULL SCREEN PROBLEM SELECTOR OVERLAY */}
            {isSelectorOpen && form.type === ContestType.CODING && (
                <div className="fixed inset-0 z-[70] bg-slate-100 flex flex-col animate-fade-in">
                    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <BookOpen className="text-blue-600" /> 从题库选择题目
                        </h2>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-600">已选: <span className="font-bold text-blue-600">{selectedProblems.length}</span> 题</span>
                            <Button onClick={() => setIsSelectorOpen(false)}>完成选择</Button>
                        </div>
                    </div>
                    <div className="flex-1 flex overflow-hidden">
                        <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0">
                            <div className="p-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">题库列表</div>
                            <div className="space-y-1 px-2">
                                <button
                                    onClick={() => setActiveBankId('all')}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex justify-between items-center ${activeBankId === 'all' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    全部题目
                                </button>
                                {banks.map(bank => (
                                    <button
                                        key={bank.id}
                                        onClick={() => setActiveBankId(bank.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex justify-between items-center ${activeBankId === bank.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <span className="truncate">{bank.title}</span>
                                        {activeBankId === bank.id && <ArrowRight size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col bg-slate-50/50 min-w-0">
                            <div className="p-4 border-b border-slate-200 bg-white flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="搜索题目名称或标签..."
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                        value={problemSearch}
                                        onChange={e => setProblemSearch(e.target.value)}
                                    />
                                </div>
                                <div className="text-sm text-slate-500">
                                    显示 {filteredProblems.length} 个结果
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="grid grid-cols-1 gap-3">
                                    {filteredProblems.map(p => {
                                        const isSelected = selectedProblems.includes(p.id);
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => toggleProblemSelection(p.id)}
                                                className={`bg-white p-4 rounded-xl border cursor-pointer transition flex items-center justify-between group ${isSelected ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'}`}
                                            >
                                                <div>
                                                    <div className="font-medium text-slate-800 flex items-center gap-2">
                                                        {p.title}
                                                        <DifficultyBadge level={p.difficulty} />
                                                    </div>
                                                    <div className="flex gap-2 mt-1.5">
                                                        {(p.tags || []).map(t => (
                                                            <span key={t} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                                                    {isSelected && <Check size={14} className="text-white" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
