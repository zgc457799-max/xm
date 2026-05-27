
import React, { useState, useEffect } from 'react';
import { CheckCircle, Code, Flame, Trophy, Star, ArrowRight, Calendar, Target, BookOpen, Sparkles, Rocket, Brain, Zap, ChevronRight, Settings as SettingsIcon, ShieldCheck, FileText, Cpu, Lock, MapPinOff, Scale, Bot, BarChart2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { Button } from '../UiComponents';
import { getStudentStats, checkIn } from '../../services/api';
import { Contest, Problem } from '../../types';

import { SettingsModal } from '../common/SettingsModal';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

export const StudentDashboard = ({
   onNavigate,
   mistakeCount = 0,
   contests = [],
   problems = [],
   theme = 'dark'
}: {
   onNavigate: (view: string) => void,
   mistakeCount?: number,
   contests?: Contest[],
   problems?: Problem[],
   theme?: string
}) => {
   const isDark = theme !== 'light';
   // Check-in State
   const [streak, setStreak] = useState(0);
   const [isCheckedIn, setIsCheckedIn] = useState(false);
   const [isAnimating, setIsAnimating] = useState(false);
   const [solvedCount, setSolvedCount] = useState(0);
   const [rank, setRank] = useState(0);
   const [isSettingsOpen, setIsSettingsOpen] = useState(false);
   const [isRankModalOpen, setIsRankModalOpen] = useState(false);
   const [globalRankings, setGlobalRankings] = useState<{name: string, solved: number, rank: number}[]>([]);

   // AI Data for Charts
   const aiData = [
      { name: 'AI 调用', value: 128, color: '#22d3ee' },
      { name: '剩余额度', value: 72, color: 'rgba(255,255,255,0.1)' }
   ];
   
   const strategyData = [
      { name: '组合策略', value: 4.8, color: '#fcd34d' },
      { name: '总分', value: 0.2, color: 'rgba(255,255,255,0.1)' }
   ];

   const problemData = [
      { name: 'AI 辅助', value: 45, color: '#10b981' },
      { name: '自主解决', value: 55, color: 'rgba(255,255,255,0.1)' }
   ];

   // Mock global rankings for the modal
   useEffect(() => {
      if (isRankModalOpen && globalRankings.length === 0) {
         setGlobalRankings([
            { name: "李华", solved: 156, rank: 1 },
            { name: "张伟", solved: 142, rank: 2 },
            { name: "王芳", solved: 128, rank: 3 },
            { name: "赵雷", solved: 115, rank: 4 },
            { name: "刘洋", solved: 98, rank: 5 },
            { name: "陈思", solved: 85, rank: 6 },
            { name: "杨光", solved: 72, rank: 7 },
            { name: "吴桐", solved: 68, rank: 8 },
            { name: "孙燕", solved: 55, rank: 9 },
            { name: "周明", solved: 42, rank: 10 },
         ]);
      }
   }, [isRankModalOpen]);

   // Get recommended problem (e.g., first medium problem not solved)
   // Use a static mock problem if the `problems` prop is empty
   const mockDailyProblems = [
      {
         id: "mock-daily-01",
         title: "爬楼梯 (每日一题)",
         difficulty: "中等",
         description: "假设你正在爬楼梯。需要 `n` 阶你才能到达楼顶。\n\n每次你可以爬 1 或 2 个台阶。你有多少种不同的方法可以爬到楼顶呢？",
         tags: ["动态规划", "记忆化搜索"],
         passRate: "68.5%"
      },
      {
         id: "mock-daily-02",
         title: "两数之和 (每日一题)",
         difficulty: "简单",
         description: "给定一个整数数组 `nums` 和一个整数目标值 `target`，请你在该数组中找出和为目标值 `target` 的那两个整数，并返回它们的数组下标。",
         tags: ["数组", "哈希表"],
         passRate: "82.1%"
      },
      {
         id: "mock-daily-03",
         title: "接雨水 (每日一题)",
         difficulty: "困难",
         description: "给定 `n` 个非负整数表示每个宽度为 `1` 的柱子的高度图，计算按此排列的柱子，下雨之后能接多少雨水。",
         tags: ["栈", "双指针", "单调栈"],
         passRate: "45.2%"
      },
      {
         id: "mock-daily-04",
         title: "最长回文子串 (每日一题)",
         difficulty: "中等",
         description: "给你一个字符串 `s`，找到 `s` 中最长的回文子串。\n如果字符串的反序与原始字符串相同，则该字符串称为回文字符串。",
         tags: ["字符串", "动态规划"],
         passRate: "55.8%"
      },
      {
         id: "mock-daily-05",
         title: "岛屿数量 (每日一题)",
         difficulty: "中等",
         description: "给你一个由 `'1'`（陆地）和 `'0'`（水）组成的的二维网格，请你计算网格中岛屿的数量。\n岛屿总是被水包围，并且每座岛屿只能由水平方向和/或竖直方向上相邻的陆地连接形成。",
         tags: ["深度优先搜索", "广度优先搜索", "并查集"],
         passRate: "61.3%"
      }
   ];
   
   const [dailyMockIndex, setDailyMockIndex] = useState(0);
   useEffect(() => {
      // 每天换一题，或者每次刷新换一题（这里用随机演示）
      setDailyMockIndex(Math.floor(Math.random() * mockDailyProblems.length));
   }, []);

   const recommendedProblems = problems.length > 0 ? problems.slice(0, 3) : mockDailyProblems.slice(dailyMockIndex, dailyMockIndex + 3).length === 3 ? mockDailyProblems.slice(dailyMockIndex, dailyMockIndex + 3) : mockDailyProblems.slice(0, 3);
   const recommendedProblem = recommendedProblems[0];

   // Get upcoming or live contests
   const activeContests = contests && contests.length > 0 
      ? contests
         .filter(c => c.status === 'LIVE' || c.status === 'UPCOMING')
         .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
         .slice(0, 8)
      : [
         { id: 'c1', title: '2026年中国大学生计算机设计大赛校内选拔赛', status: 'UPCOMING', startTime: new Date(Date.now() + 86400000 * 3).toISOString(), endTime: new Date(Date.now() + 86400000 * 4).toISOString() },
         { id: 'c2', title: '周末算法周赛 (积分赛) 第十二期', status: 'LIVE', startTime: new Date(Date.now() - 3600000).toISOString(), endTime: new Date(Date.now() + 3600000 * 2).toISOString() },
         { id: 'c3', title: '数据结构与算法期中模拟测试', status: 'UPCOMING', startTime: new Date(Date.now() + 86400000 * 7).toISOString(), endTime: new Date(Date.now() + 86400000 * 7 + 7200000).toISOString() },
         { id: 'c4', title: '蓝桥杯省赛全真模拟赛', status: 'UPCOMING', startTime: new Date(Date.now() + 86400000 * 14).toISOString(), endTime: new Date(Date.now() + 86400000 * 14 + 14400000).toISOString() },
         { id: 'c5', title: '新生杯程序设计竞赛', status: 'UPCOMING', startTime: new Date(Date.now() + 86400000 * 21).toISOString(), endTime: new Date(Date.now() + 86400000 * 22).toISOString() },
         { id: 'c6', title: '互联网+ 大赛选拔训练营', status: 'UPCOMING', startTime: new Date(Date.now() + 86400000 * 30).toISOString(), endTime: new Date(Date.now() + 86400000 * 31).toISOString() }
      ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

   useEffect(() => {
      fetchStats();
   }, []);

   const fetchStats = async () => {
      try {
         // 优先从 localStorage 读取打卡数据
         const savedStreakStr = localStorage.getItem('edu_streak');
         const savedLastCheckIn = localStorage.getItem('edu_last_checkin');
         
         let currentStreak = 0;
         let checkedInToday = false;

         if (savedStreakStr && savedLastCheckIn) {
            currentStreak = parseInt(savedStreakStr, 10);
            const lastDate = new Date(savedLastCheckIn).toISOString().split('T')[0];
            const todayDate = new Date().toISOString().split('T')[0];
            
            if (lastDate === todayDate) {
               checkedInToday = true;
            } else {
               // 检查是否中断（昨天没有打卡）
               const yesterday = new Date();
               yesterday.setDate(yesterday.getDate() - 1);
               const yesterdayDate = yesterday.toISOString().split('T')[0];
               
               if (lastDate !== yesterdayDate) {
                  currentStreak = 0; // 中断重置
                  localStorage.setItem('edu_streak', '0');
               }
            }
         }

         setStreak(currentStreak);
         setIsCheckedIn(checkedInToday);

         // 获取其他统计数据
         const stats = await getStudentStats();
         if (stats) {
            setRank(stats.rank || 0);
         }

         // 从 localStorage 获取已完成题数（模拟数据联动）
         const solvedProblems = JSON.parse(localStorage.getItem('edu_solved_problems') || '[]');
         setSolvedCount(solvedProblems.length || (stats?.solved_count || 0));
      } catch (e) {
         console.error("Failed to fetch stats", e);
      }
   };

   const handleCheckIn = async () => {
      if (isCheckedIn) return;

      try {
         // 先调用可能存在的后端接口，但不阻塞前端逻辑
         try { await checkIn(); } catch (e) { console.log('Backend check-in skipped'); }

         const newStreak = streak + 1;
         const todayDate = new Date().toISOString();
         
         // 保存到 localStorage
         localStorage.setItem('edu_streak', newStreak.toString());
         localStorage.setItem('edu_last_checkin', todayDate);

         setIsAnimating(true);
         setIsCheckedIn(true);
         setStreak(newStreak);

         // Reset animation trigger
         setTimeout(() => setIsAnimating(false), 1000);
      } catch (error) {
         console.error("Check-in failed", error);
      }
   };

   return (
      <div className="max-w-7xl mx-auto animate-fade-in relative px-4 md:py-6 pb-20 md:pb-6">
         <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

         {/* --- 纯正移动端视图 (Mobile Only) --- */}
         <div className="md:hidden flex flex-col gap-5 pt-2">
            {/* 移动端顶栏 (含打卡与基础状态) */}
            <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
               <div>
                  <h1 className={`text-xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                     <Brain size={20} className={isDark ? "text-cyan-400" : "text-blue-500"} />
                     Edu<span className="text-blue-500">Code</span>
                  </h1>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5 uppercase">智能编程训练平台</p>
               </div>
               <button 
                  onClick={handleCheckIn}
                  disabled={isCheckedIn}
                  className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${isCheckedIn ? (isDark ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-blue-50 text-blue-500 border border-blue-200') : (isDark ? 'bg-white/10 text-slate-400 border border-white/10' : 'bg-white text-slate-500 border border-slate-200 shadow-sm')}`}
               >
                  <Flame size={18} className={isCheckedIn ? 'fill-blue-400 text-blue-400' : ''} />
                  <span className="text-[8px] font-black mt-0.5">{isCheckedIn ? '已打卡' : '打卡'}</span>
               </button>
            </div>

            {/* 核心数据流 (积分、排行、连胜) */}
            <div className="flex items-center gap-3">
               <div onClick={() => onNavigate('problems')} className={`flex-1 ${isDark ? 'bg-gradient-to-br from-cyan-950/60 to-blue-900/40 border-cyan-500/20' : 'bg-gradient-to-br from-blue-500 to-cyan-400 border-transparent'} border rounded-2xl p-3 shadow-lg relative overflow-hidden`}>
                  <div className={`absolute -right-2 -bottom-2 ${isDark ? 'text-cyan-500/20' : 'text-white/20'}`}><CheckCircle size={40} /></div>
                  <span className={`text-[9px] ${isDark ? 'text-cyan-400' : 'text-white/90'} font-black uppercase tracking-widest block mb-1`}>本站排名</span>
                  <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-white'} font-mono leading-none`}>#{rank > 900 ? '99+' : rank}</div>
               </div>
               <div onClick={() => onNavigate('profile')} className={`flex-1 ${isDark ? 'bg-gradient-to-br from-indigo-950/60 to-purple-900/40 border-indigo-500/20' : 'bg-gradient-to-br from-indigo-500 to-purple-500 border-transparent'} border rounded-2xl p-3 shadow-lg relative overflow-hidden`}>
                  <div className={`absolute -right-2 -bottom-2 ${isDark ? 'text-indigo-500/20' : 'text-white/20'}`}><Trophy size={40} /></div>
                  <span className={`text-[9px] ${isDark ? 'text-indigo-400' : 'text-white/90'} font-black uppercase tracking-widest block mb-1`}>连胜天数</span>
                  <div className={`text-lg font-black ${isDark ? 'text-white' : 'text-white'} font-mono leading-none`}>{streak} <span className="text-[9px] text-white/70">Days</span></div>
               </div>
               <div onClick={() => setIsSettingsOpen(true)} className={`w-12 h-12 ${isDark ? 'bg-white/5 border border-white/10 text-slate-400 active:bg-white/10' : 'bg-white border border-slate-200 text-slate-500 active:bg-slate-50 shadow-sm'} rounded-2xl flex items-center justify-center transition-colors`}>
                  <SettingsIcon size={20} />
               </div>
            </div>

            {/* 快捷操作区 (金刚区) */}
            <div className="grid grid-cols-4 gap-2 pt-1">
               {[
                  { id: 'problems', icon: BookOpen, label: '题库刷题', color: 'text-blue-500', bg: 'bg-blue-50' },
                  { id: 'playground', icon: Rocket, label: '工作台', color: 'text-purple-500', bg: 'bg-purple-50' },
                  { id: 'mistakes', icon: Target, label: '错题本', color: 'text-rose-500', bg: 'bg-rose-50', badge: mistakeCount },
                  { id: 'contests', icon: Calendar, label: '比赛大厅', color: 'text-amber-500', bg: 'bg-amber-50' }
               ].map(item => (
                  <button key={item.id} onClick={() => onNavigate(item.id)} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl active:scale-95 transition-all relative ${isDark ? 'hover:bg-white/5' : 'bg-white shadow-sm border border-slate-100 hover:bg-slate-50'}`}>
                     <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${isDark ? item.bg.replace('50', '500/10') : item.bg} ${isDark ? item.color.replace('500', '400') : item.color}`}>
                        <item.icon size={20} />
                     </div>
                     <span className={`text-[10px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'} tracking-wide`}>{item.label}</span>
                     {item.badge && item.badge > 0 ? (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-sm">
                           {item.badge > 9 ? '9+' : item.badge}
                        </span>
                     ) : null}
                  </button>
               ))}
            </div>

            {/* 每日精选 (Swipeable Card Style) */}
            <div>
               <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-sm font-black flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}><Star size={14} className="text-amber-400 fill-amber-400" /> 每日精选</h3>
               </div>
               {recommendedProblems.length > 0 ? (
                  <div className="flex flex-col gap-3">
                     {recommendedProblems.map((prob, idx) => (
                        <div key={prob.id || idx} className={`${isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-100 shadow-sm'} border rounded-2xl p-4 relative overflow-hidden`}>
                           <div className={`absolute top-0 right-0 w-32 h-32 ${isDark ? 'bg-blue-500/10' : 'bg-blue-100/50'} rounded-full blur-2xl -translate-y-1/2 translate-x-1/4`}></div>
                           <div className="relative z-10">
                              <div className="flex items-start justify-between mb-2">
                                 <h4 className={`text-base font-black line-clamp-1 flex-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{prob.title}</h4>
                                 <span className={`text-[10px] ${isDark ? 'bg-yellow-500/10 text-yellow-500' : 'bg-amber-100 text-amber-600'} px-2 py-0.5 rounded font-bold ml-2 shrink-0`}>{prob.difficulty}</span>
                              </div>
                              <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'} line-clamp-2 mb-3`}>
                                 {prob.description?.replace(/[#*`]/g, '') || "这是一道精选算法题，快来挑战吧！"}
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="flex gap-1.5">
                                    {(prob.tags || ['算法']).slice(0, 2).map((t: string) => (
                                       <span key={t} className={`text-[9px] ${isDark ? 'bg-white/5 text-slate-400 border-white/5' : 'bg-slate-50 text-slate-500 border-slate-100'} px-1.5 py-0.5 rounded border`}>{t}</span>
                                    ))}
                                 </div>
                                 <Button onClick={() => onNavigate('problems')} className="px-4 py-1.5 text-[10px] rounded-lg h-auto tracking-widest font-black uppercase">
                                    去挑战
                                 </Button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
                     <p className="text-[10px] text-slate-500 uppercase tracking-widest">暂无推荐</p>
                  </div>
               )}
            </div>

            {/* 近期赛事列表 (Vertical List View) */}
            {activeContests.length > 0 && (
               <div className="mt-2">
                  <div className="flex items-center justify-between mb-2">
                     <h3 className="text-sm font-black text-white flex items-center gap-1.5"><Trophy size={14} className="text-blue-400" /> 近期赛事</h3>
                     <span onClick={() => onNavigate('contests')} className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center">全部 <ChevronRight size={12}/></span>
                  </div>
                  <div className="space-y-2">
                     {activeContests.slice(0, 3).map((contest: any) => (
                        <div key={contest.id} onClick={() => onNavigate('contests')} className="bg-slate-900/60 border border-white/5 hover:border-white/10 rounded-xl p-3 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex flex-col items-center justify-center shrink-0">
                              <span className="text-[8px] font-black">{new Date(contest.startTime).getMonth() + 1}月</span>
                              <span className="text-xs font-black">{new Date(contest.startTime).getDate()}</span>
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white line-clamp-1">{contest.title}</h4>
                              <p className="text-[9px] text-slate-500 mt-0.5 tracking-wide">
                                 {new Date(contest.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                                 <span className="mx-1">•</span> 
                                 {contest.status === 'LIVE' ? <span className="text-green-400">进行中</span> : <span className="text-blue-400">未开始</span>}
                              </p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>

         {/* --- 电脑端视图 (Desktop Only) --- */}
         <div className="hidden md:block space-y-6">
         <div className="relative overflow-hidden rounded-2xl md:rounded-[32px] bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#3b82f6] text-white shadow-2xl border border-white/10 group">
            {/* Visual Depth Elements */}
            <div className="absolute top-[-30%] right-[-10%] w-[80%] h-[120%] bg-cyan-400/20 rounded-full blur-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-[2s]" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-600/30 rounded-full blur-[80px] pointer-events-none" />

            {/* Mesh Pattern Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

            <div className="relative z-10 px-5 py-6 md:px-12 md:py-12 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-12">
               <div className="max-w-2xl space-y-4 md:space-y-6 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-cyan-300 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                     <Brain size={12} /> 深度学习引擎 v4.0
                  </div>
                  <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black tracking-tight leading-[1.2] md:leading-[1.1] text-white">
                     数智驱动<br />
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-200 to-white">重塑编程思维</span>
                  </h1>
                  <p className="text-blue-100/80 text-[11px] sm:text-sm md:text-base leading-relaxed font-medium tracking-wide max-w-lg mx-auto lg:mx-0">
                     构建全栈 AI 驱动的算法实验场。跨越传统边界，探索深度逻辑与无限可能的交汇点。
                  </p>
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 md:gap-4 pt-1">
                     <Button onClick={() => onNavigate('playground')} variant="secondary" className="!bg-white !text-blue-900 border-none px-5 py-2.5 md:px-8 md:py-3.5 h-auto text-xs md:text-sm font-black shadow-xl shadow-white/20 rounded-xl md:rounded-[18px] transform hover:scale-105 transition-all active:scale-95 tracking-widest hover:!bg-slate-50 flex items-center gap-1.5">
                        <Rocket size={14} className="text-blue-600" /> 在线工作台
                     </Button>
                     <Button onClick={() => onNavigate('problems')} variant="outline" className="text-white border-white/30 hover:bg-white/10 px-5 py-2.5 md:px-8 md:py-3.5 h-auto text-xs md:text-sm font-black rounded-xl md:rounded-[18px] tracking-widest">
                        题库练习
                     </Button>
                     <button onClick={() => setIsSettingsOpen(true)} className="text-white/60 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] md:text-xs font-black group ml-1">
                        <SettingsIcon size={14} className="group-hover:rotate-180 transition-transform duration-1000" />
                        <span className="tracking-[0.1em] uppercase">控制面板</span>
                     </button>
                  </div>
               </div>

               {/* Corporate Floating Visual - Resized */}
               <div className="hidden lg:block relative group shrink-0">
                  <div className="absolute -inset-4 bg-cyan-500/20 rounded-[40px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                  <div className="relative w-80 h-48 bg-white/10 border border-white/20 rounded-[32px] p-6 backdrop-blur-2xl shadow-2xl flex flex-col justify-between overflow-hidden group-hover:border-white/40 transition-colors">
                     <div className="flex justify-between items-start">
                        <div className="flex gap-2">
                           <div className="w-3 h-3 rounded-full bg-red-400"></div>
                           <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                           <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-[9px] font-black tracking-widest text-cyan-300">会话活跃</div>
                     </div>
                     <div className="space-y-3">
                        <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                           <div className="h-full bg-cyan-400 w-[75%] shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-black tracking-widest text-white/40">
                           <span>神经同步</span>
                           <span>75% 完成</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 pt-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-500/30 flex items-center justify-center">
                           <Rocket size={16} className="text-cyan-300" />
                        </div>
                        <div className="h-1.5 w-24 bg-white/10 rounded-full"></div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Bento Grid Layout */}
         <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Middle Subject Area (3/4 width) */}
            <div className="lg:col-span-3 space-y-6">
               
               {/* Side-by-Side Area: Daily Rec & Mistake Review */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Daily Recommendation Card */}
                  {recommendedProblem ? (
                      <div className="tech-card-glass-dark border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col justify-between relative overflow-hidden group">
                         <div className="flex items-start justify-between mb-4 md:mb-6">
                            <div>
                               <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3 border border-blue-500/20">
                                  <Star size={12} className="fill-blue-400" /> 每日精选
                               </div>
                               <h2 className="text-lg md:text-2xl font-black text-white group-hover:text-blue-400 transition-colors leading-tight">{recommendedProblem.title}</h2>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1.5">
                               <span className="inline-block px-2.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] md:text-xs font-medium">{recommendedProblem.difficulty}</span>
                               {recommendedProblem.passRate && (
                                  <span className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">通过率: {recommendedProblem.passRate}</span>
                               )}
                            </div>
                         </div>

                         <div className="text-slate-400 text-xs md:text-sm mb-4 md:mb-8 leading-relaxed line-clamp-3 prose prose-sm prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]}>
                               {recommendedProblem.description || "这是一道精选算法题，快来挑战吧！"}
                            </ReactMarkdown>
                         </div>

                         <div className="flex items-center gap-3 md:gap-4">
                            <Button onClick={() => onNavigate('problems')} className="bg-white !text-slate-900 hover:bg-slate-100 px-5 py-2 md:px-8 md:py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest">
                               开始挑战 <ArrowRight size={14} className="ml-1" />
                            </Button>
                            <div className="flex gap-1.5">
                               {(recommendedProblem.tags || ['算法']).slice(0, 2).map(t => (
                                  <span key={t} className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">{t}</span>
                               ))}
                            </div>
                         </div>

                         <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none text-white translate-x-1/4 translate-y-1/4">
                            <BookOpen size={160} />
                         </div>
                      </div>
                  ) : (
                     <div className="tech-card-glass-dark border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col items-center justify-center min-h-[200px] md:min-h-[300px]">
                        <Sparkles size={36} className="text-slate-700 mb-3" />
                        <p className="text-slate-500 text-xs md:text-sm font-black uppercase tracking-widest">暂无推荐题目</p>
                     </div>
                  )}

                  {/* Mistake Review Bento Card */}
                  <div className="grid grid-rows-2 gap-4 md:gap-6">
                     <div onClick={() => onNavigate('profile')} className="tech-card-glass-dark border border-white/10 hover:border-blue-500/40 rounded-2xl md:rounded-3xl p-5 md:p-8 cursor-pointer transition flex items-center gap-4 md:gap-8 group relative overflow-hidden">
                        <div className="h-14 w-14 md:h-20 md:w-20 bg-rose-500/10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-rose-500/20 transition-all duration-500 text-rose-400 group-hover:scale-110">
                           <Target size={28} />
                        </div>
                        <div className="relative z-10">
                           <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1.5 group-hover:text-rose-400 transition-colors">待攻克领域</div>
                           <h3 className="font-black text-white text-lg md:text-2xl tracking-tight group-hover:text-white transition-colors">错题复习</h3>
                           <p className="text-slate-400 text-[10px] md:text-xs mt-1 md:mt-2 font-medium">{mistakeCount} 道难题等待你的突破</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-[0.02] text-rose-500 group-hover:opacity-[0.05] transition-opacity">
                              <p className="text-slate-500 text-[10px] mt-1 font-bold">按知识点刷题</p>
                           </div>
                        </div>
                        <div onClick={() => onNavigate('playground')} className="tech-card-glass-dark border border-white/10 hover:border-cyan-500/40 rounded-3xl p-6 cursor-pointer transition flex flex-col justify-between group">
                           <div className="h-12 w-12 bg-cyan-500/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 transition text-cyan-400">
                              <Rocket size={24} />
                           </div>
                           <div>
                              <h3 className="font-black text-white text-sm tracking-widest uppercase">实验空间</h3>
                              <p className="text-slate-500 text-[10px] mt-1 font-bold">自由练习与实验室</p>
                           </div>
                        </div>
                     </div>
                  </div>

               {/* AI Cockpit - Full Width Bottom Card */}
               <div className="tech-card-glass-dark border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
                  
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
                     <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-xl shrink-0">
                           <Bot size={20} className="text-cyan-400" />
                        </div>
                        <div>
                           <h3 className="font-black text-base md:text-xl text-white tracking-wide flex flex-wrap items-center gap-2">
                              AI 工具驾驭力驾驶舱 <span className="px-2 py-0.5 rounded text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 font-black uppercase tracking-widest scale-90">智能评估</span>
                           </h3>
                           <p className="text-[10px] md:text-xs text-slate-500 mt-0.5 font-medium">综合分析模型调用、方案组合与最终解题成效</p>
                        </div>
                     </div>
                     <Button onClick={() => onNavigate('playground')} variant="secondary" className="px-4 py-1.5 md:px-6 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 self-start sm:self-auto">
                        提升驾驭力 <ChevronRight size={12} />
                     </Button>
                  </div>

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                     {/* Chart 1: Usage */}
                     <div className="bg-white/5 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/5 flex items-center gap-4 md:gap-6">
                        <div className="w-20 h-20 md:w-24 md:h-24 shrink-0">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={aiData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={35}
                                    paddingAngle={5}
                                    dataKey="value"
                                 >
                                    {aiData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                 </Pie>
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col justify-center">
                           <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                              <BarChart2 size={12} />
                              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">本月调用</span>
                           </div>
                           <div className="flex items-end gap-1.5">
                              <span className="text-2xl md:text-3xl font-black font-mono text-white leading-none">128</span>
                              <span className="text-[9px] md:text-[10px] text-slate-500 font-bold mb-0.5">次</span>
                           </div>
                        </div>
                     </div>

                     {/* Chart 2: Strategy */}
                     <div className="bg-white/5 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/5 flex items-center gap-4 md:gap-6">
                        <div className="w-20 h-20 md:w-24 md:h-24 shrink-0">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={strategyData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={35}
                                    paddingAngle={5}
                                    dataKey="value"
                                 >
                                    {strategyData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                 </Pie>
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col justify-center">
                           <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                              <Zap size={12} />
                              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">策略评分</span>
                           </div>
                           <div className="flex items-end gap-1.5">
                              <span className="text-2xl md:text-3xl font-black font-mono text-amber-400 leading-none">4.8</span>
                              <span className="text-[9px] md:text-[10px] text-slate-500 font-bold mb-0.5">/ 5.0</span>
                           </div>
                        </div>
                     </div>

                     {/* Chart 3: Problem Solving */}
                     <div className="bg-white/5 backdrop-blur-md rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/5 flex items-center gap-4 md:gap-6">
                        <div className="w-20 h-20 md:w-24 md:h-24 shrink-0">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={problemData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={25}
                                    outerRadius={35}
                                    paddingAngle={5}
                                    dataKey="value"
                                 >
                                    {problemData.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                 </Pie>
                              </PieChart>
                           </ResponsiveContainer>
                        </div>
                        <div className="flex flex-col justify-center">
                           <div className="flex items-center gap-1.5 text-slate-500 mb-0.5">
                              <Trophy size={12} />
                              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">AI 辅助</span>
                           </div>
                           <div className="flex items-end gap-1.5">
                              <span className="text-2xl md:text-3xl font-black font-mono text-emerald-400 leading-none">45</span>
                              <span className="text-[9px] md:text-[10px] text-slate-500 font-bold mb-0.5">题</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Sidebar Area (1/4 width) */}
            <div className="space-y-6">
               {/* Check-in Card integrated in Sidebar */}
               <button
                  onClick={handleCheckIn}
                  disabled={isCheckedIn}
                  className={`group relative flex flex-col gap-4 md:gap-6 p-5 md:p-8 rounded-2xl md:rounded-[40px] border w-full text-left transition-all duration-700
                  ${isCheckedIn
                        ? 'bg-blue-600/20 border-blue-500 shadow-2xl shadow-blue-500/20'
                        : 'tech-card-glass-dark border-white/10 hover:border-blue-500/40'
                     }
                `}
               >
                  <div className={`
                  w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center transition-all duration-700
                  ${isCheckedIn ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-500 group-hover:text-blue-400 group-hover:bg-blue-500/10'}
                `}>
                     <Flame size={24} className={isCheckedIn ? 'fill-white' : ''} />
                  </div>
                  <div>
                     <div className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] mb-1.5 transition-colors ${isCheckedIn ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'}`}>
                        连续打卡进度
                     </div>
                     <div className={`text-3xl md:text-5xl font-black flex items-end gap-2 md:gap-3 font-mono leading-none ${isCheckedIn ? 'text-white' : 'text-white'}`}>
                        <span className={isAnimating ? 'animate-bounce' : ''}>{streak}</span>
                        <span className="text-xs font-black mb-0.5 leading-none text-slate-600 uppercase">Days</span>
                     </div>
                  </div>
                  {!isCheckedIn ? (
                     <div className="mt-1 text-[9px] md:text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                        点击打卡记录学习 <ChevronRight size={12} />
                     </div>
                  ) : (
                     <div className="mt-1 text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckCircle size={12} /> 今日已同步
                     </div>
                  )}
               </button>

               {/* Stats Summary Bento Cards */}
               <div className="grid grid-cols-1 gap-4 md:gap-6">
                  <div onClick={() => onNavigate('problems')} className="tech-card-glass-dark border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 hover:border-blue-500/40 transition flex items-center gap-4 md:gap-6 group cursor-pointer">
                     <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500 transition-all text-cyan-400 group-hover:text-white shrink-0">
                        <CheckCircle size={20} />
                     </div>
                     <div>
                        <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5 group-hover:text-cyan-400 transition-colors">算法实战</div>
                        <div className="text-lg md:text-2xl font-black text-white font-mono leading-none">
                           {solvedCount} <span className="text-[9px] md:text-[10px] text-slate-600 uppercase">Solved</span>
                        </div>
                     </div>
                  </div>

                  <div onClick={() => setIsRankModalOpen(true)} className="tech-card-glass-dark border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 hover:border-blue-500/40 transition flex items-center gap-4 md:gap-6 group cursor-pointer">
                     <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 transition-all text-indigo-400 group-hover:text-white shrink-0">
                        <Trophy size={20} />
                     </div>
                     <div>
                        <div className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5 group-hover:text-indigo-400 transition-colors">全站排名</div>
                        <div className="text-lg md:text-2xl font-black text-white font-mono leading-none">
                           #{rank > 900 ? '99+' : rank}
                        </div>
                     </div>
                  </div>
               </div>

               {/* System Performance integrated in Sidebar */}
               <div className="tech-card-glass-dark border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 relative overflow-hidden">
                  <h3 className="font-black text-white text-xs md:text-sm tracking-widest uppercase mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                     <Cpu size={14} className="text-cyan-400" />
                     系统性能
                  </h3>
                  <div className="space-y-4 md:space-y-6">
                     <div>
                        <div className="flex justify-between text-[9px] md:text-[10px] mb-1.5 md:mb-2 font-black uppercase tracking-widest">
                           <span className="text-slate-500">CPU 负载</span>
                           <span className="text-cyan-400 font-mono">12%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-cyan-400 w-[12%] shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-[9px] md:text-[10px] mb-1.5 md:mb-2 font-black uppercase tracking-widest">
                           <span className="text-slate-500">内存占用</span>
                           <span className="text-blue-400 font-mono">2.4GB</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-blue-400 w-[45%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Recent Contests in Sidebar */}
               {activeContests.length > 0 && (
                  <div className="tech-card-glass-dark border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col max-h-[350px] md:max-h-[400px]">
                     <h3 className="font-black text-white text-xs md:text-sm tracking-widest uppercase mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                        <Calendar size={14} className="text-blue-400" />
                        近期安排
                     </h3>
                     <div className="space-y-4 md:space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {activeContests.slice(0, 3).map((contest: any) => (
                           <div key={contest.id} className="group cursor-pointer">
                              <div className="flex items-center gap-3 md:gap-4">
                                 <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl bg-blue-500/10 text-blue-400 flex flex-col items-center justify-center shrink-0 border border-blue-500/10">
                                    <span className="text-[7px] md:text-[8px] font-black leading-none">{new Date(contest.startTime).getMonth() + 1}月</span>
                                    <span className="text-xs md:text-sm font-black leading-none mt-0.5">{new Date(contest.startTime).getDate()}</span>
                                 </div>
                                 <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{contest.title}</h4>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                       <span className={`text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${contest.status === 'LIVE' ? 'bg-green-500/20 text-green-400 animate-pulse' : 'bg-blue-500/20 text-blue-400'}`}>
                                          {contest.status === 'LIVE' ? 'LIVE' : 'UPCOMING'}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                     <button onClick={() => onNavigate('contests')} className="mt-6 w-full py-3 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2">
                        全部赛事 <ChevronRight size="14" />
                     </button>
                  </div>
               )}
            </div>
         </div>

         {/* 5. Compliance Center Section - Re-integrated with Glassmorphism */}
         <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/20">
                     <ShieldCheck size={20} className="text-blue-400" />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-white tracking-tight uppercase">参赛合规中心</h2>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">数智启航 —— AI 驱动的一站式程序设计竞赛与辅助教学系统</p>
                  </div>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">合规监控中</span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {/* 原创声明 */}
               <div className="tech-card-glass-dark p-6 rounded-3xl border border-white/10 group cursor-pointer hover:border-blue-500/30">
                  <div className="flex items-center gap-3 mb-4">
                     <FileText size={20} className="text-blue-400 group-hover:scale-110 transition-transform" />
                     <h3 className="font-black text-white text-sm uppercase tracking-widest">原创声明</h3>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed font-medium">
                     本项目为团队自主设计与开发，核心业务逻辑与架构均为原创。所有引用开源组件均遵循其相关开源协议。
                  </p>
                  <div className="mt-4 inline-block px-2 py-1 bg-white/5 border border-white/5 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter">
                     标注时间：2025.7.1 – 2026.6.30
                  </div>
               </div>

               {/* AI 工具使用清单 */}
               <div className="tech-card-glass-dark p-6 rounded-3xl border border-white/10 group cursor-pointer hover:border-indigo-500/30">
                  <div className="flex items-center gap-3 mb-4">
                     <Cpu size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                     <h3 className="font-black text-white text-sm uppercase tracking-widest">AI 工具使用清单</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                     {['DeepSeek', 'GitHub Copilot', 'Claude 3.5'].map(tool => (
                        <span key={tool} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-black border border-indigo-500/10 uppercase tracking-tighter">{tool}</span>
                     ))}
                  </div>
                  <div className="hidden md:block">
                     <p className="text-slate-400 text-xs leading-relaxed font-medium">
                        <span className="font-black text-slate-300">组合说明：</span>先由 DeepSeek 进行系统架构规划，GitHub Copilot 进行代码补全，最后通过 Claude 3.5 辅助编写及润色项目文档。
                     </p>
                  </div>
                  <div className="md:hidden">
                     <p className="text-slate-400 text-xs leading-relaxed font-medium">
                        <span className="font-black text-slate-300">组合说明：</span>利用 DeepSeek 架构规划、GitHub Copilot 补全及 Claude 3.5 润色文档。
                     </p>
                  </div>
               </div>

               {/* 数据合规 & 隐私政策 */}
               <div className="tech-card-glass-dark p-6 rounded-3xl border border-white/10 group cursor-pointer hover:border-emerald-500/30">
                  <div className="flex items-center gap-3 mb-4">
                     <Lock size={20} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                     <h3 className="font-black text-white text-sm uppercase tracking-widest">数据合规 & 隐私政策</h3>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed font-medium">
                     平台中展示的全部用户测试数据均经过脱敏处理，不包含任何真实个人隐私信息。我们严格遵守国家相关数据安全法律法规。
                  </p>
               </div>

               {/* 地图合规声明 */}
               <div className="tech-card-glass-dark p-6 rounded-3xl border border-white/10 group cursor-pointer hover:border-rose-500/30">
                  <div className="flex items-center gap-3 mb-4">
                     <MapPinOff size={20} className="text-rose-400 group-hover:scale-110 transition-transform" />
                     <h3 className="font-black text-white text-sm uppercase tracking-widest">地图合规声明</h3>
                  </div>
                  <div className="inline-block px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[9px] font-black uppercase tracking-widest mb-3">本项目未使用地图</div>
                  <p className="text-slate-400 text-xs leading-relaxed font-medium">
                     系统功能均围绕编程竞赛与辅助教学展开，未包含且不涉及任何地理信息或地图展示功能。
                  </p>
               </div>

               {/* 参赛纪律承诺 */}
               <div className="tech-card-glass-dark p-6 rounded-3xl border border-white/10 group cursor-pointer hover:border-amber-500/30 md:col-span-2 lg:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                     <Scale size={20} className="text-amber-400 group-hover:scale-110 transition-transform" />
                     <h3 className="font-black text-white text-sm uppercase tracking-widest">参赛纪律承诺</h3>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed font-medium">
                     我们郑重承诺：严格遵守《数智启航》赛事规则，不抄袭、不作弊，秉持公平、公正、公开的原则。所有提交的代码及相关材料均由团队成员在合法合规使用 AI 辅助工具的前提下独立完成。
                  </p>
               </div>
            </div>
         </div>

         {/* Footer Info Section */}
         <div className="mt-12 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 pb-12 opacity-60">
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 text-white text-xl font-black tracking-tighter">
                  <span>EduCode <span className="text-blue-400">AI</span></span>
               </div>
               <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  © 2026 教育数字化与产教协同专项项目部
               </p>
            </div>
            
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">合规审计已通过</span>
               </div>
               <div className="flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">服务协议</span>
               </div>
               <div className="flex items-center gap-2">
                  <MapPinOff size={16} className="text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">隐私加密</span>
               </div>
            </div>
         </div>

         {/* Global Rank Modal */}
         {isRankModalOpen && (
            <div 
               className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => setIsRankModalOpen(false)}
            >
               <div 
                  className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl animate-fade-in relative max-h-[80vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
               >
                  <button 
                     onClick={(e) => { e.stopPropagation(); setIsRankModalOpen(false); }} 
                     className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors z-10"
                  >
                     <span className="sr-only">Close</span>
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                  </button>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2 shrink-0">
                     <Trophy className="text-indigo-500" /> 全站实力排行榜
                  </h2>
                  <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
                     {globalRankings.map((r, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50/50 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className={`w-8 h-8 flex items-center justify-center rounded-full font-black text-sm ${
                                 r.rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                                 r.rank === 2 ? 'bg-slate-200 text-slate-600' :
                                 r.rank === 3 ? 'bg-orange-100 text-orange-600' :
                                 'bg-slate-100 text-slate-500'
                              }`}>
                                 {r.rank}
                              </div>
                              <span className="font-bold text-slate-700">{r.name}</span>
                           </div>
                           <div className="text-right">
                              <div className="font-mono font-bold text-slate-800">{r.solved}</div>
                              <div className="text-[10px] text-slate-400 uppercase">做题数</div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}
      </div>
      </div>
   );
};
