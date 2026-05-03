
import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, FolderOpen, ArrowLeft, ArrowRight, BookOpen, Check, Filter, X } from 'lucide-react';
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
    // Main View State
    const [view, setView] = useState<'grid' | 'detail'>('grid');
    const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

    // Bank CRUD State
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [loading, setLoading] = useState(false);

    // Pagination for Bank Grid
    const [page, setPage] = useState(1);
    const itemsPerPage = 9;

    // Problem Selector State (Full Screen Overlay)
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [problemSearch, setProblemSearch] = useState('');
    const [selectedProblemsForImport, setSelectedProblemsForImport] = useState<string[]>([]);
    const [activeBankFilterId, setActiveBankFilterId] = useState<string>('all'); // To filter source problems

    // --- Helpers ---
    const getProblemCount = (bankId: string) => problems.filter(p => p.bankId === bankId).length;

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
        if (window.confirm('确定要删除这个题库吗？题库中的题目将被归为"未分类"。')) {
            try {
                await deleteBank(id);
                // 1. Unlink problems in local state
                setProblems(prev => prev.map(p => p.bankId === id ? { ...p, bankId: undefined } : p));
                // 2. Remove bank
                setBanks(prev => prev.filter(b => b.id !== id));
                if (selectedBankId === id) setView('grid');
                showToast("题库删除成功");
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
                showToast("题库更新成功");
            } else {
                const created = await createBank(formData);
                setBanks(prev => [...prev, created]);
                showToast("题库创建成功");
            }
            setIsModalOpen(false);
        } catch (error) {
            showToast("保存失败", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers: Drill Down & Problem Management ---
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
                showToast("已移出题库");
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
            // Bulk update (Loop for now since we don't have a bulk API yet)
            for (const pid of selectedProblemsForImport) {
                const p = problems.find(prob => prob.id === pid);
                if (p) await updateProblem(pid, { ...p, bankId: selectedBankId });
            }

            // Sync local state
            setProblems(prev => prev.map(p =>
                selectedProblemsForImport.includes(p.id) ? { ...p, bankId: selectedBankId } : p
            ));
            setIsSelectorOpen(false);
            showToast(`成功添加 ${selectedProblemsForImport.length} 道题目`);
        } catch (error) {
            showToast("添加失败", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- Data: Problems in Current Bank ---
    const bankProblems = problems.filter(p => p.bankId === selectedBankId);

    // --- Data: Problems available for Import (not in current bank) ---
    const availableProblems = problems.filter(p => p.bankId !== selectedBankId).filter(p => {
        const matchesBank = activeBankFilterId === 'all' || p.bankId === activeBankFilterId;
        const matchesSearch = p.title.toLowerCase().includes(problemSearch.toLowerCase()) || p.tags?.some(t => t.includes(problemSearch));
        return matchesBank && matchesSearch;
    });

    // --- VIEW: LIST BANKS ---
    if (view === 'grid') {
        return (
            <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">题库管理</h2>
                        <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">管理题目分类与合集</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="搜索题库..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none w-64 transition-all"
                            />
                        </div>
                        <Button onClick={handleCreate} className="!rounded-xl shadow-xl shadow-blue-500/10">
                            <Plus size={16} /> 新建题库
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto p-1 flex-1 custom-scrollbar">
                    {paginatedBanks.map(bank => (
                        <Card key={bank.id} onClick={() => handleEnterBank(bank.id)} className="p-8 flex flex-col h-64 group relative cursor-pointer hover:border-blue-500/40 transition-all hover:shadow-3xl bg-white/5">
                            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                                <button onClick={(e) => handleEdit(e, bank)} className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition shadow-sm backdrop-blur-md">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={(e) => handleDelete(e, bank.id)} className="p-2 bg-white/5 border border-white/10 hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-400 transition shadow-sm backdrop-blur-md">
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="flex items-start gap-5 mb-6">
                                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)] group-hover:scale-110 transition-transform">
                                    <FolderOpen size={28} />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-white tracking-tight line-clamp-1 pr-8 group-hover:text-blue-400 transition-colors">{bank.title}</h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-blue-400/10 text-blue-400 px-3 py-1 rounded-full mt-2 inline-block border border-blue-400/10">
                                        {getProblemCount(bank.id)} 题
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-3 mb-auto leading-relaxed font-medium">
                                {bank.description || "暂无描述"}
                            </p>
                            <div className="mt-6 pt-6 border-t border-white/5 flex items-center text-blue-400 text-xs font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                                进入管理 <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                            </div>
                        </Card>
                    ))}
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    totalItems={filteredBanks.length}
                />

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={editingId ? "编辑题库" : "新建题库"}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
                            <Button onClick={handleSaveBank} disabled={loading}>{loading ? '保存中...' : '保存'}</Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">题库名称</label>
                            <input
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="例如：C语言基础训练"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">题库描述</label>
                            <textarea
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="简要描述该题库包含的内容"
                            />
                        </div>
                    </div>
                </Modal>
            </div>
        );
    }

    // --- VIEW: DETAIL (MANAGE PROBLEMS) ---
    return (
        <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <button onClick={() => setView('grid')} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <FolderOpen size={24} className="text-blue-600" />
                            {currentBank?.title}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">{currentBank?.description || '暂无描述'}</p>
                    </div>
                </div>
                <Button onClick={handleOpenSelector}>
                    <Plus size={16} /> 添加题目
                </Button>
            </div>

            {/* Problems List */}
            <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                {bankProblems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <BookOpen size={48} className="mb-4 opacity-20" />
                        <p>该题库暂无题目</p>
                        <Button variant="secondary" className="mt-4" onClick={handleOpenSelector}>从题库导入</Button>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3">题目名称</th>
                                <th className="px-6 py-3 w-32">难度</th>
                                <th className="px-6 py-3">标签</th>
                                <th className="px-6 py-3 w-24 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bankProblems.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-800">{p.title}</td>
                                    <td className="px-6 py-4"><DifficultyBadge level={p.difficulty} /></td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {p.tags?.map(t => (
                                                <span key={t} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{t}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleRemoveProblemFromBank(p.id)}
                                            className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition"
                                            title="移出题库"
                                        >
                                            <X size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* FULL SCREEN IMPORT SELECTOR */}
            {isSelectorOpen && (
                <div className="fixed inset-0 z-[70] bg-slate-100 flex flex-col animate-fade-in">
                    {/* Selector Header */}
                    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Plus className="text-blue-600" /> 添加题目到 "{currentBank?.title}"
                        </h2>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-600">已选: <span className="font-bold text-blue-600">{selectedProblemsForImport.length}</span> 题</span>
                            <Button variant="secondary" onClick={() => setIsSelectorOpen(false)}>取消</Button>
                            <Button onClick={handleImportConfirm} disabled={loading || selectedProblemsForImport.length === 0}>
                                {loading ? '添加中...' : '确认添加'}
                            </Button>
                        </div>
                    </div>

                    {/* Selector Body */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left Sidebar: Filter by other Banks */}
                        <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0">
                            <div className="p-4 font-semibold text-xs text-slate-500 uppercase tracking-wider">题目来源</div>
                            <div className="space-y-1 px-2">
                                <button
                                    onClick={() => setActiveBankFilterId('all')}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex justify-between items-center ${activeBankFilterId === 'all' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    全部未分类/其他题目
                                </button>
                                {banks.filter(b => b.id !== currentBank?.id).map(bank => (
                                    <button
                                        key={bank.id}
                                        onClick={() => setActiveBankFilterId(bank.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex justify-between items-center ${activeBankFilterId === bank.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <span className="truncate">{bank.title}</span>
                                        {activeBankFilterId === bank.id && <ArrowRight size={14} />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Content: Available Problems */}
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
                                    可选 {availableProblems.length} 个结果
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {availableProblems.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                        <Filter size={32} className="mb-2 opacity-20" />
                                        <p>没有符合条件的题目</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {availableProblems.map(p => {
                                            const isSelected = selectedProblemsForImport.includes(p.id);
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => toggleImportSelection(p.id)}
                                                    className={`bg-white p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between group ${isSelected ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'}`}
                                                >
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <DifficultyBadge level={p.difficulty} />
                                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                                                {isSelected && <Check size={12} className="text-white" />}
                                                            </div>
                                                        </div>
                                                        <div className="font-medium text-slate-800 line-clamp-1 mb-1" title={p.title}>{p.title}</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {p.tags?.slice(0, 3).map(t => (
                                                                <span key={t} className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{t}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-50 flex justify-between">
                                                        <span>ID: {p.id}</span>
                                                        <span>{banks.find(b => b.id === p.bankId)?.title || '未分类'}</span>
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
