import React, { useState } from 'react';
import { FileText, ArrowRight, CheckCircle, Loader2, Database, AlertCircle, Trash2, Beaker, Play, FolderOpen, Sparkles, X } from 'lucide-react';
import { Button, Card, DifficultyBadge } from '../UiComponents';
import { smartParseBatchProblems, createProblem, generateTestCases } from '../../services/api';
import { ProblemBank } from '../../types';

interface ParsedProblem {
    title: string;
    description: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    inputExample: string;
    outputExample: string;
    tags?: string[];
    testCases?: { input: string; output: string }[];
}

interface SmartProblemImportProps {
    onImport?: (problem: any) => void;
    showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
    banks: ProblemBank[];
    defaultBankId?: string;
    refreshProblems?: () => void;
}

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
    
    // 题目描述识别：支持标签或 JSON 键名
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
        difficulty: (difficultyText.includes('简单') || difficultyText.toLowerCase().includes('easy')) ? 'Easy' : (difficultyText.includes('困难') || difficultyText.toLowerCase().includes('hard')) ? 'Hard' : 'Medium' as 'Easy' | 'Medium' | 'Hard',
        tags: tagsText.split(/[,，]/).map(s => s.trim()).filter(s => s),
        inputExample: clean(inputExample),
        outputExample: clean(outputExample)
    };
};

