import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, FolderOpen, ArrowLeft, ArrowRight, BookOpen, Check, Filter, X, Sparkles } from 'lucide-react';
import { ProblemBank, Problem } from '../../types';
import { Button, Modal, Card, DifficultyBadge, Pagination } from '../UiComponents';
import { createBank, updateBank, deleteBank, updateProblem } from '../../services/api';

interface BankManagerProps {
    banks: ProblemBank[];
    setBanks: React.Dispatch<React.SetStateAction<ProblemBank[]>>;
    problems: Problem[];
    setProblems: React.Dispatch<React.SetStateAction<Problem[]>>;
    showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const BankManager = ({ banks, setBanks, problems, setProblems, showToast }: BankManagerProps) => {
    // --- UI/View States ---
    const [view, setView] = useState<'grid' | 'detail'>('grid');
    const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

    // --- CRUD States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [loading, setLoading] = useState(false);

    // --- Pagination for Bank Grid ---
    const [page, setPage] = useState(1);
    const itemsPerPage = 9;

    // --- Problem Selector States (Overlay) ---
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [problemSearch, setProblemSearch] = useState('');
    const [selectedProblemsForImport, setSelectedProblemsForImport] = useState<string[]>([]);
    const [activeBankFilterId, setActiveBankFilterId] = useState<string>('all');

    // --- Helper Functions ---
    const getProblemCount = (bankId: string) => problems.filter(p => p.bankId === bankId).length;

    // Dynamic Constellation Star Signs based on Bank name
    const getConstellationSign = (title: string) => {
        const t = title.toLowerCase();
        if (t.includes('java')) return 'Java宿主星 🌌';
        if (t.includes('python')) return 'Python宿主星 🌌';
        if (t.includes('cpp') || t.includes('c++')) return 'C++宿主星 🌌';
        if (t.includes('c语言') || t.includes('c 语言') || (t.includes('c') && !t.includes('css'))) return 'C宿主星 🌌';
        if (t.includes('go')) return 'Go宿主星 🌌';
        if (t.includes('sql') || t.includes('数据库')) return '天璇数据星 🌌';
        return '星瀚综合星野 🌌';
    };

    const filteredBanks = banks.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filteredBanks.length / itemsPerPage);
    const paginatedBanks = filteredBanks.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const currentBank = banks.find(b => b.id === selectedBankId);

