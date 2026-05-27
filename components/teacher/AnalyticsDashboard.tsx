
import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { MOCK_RANKINGS } from '../../data/mockData';
import { Button, Card, Pagination } from '../UiComponents';
import { ArrowLeft, User, Trophy, FileDown } from 'lucide-react';
import { Contest } from '../../types';
import { getContestAnalytics, getStudentRadar } from '../../services/api';

// Helper to download CSV (Reuse or move to utils in real app)
const downloadCSV = (data: any[], filename: string) => {
   if (!data.length) return;
   const headers = Object.keys(data[0]).join(',');
   const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
   const blob = new Blob([`\uFEFF${headers}\n${rows}`], { type: 'text/csv;charset=utf-8;' });
   const url = URL.createObjectURL(blob);
   const link = document.createElement('a');
   link.href = url;
   link.download = `${filename}.csv`;
   document.body.appendChild(link);
   link.click();
   document.body.removeChild(link);
};

export const AnalyticsDashboard = ({ contests, students }: { contests: Contest[], students: any[] }) => {
   const [selectedContestId, setSelectedContestId] = useState(contests.length > 0 ? contests[0].id : '');
   const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

   // API Data State
   const [rankings, setRankings] = useState<any[]>([]);
   const [radarData, setRadarData] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);
   const [radarLoading, setRadarLoading] = useState(false);

   // Pagination State for Rankings
   const [page, setPage] = useState(1);
   const itemsPerPage = 10;

   const currentContest = contests.find(c => c.id === selectedContestId);

   // Fetch Contest Leaderboard
   React.useEffect(() => {
      const fetchRankings = async () => {
         if (!selectedContestId) return;
         setLoading(true);
         try {
            const data = await getContestAnalytics(selectedContestId);
            setRankings(data.leaderboard || []);
         } catch (error) {
            console.error("Fetch rankings error:", error);
         } finally {
            setLoading(false);
         }
      };
      fetchRankings();
   }, [selectedContestId]);

   // Fetch Student Radar
   React.useEffect(() => {
      const fetchRadar = async () => {
         if (!selectedStudentId) return;
         setRadarLoading(true);
         try {
            const data = await getStudentRadar(selectedStudentId);
            setRadarData(data);
         } catch (error) {
            console.error("Fetch radar error:", error);
         } finally {
            setRadarLoading(false);
         }
      };
      fetchRadar();
   }, [selectedStudentId]);

   // Paginated Rankings
   const totalPages = Math.ceil(rankings.length / itemsPerPage);
   const paginatedRankings = rankings.slice((page - 1) * itemsPerPage, page * itemsPerPage);

   const handleExportLeaderboard = () => {
      if (!currentContest) return;
      const data = rankings.map(r => ({
         排名: r.rank,
         姓名: r.name,
         解题数: r.solved,
         总用时: r.time
      }));
      downloadCSV(data, `${currentContest.title}_排行榜`);
   };

   if (selectedStudentId) {
      const student = students.find(s => s.id === selectedStudentId);
      return (
         <div className="animate-fade-in space-y-6">
            <div className="flex items-center gap-4">
               <button onClick={() => setSelectedStudentId(null)} className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all backdrop-blur-md">
                  <ArrowLeft size={20} />
               </button>
               <h2 className="text-2xl font-black text-white tracking-tight">学生画像: {student?.name}</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <Card className="p-8 lg:col-span-2 bg-white/5">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                     技能图谱分析
                  </h3>
                  <div className="h-80 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                           <PolarGrid stroke="rgba(255,255,255,0.05)" />
                           <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} />
                           <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                           <Radar
                              name={student?.name}
                              dataKey="A"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              fillOpacity={0.4}
                           />
                           <RechartsTooltip 
                              contentStyle={{ 
                                 backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                                 borderRadius: '16px', 
                                 border: '1px solid rgba(255,255,255,0.1)', 
                                 backdropFilter: 'blur(10px)'
                              }}
                           />
                        </RadarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
               <Card className="p-8 bg-white/5">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                     学习统计
                  </h3>
                  <div className="space-y-6">
                     <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">平均得分</span>
                        <span className="text-xl font-black text-emerald-400">{student?.stats?.avgScore || 0}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">排名百分比</span>
                        <span className="text-xl font-black text-purple-400">{student?.stats?.rankPercent || '0%'}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">做题总数</span>
                        <span className="text-xl font-black text-blue-400">{student?.stats?.solved || 0}</span>
                     </div>
                  </div>
               </Card>
            </div>
         </div>
      );
   }

   return (
      <div className="space-y-6 animate-fade-in h-[calc(100vh-120px)] flex flex-col">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
               <h2 className="text-2xl font-black text-white tracking-tight">成绩分析</h2>
               <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">深度挖掘学生学习数据与能力图谱</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 w-full md:w-auto">
               <Button variant="secondary" onClick={handleExportLeaderboard} className="!rounded-xl backdrop-blur-md">
                  <FileDown size={16} /> 导出榜单
               </Button>
               <select
                  value={selectedContestId}
                  onChange={(e) => { setSelectedContestId(e.target.value); setPage(1); }}
                  className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 outline-none backdrop-blur-md"
               >
                  {contests.map(c => (
                     <option key={c.id} value={c.id} className="bg-slate-900">{c.title}</option>
                  ))}
               </select>
            </div>
         </div>

         <div className="flex gap-6 flex-1 overflow-hidden">
            {/* Main Leaderboard */}
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/10 shadow-3xl overflow-hidden flex flex-col backdrop-blur-md">
               <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                     <Trophy size={16} className="text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" /> 
                     实时榜单
                  </h3>
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 animate-pulse uppercase tracking-widest">● 实时更新中</span>
               </div>
               <div className="overflow-auto flex-1 custom-scrollbar w-full">
                  {loading ? (
                     <div className="p-12 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest">加载排名中...</div>
                  ) : (
                     <table className="w-full text-left min-w-[500px]">
                        <thead className="bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                           <tr>
                              <th className="px-6 py-4 w-20">排名</th>
                              <th className="px-6 py-4">姓名</th>
                              <th className="px-6 py-4 w-32 text-center">解题数</th>
                              <th className="px-6 py-4 w-32 text-center">罚时</th>
                              <th className="px-6 py-4 text-right">详情</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {paginatedRankings.length === 0 ? (
                              <tr><td colSpan={5} className="p-12 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">暂无参赛数据</td></tr>
                           ) : (
                              paginatedRankings.map((r, i) => (
                                 <tr key={i} className="hover:bg-white/5 transition-all group">
                                    <td className="px-6 py-4">
                                       <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                          r.rank === 1 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]' :
                                          r.rank === 2 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30' :
                                          r.rank === 3 ? 'bg-amber-600/20 text-amber-600 border border-amber-600/30' :
                                          'bg-white/5 text-slate-500'
                                       }`}>
                                          {r.rank}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="font-black text-white tracking-tight group-hover:text-blue-400 transition-colors">{r.name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                       <span className="text-emerald-400 font-black text-sm">{r.solved}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                       <span className="text-slate-500 font-mono text-xs">{r.time}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <button
                                          onClick={() => {
                                             const student = students.find(s => s.name === r.name);
                                             if (student) setSelectedStudentId(student.id);
                                          }}
                                          className="p-2 bg-white/5 border border-white/10 hover:bg-blue-500/10 rounded-xl text-slate-400 hover:text-blue-400 transition shadow-sm backdrop-blur-md"
                                       >
                                          <User size={16} />
                                       </button>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  )}
               </div>
               <div className="border-t border-white/5">
                  <Pagination
                     currentPage={page}
                     totalPages={totalPages}
                     onPageChange={setPage}
                     totalItems={rankings.length}
                  />
               </div>
            </div>
         </div>
      </div>
   );
};
