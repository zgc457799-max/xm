
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Timer, Book, AlertCircle, Upload, FileText, Youtube, CheckCircle, Clock, ChevronLeft, ChevronRight as ChevronRightIcon, Award, Trophy } from 'lucide-react';
import { Contest, Problem, ContestType, ProjectSubmission, User, ContestResult } from '../../types';
import { Card, Button } from '../UiComponents';
import { getMyContestResult, submitContestExam } from '../../services/api';
import { CertificateView } from './CertificateView';

const useCountdown = (targetDate: string | Date) => {
    const countDownDate = new Date(targetDate).getTime();
    const [countDown, setCountDown] = useState(
        countDownDate - new Date().getTime()
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setCountDown(countDownDate - new Date().getTime());
        }, 1000);

        return () => clearInterval(interval);
    }, [countDownDate]);

    const isEnded = countDown < 0;

    const hours = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

    // Add days if needed, but for now simple HH:MM:SS
    const days = Math.floor(countDown / (1000 * 60 * 60 * 24));
    const totalHours = days * 24 + hours;

    const timeLeft = isEnded
        ? "00:00:00"
        : `${totalHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return { timeLeft, isEnded };
};

const formatFilename = (url?: string, defaultName = '未知文件') => {
    if (!url) return defaultName;
    const fullName = url.split('/').pop() || defaultName;
    // 匹配后端 multer 产生的 timestamp-random-originalname 模式
    const match = fullName.match(/^\d+-\d+-(.+)$/);
    try {
        return decodeURIComponent(match ? match[1] : fullName);
    } catch (e) {
        return match ? match[1] : fullName;
    }
};

export const ContestDetail = ({
    user,
    contest,
    problems,
    onBack,
    onSelectProblem,
    onSubmitProject,
    onSubmitExam,
    showToast
}: {
    user: User,
    contest: Contest & { userProblemStatus?: Record<string, string> },
    problems: Problem[],
    onBack: () => void,
    onSelectProblem: (p: Problem) => void,
    onSubmitProject: (contestId: string, submission: any) => void,
    onSubmitExam: () => void,
    showToast: (msg: string, type?: 'success' | 'info' | 'error') => void
}) => {
    const [fileCode, setFileCode] = useState<File | null>(null);
    const [fileDoc, setFileDoc] = useState<File | null>(null);
    const [videoLink, setVideoLink] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myResult, setMyResult] = useState<ContestResult | null>(null);
    const [showCertificate, setShowCertificate] = useState(false);
    const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);

    // Countdown
    const { timeLeft, isEnded } = useCountdown(contest.endTime);

    // Fetch Result if ended
    useEffect(() => {
        const fetchResult = async () => {
            // Check if contest is ended (or logic allows fetching earlier?)
            // Usually results are only available after end/settlement.
            try {
                const res = await getMyContestResult(contest.id);
                if (res) setMyResult(res);
            } catch (e) {
                // Ignore 404 (not published yet)
            }
        };

        // We try fetching if it's potentially ended or we just want to check availability
        fetchResult();
    }, [contest.id]);

    // Auto-submit when countdown ends
    useEffect(() => {
        if (isEnded && !contest.isSubmitted && contest.status === 'LIVE' && contest.type === ContestType.CODING) {
            handleConfirmSubmit();
        }
    }, [isEnded]);

    const handleConfirmSubmit = async () => {
        try {
            await submitContestExam(contest.id);
            showToast("交卷成功！比赛已结束或手动提交", "success");
            onSubmitExam();
        } catch (e) {
            showToast("交卷失败，请重试", "error");
        } finally {
            setIsConfirmSubmitOpen(false);
        }
    };

    // Pagination for Problems
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const problemsList = problems.filter(p => contest.problemIds?.includes(p.id));
    const totalPages = Math.ceil(problemsList.length / itemsPerPage);
    const paginatedProblems = problemsList.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    // Find existing submission for current user
    const mySubmission = contest.projectSubmissions?.find(s => s.userId === user.id);

    const handleSubmit = (e: React.FormEvent) => {
        // ... (keep logic)
        e.preventDefault();
        if (!fileCode || !fileDoc || !videoLink) {
            showToast("请上传所有必要文件并填写视频链接", "info");
            return;
        }

        setIsSubmitting(true);
        // Simulate upload delay
        setIsSubmitting(true);
        // Simulate upload delay (UI feel)
        setTimeout(() => {
            const formData = new FormData();
            formData.append('code', fileCode);
            formData.append('doc', fileDoc);
            formData.append('videoUrl', videoLink);

            // We pass formData to the parent submit handler. 
            // Note: The parent handler expects ProjectSubmission usually, but we need to change that flow or bypass type check temporarily.
            // Or better, change the prop type in next step.
            onSubmitProject(contest.id, formData as any);

            setIsSubmitting(false);
        }, 1000);
    };

    // --- VIEW: PROJECT CONTEST ---
    if (contest.type === ContestType.PROJECT) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in">
                {showCertificate && myResult && (
                    <CertificateView
                        userName={user.name}
                        contestTitle={contest.title}
                        rank={myResult.rank || 0}
                        awardName={myResult.award_name || myResult.awardName || ''}
                        code={myResult.certificate_code || '---'}
                        date={new Date().toLocaleDateString()}
                        config={contest.certificateConfig}
                        onClose={() => setShowCertificate(false)}
                    />
                )}
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    {/* ... (keep header) */}
                    <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            {contest.title}
                            <span className="text-sm bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200">作品赛</span>
                        </h1>
                        {/* ... (keep info) */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${isEnded ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                                {isEnded ? '已结束' : '进行中'}
                            </span>
                            <span>•</span>
                            <span>截止时间: {new Date(contest.endTime).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* RESULTS CARD (New) */}
                {myResult && (
                    <div className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600">
                                <Trophy size={32} />
                            </div>
                            <div>
                                <div className="text-sm text-yellow-800 font-bold mb-1">恭喜! 比赛结果已发布</div>
                                <h2 className="text-2xl font-bold text-slate-800">
                                    {myResult.award_name || myResult.awardName || `第 ${myResult.rank} 名`}
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">最终得分: {myResult.score}</p>
                            </div>
                        </div>
                        {(myResult.award_name || myResult.awardName) && (
                            <Button onClick={() => setShowCertificate(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg shadow-yellow-600/20">
                                <Award size={18} className="mr-2" /> 查看证书
                            </Button>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left: Requirements & Status */}
                    <div className="md:col-span-2 space-y-6">
                        {/* ... (rest of component content roughly same) */}
                        <Card className="p-6">
                            {/* ... card content ... */}

                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Book size={18} className="text-blue-500" /> 作品要求
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line mb-6">
                                {contest.description}
                            </p>

                            <div className="space-y-4">
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <h4 className="font-semibold text-slate-700 text-sm mb-2">提交清单</h4>
                                    <ul className="space-y-2 text-sm text-slate-600">
                                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> 源代码压缩包 (.zip)</li>
                                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> 项目说明文档 (.pdf)</li>
                                        <li className="flex items-center gap-2"><CheckCircle size={14} className="text-green-500" /> 演示视频链接 (B站/优酷)</li>
                                    </ul>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Upload size={18} className="text-blue-500" /> 作品提交
                            </h3>

                            {mySubmission ? (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                            <CheckCircle size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-green-800">已提交作品</div>
                                            <div className="text-xs text-green-600">提交时间: {new Date(mySubmission.submittedAt).toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <FileText size={16} className="text-blue-500" /> <span className="w-12 text-slate-500">代码:</span>
                                            <a
                                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${mySubmission.codeUrl || ''}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex-1 truncate"
                                                title={formatFilename(mySubmission.codeUrl, '未知代码文件')}
                                            >
                                                {formatFilename(mySubmission.codeUrl, '未知代码文件')}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <FileText size={16} className="text-green-500" /> <span className="w-12 text-slate-500">文档:</span>
                                            <a
                                                href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${mySubmission.docUrl || ''}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex-1 truncate"
                                                title={formatFilename(mySubmission.docUrl, '未知文档文件')}
                                            >
                                                {formatFilename(mySubmission.docUrl, '未知文档文件')}
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Youtube size={16} className="text-red-500" /> <span className="w-12 text-slate-500">视频:</span>
                                            <a
                                                href={mySubmission.videoUrl || '#'}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex-1 truncate"
                                                title={mySubmission.videoUrl}
                                            >
                                                {mySubmission.videoUrl || '无视频链接'}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-green-200">
                                        {mySubmission.score !== undefined ? (
                                            <div>
                                                <div className="flex items-end gap-2">
                                                    <span className="text-sm font-bold text-slate-600">最终得分:</span>
                                                    <span className="text-3xl font-bold text-blue-600">{mySubmission.score}</span>
                                                    <span className="text-sm text-slate-400">/ 100</span>
                                                </div>
                                                {mySubmission.feedback && (
                                                    <div className="mt-2 text-sm text-slate-600 bg-white p-3 rounded border border-green-100">
                                                        <span className="font-bold">教师评语:</span> {mySubmission.feedback}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-orange-600 font-medium text-sm">
                                                <Clock size={16} /> 等待教师评分中...
                                            </div>
                                        )}
                                    </div>

                                    {!isEnded && (
                                        <div className="mt-4 text-center">
                                            <button
                                                onClick={() => { /* reset handled by parent or overwrite */ }}
                                                className="text-xs text-slate-400 hover:text-blue-500 underline"
                                            >
                                                重新提交 (将覆盖旧版本)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {(!mySubmission || mySubmission) && !isEnded && (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">代码压缩包 (.zip)</label>
                                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                                            <input type="file" accept=".zip,.rar" onChange={e => setFileCode(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">项目文档 (.pdf)</label>
                                        <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
                                            <input type="file" accept=".pdf" onChange={e => setFileDoc(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">演示视频链接</label>
                                        <input
                                            type="url"
                                            placeholder="例如: https://www.bilibili.com/video/..."
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={videoLink}
                                            onChange={e => setVideoLink(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className={`w-full ${mySubmission ? 'bg-slate-600 hover:bg-slate-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? '上传中...' : mySubmission ? '确认覆盖提交' : '提交作品'}
                                    </Button>
                                </form>
                            )}
                            {isEnded && !mySubmission && (
                                <div className="bg-slate-100 text-slate-500 p-4 rounded text-center text-sm">
                                    比赛已结束，停止提交。
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right: Info */}
                    <div className="space-y-6">
                        <Card className="p-6 border-l-4 border-yellow-400 bg-yellow-50">
                            <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2"><AlertCircle size={16} /> 注意事项</h3>
                            <p className="text-sm text-yellow-700 leading-relaxed">
                                1. 请确保代码可以直接编译运行。<br />
                                2. 项目文档需包含功能介绍、设计思路和运行截图。<br />
                                3. 视频时长建议控制在 3-5 分钟。<br />
                                4. 截止日期前可多次提交，以最后一次为准。
                            </p>
                        </Card>

                        <div className="bg-slate-900 text-white px-6 py-4 rounded-xl flex flex-col items-center shadow-lg">
                            <span className="text-slate-400 text-xs uppercase tracking-widest mb-1">Time Remaining</span>
                            <div className="flex items-center gap-2 font-mono text-2xl font-bold text-yellow-400">
                                <Timer size={20} />
                                <span>{isEnded ? '00:00:00' : timeLeft}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: CODING CONTEST (Existing) ---
    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{contest.title}</h1>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${isEnded ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'}`}>
                                {isEnded ? '已结束' : '进行中'}
                            </span>
                            <span>•</span>
                            <span>距离结束还有: {isEnded ? '00:00:00' : timeLeft}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900 text-white px-6 py-3 rounded-lg flex items-center gap-3 shadow-lg">
                    <Timer size={20} className="text-yellow-400" />
                    <span className="font-mono text-xl font-bold">{isEnded ? 'Ended' : timeLeft}</span>
                </div>
                {!isEnded && !contest.isSubmitted && (
                    <Button
                        onClick={() => setIsConfirmSubmitOpen(true)}
                        className="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                    >
                        立即交卷
                    </Button>
                )}
                {contest.isSubmitted && (
                    <span className="px-4 py-2 bg-slate-100 text-slate-500 rounded font-bold border border-slate-200">
                        已交卷
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Problem List */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Book size={18} /> 题目列表
                    </h3>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[300px] flex flex-col">
                        <div className="flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 w-16">#</th>
                                        <th className="px-6 py-4">题目</th>
                                        <th className="px-6 py-4 w-24">分数</th>
                                        <th className="px-6 py-4 w-32">通过率</th>
                                        <th className="px-6 py-4 w-24">状态</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedProblems.map((p, idx) => {
                                        const status = contest.userProblemStatus?.[p.id];
                                        return (
                                            <tr
                                                key={p.id}
                                                onClick={() => {
                                                    if (contest.isSubmitted || isEnded) {
                                                        showToast("比赛已结束或已交卷，无法进入题目", "info");
                                                        return;
                                                    }
                                                    onSelectProblem(p);
                                                }}
                                                className={`hover:bg-slate-50 cursor-pointer transition ${contest.isSubmitted || isEnded ? 'opacity-70' : ''}`}
                                            >
                                                <td className="px-6 py-4 font-mono text-slate-500">{String.fromCharCode(65 + (page - 1) * itemsPerPage + idx)}</td>
                                                <td className="px-6 py-4 font-medium text-blue-600">{p.title}</td>
                                                <td className="px-6 py-4 text-slate-600">100</td>
                                                <td className="px-6 py-4 text-slate-500 text-sm">{p.passRate || 0}%</td>
                                                <td className="px-6 py-4">
                                                    {status === 'AC' ? (
                                                        <span className="flex items-center gap-1 text-green-500 font-bold text-xs">
                                                            <CheckCircle size={14} /> 已通过
                                                        </span>
                                                    ) : status ? (
                                                        <span className="text-orange-500 text-xs font-medium">尝试过</span>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">未尝试</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50">
                                <span className="text-xs text-slate-500">
                                    第 {page} / {totalPages} 页
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-600"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-600"
                                    >
                                        <ChevronRightIcon size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Info & Announcements */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-bold text-slate-800 mb-4">比赛说明</h3>
                        <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside">
                            <li>本场比赛采用 ACM 赛制。</li>
                            <li>每道题提交后实时反馈结果。</li>
                            <li>错误提交会有 20 分钟罚时。</li>
                            <li>请勿抄袭，系统有查重机制。</li>
                        </ul>
                    </Card>

                    <Card className="p-6 border-l-4 border-yellow-400 bg-yellow-50">
                        <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2"><AlertCircle size={16} /> 裁判公告</h3>
                        <p className="text-sm text-yellow-700">
                            [14:00] 题目 B 的数据范围已更新，请刷新查看。
                        </p>
                    </Card>
                </div>
            </div>
            {/* Confirm Submit Modal */}
            {isConfirmSubmitOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertCircle size={24} />
                            <h3 className="text-xl font-bold">确认提前交卷？</h3>
                        </div>
                        <p className="text-slate-600 mb-6 leading-relaxed">
                            交卷后您将<span className="font-bold text-red-600">无法再次查看或提交任何题目</span>。请确认您已经完成了所有的答题。
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setIsConfirmSubmitOpen(false)}
                            >
                                我再想想
                            </Button>
                            <Button
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                                onClick={handleConfirmSubmit}
                            >
                                确认交卷
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