    // --- Handlers: Bank CRUD ---
    const handleCreate = () => {
        setEditingId(null);
        setFormData({ title: '', description: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (e: React.MouseEvent, bank: ProblemBank) => {
        e.stopPropagation();
        setEditingId(bank.id);
        setFormData({ title: bank.title, description: bank.description });
        setIsModalOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('确定要删除该星轨题库吗？其中的试炼法题将被归为"未分类题库"。')) {
            try {
                await deleteBank(id);
                setProblems(prev => prev.map(p => p.bankId === id ? { ...p, bankId: undefined } : p));
                setBanks(prev => prev.filter(b => b.id !== id));
                if (selectedBankId === id) setView('grid');
                showToast("星轨题库拆卸成功");
            } catch (error) {
                showToast("删除失败", "error");
            }
        }
    };

    const handleSaveBank = async () => {
        if (!formData.title) return;
        setLoading(true);
        try {
            if (editingId) {
                const updated = await updateBank(editingId, formData);
                setBanks(prev => prev.map(b => b.id === editingId ? updated : b));
                showToast("星轨题库更新成功");
            } else {
                const created = await createBank(formData);
                setBanks(prev => [...prev, created]);
                showToast("星轨题库筑造成功");
            }
            setIsModalOpen(false);
        } catch (error) {
            showToast("保存失败", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers: Drill Down ---
    const handleEnterBank = (id: string) => {
        setSelectedBankId(id);
        setView('detail');
    };

    const handleRemoveProblemFromBank = async (problemId: string) => {
        try {
            const p = problems.find(prob => prob.id === problemId);
            if (p) {
                const updated = await updateProblem(problemId, { ...p, bankId: null });
                setProblems(prev => prev.map(prob => prob.id === problemId ? updated : prob));
                showToast("已将题目移出当前星轨");
            }
        } catch (error) {
            showToast("操作失败", "error");
        }
    };

    const handleOpenSelector = () => {
        setSelectedProblemsForImport([]);
        setProblemSearch('');
        setActiveBankFilterId('all');
        setIsSelectorOpen(true);
    };

    const toggleImportSelection = (id: string) => {
        setSelectedProblemsForImport(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleImportConfirm = async () => {
        if (!selectedBankId) return;
        setLoading(true);
        try {
            for (const pid of selectedProblemsForImport) {
                const p = problems.find(prob => prob.id === pid);
                if (p) await updateProblem(pid, { ...p, bankId: selectedBankId });
            }

            setProblems(prev => prev.map(p =>
                selectedProblemsForImport.includes(p.id) ? { ...p, bankId: selectedBankId } : p
            ));
            setIsSelectorOpen(false);
            showToast(`成功将 ${selectedProblemsForImport.length} 道试炼法题注入星轨`);
        } catch (error) {
            showToast("添加失败", "error");
        } finally {
            setLoading(false);
        }
    };

    const bankProblems = problems.filter(p => p.bankId === selectedBankId);

    const availableProblems = problems.filter(p => p.bankId !== selectedBankId).filter(p => {
        const matchesBank = activeBankFilterId === 'all' || p.bankId === activeBankFilterId;
        const matchesSearch = p.title.toLowerCase().includes(problemSearch.toLowerCase()) || p.tags?.some(t => t.includes(problemSearch));
        return matchesBank && matchesSearch;
    });

    // ================= VIEW: GRID (LIST BANKS) =================
    if (view === 'grid') {
        return (
            <div 
                className="space-y-6 animate-fade-in h-[calc(100vh-60px)] flex flex-col relative pb-6 pr-2"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            >
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                            <span>题库空间仓</span>
                            <span className="text-slate-500 text-sm font-light">|</span>
                            <span className="text-cyan-400 text-sm font-bold uppercase tracking-widest">Bank Control Hub</span>
                        </h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">管理各星曜轨道所辖试炼法题与功德产出</p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3.5 top-2.5 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="搜寻星轨题库..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-cyan-500/50 focus:bg-slate-950 outline-none w-full sm:w-60 transition-all placeholder:text-slate-600 font-bold"
                            />
                        </div>
                        <Button onClick={handleCreate} className="!rounded-xl shadow-lg shadow-cyan-500/10 flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500">
                            <Plus size={16} /> 筑造星轨
                        </Button>
                    </div>
                </div>

                {/* Grid Cards Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto p-1 flex-1 custom-scrollbar">
                    {paginatedBanks.map(bank => {
                        const starSign = getConstellationSign(bank.title);
                        const count = getProblemCount(bank.id);
                        return (
                            <Card 
                                key={bank.id} 
                                onClick={() => handleEnterBank(bank.id)} 
                                className="p-6 flex flex-col h-64 group relative cursor-pointer border border-slate-800 hover:border-cyan-500/50 bg-slate-900/60 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] flex-shrink-0"
                            >
                                {/* Active action buttons on hover */}
                                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2 z-20">
                                    <button 
                                        onClick={(e) => handleEdit(e, bank)} 
                                        className="p-1.5 bg-slate-950 border border-slate-850 hover:border-cyan-400 rounded-lg text-slate-400 hover:text-white transition shadow-sm backdrop-blur-md"
                                        title="编辑星轨属性"
                                    >
                                        <Edit2 size={13} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(e, bank.id)} 
                                        className="p-1.5 bg-slate-950 border border-slate-850 hover:border-rose-400 rounded-lg text-slate-400 hover:text-rose-400 transition shadow-sm backdrop-blur-md"
                                        title="拆卸星轨"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>

                                {/* Star sign header */}
                                <div className="text-[9px] font-black uppercase tracking-wider text-cyan-400 mb-4 bg-cyan-950/40 border border-cyan-800/20 px-2 py-0.5 rounded w-fit select-none">
                                    {starSign}
                                </div>

                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)] group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300 shrink-0 border border-cyan-500/20">
                                        <FolderOpen size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-base text-white tracking-tight line-clamp-1 pr-12 group-hover:text-cyan-400 transition-colors">{bank.title}</h3>
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full mt-1.5 inline-block border border-cyan-500/20">
                                            {count} 试炼
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-400 line-clamp-3 mb-auto leading-relaxed font-medium">
                                    {bank.description || "量子星云题库，汇聚星河试炼核心指令..."}
                                </p>

                                {/* Gamified Reward Privilege Row */}
                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-[10px] text-amber-400 font-bold bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 select-none">
                                        <Sparkles size={10} className="text-amber-400 animate-spin" />
                                        产出: 25 能量币 | +15 境界XP
                                    </span>
                                    <div className="flex items-center text-cyan-400 text-[10px] font-black uppercase tracking-wider group-hover:gap-2 transition-all">
                                        进入星轨 <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0" />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalItems={filteredBanks.length}
                />

                {/* Dark Custom Modal */}
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingId ? "🔮 修正星曜轨道" : "🌌 筑造全新星曜轨道"}
                    footer={
                        <div className="flex justify-end gap-3 w-full">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)} className="!rounded-xl text-xs uppercase tracking-widest font-black">取消</Button>
                            <Button onClick={handleSaveBank} disabled={loading} className="!rounded-xl text-xs uppercase tracking-widest font-black bg-cyan-600 hover:bg-cyan-500 text-white border-none shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                                {loading ? '筑造中...' : '确认筑造'}
                            </Button>
                        </div>
                    }
                >
                    <div className="space-y-5 text-slate-300">
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">星轨名称 (Title)</label>
                          <input
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 outline-none font-bold"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="例如：Java核心算法星轨"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">星轨使命描述 (Description)</label>
                          <textarea
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 outline-none font-medium"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="为叩开仙门做基础，指引学生修行此系法门..."
                          />
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    // ================= VIEW: DETAIL (MANAGE PROBLEMS) =================
    return (
        <div className="space-y-6 animate-fade-in h-[calc(100vh-60px)] flex flex-col relative pb-6 pr-2">
            {/* Header section in Dark theme */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setView('grid')} 
                        className="p-2 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-950 rounded-xl text-slate-400 hover:text-white transition shadow-sm backdrop-blur-md"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
                            <FolderOpen size={20} className="text-cyan-400" />
                            {currentBank?.title}
                        </h2>
                        <p className="text-slate-400 text-xs mt-1 font-medium">{currentBank?.description || '暂无描述'}</p>
                    </div>
                </div>
                <Button onClick={handleOpenSelector} className="!rounded-xl text-xs font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 border-none shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <Plus size={16} /> 注入试炼题目
                </Button>
            </div>

            {/* Problems List in space dark design */}
            <div className="flex-1 overflow-y-auto bg-slate-900/40 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md custom-scrollbar">
                {bankProblems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                        <BookOpen size={48} className="mb-4 opacity-20 text-cyan-400 animate-pulse" />
                        <p className="text-xs font-black uppercase tracking-[0.2em] mb-4">当前轨道星宿中空无一物，尚无试炼法题</p>
                        <Button variant="secondary" className="!rounded-xl text-xs uppercase tracking-widest font-black" onClick={handleOpenSelector}>
                            从综合库导入
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="px-8 py-4">试炼法题名称</th>
                                <th className="px-8 py-4 w-32">试炼难度</th>
                                <th className="px-8 py-4">法理标签</th>
                                <th className="px-8 py-4 w-24 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {bankProblems.map(p => (
                                <tr key={p.id} className="hover:bg-cyan-950/20 transition-all duration-300">
                                    <td className="px-8 py-5 font-bold text-white text-sm tracking-tight">{p.title}</td>
                                    <td className="px-8 py-5"><DifficultyBadge level={p.difficulty} /></td>
                                    <td className="px-8 py-5">
                                        <div className="flex gap-1.5 flex-wrap">
                                            {p.tags?.map(t => (
                                                <span key={t} className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">{t}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => handleRemoveProblemFromBank(p.id)}
                                            className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
                                            title="自当前星轨卸下"
                                        >
                                            <X size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* FULL SCREEN IMPORT SELECTOR IN COSMIC DARK THEME */}
            {isSelectorOpen && (
                <div className="fixed inset-0 z-[70] bg-slate-950 flex flex-col animate-fade-in relative">
                    {/* Background Dot Grid */}
                    <div className="absolute inset-0 bg-slate-950 z-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                    
                    {/* Selector Header */}
                    <div className="md:h-16 py-3 md:py-0 bg-slate-900/90 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between px-4 sm:px-6 shadow-2xl backdrop-blur-md flex-shrink-0 z-10 gap-3 md:gap-0">
                        <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-wide">
                            <Plus className="text-cyan-400 animate-pulse" size={18} /> 向 "{currentBank?.title}" 星轨注入试炼法题
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto">
                          <span className="text-xs text-slate-400 font-bold">已选: <span className="font-black text-cyan-400">{selectedProblemsForImport.length}</span> 题</span>
                          <Button variant="secondary" onClick={() => setIsSelectorOpen(false)} className="!rounded-xl text-xs uppercase tracking-widest font-black">取消</Button>
                          <Button onClick={handleImportConfirm} disabled={loading || selectedProblemsForImport.length === 0} className="!rounded-xl text-xs uppercase tracking-widest font-black bg-cyan-600 hover:bg-cyan-500 border-none shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                              {loading ? '注入中...' : '确认注入'}
                          </Button>
                        </div>
                    </div>

                    {/* Selector Body */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden z-10 relative">
                        {/* Left Sidebar: Filter by other Banks */}
                        <div className="w-full md:w-64 bg-slate-900/40 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto max-h-48 md:max-h-none flex-shrink-0 backdrop-blur-md">
                            <div className="p-4 font-black text-[10px] text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">试炼法术来源</div>
                            <div className="space-y-1.5 p-3">
                                <button
                                    onClick={() => setActiveBankFilterId('all')}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                                        activeBankFilterId === 'all' 
                                            ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                                            : 'text-slate-400 hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    全部未分类/其他题目
                                </button>
                                {banks.filter(b => b.id !== currentBank?.id).map(bank => (
                                    <button
                                        key={bank.id}
                                        onClick={() => setActiveBankFilterId(bank.id)}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex justify-between items-center ${
                                            activeBankFilterId === bank.id 
                                                ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                                                : 'text-slate-400 hover:bg-white/5 border border-transparent'
                                        }`}
                                    >
                                        <span className="truncate pr-2">{bank.title}</span>
                                        {activeBankFilterId === bank.id && <ArrowRight size={12} className="text-cyan-400 shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Content: Available Problems */}
                        <div className="flex-1 flex flex-col bg-slate-950/20 min-w-0">
                            <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center gap-4 flex-shrink-0">
                                <div className="relative flex-1 max-w-md group">
                                    <Search className="absolute left-3.5 top-2.5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
                                    <input
                                        type="text"
                                        placeholder="搜寻题目名称或法理标签..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-cyan-500/50 transition placeholder:text-slate-600 font-bold"
                                        value={problemSearch}
                                        onChange={e => setProblemSearch(e.target.value)}
                                    />
                                </div>
                                <div className="text-xs text-slate-400 font-bold">
                                    可选 {availableProblems.length} 个修行法题
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                {availableProblems.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
                                        <Filter size={32} className="mb-2 opacity-20 text-cyan-400" />
                                        <p className="text-xs font-black uppercase tracking-widest">无可供引入的试炼题目</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {availableProblems.map(p => {
                                            const isSelected = selectedProblemsForImport.includes(p.id);
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => toggleImportSelection(p.id)}
                                                    className={`bg-slate-900/60 p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between hover:shadow-lg backdrop-blur-sm relative group ${
                                                        isSelected 
                                                            ? 'border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] bg-cyan-950/20' 
                                                            : 'border-slate-850 hover:border-cyan-500/40'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-3">
                                                            <DifficultyBadge level={p.difficulty} />
                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                                                isSelected 
                                                                    ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]' 
                                                                    : 'border-slate-700 hover:border-slate-500'
                                                            }`}>
                                                                {isSelected && <Check size={11} className="text-white" />}
                                                            </div>
                                                        </div>
                                                        <div className="font-bold text-white text-sm line-clamp-1 mb-1.5 group-hover:text-cyan-400 transition-colors" title={p.title}>{p.title}</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {p.tags?.slice(0, 3).map(t => (
                                                                <span key={t} className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{t}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-4 pt-2 border-t border-white/5 flex justify-between">
                                                        <span>ID: {p.id}</span>
                                                        <span className="text-cyan-400/80">{banks.find(b => b.id === p.bankId)?.title || '未分类'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
