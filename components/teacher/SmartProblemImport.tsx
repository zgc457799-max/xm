import React, { useState } from 'react';
import { 
    FileText, ArrowRight, CheckCircle, Loader2, Database, AlertCircle, 
    Trash2, Beaker, Play, FolderOpen, Sparkles, X, Globe, BookOpen, Zap 
} from 'lucide-react';
import { Button, Card, DifficultyBadge } from '../UiComponents';
import { 
    smartParseBatchProblems, 
    createProblem, 
    generateTestCases,
    importProblemFromUrl,
    importPresetBank
} from '../../services/api';
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

export const SmartProblemImport: React.FC<SmartProblemImportProps> = ({ 
    onImport, 
    showToast, 
    banks, 
    defaultBankId, 
    refreshProblems 
}) => {
    // Mode State
    const [importMode, setImportMode] = useState<'text' | 'url' | 'preset'>('text');

    // Left Panel States
    const [rawText, setRawText] = useState('');
    const [urlInput, setUrlInput] = useState('');
    const [urlPlatform, setUrlPlatform] = useState('auto');
    const [selectedPresetId, setSelectedPresetId] = useState('preset_syntax');

    // General States
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

    const handleUrlImportSubmit = async () => {
        if (!urlInput.trim()) {
            showToast('请输入有效的网页链接', 'info');
            return;
        }
        setLoading(true);
        setParsedResults([]);
        try {
            const parsed = await importProblemFromUrl(urlInput.trim(), urlPlatform);
            if (!parsed || !parsed.title) {
                showToast('AI 智能抓取解析未返回有效题面', 'info');
                return;
            }

            const problem: ParsedProblem = {
                title: parsed.title,
                description: parsed.description || '',
                difficulty: parsed.difficulty || 'Easy',
                tags: parsed.tags || [],
                inputExample: parsed.inputExample || '',
                outputExample: parsed.outputExample || ''
            };

            setParsedResults([problem]);
            showToast('网页题目智能拉取并解析成功！', 'success');
        } catch (e: any) {
            console.error(e);
            const msg = e.response?.data?.message || '拉取网页题目失败，请检查网络或链接是否支持。';
            showToast(msg, 'error');
        }
        setLoading(false);
    };

    const handlePresetImportSubmit = async () => {
        setLoading(true);
        try {
            const res = await importPresetBank(selectedPresetId, targetBankId);
            showToast(res.message || '批量导入精品题单成功！', 'success');
            setParsedResults([]);
            if (refreshProblems) {
                refreshProblems();
            }
        } catch (e: any) {
            console.error(e);
            showToast('批量导入精品题单失败，请检查数据库配置', 'error');
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
            const resultText = await generateTestCases(problem.description, testCaseCount, (problem as any).referenceCode);
            if (!resultText) {
                showToast('AI 未能生成测试用例', 'error');
                return;
            }

            const caseBlocks = resultText.split(/第\d+组：|用例\d+：/).filter(b => b.trim());
            const parsedCases = caseBlocks.map(block => {
                const inputMatch = block.match(/输入：\s*([\s\S]*?)(?=输出：|$)/);
                const outputMatch = block.match(/输出：\s*([\s\S]*?)$/);
                const input = inputMatch ? inputMatch[1].trim() : '';
                const output = outputMatch ? outputMatch[1].trim() : '';
                return { input, output };
            }).filter(c => c.input || c.output);

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
            if (newResults[i].testCases && newResults[i].testCases!.length > 0) continue;

            try {
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

    const fillSampleUrl = (url: string, platform: string) => {
        setUrlInput(url);
        setUrlPlatform(platform);
    };

    return (
        <Card className="p-8 h-full flex flex-col relative bg-white/5 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] border border-blue-500/20">
                        <Database size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">AI 智能与网络多源录题</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">支持智能文本解析、多平台网页拉取、以及一键精品预设导入</p>
                    </div>
                </div>
                
                {/* Destination Configs */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">用例数:</span>
                        <select 
                            className="bg-transparent text-white text-[10px] font-black focus:outline-none"
                            value={testCaseCount}
                            onChange={(e) => setTestCaseCount(Number(e.target.value))}
                        >
                            {[3, 5, 10, 20].map(n => <option key={n} value={n} className="bg-slate-900">{n} 组</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl">
                        <FolderOpen size={14} className="text-slate-400" />
                        <select 
                            className="bg-transparent text-white text-[10px] font-black focus:outline-none max-w-[150px]"
                            value={targetBankId}
                            onChange={(e) => setTargetBankId(e.target.value)}
                        >
                            <option value="" className="bg-slate-900">导入到: 未分类 (默认)</option>
                            {banks.map(b => <option key={b.id} value={b.id} className="bg-slate-900">{b.title}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Premium Mode Tab Selector */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-6 max-w-md">
                <button
                    onClick={() => { setImportMode('text'); setParsedResults([]); }}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${importMode === 'text' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                    <FileText size={14} />
                    智能文本解析
                </button>
                <button
                    onClick={() => { setImportMode('url'); setParsedResults([]); }}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${importMode === 'url' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                    <Globe size={14} />
                    网页链接拉取
                </button>
                <button
                    onClick={() => { setImportMode('preset'); setParsedResults([]); }}
                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${importMode === 'preset' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
                >
                    <BookOpen size={14} />
                    精品预设题单
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
                
                {/* Left Area: Inputs */}
                <div className="flex flex-col gap-3 h-full">
                    {importMode === 'text' && (
                        <div className="flex-1 flex flex-col gap-3">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">请在下方粘贴一段包含题目描述的任意格式文本</span>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">预估AI识别数量:</span>
                                    <select 
                                        className="bg-transparent text-white text-[8px] font-black focus:outline-none"
                                        value={expectedProblemCount}
                                        onChange={(e) => setExpectedProblemCount(Number(e.target.value))}
                                    >
                                        {[1, 2, 3, 5, 10].map(n => <option key={n} value={n} className="bg-slate-900">{n} 道</option>)}
                                    </select>
                                </div>
                            </div>
                            <textarea
                                className="flex-1 w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-white text-sm font-medium placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all resize-none leading-relaxed min-h-[250px]"
                                placeholder="在此粘贴题目文本...\n\n支持标准格式或杂乱Word/PDF复制内容。AI会自动清洗，并对题目描述进行高可读性 Markdown 排版。"
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                            <div className="flex gap-3">
                                <Button 
                                    onClick={handleAnalyze}
                                    disabled={loading || !rawText.trim()}
                                    className="flex-1 py-4 !rounded-2xl shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                    {loading ? "AI 深度解析中..." : "开始智能解析"}
                                </Button>
                                <Button variant="secondary" onClick={insertTemplate} className="!rounded-2xl px-6 font-black tracking-widest text-xs uppercase text-slate-300">
                                    模板
                                </Button>
                            </div>
                        </div>
                    )}

                    {importMode === 'url' && (
                        <div className="flex-1 flex flex-col gap-6 p-6 bg-white/5 border border-white/10 rounded-3xl">
                            <div>
                                <h4 className="text-xs font-black text-white uppercase tracking-widest">🌐 输入题目网页 URL 地址</h4>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">支持 LeetCode (力扣)、Codeforces 经典题目链接以及任意技术博客的 AI 解析</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">链接类型 (Platform)</label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-bold focus:outline-none focus:border-blue-500/50 appearance-none"
                                            value={urlPlatform}
                                            onChange={(e) => setUrlPlatform(e.target.value)}
                                        >
                                            <option value="auto" className="bg-slate-900 text-white">⭐ 自动识别 / AI 智能解析 (抓取任意页面并智能转成 Markdown)</option>
                                            <option value="leetcode" className="bg-slate-900 text-white">力扣 (LeetCode CN & US - 原生高精准数据接口)</option>
                                            <option value="codeforces" className="bg-slate-900 text-white">Codeforces (CF 官方经典题库拉取)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-black text-[9px]">▼</div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">网页链接地址 (URL)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-medium placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
                                            placeholder="在此粘贴网址链接..."
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                        />
                                        <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Quick Sample Links */}
                            <div className="space-y-2">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">💡 常用拉取示例 (点击一键填入)</span>
                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        onClick={() => fillSampleUrl('https://leetcode.cn/problems/two-sum/', 'leetcode')}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-slate-300 transition-all"
                                    >
                                        力扣: 两数之和
                                    </button>
                                    <button 
                                        onClick={() => fillSampleUrl('https://leetcode.cn/problems/reverse-linked-list/', 'leetcode')}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-slate-300 transition-all"
                                    >
                                        力扣: 反转链表
                                    </button>
                                    <button 
                                        onClick={() => fillSampleUrl('https://codeforces.com/problemset/problem/1900/A', 'codeforces')}
                                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-slate-300 transition-all"
                                    >
                                        CF: 1900A (Cover in Water)
                                    </button>
                                </div>
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/5">
                                <Button
                                    onClick={handleUrlImportSubmit}
                                    disabled={loading || !urlInput.trim()}
                                    className="w-full py-4 !rounded-2xl shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                                    {loading ? "智能网页内容抓取解析中..." : "开始拉取网页并智能解析"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {importMode === 'preset' && (
                        <div className="flex-1 flex flex-col gap-6 p-6 bg-white/5 border border-white/10 rounded-3xl">
                            <div>
                                <h4 className="text-xs font-black text-white uppercase tracking-widest">🚀 教学预设精品题单</h4>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">精选适配 C/C++/Java/Python 四语言、覆盖基础到高阶的经典精选题单。一键全自动装配测试用例导入</p>
                            </div>

                            {/* Preset Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
                                <button
                                    onClick={() => setSelectedPresetId('preset_syntax')}
                                    className={`p-4 text-left rounded-2xl border transition-all relative overflow-hidden ${
                                        selectedPresetId === 'preset_syntax' 
                                            ? 'bg-gradient-to-br from-orange-500/15 to-red-500/15 border-orange-500/40 shadow-lg' 
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                            selectedPresetId === 'preset_syntax' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-slate-400'
                                        }`}>基础入门</span>
                                        <span className="text-[10px] text-slate-500 font-bold">5 道经典</span>
                                    </div>
                                    <h5 className="text-xs font-black text-white mb-1">零基础语法入门题单</h5>
                                    <p className="text-[9px] text-slate-400 leading-normal">包含 A+B、闰年判断、九九乘法表、素数判断及一维数组逆序。</p>
                                </button>

                                <button
                                    onClick={() => setSelectedPresetId('preset_oop')}
                                    className={`p-4 text-left rounded-2xl border transition-all relative overflow-hidden ${
                                        selectedPresetId === 'preset_oop' 
                                            ? 'bg-gradient-to-br from-blue-500/15 to-indigo-500/15 border-blue-500/40 shadow-lg' 
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                            selectedPresetId === 'preset_oop' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400'
                                        }`}>语言特性</span>
                                        <span className="text-[10px] text-slate-500 font-bold">3 道经典</span>
                                    </div>
                                    <h5 className="text-xs font-black text-white mb-1">类封装与指针操作</h5>
                                    <p className="text-[9px] text-slate-400 leading-normal">包含 C++ 指针交换、Java 类封装继承及 Python 列表切片与推导式。</p>
                                </button>

                                <button
                                    onClick={() => setSelectedPresetId('preset_ds')}
                                    className={`p-4 text-left rounded-2xl border transition-all relative overflow-hidden ${
                                        selectedPresetId === 'preset_ds' 
                                            ? 'bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border-emerald-500/40 shadow-lg' 
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                            selectedPresetId === 'preset_ds' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'
                                        }`}>数据结构</span>
                                        <span className="text-[10px] text-slate-500 font-bold">2 道核心</span>
                                    </div>
                                    <h5 className="text-xs font-black text-white mb-1">核心数据结构专项</h5>
                                    <p className="text-[9px] text-slate-400 leading-normal">精选数据结构必考核心：单链表原地反转以及有效的括号匹配检验。</p>
                                </button>

                                <button
                                    onClick={() => setSelectedPresetId('preset_algo')}
                                    className={`p-4 text-left rounded-2xl border transition-all relative overflow-hidden ${
                                        selectedPresetId === 'preset_algo' 
                                            ? 'bg-gradient-to-br from-purple-500/15 to-pink-500/15 border-purple-500/40 shadow-lg' 
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                            selectedPresetId === 'preset_algo' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-slate-400'
                                        }`}>高级算法</span>
                                        <span className="text-[10px] text-slate-500 font-bold">2 道核心</span>
                                    </div>
                                    <h5 className="text-xs font-black text-white mb-1">经典算法进阶题单</h5>
                                    <p className="text-[9px] text-slate-400 leading-normal">包含经典排序算法快速排序及硬核动态规划经典：0/1 背包问题。</p>
                                </button>
                            </div>

                            <div className="pt-6 border-t border-white/5 mt-auto">
                                <div className="mb-4 flex items-center justify-between px-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">当前选择目标归档题库:</span>
                                    <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                        {banks.find(b => b.id === targetBankId)?.title || "未分类题库"}
                                    </span>
                                </div>
                                <Button
                                    onClick={handlePresetImportSubmit}
                                    disabled={loading}
                                    className="w-full py-4 !rounded-2xl shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                                    {loading ? "全自动建库中，请稍候..." : "一键拉取题单并自动导入本地"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Right Area: Results Preview */}
                <div className="flex flex-col bg-white/5 border border-white/10 rounded-3xl overflow-hidden min-h-[400px]">
                    <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">导入题目预览</span>
                        {parsedResults.length > 0 && (
                            <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                共 {parsedResults.length} 题
                            </span>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                        {parsedResults.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50 py-12">
                                <FileText size={48} strokeWidth={1} />
                                <p className="text-[10px] font-black uppercase tracking-widest">解析结果将显示在这里</p>
                                <p className="text-[8px] font-black uppercase tracking-[0.2em]">支持一键生成多组测试用例</p>
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
                                                {p.tags?.slice(0, 3).map(t => (
                                                    <span key={t} className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[9px] font-black uppercase tracking-widest">{t}</span>
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
