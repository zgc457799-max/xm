
import React, { useState, useEffect, useRef } from 'react';
import { Brain, Plus, Search, Edit2, Trash2, ArrowLeft, Beaker, Play, CheckCircle, AlertTriangle, Code as CodeIcon, RefreshCw, X } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Problem, Difficulty, TestCase, ProblemBank } from '../../types';
import { smartParseProblem, generateTestCases, validateProblem, createProblem, updateProblem, deleteProblem, getProblemDetail } from '../../services/api';
import { Button, Card, DifficultyBadge, Pagination, IconButton } from '../UiComponents';
import { SmartProblemImport } from './SmartProblemImport';

const EMPTY_PROBLEM: Problem = {
    id: '',
    title: '',
    difficulty: Difficulty.EASY,
    description: '',
    inputExample: '',
    outputExample: '',
    tags: [],
    passRate: 0,
    testCases: [],
    referenceCode: ''
};

const DEFAULT_REF_CODE = `#include <stdio.h>\n\nint main() {\n    // 请在此编写标准题解\n    // 系统将运行此代码来验证测试用例的正确性\n    return 0;\n}`;

const parseProblemFromText = (text: string) => {
    // 同时支持标准的 题目名称：... 和 JSON 格式的 "title": "..."
    const titleMatch = text.match(/题目名称：\s*(.*)/) || text.match(/"title":\s*"([^"]*)"/);
    const title = titleMatch?.[1] || '';
    
    // 支持 难度等级：... 或 "difficulty": "..."
    const difficultyMatch = text.match(/难度等级：\s*(.*)/) || text.match(/"difficulty":\s*"([^"]*)"/);
    const difficultyText = difficultyMatch?.[1] || '中等';
    
    // 支持 知识点标签：... 或 "tags": [...]
    const tagsMatch = text.match(/知识点标签：\s*(.*)/) || text.match(/"tags":\s*\[([^\]]*)\]/);
    const tagsText = tagsMatch?.[1]?.replace(/"/g, '') || '';
    
    // 题目描述识别
    const descMatch = text.match(/题目描述：\s*([\s\S]*?)(?=输入样例：|样例输入：|输出样例：|$)/) || text.match(/"description":\s*"([^"]*)"/);
    let description = descMatch ? (Array.isArray(descMatch) && descMatch.length > 1 ? descMatch[1] : descMatch[0]) : '';
    
    // 样例输入
    const inputMatch = text.match(/输入样例：\s*([\s\S]*?)(?=输出样例：|样例输出：|$)/) || text.match(/"input":\s*"([^"]*)"/);
    let inputExample = inputMatch ? (Array.isArray(inputMatch) && inputMatch.length > 1 ? inputMatch[1] : inputMatch[0]) : '';
    
    // 样例输出
    const outputMatch = text.match(/输出样例：\s*([\s\S]*?)(?=\n-|$)/) || text.match(/"output":\s*"([^"]*)"/);
    let outputExample = outputMatch ? (Array.isArray(outputMatch) && outputMatch.length > 1 ? outputMatch[1] : outputMatch[0]) : '';

    // 清理和处理转义字符
    const clean = (s: string) => s.trim().replace(/\\n/g, '\n').replace(/\\"/g, '"');

    return {
        title: clean(title),
        description: clean(description),
        difficulty: (difficultyText.includes('简单') || difficultyText.toLowerCase().includes('easy')) ? 'Easy' : (difficultyText.includes('困难') || difficultyText.toLowerCase().includes('hard')) ? 'Hard' : 'Medium' as Difficulty,
        tags: tagsText.split(/[,，]/).map(s => s.trim()).filter(s => s),
        inputExample: clean(inputExample),
        outputExample: clean(outputExample)
    };
};

