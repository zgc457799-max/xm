
import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, Clock, ChevronRight, AlertCircle, Map, Info, Timer, Brain, Target, ArrowRight, Zap, Shield, Activity, Lightbulb, CheckCircle } from 'lucide-react';
import { Contest } from '../../types';
import { Button, StatusBadge, Modal, Skeleton } from '../UiComponents';

export const ContestLobby = ({
  contests,
  onRegister,
  onEnter,
  onViewLeaderboard
}: {
  contests: Contest[],
  onRegister: (id: string) => void,
  onEnter: (contest: Contest) => void,
  onViewLeaderboard: (contest: Contest) => void,
  theme?: 'light' | 'dark'
}) => {
  const isDark = theme !== 'light';

  const [selectedContestId, setSelectedContestId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Target Date: 2026-05-30
  useEffect(() => {
    const targetDate = new Date('2026-05-30T23:59:59').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleRegisterClick = (id: string) => {
    setSelectedContestId(id);
    setIsModalOpen(true);
  };

  const confirmRegister = () => {
    if (selectedContestId) {
      onRegister(selectedContestId);
      setIsModalOpen(false);
      setSelectedContestId(null);
    }
  };

  const selectedContest = contests.find(c => c.id === selectedContestId);

  return (
    <div className="max-w-6xl mx-auto md:space-y-8 animate-fade-in pb-20 md:pb-12 px-4 md:px-0 mt-4 md:mt-0">
      
      {/* --- 纯正移动端视图 (Mobile Only) --- */}
      <div className="md:hidden flex flex-col gap-4">
        {/* Mobile Header */}
        <div className="flex flex-col items-center pt-6 pb-4">
           <h1 className={`text-2xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <Trophy size={24} className="text-blue-400" />
              比赛 <span className="text-cyan-400">大厅</span>
           </h1>
           <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>实战晋级 & 荣誉争夺</p>
        </div>

        {/* 紧凑版倒计时卡片 */}
        <div className="px-4 pb-2">
           <div className={`rounded-2xl p-4 shadow-sm border ${isDark ? 'bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border-blue-500/20' : 'bg-gradient-to-br from-indigo-100 to-blue-50 border-blue-200 shadow-blue-500/10'}`}>
              <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-1.5">
                    <Timer size={12} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>距国赛报名截止</span>
                 </div>
                 <div className={`p-1 rounded-full animate-pulse ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-200 text-blue-600'}`}><Target size={14} /></div>
              </div>
              <div className="flex justify-between items-center px-2">
                 <div className="flex flex-col items-center">
                    <span className={`text-xl font-black font-mono leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>{String(timeLeft.days).padStart(2, '0')}</span>
                 </div>
                 <span className={`text-lg font-black pb-1 ${isDark ? 'text-blue-500/50' : 'text-blue-300'}`}>:</span>
                 <div className="flex flex-col items-center">
                    <span className={`text-xl font-black font-mono leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>{String(timeLeft.hours).padStart(2, '0')}</span>
                 </div>
                 <span className={`text-lg font-black pb-1 ${isDark ? 'text-blue-500/50' : 'text-blue-300'}`}>:</span>
                 <div className="flex flex-col items-center">
                    <span className={`text-xl font-black font-mono leading-none ${isDark ? 'text-white' : 'text-slate-800'}`}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                 </div>
              </div>
              <div className={`text-[9px] font-bold text-center mt-3 pt-2 border-t ${isDark ? 'text-slate-400 border-white/10' : 'text-slate-500 border-slate-300'}`}>
                 提示：省赛排名前 30% 可直通全国现场总决赛
              </div>
           </div>
        </div>

        {/* 移动端列表 */}
        <div className="px-4 flex flex-col gap-4">
           {contests.length === 0 ? (
              <div className={`text-center py-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>暂无比赛</div>
           ) : (
              contests.map(contest => {
                 const isLive = contest.status === 'LIVE';
                 const isUpcoming = contest.status === 'UPCOMING';
                 const isEnded = contest.status === 'ENDED';

                 return (
                    <div key={contest.id} className={`rounded-[20px] p-4 border shadow-sm flex flex-col ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-200 shadow-slate-200/50'}`}>
                       <div className="flex items-start gap-4 mb-3">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                             <Trophy size={24} />
                          </div>
                          <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                                <h3 className={`text-sm font-black leading-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{contest.title}</h3>
                             </div>
                             <div className="flex items-center gap-2 flex-wrap mb-1.5">
                                <StatusBadge status={contest.status} />
                                {contest.isRegistered && !isEnded && (
                                   <span className="text-[8px] font-black uppercase bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded border border-blue-500/20">已报名</span>
                                )}
                             </div>
                             <div className={`flex flex-col gap-1 text-[9px] font-bold tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <div className="flex items-center gap-1.5">
                                   <Calendar size={10} className="text-slate-400" />
                                   {formatDate(contest.startTime)} 开始
                                </div>
                                <div className="flex items-center gap-1.5">
                                   <Users size={10} className="text-slate-400" />
                                   {contest.participantCount} 人已报名
                                </div>
                             </div>
                          </div>
                       </div>
                       
                       <div className={`pt-3 border-t w-full ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                          {isLive ? (
                             contest.isRegistered ? (
                                <button onClick={() => onEnter(contest)} className="w-full py-2.5 bg-green-600 text-white rounded-xl text-xs font-black tracking-widest uppercase flex items-center justify-center gap-1">
                                   进入比赛 <ChevronRight size={14} />
                                </button>
                             ) : (
                                <button onClick={() => handleRegisterClick(contest.id)} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black tracking-widest uppercase">
                                   立即报名
                                </button>
                             )
                          ) : isUpcoming ? (
                             contest.isRegistered ? (
                                <button disabled className={`w-full py-2.5 rounded-xl text-xs font-black tracking-widest uppercase flex items-center justify-center gap-1 border ${isDark ? 'bg-white/5 text-slate-500 border-white/10' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                   <Clock size={14} /> 等待开始
                                </button>
                             ) : (
                                <button onClick={() => handleRegisterClick(contest.id)} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black tracking-widest uppercase">
                                   立即报名
                                </button>
                             )
                          ) : (
                             <button onClick={() => onViewLeaderboard(contest)} className={`w-full py-2.5 rounded-xl text-xs font-black tracking-widest uppercase flex items-center justify-center gap-1 border ${isDark ? 'bg-white/5 text-slate-400 border-white/10' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                                查看榜单
                             </button>
                          )}
                       </div>
                    </div>
                 );
              })
           )}
        </div>
      </div>

      {/* --- 电脑端视图 (Desktop Only) --- */}
      <div className="hidden md:block space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white">比赛大厅</h2>
        <p className="text-slate-400 mt-1">参加比赛，检验你的编程实力</p>
      </div>

      {/* 赛事机制与晋级路径横幅 */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e1b4b] rounded-2xl p-6 md:p-8 shadow-lg text-white relative overflow-hidden border border-white/10">
        {/* 背景光效 */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-500/20 rounded-full blur-[60px]"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 justify-between items-center">
          
          {/* 左侧：晋级机制与说明 */}
          <div className="flex-1 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-bold tracking-widest uppercase border border-white/20 backdrop-blur-sm">
              <Trophy size={14} className="text-yellow-400" />
              <span>赛事晋级机制</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold leading-tight">
              作品小类排名前 30% <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">直通国赛现场总决赛</span>
            </h3>
            <p className="text-blue-100/80 text-sm leading-relaxed max-w-md">
              系统将根据代码规范、运行效率、创意得分进行综合评判。省赛成绩位于各自小类前 30% 的选手将自动获得上推国赛的资格。
            </p>
          </div>

          {/* 中间：路径图 */}
          <div className="flex-1 w-full max-w-md flex flex-col justify-center">
            <div className="relative flex items-center justify-between w-full mb-2">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 rounded-full"></div>
              <div className="absolute top-1/2 left-0 w-[50%] h-1 bg-gradient-to-r from-cyan-400 to-blue-500 -translate-y-1/2 rounded-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
              
              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.5)]">1</div>
                <span className="text-xs font-bold text-blue-100">校赛选拔</span>
              </div>
              
              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(59,130,246,0.5)]">2</div>
                <span className="text-xs font-bold text-white">省级初赛</span>
              </div>
              
              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-700/80 border-2 border-white/20 text-slate-400 flex items-center justify-center font-bold text-sm backdrop-blur-sm">3</div>
                <span className="text-xs font-bold text-slate-500">全国总决赛</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-blue-200/80 bg-white/5 p-2 rounded-lg backdrop-blur-md border border-white/5">
              <Info size={14} className="shrink-0 text-blue-400" />
              当前处于【省级初赛】冲刺阶段，请尽快提交作品。
            </div>
          </div>

          {/* 右侧：倒计时 */}
          <div className="shrink-0 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md text-center min-w-[200px]">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-100 mb-3">
              <Timer size={16} className="text-cyan-400 animate-pulse" />
              距离国赛报名截止
            </div>
            <div className="flex justify-center gap-2 text-2xl font-mono font-black">
              <div className="flex flex-col items-center">
                <span className="bg-black/40 px-2 py-1 rounded shadow-inner min-w-[40px] border border-white/5">{timeLeft.days.toString().padStart(2, '0')}</span>
                <span className="text-[10px] mt-1 text-slate-500 font-sans font-normal uppercase tracking-widest">天</span>
              </div>
              <span className="text-blue-500">:</span>
              <div className="flex flex-col items-center">
                <span className="bg-black/40 px-2 py-1 rounded shadow-inner min-w-[40px] border border-white/5">{timeLeft.hours.toString().padStart(2, '0')}</span>
                <span className="text-[10px] mt-1 text-slate-500 font-sans font-normal uppercase tracking-widest">时</span>
              </div>
              <span className="text-blue-500">:</span>
              <div className="flex flex-col items-center">
                <span className="bg-black/40 px-2 py-1 rounded shadow-inner min-w-[40px] border border-white/5">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <span className="text-[10px] mt-1 text-slate-500 font-sans font-normal uppercase tracking-widest">分</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-600 mt-3 font-bold uppercase tracking-widest">目标: 2026年5月30日</div>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          {contests.length === 0 && (
            <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="tech-card-glass-dark rounded-xl border border-white/10 p-6 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <Skeleton className="w-14 h-14 rounded-xl bg-white/10" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48 bg-white/10" />
                    <Skeleton className="h-4 w-64 bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {contests.map((contest) => {
          const isLive = contest.status === 'LIVE';
          const isUpcoming = contest.status === 'UPCOMING';
          const isEnded = contest.status === 'ENDED';

          return (
            <div key={contest.id} className="tech-card-glass-dark rounded-xl border border-white/10 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:border-white/20 transition-all group">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-inner shrink-0 ${isLive ? 'bg-green-500/20 text-green-400' : isUpcoming ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-500'}`}>
                  <Trophy size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{contest.title}</h3>
                    <StatusBadge status={contest.status} />
                    {contest.isRegistered && !isEnded && (
                      <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">已报名</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1 mb-2 line-clamp-1 leading-relaxed">{contest.description}</p>
                  <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-600" />
                      {formatDate(contest.startTime)} - {formatDate(contest.endTime)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-slate-600" />
                      {contest.participantCount} 人报名
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 w-full md:w-auto flex flex-col gap-2 min-w-[140px]">
                {/* Action Buttons Logic */}
                {isLive ? (
                  contest.isRegistered ? (
                    <Button onClick={() => onEnter(contest)} className="w-full !bg-green-600 !text-white hover:!bg-green-500 border-none shadow-lg shadow-green-600/20 font-black tracking-widest uppercase text-xs">
                      进入比赛 <ChevronRight size={16} />
                    </Button>
                  ) : (
                    <Button onClick={() => handleRegisterClick(contest.id)} className="w-full font-black tracking-widest uppercase text-xs">
                      立即报名
                    </Button>
                  )
                ) : isUpcoming ? (
                  contest.isRegistered ? (
                    <Button disabled className="w-full bg-white/5 text-slate-500 border-white/10 font-black tracking-widest uppercase text-xs">
                      <Clock size={16} /> 等待开始
                    </Button>
                  ) : (
                    <Button onClick={() => handleRegisterClick(contest.id)} className="w-full font-black tracking-widest uppercase text-xs">
                      立即报名
                    </Button>
                  )
                ) : (
                  <Button onClick={() => onViewLeaderboard(contest)} variant="secondary" className="w-full !bg-white/5 !text-slate-400 !border-white/10 hover:!bg-white/10 hover:!text-white font-black tracking-widest uppercase text-xs">
                    查看榜单
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        </div>

        {/* 右侧边栏：AI 亮点功能 */}
        <div className="space-y-6 sticky top-6">
          {/* 亮点1：AI 竞赛教练 */}
          <div className="tech-card-glass-dark rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:scale-150"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Brain size={18} />
                </div>
                <h3 className="font-bold text-white">AI 竞赛教练建议</h3>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            </div>
            <div className="relative z-10 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/5 text-sm text-slate-300 leading-relaxed shadow-inner">
              <p>根据你的错题本薄弱点（<span className="font-semibold text-indigo-400">DP、图论</span>），AI 为你推荐了 <span className="font-bold text-indigo-300">2</span> 场省赛模拟赛，建议本周内完成针对性训练。</p>
            </div>
            <button 
              onClick={() => alert('提示：演示版本，专项训练模块正在加紧开发中！')}
              className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-indigo-950/50 flex items-center justify-center gap-2"
            >
              <Target size={16} /> 立即开启专项训练
            </button>
          </div>

          {/* 亮点2：智能组队助手 */}
          <div className="tech-card-glass-dark rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:scale-150"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
                  <Users size={18} />
                </div>
                <h3 className="font-bold text-white">智能组队助手</h3>
              </div>
            </div>
            <div className="relative z-10 space-y-3">
              <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5 text-sm text-slate-300 leading-relaxed shadow-inner flex items-start gap-3">
                <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md shrink-0 mt-0.5"><Zap size={14} /></div>
                <div>
                  <p className="font-medium text-white mb-1">同校队友推荐 (2-9人组队)</p>
                  <p className="text-xs text-slate-400">基于你的能力画像，已为你匹配到 3 名互补型队友。</p>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5 text-sm text-slate-300 leading-relaxed shadow-inner flex items-start gap-3">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md shrink-0 mt-0.5"><Shield size={14} /></div>
                <div>
                  <p className="font-medium text-white mb-1">队员角色分工建议</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 rounded border border-white/5">你: 算法核心</span>
                    <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 rounded border border-white/5">队友A: 工程实现</span>
                    <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 rounded border border-white/5">队友B: 测试与文档</span>
                  </div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => alert('提示：演示版本，正在为您智能匹配同校队友...')}
              className="mt-4 w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Users size={16} /> 查看推荐队友
            </button>
          </div>

          {/* 亮点3：参赛合规中心 */}
          <div className="tech-card-glass-dark rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:scale-150"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-md">
                  <Shield size={18} />
                </div>
                <h3 className="font-bold text-white">参赛合规中心</h3>
              </div>
            </div>
            <div className="relative z-10 space-y-3">
              <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5 text-sm text-slate-300 leading-relaxed shadow-inner flex items-start gap-3">
                <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-md shrink-0 mt-0.5"><AlertCircle size={14} /></div>
                <div>
                  <p className="font-medium text-white mb-1">实名认证未完成</p>
                  <p className="text-xs text-slate-400">参加比赛前必须完成实名认证，否则成绩无效。</p>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5 text-sm text-slate-300 leading-relaxed shadow-inner flex items-start gap-3">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md shrink-0 mt-0.5"><CheckCircle size={14} /></div>
                <div>
                  <p className="font-medium text-white mb-1">防作弊协议已签署</p>
                  <p className="text-xs text-slate-400">感谢您共同维护公平竞赛环境。</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => alert('提示：演示版本，实名认证请联系教务处管理员。')}
              className="mt-4 w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-all shadow-md shadow-amber-950/50 flex items-center justify-center gap-2"
            >
              <Shield size={16} /> 立即去认证
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="确认报名"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button onClick={confirmRegister}>确认报名</Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
            <AlertCircle size={24} />
          </div>
          <h4 className="text-lg font-bold text-slate-800 mb-2">是否确认报名该比赛？</h4>
          <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg w-full">
            {selectedContest?.title}
          </p>
          <p className="text-xs text-slate-400 mt-4">
            注意：报名后系统将记录您的参赛状态，请准时参加。
          </p>
        </div>
      </Modal>
    </div>
  );
};