export const SmartProblemImport: React.FC<SmartProblemImportProps> = ({ onImport, showToast, banks, defaultBankId, refreshProblems }) => {
    const [rawText, setRawText] = useState('');
    const [loading, setLoading] = useState(false);
    const [parsedResults, setParsedResults] = useState<ParsedProblem[]>([]);
    const [generatingMap, setGeneratingMap] = useState<Record<number, boolean>>({});
    const [previewProblemIndex, setPreviewProblemIndex] = useState<number | null>(null);

    const [targetBankId, setTargetBankId] = useState<string>(defaultBankId || '');
    const [testCaseCount, setTestCaseCount] = useState<number>(5);
    const [expectedProblemCount, setExpectedProblemCount] = useState<number>(1);

    const handleAnalyze = async () => {
        if (!rawText.trim()) return;
        setLoading(true);
        setParsedResults([]);
        try {
            const resultList = await smartParseBatchProblems(rawText, expectedProblemCount);
            if (!resultList || !Array.isArray(resultList)) {
                showToast('AI 未能返回有效的识别结果', 'info');
                return;
            }

            const parsed = resultList.map((p: any) => ({
                title: p.title || '',
                description: p.description || '',
                difficulty: (p.difficulty === '简单' || p.difficulty?.toLowerCase() === 'easy') ? 'Easy' : (p.difficulty === '困难' || p.difficulty?.toLowerCase() === 'hard') ? 'Hard' : 'Medium',
                tags: Array.isArray(p.tags) ? p.tags : [],
                inputExample: p.inputExample || '',
                outputExample: p.outputExample || ''
            }));

            // Update main text area so user sees the formatted JSON output
            setRawText(JSON.stringify(parsed, null, 2));
            
            setParsedResults(parsed);
            if (parsed.length > 0) {
                showToast(`AI 成功识别 ${parsed.length} 道题目`, 'success');
            } else {
                showToast('解析失败，请检查格式', 'info');
            }
        } catch (e) {
            console.error(e);
            showToast('解析失败，请检查输入或稍后重试', 'error');
        }
        setLoading(false);
    };

    const insertTemplate = () => {
        const template = `题目名称：
难度等级：简单/中等/困难
知识点标签：算法, 入门
题目描述：
（在此输入描述...）

输入样例：
输出样例：

--------------------------
`;
        setRawText(prev => prev + (prev.endsWith('\n') ? '' : '\n') + template);
    };

    const handleGenerateCases = async (index: number) => {
        const problem = parsedResults[index];
        if (!problem.description) return;

        setGeneratingMap(prev => ({ ...prev, [index]: true }));
        try {
            // Assuming problem might have a referenceCode property if needed for test case generation
            // For now, using problem.description as per original logic, but added problem.referenceCode as a placeholder if API supports it.
            const resultText = await generateTestCases(problem.description, testCaseCount, (problem as any).referenceCode);
            if (!resultText) {
                showToast('AI 未能生成测试用例', 'error');
                return;
            }

            // Parse cases using regex: looking for "输入：" and "输出："
            // Robustly split blocks by "第X组：" or "用例X：" or just by newlines if no specific markers
            const caseBlocks = resultText.split(/第\d+组：|用例\d+：/).filter(b => b.trim());
            
            const parsedCases = caseBlocks.map(block => {
                // Use non-greedy match for input and output
                const inputMatch = block.match(/输入：\s*([\s\S]*?)(?=输出：|$)/);
                const outputMatch = block.match(/输出：\s*([\s\S]*?)$/);
                
                // Clean up extracted strings, remove leading/trailing whitespace
                const input = inputMatch ? inputMatch[1].trim() : '';
                const output = outputMatch ? outputMatch[1].trim() : '';

                return { input, output };
            }).filter(c => c.input || c.output); // Only keep cases that have at least input or output

            setParsedResults(prev => prev.map((item, idx) => 
                idx === index ? { ...item, testCases: parsedCases } : item
            ));
            showToast(`成功生成 ${parsedCases.length} 组用例`, 'success');
        } catch (e) {
            showToast("生成测试用例失败", "error");
        }
        setGeneratingMap(prev => ({ ...prev, [index]: false }));
    };

    const handleConfirmImport = async () => {
        if (parsedResults.length === 0) return;

        let successCount = 0;
        setLoading(true);

        for (const p of parsedResults) {
            try {
                const difficultyMap: any = {
                    '简单': 'Easy',
                    '中等': 'Medium',
                    '困难': 'Hard'
                };

                const payload = {
                    title: p.title,
                    description: p.description,
                    difficulty: difficultyMap[p.difficulty as string] || p.difficulty || 'Easy',
                    inputExample: p.inputExample,
                    outputExample: p.outputExample,
                    tags: p.tags || [],
                    bankId: targetBankId || null,
                    testCases: p.testCases
                };
                const createdProblem = await createProblem(payload);
                successCount++;
                if (onImport) onImport(createdProblem);
            } catch (e) {
                console.error("Import failed for", p.title, e);
            }
        }

        setLoading(false);
        showToast(`成功导入 ${successCount}/${parsedResults.length} 道题目到题库！`, 'success');
        if (successCount > 0 && refreshProblems) {
            refreshProblems();
        }

        if (successCount === parsedResults.length) {
            setRawText('');
            setParsedResults([]);
        }
    };

    const handleRemove = (idx: number) => {
        const newResults = [...parsedResults];
        newResults.splice(idx, 1);
        setParsedResults(newResults);
    };

    const handleBatchGenerate = async () => {
        if (parsedResults.length === 0) return;
        const confirm = window.confirm(`确定为所有 ${parsedResults.length} 道题目生成测试用例吗？这将花费一些时间。`);
        if (!confirm) return;

        setLoading(true);
        const newResults = [...parsedResults];

        for (let i = 0; i < newResults.length; i++) {
            if (newResults[i].testCases && newResults[i].testCases!.length > 0) continue; // Skip if already has cases

            try {
                // Determine count based on difficulty? Default to 5.
                const cases = await generateTestCases(newResults[i].description, testCaseCount);
                newResults[i].testCases = Array.isArray(cases) ? cases : [];
            } catch (e) {
                console.error(`Failed to generate cases for ${newResults[i].title}`);
            }
        }

        setParsedResults(newResults);
        setLoading(false);
        showToast("批量生成测试用例完成", "success");
    };

    // ... (keep rendering) ...

    return (
        <Card className="p-8 h-full flex flex-col relative bg-white/5">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                        <Database size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">AI 智能/批量录题</h3>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">支持一次性识别多个题目，AI 自动拆分并预览</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">预计数量:</span>
                        <select 
                            className="bg-transparent text-white text-[10px] font-black focus:outline-none"
                            value={expectedProblemCount}
                            onChange={(e) => setExpectedProblemCount(Number(e.target.value))}
                        >
                            {[1, 2, 3, 5, 10].map(n => <option key={n} value={n} className="bg-slate-900">{n} 道</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">用例数:</span>
                        <select 
                            className="bg-transparent text-white text-[10px] font-black focus:outline-none"
                            value={testCaseCount}
                            onChange={(e) => setTestCaseCount(Number(e.target.value))}
                        >
                            {[3, 5, 10, 20].map(n => <option key={n} value={n} className="bg-slate-900">{n} 组</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                        <FolderOpen size={14} className="text-slate-500" />
                        <select 
                            className="bg-transparent text-white text-[10px] font-black focus:outline-none max-w-[120px]"
                            value={targetBankId}
                            onChange={(e) => setTargetBankId(e.target.value)}
                        >
                            <option value="" className="bg-slate-900">导入到: 未分类 (默认)</option>
                            {banks.map(b => <option key={b.id} value={b.id} className="bg-slate-900">{b.title}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[350px]">
                {/* Left: Input */}
                <div className="flex flex-col gap-3">
                    <textarea
                        className="flex-1 w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-medium placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all resize-none leading-relaxed"
                        placeholder="在此粘贴题目文本...\n\n支持格式：\n1. 题目名称\n描述...\n\n2. 题目2\n描述..."
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                    />
                    <div className="flex gap-3">
                        <Button 
                            onClick={handleAnalyze}
                            disabled={loading || !rawText.trim()}
                            className="flex-1 py-4 !rounded-2xl shadow-xl shadow-blue-500/10"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                            {loading ? "AI 深度解析中..." : "开始智能解析"}
                        </Button>
                        <Button variant="secondary" onClick={insertTemplate} className="!rounded-2xl px-6">
                            模板
                        </Button>
                    </div>
                </div>

                {/* Right: Results Preview */}
                <div className="flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">解析结果预览</span>
                        {parsedResults.length > 0 && (
                            <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                共 {parsedResults.length} 题
                            </span>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                        {parsedResults.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50">
                                <FileText size={48} strokeWidth={1} />
                                <p className="text-[10px] font-black uppercase tracking-widest">解析结果将显示在这里</p>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em]">支持一次性识别多个题目</p>
                            </div>
                        ) : (
                            parsedResults.map((p, idx) => (
                                <div key={idx} className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:border-blue-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-blue-500 opacity-50">#{idx + 1}</span>
                                                <h4 className="font-black text-white text-sm tracking-tight">{p.title || '未命名题目'}</h4>
                                            </div>
                                            <div className="flex gap-2">
                                                <DifficultyBadge level={p.difficulty as any} />
                                                {p.tags?.slice(0, 2).map(t => (
                                                    <span key={t} className="px-2 py-0.5 rounded bg-white/5 text-slate-500 text-[9px] font-black uppercase tracking-widest">{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleRemove(idx)}
                                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button 
                                            onClick={() => handleGenerateCases(idx)}
                                            disabled={generatingMap[idx]}
                                            className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-black text-slate-400 hover:text-white rounded-lg transition flex items-center justify-center gap-2 uppercase tracking-widest border border-white/5"
                                        >
                                            {generatingMap[idx] ? <Loader2 size={12} className="animate-spin" /> : <Beaker size={12} />}
                                            {p.testCases && p.testCases.length > 0 ? `重新生成用例 (${p.testCases.length})` : "生成测试用例"}
                                        </button>
                                        {p.testCases && p.testCases.length > 0 && (
                                            <button 
                                                onClick={() => setPreviewProblemIndex(idx)}
                                                className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest"
                                            >
                                                预览
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {parsedResults.length > 0 && (
                        <div className="p-4 bg-white/5 border-t border-white/10 grid grid-cols-2 gap-3">
                            <button 
                                onClick={handleBatchGenerate}
                                disabled={loading}
                                className="py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-xl transition uppercase tracking-widest border border-white/10"
                            >
                                批量生成用例
                            </button>
                            <button 
                                onClick={handleConfirmImport}
                                disabled={loading}
                                className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-xl transition shadow-lg shadow-blue-500/20 uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={14} />
                                确认导入全部
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Preview Modal */}
            {previewProblemIndex !== null && (
                <div className="fixed inset-0 z-[100] bg-[#020617]/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="tech-card-glass-dark w-full max-w-2xl max-h-[80%] flex flex-col rounded-[32px] overflow-hidden border border-white/10 shadow-3xl">
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-xl font-black text-white tracking-tight">
                                    测试用例预览
                                </h3>
                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">题目: {parsedResults[previewProblemIndex].title}</p>
                            </div>
                            <button 
                                onClick={() => setPreviewProblemIndex(null)} 
                                className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {parsedResults[previewProblemIndex].testCases?.map((c, i) => (
                                <div key={i} className="space-y-3 bg-white/5 p-6 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-black border border-blue-500/20">
                                            {i + 1}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">测试组</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">输入 (Input)</div>
                                            <pre className="bg-slate-950 p-4 rounded-xl text-xs text-blue-400 font-mono border border-white/5 overflow-x-auto min-h-[60px]">{c.input || '(空)'}</pre>
                                        </div>
                                        <div>
                                            <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1.5 ml-1">期望输出 (Output)</div>
                                            <pre className="bg-slate-950 p-4 rounded-xl text-xs text-emerald-400 font-mono border border-white/5 overflow-x-auto min-h-[60px]">{c.output || '(空)'}</pre>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-8 bg-white/5 border-t border-white/5 flex justify-end">
                            <Button onClick={() => setPreviewProblemIndex(null)} className="px-8 !rounded-2xl">
                                完成预览
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};
