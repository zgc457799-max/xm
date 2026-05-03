
import React, { useState } from 'react';
import { BookOpen, Search, Trash2, ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon, AlertCircle } from 'lucide-react';
import { Problem, Difficulty } from '../../types';
import { Button, Card, DifficultyBadge } from '../UiComponents';

interface MistakeBookProps {
  allProblems: Problem[];
  mistakeIds: string[];
  onRemoveMistake: (id: string) => void;
  onSelectProblem: (p: Problem) => void;
}

export const MistakeBook = ({ allProblems, mistakeIds, onRemoveMistake, onSelectProblem }: MistakeBookProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // 1. Filter problems based on mistakeIds
  const mistakeProblems = allProblems.filter(p => mistakeIds.includes(p.id));

  // 2. Filter based on search
  const filtered = mistakeProblems.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tags?.some(t => t.includes(searchTerm))
  );

  // 3. Pagination Logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedProblems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-10 relative z-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 rounded-2xl text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)] border border-rose-500/20">
              <BookOpen size={28} />
            </div>
            错题本
          </h2>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-2 ml-1">
            温故而知新，重点攻克薄弱环节 <span className="text-rose-400/50 mx-2">/</span> 共 {mistakeProblems.length} 题
          </p>
        </div>
        <div className="relative group">
          <Search className="absolute left-4 top-3 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
          <input
            type="text"
            placeholder="搜索错题名称或标签..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none w-full md:w-80 transition-all backdrop-blur-md placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Content Container */}
      <div className="bg-white/5 rounded-[32px] border border-white/10 shadow-3xl overflow-hidden min-h-[500px] flex flex-col backdrop-blur-3xl relative">
        {/* Subtle Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>

        {filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-20 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mb-6 border border-white/5 shadow-inner">
              <BookOpen size={48} className="opacity-20 text-white" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-widest mb-2">暂无相关错题记录</h3>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">
              {mistakeProblems.length === 0 ? "在做题时点击 '加入错题本' 即可在此查看" : "尝试更换搜索关键词"}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="overflow-x-auto custom-scrollbar flex-1">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-8 py-5 w-24">序号</th>
                    <th className="px-8 py-5">题目信息</th>
                    <th className="px-8 py-5 w-40 text-center">难度</th>
                    <th className="px-8 py-5">知识点标签</th>
                    <th className="px-8 py-5 w-48 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedProblems.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-white/5 transition-all group">
                      <td className="px-8 py-6 text-slate-500 font-black text-xs">
                        <span className="opacity-30">#</span>{((page - 1) * itemsPerPage + idx + 1).toString().padStart(2, '0')}
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-black text-white text-base tracking-tight group-hover:text-blue-400 transition-colors">{p.title}</div>
                        <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">ID: {p.id}</div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <DifficultyBadge level={p.difficulty} />
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-2 flex-wrap">
                          {p.tags?.map(t => (
                            <span key={t} className="text-[10px] font-black uppercase tracking-widest bg-white/5 text-slate-500 px-2.5 py-1 rounded-lg border border-white/5 group-hover:border-blue-500/20 group-hover:text-slate-400 transition-all">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3">
                          <button 
                            onClick={() => onSelectProblem(p)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 uppercase tracking-widest flex items-center gap-2"
                          >
                            <ChevronRightIcon size={14} /> 再次挑战
                          </button>
                          <button 
                            onClick={() => onRemoveMistake(p.id)}
                            className="p-2 bg-white/5 border border-white/10 hover:bg-rose-500/10 rounded-xl text-slate-500 hover:text-rose-400 transition-all shadow-sm backdrop-blur-md"
                            title="从错题本移除"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/5">
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                  显示 {(page - 1) * itemsPerPage + 1} - {Math.min(page * itemsPerPage, filtered.length)} / 共 {filtered.length} 条
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="p-2.5 rounded-xl border border-white/10 text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`w-10 h-10 rounded-xl text-xs font-black transition-all border ${
                          page === i + 1 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' 
                            : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-2.5 rounded-xl border border-white/10 text-slate-500 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
