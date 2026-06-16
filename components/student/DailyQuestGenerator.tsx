import React, { useState } from 'react';
import { Target, Zap, RefreshCw, CheckCircle, Award } from 'lucide-react';

export const DailyQuestGenerator = ({ theme = 'dark', streak = 0 }: { theme?: string, streak?: number }) => {
   const isDark = theme !== 'light';
   const [quests, setQuests] = useState([
      { id: 1, title: '初试锋芒', desc: '今天独立解决 1 道算法题', progress: 0, target: 1, type: 'code', completed: false, xp: 50 },
      { id: 2, title: '坚持不懈', desc: '连续打开陪伴空间达到 3 天', progress: Math.min(streak, 3), target: 3, type: 'streak', completed: streak >= 3, xp: 100 },
      { id: 3, title: '求知若渴', desc: '使用 AI 助教的“提示券” 1 次', progress: 0, target: 1, type: 'ai', completed: false, xp: 30 }
   ]);
   const [isRefreshing, setIsRefreshing] = useState(false);

   const refreshQuests = () => {
      setIsRefreshing(true);
      setTimeout(() => {
         setQuests([
            { id: 4, title: '算法进阶', desc: '挑战 1 道困难难度题目', progress: 0, target: 1, type: 'code', completed: false, xp: 120 },
            { id: 5, title: '消灭错题', desc: '在错题本中重做并 AC 1 道题', progress: 0, target: 1, type: 'review', completed: false, xp: 80 },
            { id: 6, title: '竞技达人', desc: '在异步竞技场执行效率击败 50% 以上', progress: 0, target: 1, type: 'pvp', completed: false, xp: 150 }
         ]);
         setIsRefreshing(false);
      }, 800);
   };

   return (
      <div className={`rounded-[32px] border shadow-xl p-8 relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border-indigo-500/20 shadow-black/30' : 'bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100 shadow-slate-200/50'}`}>
         {/* Decorative bg */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
         
         <div className="flex justify-between items-center mb-6 relative z-10">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                  <Target size={24} />
               </div>
               <div>
                  <h3 className={`font-black text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>🎯 今日推举（定制版）</h3>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>系统基于你的薄弱点精选推荐</p>
               </div>
            </div>
            <button onClick={refreshQuests} className={`p-2 rounded-xl transition-all ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-100'}`}>
               <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
            {quests.map(q => (
               <div key={q.id} className={`p-5 rounded-2xl border transition-all ${q.completed ? (isDark ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-green-50 border-green-200 shadow-sm') : (isDark ? 'bg-white/5 border-white/10 hover:border-indigo-500/30' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-300')}`}>
                  <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${q.completed ? 'bg-green-500 text-white' : (isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600')}`}>
                           {q.completed ? <CheckCircle size={16} /> : <Zap size={16} />}
                        </div>
                        <h4 className={`font-bold text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{q.title}</h4>
                     </div>
                     <div className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${q.completed ? 'bg-green-500/20 text-green-500' : (isDark ? 'bg-yellow-500/20 text-yellow-500' : 'bg-yellow-100 text-yellow-600')}`}>
                        <Award size={12} /> +{q.xp} EXP
                     </div>
                  </div>
                  
                  <div className="flex items-end justify-between gap-4">
                     <div className="flex-1">
                        <p className={`text-xs mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{q.desc}</p>
                        {/* Progress Bar */}
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                           <div 
                              className={`h-full rounded-full transition-all duration-1000 ${q.completed ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
                              style={{ width: `${(q.progress / q.target) * 100}%` }}
                           />
                        </div>
                     </div>
                     <div className={`text-xl font-black font-mono ${q.completed ? 'text-green-500' : (isDark ? 'text-indigo-400' : 'text-indigo-600')}`}>
                        {q.progress}<span className="text-sm opacity-50">/{q.target}</span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};
