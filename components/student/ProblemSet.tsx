import React, { useState, useMemo } from 'react';
import { BookOpen, ChevronRight, ChevronLeft, ArrowLeft, CheckCircle, Layers, Search as SearchIcon } from 'lucide-react';
import { ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Problem, ProblemBank } from '../../types';
import { Button, Card, DifficultyBadge, Skeleton, IconButton } from '../UiComponents';
import { getProblems, getBanks } from '../../services/api';
import { useEffect } from 'react';

export const ProblemSet = ({ problems: propProblems, onSelectProblem }: { problems: Problem[], onSelectProblem: (p: Problem) => void }) => {
  const [selectedBank, setSelectedBank] = useState<any>(() => {
    const saved = localStorage.getItem('educode_selected_bank');
    return saved ? JSON.parse(saved) : null;
  });
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const [fetchedProblems, setFetchedProblems] = useState<Problem[]>(propProblems);
  const [fetchedBanks, setFetchedBanks] = useState<ProblemBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState(() => localStorage.getItem('educode_difficulty_filter') || '全部');
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem('educode_search_term') || '');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [problemsData, banksData] = await Promise.all([
          getProblems({
            bankId: selectedBank?.id === 'uncategorized' ? undefined : selectedBank?.id,
            difficulty: difficultyFilter,
            search: searchTerm
          }),
          getBanks()
        ]);
        if (Array.isArray(problemsData)) setFetchedProblems(problemsData);
        if (Array.isArray(banksData)) setFetchedBanks(banksData);
      } catch (e) {
        console.error("Failed to fetch problem set data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedBank, difficultyFilter, searchTerm]); // Trigger load when filters change

  // Use fetched problems if available, otherwise fall back to props (mock)
  const problems = fetchedProblems.length > 0 ? fetchedProblems : propProblems;

  // --- Dynamic Bank Calculation ---
  const banksWithCounts = useMemo(() => {
    const bankMap = new Map<string, number>();
    let uncategorizedCount = 0;

    problems.forEach(p => {
      if (p.bankId) {
        bankMap.set(p.bankId, (bankMap.get(p.bankId) || 0) + 1);
      } else {
        uncategorizedCount++;
      }
    });

    const displayBanks = fetchedBanks.map((b: ProblemBank) => ({
      ...b,
      count: bankMap.get(b.id) || 0
    }));

    if (uncategorizedCount > 0) {
      displayBanks.push({
        id: 'uncategorized',
        title: '未分类题目',
        description: '暂无特定分类的综合练习题',
        count: uncategorizedCount,
        isVirtual: true
      } as any);
    }

    return displayBanks;
  }, [problems, fetchedBanks]);

  const totalPages = Math.ceil(banksWithCounts.length / itemsPerPage);

  // Pagination Logic
  const paginatedBanks = banksWithCounts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // View 1: List of Banks
  if (!selectedBank) {
    if (loading) {
      // Loading State
      return (
        <div className="max-w-6xl mx-auto space-y-8 pb-8">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-white/10" />
            <Skeleton className="h-4 w-64 bg-white/5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="p-6 tech-card-glass-dark rounded-xl border border-white/10 h-56 flex flex-col space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-12 w-12 rounded-xl bg-white/10" />
                  <Skeleton className="h-6 w-16 rounded-full bg-white/5" />
                </div>
                <Skeleton className="h-6 w-32 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/5" />
                <Skeleton className="h-4 w-2/3 bg-white/5" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-white">题库中心</h2>
            <p className="text-slate-400 mt-1">选择一个题库开始专项训练</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedBanks.map((bank: any) => (
            <Card
              key={bank.id}
              onClick={() => {
                setSelectedBank(bank);
                localStorage.setItem('educode_selected_bank', JSON.stringify(bank));
              }}
              className={`p-6 hover:-translate-y-1 transition-transform duration-200 flex flex-col h-56 tech-card-glass-dark border border-white/10 ${bank.isVirtual ? 'border-dashed border-white/20 bg-white/5' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${bank.isVirtual ? 'bg-white/10 text-slate-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {bank.isVirtual ? <Layers size={24} /> : <BookOpen size={24} />}
                </div>
                <div className="bg-white/10 text-slate-400 text-xs px-2 py-1 rounded-full border border-white/5">{bank.count} 题</div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{bank.title}</h3>
              <p className="text-sm text-slate-400 mb-auto line-clamp-2">{bank.description}</p>
              <div className="text-blue-400 text-sm font-black uppercase tracking-widest flex items-center group pt-4 mt-2 border-t border-white/5">
                进入题库 <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <IconButton
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={20} />
            </IconButton>
            <span className="text-sm font-medium text-slate-600">
              第 {page} / {totalPages} 页
            </span>
            <IconButton
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRightIcon size={20} />
            </IconButton>
          </div>
        )}
      </div>
    );
  }

  // Display fetched problems (already filtered by backend)
  const displayProblems = fetchedProblems;

  // View 2: List of Problems in Bank
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-4 mb-2">
        <IconButton
          onClick={() => {
            setSelectedBank(null);
            setSearchTerm('');
            setDifficultyFilter('全部');
            localStorage.removeItem('educode_selected_bank');
            localStorage.removeItem('educode_search_term');
            localStorage.removeItem('educode_difficulty_filter');
          }}
          className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10"
        >
          <ArrowLeft size={20} />
        </IconButton>
        <div>
          <h2 className="text-2xl font-bold text-white">{selectedBank.title}</h2>
          <p className="text-slate-400 text-sm">共 {displayProblems.length} 道题目</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2">
          {['全部', '简单', '中等', '困难'].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setDifficultyFilter(filter);
                localStorage.setItem('educode_difficulty_filter', filter);
              }}
              className={`px-4 py-2 text-sm rounded-full transition-all border font-bold tracking-widest uppercase ${difficultyFilter === filter ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="relative group max-w-sm w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              localStorage.setItem('educode_search_term', e.target.value);
            }}
            placeholder="搜索题目、描述或标签..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 focus:bg-white/10 transition-all text-white placeholder:text-slate-600"
          />
          <SearchIcon className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
        </div>
      </div>

      <div className="tech-card-glass-dark border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        {displayProblems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">本题库暂无题目</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="px-8 py-5 w-24">状态</th>
                <th className="px-8 py-5">题目名称</th>
                <th className="px-8 py-5 w-32">难度</th>
                <th className="px-8 py-5 w-32 text-center">通过率</th>
                <th className="px-8 py-5 w-32 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayProblems.map((problem) => (
                <tr key={problem.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => onSelectProblem(problem)}>
                  <td className="px-8 py-6">
                    {problem.isSolved ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        <CheckCircle size={14} className="text-emerald-400" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-white/10 group-hover:border-blue-500/30 transition-colors" />
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{problem.title}</span>
                      <div className="flex gap-2">
                        {(problem.tags || []).slice(0, 3).map(tag => (
                          <span key={tag} className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <DifficultyBadge level={problem.difficulty} />
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-xs font-mono text-slate-400">{problem.passRate || '0.0%'}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-xs font-black uppercase tracking-widest text-blue-400 group-hover:text-blue-300 flex items-center gap-1 ml-auto">
                      去解题 <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};