export const ProblemManager = ({ problems, setProblems, banks, showToast }: { problems: Problem[], setProblems: React.Dispatch<React.SetStateAction<Problem[]>>, banks: ProblemBank[], showToast: (msg: string, type?: 'success' | 'info' | 'error') => void }) => {
    const [view, setView] = useState<'list' | 'editor' | 'bulk_ai'>('list');
    const [mode, setMode] = useState<'manual' | 'ai'>('manual');
    const [editingId, setEditingId] = useState<string | null>(null);

    // Tab State in Editor: 'basic' | 'validation'
    const [activeTab, setActiveTab] = useState<'basic' | 'validation'>('basic');

    // Editor State
    const [rawText, setRawText] = useState('');
    const [parsing, setParsing] = useState(false);
    const [form, setForm] = useState<Problem>(EMPTY_PROBLEM);

    // Validation State
    const [generatingTests, setGeneratingTests] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState<'success' | 'fail' | null>(null);

    // Filter & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [saving, setSaving] = useState(false);

    const [initialized, setInitialized] = useState(false);

    // --- STATE PERSISTENCE ---
    useEffect(() => {
        const savedView = sessionStorage.getItem('problem_manager_view');
        const savedId = sessionStorage.getItem('problem_manager_editing_id');
        const savedForm = sessionStorage.getItem('problem_manager_form');
        const savedTab = sessionStorage.getItem('problem_manager_active_tab');

        if (savedView) setView(savedView as any);
        if (savedId) setEditingId(savedId === 'null' ? null : savedId);
        if (savedTab) setActiveTab(savedTab as any);
        if (savedForm) {
            try {
                const parsed = JSON.parse(savedForm);
                if (parsed && (parsed.title !== undefined || parsed.description !== undefined)) {
                    setForm(parsed);
                }
            } catch (e) {
                console.error("Failed to parse saved form", e);
            }
        }
        setInitialized(true);
    }, []);

    useEffect(() => {
        if (!initialized) return; // Wait for initial load
        sessionStorage.setItem('problem_manager_view', view);
        sessionStorage.setItem('problem_manager_editing_id', editingId || 'null');
        sessionStorage.setItem('problem_manager_active_tab', activeTab);
        sessionStorage.setItem('problem_manager_form', JSON.stringify(form));
    }, [view, editingId, activeTab, form, initialized]);
    const itemsPerPage = 8;

    // Language & Editor Refs
    const [language, setLanguage] = useState('c');
    const [testCaseCount, setTestCaseCount] = useState(5);
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    // --- Paste & Shortcut Logic ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Intercept Ctrl+V or Cmd+V
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                // Check if we are inside the editor context
                const target = e.target as HTMLElement;
                if (target.classList.contains('view-lines') || target.closest('.monaco-editor')) {
                    e.preventDefault();
                    handleManualPaste();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleManualPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (editorRef.current && monacoRef.current) {
                const selection = editorRef.current.getSelection();
                if (!selection) return;

                const range = new monacoRef.current.Range(
                    selection.startLineNumber,
                    selection.startColumn,
                    selection.endLineNumber,
                    selection.endColumn
                );

                editorRef.current.executeEdits('manual-paste', [
                    { range, text, forceMoveMarkers: true }
                ]);
                showToast("已从剪贴板粘贴", "success");
            }
        } catch (err) {
            console.error('Paste failed', err);
            showToast("粘贴失败，请授权剪贴板访问", "error");
        }
    };

    const handleCreate = () => {
        setForm({ ...EMPTY_PROBLEM, referenceCode: DEFAULT_REF_CODE });
        setEditingId(null);
        setRawText('');
        setMode('manual');
        setActiveTab('basic');
        setVerificationResult(null);
        setView('editor');
    };

    const handleEdit = async (p: Problem) => {
        setEditingId(p.id);
        const fullProblem = await getProblemDetail(p.id);
        if (fullProblem) {
            setForm({
                ...fullProblem,
                referenceCode: fullProblem.referenceCode || DEFAULT_REF_CODE,
                testCases: fullProblem.testCases || []
            });
        }
        setMode('manual');
        setActiveTab('basic');
        setVerificationResult(null);
        setView('editor');
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('确定要删除这道题目吗？')) {
            try {
                await deleteProblem(id);
                setProblems(prev => prev.filter(p => p.id !== id));
            } catch (error) {
                showToast("删除失败", "error");
            }
        }
    };

    const handleSmartParse = async () => {
        if (!rawText) return;
        setParsing(true);
        try {
            const p = await smartParseProblem(rawText);
            if (!p || !p.title) {
                showToast("未识别到有效的题目信息", "info");
                return;
            }

            const result = {
                title: p.title || '',
                description: p.description || '',
                difficulty: (p.difficulty === '简单' || p.difficulty?.toLowerCase() === 'easy') ? 'Easy' : (p.difficulty === '困难' || p.difficulty?.toLowerCase() === 'hard') ? 'Hard' : 'Medium',
                tags: Array.isArray(p.tags) ? p.tags : [],
                inputExample: p.inputExample || '',
                outputExample: p.outputExample || ''
            };

            // Update raw text area for visibility
            setRawText(JSON.stringify(result, null, 2));
            
            setForm(prev => ({
                ...prev,
                ...result,
                difficulty: result.difficulty as Difficulty,
                testCases: result.inputExample && result.outputExample
                    ? [{ input: result.inputExample, output: result.outputExample }]
                    : (prev.testCases || []),
                referenceCode: prev.referenceCode || DEFAULT_REF_CODE
            }));
            showToast("识别完成并已反填模板", "success");
        } catch (e) {
            showToast("解析失败，请重试", "error");
        }
        setParsing(false);
    };

    const insertTemplate = () => {
        const template = `题目名称：
难度等级：简单/中等/困难
知识点标签：算法, 入门
题目描述：
（在此输入描述...）

输入样例：
输出样例：
`;
        setRawText(prev => (prev ? prev + '\n' : '') + template);
    };

    const handleTerminalPaste = () => {
        const text = window.prompt("请粘贴终端内容（支持多行交替）：");
        if (!text) return;

        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        
        // Check for explicit markers
        const hasMarkers = lines.some(l => /^(input|输入|output|输出|in|out)[:：\s]*/i.test(l));

        if (hasMarkers) {
            const pairs: { input: string; output: string }[] = [];
            let currentInput: string[] = [];
            let isCollectingInput = true;

            lines.forEach((line) => {
                const low = line.toLowerCase();
                const isInputMarker = low.startsWith('输入') || low.startsWith('input') || low.startsWith('in:');
                const isOutputMarker = low.startsWith('输出') || low.startsWith('output') || low.startsWith('out:');

                if (isInputMarker) {
                    const val = line.replace(/^(input|in|输入)[:：\s]*/i, '').trim();
                    if (val) currentInput.push(val);
                    isCollectingInput = true;
                } else if (isOutputMarker) {
                    const val = line.replace(/^(output|out|输出)[:：\s]*/i, '').trim();
                    if (currentInput.length > 0) {
                        pairs.push({ input: currentInput.join('\n'), output: val });
                        currentInput = [];
                    }
                    isCollectingInput = false;
                } else {
                    if (isCollectingInput) currentInput.push(line);
                    else { currentInput = [line]; isCollectingInput = true; }
                }
            });

            if (pairs.length > 0) {
                setForm(prev => ({ ...prev, testCases: [...(prev.testCases || []), ...pairs] }));
                showToast(`成功识别 ${pairs.length} 组用例`, "success");
            }
        } else {
            // Strategy B: No markers, like "3 13 -1 123 312 24 24"
            // For ACM style problems (cin >> q), we need one single input block containing ALL queries.
            if (lines.length % 2 !== 0 && lines.length >= 3) {
                const q = lines[0];
                const inputLines = [q];
                const outputLines = [];
                for (let i = 1; i < lines.length - 1; i += 2) {
                    inputLines.push(lines[i]);
                    outputLines.push(lines[i+1]);
                }
                const singlePair = {
                    input: inputLines.join('\n'),
                    output: outputLines.join('\n')
                };
                setForm(prev => ({
                    ...prev,
                    testCases: [...(prev.testCases || []), singlePair]
                }));
                showToast("已作为 1 组完整测试数据点导入", "success");
            } else if (lines.length % 2 === 0) {
                // Classic alternating
                const pairs = [];
                for (let i = 0; i < lines.length - 1; i += 2) {
                    pairs.push({ input: lines[i], output: lines[i+1] });
                }
                setForm(prev => ({ ...prev, testCases: [...(prev.testCases || []), ...pairs] }));
                showToast(`已导入 ${pairs.length} 组独立用例`, "success");
            } else {
                showToast("无法识别该格式，请确保数据行数正确", "info");
            }
        }
    };

    const handleGenerateTestCases = async () => {
        if (!form.description) {
            showToast("请先填写题目描述", "info");
            return;
        }
        setGeneratingTests(true);

        try {
            // Pass reference code if available for better accuracy
            const resultText = await generateTestCases(form.description, testCaseCount, form.referenceCode);
            
            if (!resultText) {
                showToast("AI 未能生成有效的测试数据", "error");
                setGeneratingTests(false);
                return;
            }

            // Parse cases using regex: looking for "输入：" and "输出："
            const caseBlocks = resultText.split(/第\d+组：|用例\d+：/).filter(b => b.trim());
            
            const parsedCases = caseBlocks.map(block => {
                const inputMatch = block.match(/输入：\s*([\s\S]*?)(?=输出：|$)/);
                const outputMatch = block.match(/输出：\s*([\s\S]*?)$/);
                
                const input = inputMatch ? inputMatch[1].trim() : '';
                const output = outputMatch ? outputMatch[1].trim() : '';

                return { input, output };
            }).filter(c => {
                const hasValue = c.input || c.output;
                // 过滤掉包含过多中文字符的内容（通常是 AI 误导输出的描述）
                const isDescriptive = /[\u4e00-\u9fa5]{4,}/.test(c.input) || /[\u4e00-\u9fa5]{4,}/.test(c.output);
                return hasValue && !isDescriptive;
            });

            // Add the example case from parsing if available
            if (form.inputExample && form.outputExample) {
                const exists = parsedCases.some(c => c.input === form.inputExample);
                if (!exists) {
                    parsedCases.unshift({
                        input: form.inputExample,
                        output: form.outputExample
                    });
                }
            }

            // Filter duplicates based on Input
            const uniqueCases = parsedCases.filter((caseItem: TestCase, index: number, self: TestCase[]) =>
                caseItem && index === self.findIndex((t) => t && (t.input || '').trim() === (caseItem.input || '').trim())
            );

            setForm(prev => ({ ...prev, testCases: uniqueCases }));
            showToast(`成功生成 ${uniqueCases.length} 组用例`, "success");
        } catch (e) {
            showToast("生成过程出错", "error");
        }
        
        setGeneratingTests(false);
        setVerificationResult(null);
    };

    const handleAddTestCase = () => {
        setForm(prev => ({
            ...prev,
            testCases: [...(prev.testCases || []), { input: '', output: '' }]
        }));
    };

    const handleRemoveTestCase = (index: number) => {
        setForm(prev => ({
            ...prev,
            testCases: prev.testCases?.filter((_, i) => i !== index)
        }));
    };

    const handleTestCaseChange = (index: number, field: 'input' | 'output', value: string) => {
        const newCases = [...(form.testCases || [])];
        newCases[index] = { ...newCases[index], [field]: value };
        setForm(prev => ({ ...prev, testCases: newCases }));
    };

    const handleVerify = async () => {
        if (!form.referenceCode || (form.testCases?.length || 0) === 0) {
            showToast("请提供标准代码和至少一组测试用例", "info");
            return;
        }
        setVerifying(true);
        try {
            const result = await validateProblem({
                code: form.referenceCode,
                language: language,
                testCases: form.testCases
            });

            if (result.status === 'AC') {
                setVerificationResult('success');
            } else {
                setVerificationResult('fail');
                let msg = `验证失败: ${result.status} (得分: ${result.score})`;
                if (result.error) msg += `\n错误信息: ${result.error}`;
                if (result.first_fail) {
                    msg += `\n\n[Failed Case]\nInput: ${result.first_fail.input}\nExpected: ${result.first_fail.expected}\nActual: ${result.first_fail.actual}`;
                }
                showToast("代码验证未通过", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("验证服务暂时不可用", "error");
            setVerificationResult('fail');
        }
        setVerifying(false);
    };

    const handleSave = async () => {
        if (!form.title) {
            showToast('请输入题目名称', "info");
            return;
        }

        if ((form.testCases?.length || 0) > 0 && verificationResult !== 'success') {
            if (!window.confirm("这道题目的测试用例尚未通过标准代码验证，确定要强制保存吗？")) {
                return;
            }
        }

        setSaving(true);
        try {
            if (editingId) {
                // Update
                const updated = await updateProblem(editingId, {
                    ...form,
                    bank_id: form.bankId // Ensure backend receives snake_case
                });

                // Mapping backend response fields to frontend state format
                const bankId = updated.bank_id || updated.bankId;
                const currentBank = banks.find(b => b.id === bankId);
                const problemWithBank = {
                    ...updated,
                    bankId: bankId,
                    inputExample: updated.input_example || updated.inputExample,
                    outputExample: updated.output_example || updated.outputExample,
                    testCases: updated.testCases || [],
                    problem_bank: currentBank ? { id: currentBank.id, title: currentBank.title } : null
                };

                setProblems(prev => prev.map(p => p.id === editingId ? problemWithBank : p));
                showToast("更新成功");
            } else {
                // Create
                const created = await createProblem(form);
                const bankId = created.bank_id || created.bankId;
                const currentBank = banks.find(b => b.id === bankId);
                const problemWithBank = {
                    ...created,
                    bankId: bankId,
                    inputExample: created.input_example || created.inputExample,
                    outputExample: created.output_example || created.outputExample,
                    testCases: created.testCases || [],
                    problem_bank: currentBank ? { id: currentBank.id, title: currentBank.title } : null
                };
                setProblems(prev => [problemWithBank, ...prev]);
                showToast("创建成功");
            }
            setView('list');
        } catch (error) {
            console.error(error);
            showToast("保存失败", "error");
        } finally {
            setSaving(false);
        }
    };
    const refreshProblems = async () => {
        window.location.reload();
    };

    const handleBulkImport = () => {
        setView('bulk_ai');
    };

    // ... (existing handlers)

    const handleImportedProblem = (newProblem: any) => {
        setProblems(prev => [newProblem, ...prev]);
    };

    // --- BULK IMPORT VIEW ---
    if (view === 'bulk_ai') {
        return (
            <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col animate-fade-in">
                <div className="flex items-center gap-4">
                    <IconButton onClick={() => setView('list')} className="rounded-full">
                        <ArrowLeft size={20} />
                    </IconButton>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">AI 批量录题</h2>
                        <p className="text-sm text-slate-500">智能识别多道题目，一键导入题库</p>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <SmartProblemImport
                        showToast={showToast}
                        banks={banks}
                        refreshProblems={refreshProblems}
                        onImport={handleImportedProblem}
                    />
                </div>
            </div>
        );
    }

    // --- LIST VIEW ---
    if (view === 'list') {
        const filtered = problems.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const paginatedProblems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

        return (
            <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">题目管理</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">管理、编辑和发布编程题目</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="搜索题目..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none w-64 transition-all"
                            />
                        </div>
                        <Button variant="secondary" onClick={handleBulkImport} className="!rounded-xl backdrop-blur-md">
                            <Brain size={16} /> AI 批量录入
                        </Button>
                        <Button onClick={handleCreate} className="!rounded-xl shadow-xl shadow-blue-500/10">
                            <Plus size={16} /> 新增题目
                        </Button>
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl border border-white/10 shadow-3xl overflow-hidden flex-1 flex flex-col backdrop-blur-md">
                    <div className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4">题目名称</th>
                                    <th className="px-6 py-4">所属题库</th>
                                    <th className="px-6 py-4 w-32">难度</th>
                                    <th className="px-6 py-4 text-center">测试点数量</th>
                                    <th className="px-6 py-4 w-32 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {paginatedProblems.map(p => (
                                    <tr key={p.id} className="hover:bg-white/5 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">{p.title}</div>
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">ID: #{p.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                                            {banks.find(b => b.id === p.bankId)?.title || <span className="text-slate-600 italic">未分类</span>}
                                        </td>
                                        <td className="px-6 py-4"><DifficultyBadge level={p.difficulty} /></td>
                                        <td className="px-6 py-4 text-center">
                                            {p.testCases?.length ? (
                                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                    {p.testCases.length} 组数据
                                                </span>
                                            ) : (
                                                <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">未配置</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(p)} className="p-2 bg-white/5 border border-white/10 hover:bg-blue-500/10 rounded-xl text-slate-400 hover:text-blue-400 transition shadow-sm backdrop-blur-md">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(p.id)} className="p-2 bg-white/5 border border-white/10 hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-400 transition shadow-sm backdrop-blur-md">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="border-t border-white/5">
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                            totalItems={filtered.length}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // --- EDITOR VIEW ---
    return (
        <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <IconButton onClick={() => setView('list')} className="rounded-full">
                        <ArrowLeft size={20} />
                    </IconButton>
                    <h2 className="text-2xl font-bold text-slate-800">
                        {editingId ? '编辑题目' : mode === 'ai' ? 'AI 智能录入' : '新增题目'}
                    </h2>
                </div>

                {/* Top Actions / Mode Switch */}
                {activeTab === 'basic' && (
                    <div className="bg-slate-100 p-1 rounded-lg flex text-sm">
                        <button
                            onClick={() => setMode('manual')}
                            className={`px-4 py-1.5 rounded-md transition ${mode === 'manual' ? 'bg-white shadow text-slate-800 font-medium' : 'text-slate-500'}`}
                        >
                            手动录入
                        </button>
                        <button
                            onClick={() => setMode('ai')}
                            className={`px-4 py-1.5 rounded-md transition flex items-center gap-2 ${mode === 'ai' ? 'bg-white shadow text-blue-600 font-medium' : 'text-slate-500'}`}
                        >
                            <Brain size={14} /> AI 智能识别
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('basic')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'basic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Edit2 size={16} /> 题目信息
                </button>
                <button
                    onClick={() => setActiveTab('validation')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${activeTab === 'validation' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Beaker size={16} /> 验证与数据
                    {verificationResult === 'success' && <CheckCircle size={14} className="text-green-500" />}
                </button>
            </div>

            {/* TAB CONTENT: BASIC INFO */}
            {activeTab === 'basic' && (
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {mode === 'ai' && (
                        <Card className="w-1/3 p-4 flex flex-col h-full bg-slate-50/50">
                            <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2"><div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">1</div> 粘贴原题文本</h3>
                            <p className="text-xs text-slate-400 mb-4">支持从 Word, PDF 或网页直接复制粘贴</p>
                            <div className="text-xs text-slate-500 mb-2 space-y-1">
                                <p className="font-semibold">要求:</p>
                                <ul className="list-disc list-inside ml-2">
                                    <li><span className="font-semibold">绝对禁令</span>: 严禁输出任何中文说明、描述文字、逻辑解释或提示性语句（如“第一行输入...”）。仅输出程序标准 IO 需要的<span className="font-semibold">纯数据字符串</span>。</li>
                                    <li><span className="font-semibold">忽略描述文字</span>: 题目描述中包含的“输入描述”和“输出描述”文字段落仅供参考逻辑，<span className="font-semibold">严禁</span>将其作为测试用例输出。</li>
                                    <li>覆盖边界情况。</li>
                                    <li>输入和输出必须是纯净的标准 IO 格式。</li>
                                </ul>
                            </div>
                            <textarea
                                className="flex-1 w-full border border-slate-200 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="请在此粘贴完整的题目描述..."
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                            <div className="flex gap-2 mt-4">
                                <Button className="flex-1 justify-center" onClick={handleSmartParse} disabled={parsing}>
                                    {parsing ? 'AI 正在分析...' : '开始识别'}
                                </Button>
                                <Button variant="secondary" onClick={insertTemplate} title="使用结构化标签填充可实现 100% 识别率">
                                    生成模板
                                </Button>
                            </div>
                        </Card>
                    )}

                    <Card className={`flex-1 p-8 overflow-y-auto ${mode === 'ai' ? 'w-2/3' : 'w-full'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">{mode === 'ai' ? '2' : '1'}</div>
                                确认题目详情
                            </h3>
                            <div className="text-xs text-slate-400">* 红色星号为必填项</div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">题目名称</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="例如：两数之和"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">所属题库</label>
                                <select
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                                    value={form.bankId || ''}
                                    onChange={(e) => setForm({ ...form, bankId: e.target.value })}
                                >
                                    <option value="">-- 请选择题库 --</option>
                                    {banks.map(b => (
                                        <option key={b.id} value={b.id}>{b.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">难度等级</label>
                                    <select
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                                        value={form.difficulty}
                                        onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
                                    >
                                        <option value="Easy">简单</option>
                                        <option value="Medium">中等</option>
                                        <option value="Hard">困难</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">知识点标签</label>
                                    <input
                                        type="text"
                                        placeholder="用逗号分隔，例如：数组, 排序"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                        value={form.tags?.join(', ')}
                                        onChange={(e) => setForm({ ...form, tags: e.target.value.split(/[,，]/).map(s => s.trim()) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">题目描述 (支持 Markdown)</label>
                                <textarea
                                    className="w-full h-48 px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm leading-relaxed"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">输入样例 (展示给学生)</label>
                                    <textarea
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                        rows={4}
                                        value={form.inputExample}
                                        onChange={(e) => setForm({ ...form, inputExample: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">输出样例 (展示给学生)</label>
                                    <textarea
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                        rows={4}
                                        value={form.outputExample}
                                        onChange={(e) => setForm({ ...form, outputExample: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* TAB CONTENT: VALIDATION & DATA */}
            {activeTab === 'validation' && (
                <div className="flex-1 flex gap-6 overflow-hidden">
                    {/* Left: Reference Code Editor */}
                    <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2">
                                <CodeIcon size={16} className="text-blue-600" />
                                <h3 className="font-semibold text-slate-700 text-sm">标准题解 (Reference Code)</h3>
                            </div>
                            <div className="flex gap-2">
                                <select
                                    className="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="c">C Language</option>
                                    <option value="cpp">C++</option>
                                    <option value="java">Java</option>
                                    <option value="python">Python</option>
                                </select>
                                <button
                                    onClick={async () => {
                                        if (!form.description) return showToast("请先填写题目描述", "info");
                                        if (!window.confirm("AI 生成将覆盖当前代码，确定继续吗？")) return;
                                        setVerifying(true); // Reuse loading state or add new one
                                        try {
                                            const { generateReferenceCode } = await import('../../services/api');
                                            const code = await generateReferenceCode(form.description, language);
                                            setForm(prev => ({ ...prev, referenceCode: code }));
                                            showToast("代码生成成功");
                                        } catch (e) { showToast("生成失败", "error"); }
                                        setVerifying(false);
                                    }}
                                    className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1 rounded hover:bg-purple-100 flex items-center gap-1"
                                >
                                    <Brain size={12} /> AI 生成
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 relative group">
                            {/* Fix for Paste Issue: Sometimes clipboard events are blocked by browser if not explicitly focused or verified. 
                                ensuring automaticLayout and contextmenu can help. 
                                Also adding a trusted event listener if needed, but Monaco handles this internally.
                                Often 'Ctrl+V' issues in React apps are due to event bubbling capture.
                            */}
                            <Editor
                                height="100%"
                                language={language}
                                theme="vs-light"
                                value={form.referenceCode}
                                onChange={(val) => setForm({ ...form, referenceCode: val || '' })}
                                onMount={(editor, monaco) => {
                                    editorRef.current = editor;
                                    monacoRef.current = monaco;
                                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
                                        handleManualPaste();
                                    });
                                }}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    automaticLayout: true,
                                    contextmenu: true,
                                }}
                            />
                        </div>
                        <div className="p-3 border-t border-slate-100 flex justify-end">
                            <Button onClick={handleVerify} disabled={verifying || (form.testCases?.length || 0) === 0} className={`w-full ${verificationResult === 'success' ? 'bg-green-600 hover:bg-green-700' : ''}`}>
                                {verifying ? (
                                    <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> 正在跑测...</span>
                                ) : verificationResult === 'success' ? (
                                    <span className="flex items-center gap-2"><CheckCircle size={16} /> 验证通过</span>
                                ) : (
                                    <span className="flex items-center gap-2"><Play size={16} /> 运行验证</span>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Right: Test Cases Manager */}
                    <div className="w-1/2 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div className="flex items-center gap-2">
                                <Beaker size={16} className="text-purple-600" />
                                <h3 className="font-semibold text-slate-700 text-sm">测试用例 ({form.testCases?.length || 0})</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">数量:</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={testCaseCount}
                                    onChange={(e) => setTestCaseCount(parseInt(e.target.value))}
                                    className="w-12 text-xs border border-slate-300 rounded px-1 py-1 text-center focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    onClick={handleGenerateTestCases}
                                    disabled={generatingTests}
                                    className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-50 transition flex items-center gap-1"
                                >
                                    {generatingTests ? '生成中...' : <><RefreshCw size={12} /> AI 生成</>}
                                </button>
                                <button
                                    onClick={handleTerminalPaste}
                                    className="text-xs bg-slate-50 border border-slate-200 text-slate-600 px-3 py-1.5 rounded hover:bg-slate-100 transition flex items-center gap-1"
                                    title="直接粘贴终端交互产生的输入输出文本"
                                >
                                    终端粘贴
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                            {(!form.testCases || form.testCases.length === 0) && (
                                <div className="text-center py-10 text-slate-400">
                                    <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">暂无测试用例</p>
                                    <p className="text-xs mt-1">请点击右上角自动生成，或手动添加</p>
                                </div>
                            )}

                            {form.testCases?.map((tc, index) => (
                                <div key={index} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm group">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-500">Case #{index + 1}</span>
                                        <IconButton onClick={() => handleRemoveTestCase(index)} variant="danger" size="sm">
                                            <X size={14} />
                                        </IconButton>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] text-slate-400 mb-1 uppercase">Input</label>
                                            <textarea
                                                rows={3}
                                                className="w-full text-xs font-mono p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                                value={tc.input}
                                                onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] text-slate-400 mb-1 uppercase">Output</label>
                                            <textarea
                                                rows={3}
                                                className="w-full text-xs font-mono p-2 border border-slate-200 rounded bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                                value={tc.output}
                                                onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button onClick={handleAddTestCase} className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center gap-2 text-sm font-medium">
                                <Plus size={16} /> 添加测试点
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setView('list')}>取消</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? '保存中...' : '保存题目'}</Button>
            </div>
        </div>
    );
};
