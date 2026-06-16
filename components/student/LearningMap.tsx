import React from 'react';
import { Lock, CheckCircle, Map, Sparkles, Star, Target, Crown } from 'lucide-react';

interface LearningNode {
    id: string;
    title: string;
    status: 'locked' | 'current' | 'completed';
    requiredSolved: number;
    currentSolved: number;
    description: string;
    icon: React.ElementType;
}

export const LearningMap = ({ solvedCount = 0, theme = 'dark' }: { solvedCount?: number, theme?: string }) => {
    const isDark = theme !== 'light';

    // Simulated nodes based on solvedCount
    const nodes: LearningNode[] = [
        { id: 'n1', title: '筑基期：基础数据结构', status: solvedCount >= 10 ? 'completed' : 'current', requiredSolved: 10, currentSolved: Math.min(solvedCount, 10), description: '数组、链表、栈与队列', icon: Star },
        { id: 'n2', title: '结丹期：算法思维启蒙', status: solvedCount >= 30 ? 'completed' : (solvedCount >= 10 ? 'current' : 'locked'), requiredSolved: 30, currentSolved: Math.min(Math.max(solvedCount - 10, 0), 20), description: '二分查找、双指针、哈希表', icon: Sparkles },
        { id: 'n3', title: '元婴期：树与图的奥秘', status: solvedCount >= 60 ? 'completed' : (solvedCount >= 30 ? 'current' : 'locked'), requiredSolved: 60, currentSolved: Math.min(Math.max(solvedCount - 30, 0), 30), description: '二叉树遍历、DFS、BFS', icon: Target },
        { id: 'n4', title: '化神期：动态规划宗师', status: solvedCount >= 100 ? 'completed' : (solvedCount >= 60 ? 'current' : 'locked'), requiredSolved: 100, currentSolved: Math.min(Math.max(solvedCount - 60, 0), 40), description: '状态转移、背包问题、区间DP', icon: Crown },
    ];

    return (
        <div className={`rounded-3xl p-6 md:p-8 relative overflow-hidden ${isDark ? 'bg-slate-900/80 border border-white/10' : 'bg-white border border-slate-200'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <h3 className={`text-xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        <Map className="text-cyan-400" size={24} /> 修行疆域图
                    </h3>
                    <p className={`text-xs mt-1 font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>将编程技能转化为可见的修仙境界</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${isDark ? 'bg-white/5 text-cyan-400 border border-white/10' : 'bg-cyan-50 text-cyan-600 border border-cyan-100'}`}>
                    总修为: {solvedCount} 题
                </div>
            </div>

            <div className="relative z-10">
                {/* Connecting Line */}
                <div className={`absolute left-[27px] top-[40px] bottom-[40px] w-0.5 ${isDark ? 'bg-slate-800' : 'bg-slate-100'} -z-10`}></div>

                <div className="space-y-8">
                    {nodes.map((node, idx) => {
                        const Icon = node.icon;
                        const isCompleted = node.status === 'completed';
                        const isCurrent = node.status === 'current';
                        const isLocked = node.status === 'locked';
                        
                        const progress = isCompleted ? 100 : (isCurrent ? (node.currentSolved / (node.requiredSolved - (idx === 0 ? 0 : nodes[idx-1].requiredSolved))) * 100 : 0);

                        return (
                            <div key={node.id} className={`flex items-start gap-4 md:gap-6 group transition-all ${isLocked ? 'opacity-50 grayscale' : ''}`}>
                                {/* Node Icon Marker */}
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative z-10 transition-transform group-hover:scale-105 ${
                                    isCompleted ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 
                                    isCurrent ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-cyan-500/30 ring-4 ring-cyan-500/20' : 
                                    (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')
                                }`}>
                                    {isCompleted ? <CheckCircle size={24} /> : isLocked ? <Lock size={24} /> : <Icon size={24} className={isCurrent ? 'animate-pulse' : ''} />}
                                </div>

                                {/* Node Content */}
                                <div className={`flex-1 ${isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} border rounded-2xl p-4 md:p-5 relative overflow-hidden transition-colors ${isCurrent ? (isDark ? 'border-cyan-500/30 bg-cyan-900/10' : 'border-cyan-200 bg-cyan-50') : ''}`}>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                                        <div>
                                            <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{node.title}</h4>
                                            <p className={`text-xs mt-0.5 font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{node.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${isCurrent ? 'text-cyan-500' : (isDark ? 'text-slate-500' : 'text-slate-400')}`}>
                                                {isCompleted ? '已勘破' : isLocked ? '未解锁' : '当前修炼'}
                                            </span>
                                            {!isLocked && (
                                                <span className={`text-xs font-mono font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                                                    {isCompleted ? node.requiredSolved : (idx === 0 ? node.currentSolved : node.currentSolved + nodes[idx-1].requiredSolved)} / {node.requiredSolved}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-black/40' : 'bg-slate-200'} relative`}>
                                        <div 
                                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                                                isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                                            }`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                    
                                    {isCurrent && (
                                        <p className="text-[10px] font-bold text-cyan-500 mt-2 flex items-center gap-1">
                                            <Sparkles size={12} /> 你距离解锁下一个大境界还差 {node.requiredSolved - (idx === 0 ? node.currentSolved : node.currentSolved + nodes[idx-1].requiredSolved)} 道历练题，加油！
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
