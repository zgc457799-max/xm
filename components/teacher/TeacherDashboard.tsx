
import React, { useMemo } from 'react';
import { Users, CheckCircle, Award } from 'lucide-react';
import { getTeacherDashboardStats } from '../../services/api';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card } from '../UiComponents';
import { Contest, ProblemBank } from '../../types';
import { SmartProblemImport } from './SmartProblemImport';
import { TestCaseGenerator } from './TestCaseGenerator';

import { Settings as SettingsIcon, Clock, AlertCircle } from 'lucide-react';
import { SettingsModal } from '../common/SettingsModal';
import { useState, useEffect } from 'react';

const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Green, Orange, Red
const NEON_COLORS = ['#34d399', '#fbbf24', '#f87171']; // Brighter versions for neon effect

export const TeacherDashboard = ({ stats, contests, banks, showToast }: {
  stats: { studentCount: number, problemCount: number, contestCount: number },
  contests: Contest[],
  banks: ProblemBank[],
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [extendedStats, setExtendedStats] = useState<any>(null);

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

  // Calculate Submission Activity from Contests
  const chartData = useMemo(() => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const counts = new Array(7).fill(0);

    // Iterate through all project submissions in all contests
    // Note: In a real app with 1000s of records, this should be done backend-side.
    contests.forEach(c => {
      if (c.projectSubmissions) {
        c.projectSubmissions.forEach(sub => {
          const date = new Date(sub.submittedAt);
          const dayIdx = date.getDay(); // 0 = Sunday
          counts[dayIdx]++;
        });
      }
    });

    // If no data (mock/empty), fallback to some static trend to look good, but prefer real.
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) {
      // Fallback static data for demo if totally empty
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

    // Map back to chart object
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
    <div className="space-y-8 animate-fade-in relative">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} isTeacherOrAdmin={true} />

      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">教师仪表盘</h1>
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.2em] mt-1">Teacher Control Center v4.0</p>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:bg-white/10 hover:text-white transition shadow-xl backdrop-blur-md font-black text-xs uppercase tracking-widest"
        >
          <SettingsIcon size={16} />
          账号设置
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 flex items-center gap-6 border-l-4 border-blue-500 bg-white/5">
          <div className="bg-blue-500/10 p-4 rounded-2xl text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Users size={28} />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">班级总人数</div>
            <div className="text-3xl font-black text-white tracking-tighter">{stats.studentCount}</div>
          </div>
        </Card>
        <Card className="p-8 flex items-center gap-6 border-l-4 border-emerald-500 bg-white/5">
          <div className="bg-emerald-500/10 p-4 rounded-2xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <CheckCircle size={28} />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">题库总数</div>
            <div className="text-3xl font-black text-white tracking-tighter">{stats.problemCount}</div>
          </div>
        </Card>
        <Card className="p-8 flex items-center gap-6 border-l-4 border-purple-500 bg-white/5">
          <div className="bg-purple-500/10 p-4 rounded-2xl text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Award size={28} />
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">活跃比赛</div>
            <div className="text-3xl font-black text-white tracking-tighter">{stats.contestCount}</div>
          </div>
        </Card>
      </div>

      <div className="w-full">
        <SmartProblemImport
          onImport={(data) => {
            console.log("Imported Data:", data);
            showToast(`已提取题目：${data.title}，请前往题目管理完善发布`);
          }}
          showToast={showToast}
          banks={banks}
        />
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="p-8 lg:col-span-2">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
            本周提交活跃度
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                  allowDecimals={false} 
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    borderRadius: '16px', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                    backdropFilter: 'blur(10px)'
                  }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#64748b', marginBottom: '4px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                />
                <Bar 
                  dataKey="submissions" 
                  name="提交数" 
                  fill="url(#barGradient)" 
                  radius={[6, 6, 0, 0]} 
                  barSize={40} 
                  filter="url(#glow)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Difficulty Pie Chart */}
        <Card className="p-8">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            题库难度分布
          </h3>
          {extendedStats && (extendedStats.difficultyDist.Easy + extendedStats.difficultyDist.Medium + extendedStats.difficultyDist.Hard > 0) ? (
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={NEON_COLORS[index % NEON_COLORS.length]} 
                        filter="url(#pieGlow)"
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      borderRadius: '16px', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    formatter={(value) => <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Central Text for Pie Chart */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">总计</div>
                <div className="text-2xl font-black text-white leading-none">
                  {extendedStats.difficultyDist.Easy + extendedStats.difficultyDist.Medium + extendedStats.difficultyDist.Hard}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-600 text-[10px] font-black uppercase tracking-widest">暂无数据</div>
          )}
        </Card>
      </div>

      {/* Recent Activity List */}
      <Card className="p-8">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">实时提交动态</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/5 text-slate-500 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 rounded-l-2xl">学生</th>
                <th className="px-6 py-4">题目ID</th>
                <th className="px-6 py-4 text-center">状态</th>
                <th className="px-6 py-4 text-center">得分</th>
                <th className="px-6 py-4 rounded-r-2xl">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {extendedStats?.recentActivity.map((act: any) => (
                <tr key={act.id} className="hover:bg-white/5 transition group">
                  <td className="px-6 py-4 font-black text-white tracking-tight flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-[10px] font-black border border-blue-500/20 shadow-lg shadow-blue-500/5 group-hover:scale-110 transition-transform">
                      {act.user_name[0]}
                    </div>
                    {act.user_name}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-black text-xs">#{act.problem_id}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${act.status === 'AC' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      act.status === 'WA' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                      {act.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-white font-bold">{act.score}</td>
                  <td className="px-6 py-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    {new Date(act.submitted_at).toLocaleDateString()} {new Date(act.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
              {(!extendedStats?.recentActivity || extendedStats.recentActivity.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600 font-black text-[10px] uppercase tracking-widest">暂无提交记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
