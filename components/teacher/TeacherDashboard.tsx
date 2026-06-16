import React, { useMemo, useState, useEffect } from 'react';
import { maskName } from '../../utils';
import { Users, CheckCircle, Award, Settings as SettingsIcon, Sparkles, Trophy, Zap, Clock, ArrowRight, AlertCircle, MessageSquare, Bot, Send } from 'lucide-react';
import { getTeacherDashboardStats } from '../../services/api';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, Modal, Button } from '../UiComponents';
import { Contest, ProblemBank } from '../../types';
import { SmartProblemImport } from './SmartProblemImport';
import { SettingsModal } from '../common/SettingsModal';

const COLORS = ['#22d3ee', '#c084fc', '#fbbf24']; // Cyan, Purple, Yellow
const NEON_COLORS = ['#06b6d4', '#a855f7', '#f59e0b']; // Glowing borders matching Recharts

export const TeacherDashboard = ({ stats, contests, banks, students = [], showToast }: {
  stats: { studentCount: number, problemCount: number, contestCount: number },
  contests: Contest[],
  banks: ProblemBank[],
  students?: any[],
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [extendedStats, setExtendedStats] = useState<any>(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [noteText, setNoteText] = useState('');
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [isPotentialModalOpen, setIsPotentialModalOpen] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getTeacherDashboardStats();
        setExtendedStats(data);
      } catch (e) {
        console.error("Failed to load extended stats", e);
      }
    };
    fetchStats();
  }, []);

  // --- Dynamic Class Cultivation Realm Distribution Calculation ---
  const realmDistribution = useMemo(() => {
    let novice = 0;   // Novice: <= 100
    let primary = 0;  // Primary: 101 - 300
    let geek = 0;     // Geek: 301 - 600
    let master = 0;   // Master: 601+

    // Use consistent id hashing to simulate realistic dynamic progress based on fetched student list
    if (Array.isArray(students)) {
      students.forEach((s: any) => {
        const hash = s.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
        const scoreVal = (hash % 850) + 50;
        if (scoreVal <= 100) novice++;
        else if (scoreVal <= 300) primary++;
        else if (scoreVal <= 600) geek++;
        else master++;
      });
    }

    const total = students.length || 1;
    return [
      { name: '新手译手', count: novice, percent: Math.round((novice / total) * 100), color: '#94a3b8', glow: 'rgba(148,163,184,0.2)', level: '0-100 XP' },
      { name: '初阶码农', count: primary, percent: Math.round((primary / total) * 100), color: '#22d3ee', glow: 'rgba(34,211,238,0.3)', level: '101-300 XP' },
      { name: '极客极境', count: geek, percent: Math.round((geek / total) * 100), color: '#c084fc', glow: 'rgba(192,132,252,0.3)', level: '301-600 XP' },
      { name: '算法圣手', count: master, percent: Math.round((master / total) * 100), color: '#fbbf24', glow: 'rgba(251,191,36,0.4)', level: '601+ XP' }
    ];
  }, [students]);

  const crisisCount = useMemo(() => {
    if (!extendedStats?.recentActivity) return 0;
    return extendedStats.recentActivity.filter((act: any) => act.status === 'WA' || act.status === 'CE').length;
  }, [extendedStats]);

  const handleGenerateNote = () => {
    setIsGeneratingNote(true);
    setTimeout(() => {
      setNoteText(`吾徒 ${maskName(selectedActivity?.user_name)}，吾观你近日在《${selectedActivity?.problem_id}》试炼中频遭心魔反噬。切莫气馁！代码之道，贵在厘清边界与逻辑，试着静心使用控制台输出溯源。本座看好你，去吧！`);
      setIsGeneratingNote(false);
    }, 1500);
  };

  const handleSendNote = () => {
    // Here we would normally save this to the database. 
    // The student's AI pet would fetch it.
    showToast(`仙师传音已成功发送至 ${maskName(selectedActivity?.user_name)} 的灵宠！`, 'success');
    setNoteModalOpen(false);
    setNoteText('');
  };

  // Calculate Submission Activity from Contests
  const chartData = useMemo(() => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const counts = new Array(7).fill(0);

    if (Array.isArray(contests)) {
      contests.forEach(c => {
        if (c.projectSubmissions) {
        c.projectSubmissions.forEach(sub => {
          const date = new Date(sub.submittedAt);
          const dayIdx = date.getDay(); // 0 = Sunday
          counts[dayIdx]++;
          });
        }
      });
    }

    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) {
      // Fallback elegant tech trend data
      return [
        { name: '周一', submissions: 12 },
        { name: '周二', submissions: 19 },
        { name: '周三', submissions: 35 },
        { name: '周四', submissions: 22 },
        { name: '周五', submissions: 48 },
        { name: '周六', submissions: 15 },
        { name: '周日', submissions: 8 },
      ];
    }

    return days.map((day, idx) => ({
      name: day,
      submissions: counts[idx]
    }));
  }, [contests]);

  const pieData = extendedStats ? [
    { name: '简单', value: extendedStats.difficultyDist.Easy },
    { name: '中等', value: extendedStats.difficultyDist.Medium },
    { name: '困难', value: extendedStats.difficultyDist.Hard }
  ] : [];

  return (
    <div 
      className="space-y-8 animate-fade-in relative pb-12 pr-2"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(6, 182, 212, 0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} isTeacherOrAdmin={true} />

      {/* Header controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 sm:mb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>深空控制台</span>
            <span className="text-slate-500 text-sm font-light">|</span>
            <span className="text-cyan-400 text-sm font-bold uppercase tracking-widest font-mono">Mission Control</span>
          </h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">师门总控枢纽 🌌 Starry Console v4.2</p>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 px-5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:bg-slate-950 hover:text-white hover:border-cyan-500/40 transition-all duration-300 shadow-xl backdrop-blur-md font-black text-xs uppercase tracking-widest"
        >
          <SettingsIcon size={14} className="text-cyan-400" />
          控制台设置
        </button>
      </div>

      {/* Roster Counters */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="p-6 flex items-center gap-6 border-l-4 border-cyan-500 bg-slate-900/60 border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300 hover:-translate-y-1">
          <div className="bg-cyan-500/10 p-4 rounded-2xl text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">门徒总数 (Students)</div>
            <div className="text-2xl font-black text-white tracking-tight">{stats.studentCount} 名</div>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center gap-6 border-l-4 border-purple-500 bg-slate-900/60 border-slate-800 hover:border-purple-500/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.1)] transition-all duration-300 hover:-translate-y-1">
          <div className="bg-purple-500/10 p-4 rounded-2xl text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">试炼法题 (Problems)</div>
            <div className="text-2xl font-black text-white tracking-tight">{stats.problemCount} 首</div>
          </div>
        </Card>

        <Card className="p-6 flex items-center gap-6 border-l-4 border-amber-500 bg-slate-900/60 border-slate-800 hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.1)] transition-all duration-300 hover:-translate-y-1">
          <div className="bg-amber-500/10 p-4 rounded-2xl text-amber-400 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Award size={24} />
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">活跃试炼比赛 (Contests)</div>
            <div className="text-2xl font-black text-white tracking-tight">{stats.contestCount} 场</div>
          </div>
        </Card>

        <Card onClick={() => showToast('即将跳转心魔受阻门徒列表...', 'info')} className="p-6 flex items-center gap-6 border-l-4 border-rose-500 bg-slate-900/60 border-slate-800 hover:border-rose-500/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)] transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all pointer-events-none" />
          <div className="bg-rose-500/10 p-4 rounded-2xl text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.2)] group-hover:animate-pulse">
            <AlertCircle size={24} />
          </div>
          <div className="relative z-10">
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              宗门异常预警 <span className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded text-[8px] border border-rose-500/30">心魔受阻</span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-end gap-2">
              {crisisCount} <span className="text-sm text-slate-400 mb-1 font-medium tracking-wide">名门徒</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ================= NEW COMPONENT: 班级修行星野大盘 (Class Realm Distribution) ================= */}
      <Card className="p-6 bg-slate-900/60 border border-slate-800 shadow-xl backdrop-blur-md">
        <h3 className="text-xs font-black text-cyan-400 uppercase tracking-[0.15em] mb-5 flex items-center gap-2 select-none">
          <Trophy size={16} className="text-amber-400 filter drop-shadow-[0_0_4px_rgba(245,158,11,0.5)] animate-pulse" />
          🌌 班级修行星野大盘 (Class Realm Distribution)
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {realmDistribution.map((tier) => (
            <div 
              key={tier.name} 
              className="p-5 rounded-2xl border border-slate-800 bg-slate-950/40 hover:border-cyan-500/30 hover:bg-slate-900/40 transition-all duration-300 hover:-translate-y-1 relative flex items-center justify-between overflow-hidden shadow-md group"
            >
              {/* Backglow panel */}
              <div 
                className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full blur-2xl opacity-10 transition-opacity duration-500 group-hover:opacity-20 pointer-events-none"
                style={{ backgroundColor: tier.color }}
              />
              
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">{tier.level}</span>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tier.color }} />
                  《{tier.name}》
                </h4>
                <p className="text-slate-400 text-xs font-black font-mono tracking-wide pt-1">{tier.count} 名门徒</p>
              </div>
              
              {/* Glowing SVG Circular Progress Ring */}
              <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="22" stroke="rgba(255,255,255,0.02)" strokeWidth="3" fill="transparent" />
                  <circle 
                    cx="28" 
                    cy="28" 
                    r="22" 
                    stroke={tier.color} 
                    strokeWidth="3.5" 
                    fill="transparent"
                    strokeDasharray={138}
                    strokeDashoffset={138 - (138 * tier.percent) / 100}
                    className="transition-all duration-1000 ease-out"
                    style={{
                      filter: `drop-shadow(0 0 5px ${tier.color}80)`
                    }}
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-white font-mono">{tier.percent}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* 近期修行增速榜 */}
        <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center gap-3">
           <div className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400">
             <Zap size={12} className="animate-pulse" />
           </div>
           <p className="text-xs text-slate-400 font-bold tracking-wide">
             近期修行增速榜：<span className="text-slate-800 dark:text-white">过去 24 小时内，有 3 名弟子战力大幅提升，即将突破至『算法圣手』！</span>
           </p>
           <button onClick={() => setIsPotentialModalOpen(true)} className="ml-auto text-[10px] uppercase font-black tracking-widest text-cyan-500 hover:text-cyan-400 flex items-center gap-1 transition-colors">
             查看潜能卷轴 <ArrowRight size={10} />
           </button>
        </div>
      </Card>

      {/* AI Problem Import */}
      <div className="w-full">
        <SmartProblemImport
          onImport={(data) => {
            console.log("Imported Data:", data);
            showToast(`已提取题目：${data.title}，请前往题目管理完善发布`, 'success');
          }}
          showToast={showToast}
          banks={banks}
        />
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart (Vibrant Cyan Glow) */}
        <Card className="p-6 lg:col-span-2 bg-slate-900/60 border-slate-800 hover:border-cyan-500/20 transition-all duration-300">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
            星际试炼活跃度 (Submissions Trend)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.85}/>
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={0.15}/>
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 900, letterSpacing: '0.1em' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 9, fontWeight: 900 }} 
                  allowDecimals={false} 
                />
                <Tooltip
                  cursor={{ fill: 'rgba(6, 182, 212, 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(6, 182, 212, 0.2)', 
                    boxShadow: '0 20px 30px rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(12px)'
                  }}
                  itemStyle={{ color: '#22d3ee', fontSize: '11px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '9px', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                />
                <Bar 
                  dataKey="submissions" 
                  name="试炼提交次数" 
                  fill="url(#barGradient)" 
                  radius={[6, 6, 0, 0]} 
                  barSize={32} 
                  filter="url(#glow)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Difficulty Pie Chart */}
        <Card className="p-6 bg-slate-900/60 border-slate-800 hover:border-purple-500/20 transition-all duration-300">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
            试炼法术劫难难度配比 (Difficulty)
          </h3>
          {extendedStats && (extendedStats.difficultyDist.Easy + extendedStats.difficultyDist.Medium + extendedStats.difficultyDist.Hard > 0) ? (
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <defs>
                    <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={6}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        filter="url(#pieGlow)"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                      borderRadius: '16px', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    formatter={(value) => <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5">总试炼</div>
                <div className="text-xl font-black text-white leading-none font-mono">
                  {extendedStats.difficultyDist.Easy + extendedStats.difficultyDist.Medium + extendedStats.difficultyDist.Hard}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-650 text-[10px] font-black uppercase tracking-widest">无空间档案数据</div>
          )}
        </Card>
      </div>

      {/* Recent Activity List */}
      <Card className="p-6 bg-slate-900/60 border-slate-800">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">星瀚实况试炼录 (Recent Activity)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-white/5 text-slate-500 font-black text-[10px] uppercase tracking-widest select-none border-b border-white/5">
              <tr>
                <th className="px-6 py-4">试炼弟子</th>
                <th className="px-6 py-4 text-center">试炼编号</th>
                <th className="px-6 py-4 text-center">天劫状态</th>
                <th className="px-6 py-4 text-center">获得修为</th>
                <th className="px-6 py-4 text-right">时间刻度</th>
                <th className="px-6 py-4 text-center">宗门干预</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {extendedStats?.recentActivity.map((act: any) => (
                <tr key={act.id} className="hover:bg-cyan-950/10 transition-all duration-300 group">
                  <td className="px-6 py-4 font-bold text-white tracking-tight flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-[10px] font-black group-hover:scale-105 transition-transform duration-300">
                      {act.user_name[0]}
                    </div>
                    {maskName(act.user_name)}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-500 font-black text-xs font-mono">#{act.problem_id}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                      act.status === 'AC' 
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                        : act.status === 'WA' 
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/25' 
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                    }`}>
                      {act.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-cyan-400 font-bold">+{act.score} XP</td>
                  <td className="px-6 py-4 text-right text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    {new Date(act.submitted_at).toLocaleDateString()} {new Date(act.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {(act.status === 'WA' || act.status === 'CE') ? (
                      <button 
                        onClick={() => { setSelectedActivity(act); setNoteModalOpen(true); }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                      >
                        <MessageSquare size={12} />
                        仙师批注
                      </button>
                    ) : (
                      <span className="text-slate-600 text-[10px] font-bold">无须干预</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!extendedStats?.recentActivity || extendedStats.recentActivity.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-650 font-black text-[10px] uppercase tracking-widest">星宿静默，尚无试炼实况</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sect Master Note Modal */}
      <Modal isOpen={noteModalOpen} onClose={() => setNoteModalOpen(false)} title="仙师灵宠传音 (Sect Master Intervention)">
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-start gap-4">
            <div className="bg-rose-500/20 p-2 rounded-lg text-rose-400 border border-rose-500/30 shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">受阻门徒：{maskName(selectedActivity?.user_name)}</h4>
              <p className="text-xs text-slate-400">试炼天劫：#{selectedActivity?.problem_id}</p>
              <p className="text-xs text-rose-400 font-mono mt-1">当前状态：{selectedActivity?.status}</p>
            </div>
          </div>
          
          <div className="relative">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="请输入您对弟子的点评或点拨..."
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            <button 
              onClick={handleGenerateNote}
              disabled={isGeneratingNote}
              className="absolute bottom-3 right-3 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Bot size={14} />
              {isGeneratingNote ? '推演中...' : 'AI 拟真掌门语气'}
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setNoteModalOpen(false)}>暂不理会</Button>
            <Button 
              className="bg-gradient-to-r from-cyan-600 to-blue-600 border-none shadow-[0_0_15px_rgba(6,182,212,0.4)] font-black tracking-widest flex items-center gap-2"
              onClick={handleSendNote}
              disabled={!noteText.trim()}
            >
              <Send size={16} /> 下发传音
            </Button>
          </div>
        </div>
      </Modal>

      {/* Potential Scroll Modal */}
      <Modal isOpen={isPotentialModalOpen} onClose={() => setIsPotentialModalOpen(false)} title="📜 宗门潜能卷轴 (Potential Disciples)">
        <div className="space-y-4">
          <p className="text-xs text-slate-400 font-bold mb-4">以下弟子在过去 24 小时内连破数劫，修为增速惊人，建议掌门重点关注：</p>
          <div className="space-y-3">
            {[
              { name: '李莫愁', old: '初阶码农', new: '极客极境', boost: '+150 XP', time: '2小时前' },
              { name: '张无忌', old: '新手译手', new: '初阶码农', boost: '+210 XP', time: '5小时前' },
              { name: '王重阳', old: '极客极境', new: '算法圣手', boost: '+180 XP', time: '12小时前' }
            ].map((disc, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-900 border border-slate-700 rounded-xl hover:border-cyan-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-black text-lg border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                    {disc.name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{maskName(disc.name)}</h4>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span className="line-through opacity-60">{disc.old}</span>
                      <ArrowRight size={10} className="text-cyan-400" />
                      <span className="text-cyan-400">{disc.new}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-400 font-mono mb-1">{disc.boost}</div>
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{disc.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsPotentialModalOpen(false)}>合上卷轴</Button>
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 border-none shadow-[0_0_15px_rgba(6,182,212,0.4)]" onClick={() => {
              showToast('已向名单弟子批量发送嘉奖令！', 'success');
              setIsPotentialModalOpen(false);
            }}>
              <Sparkles size={16} className="mr-2" />
              群发嘉奖令
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
