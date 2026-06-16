import React, { useState, useRef, useEffect } from 'react';
import { maskName } from '../../utils';
import { BookOpen, User as UserIcon, Users, Key, CheckCircle, Activity, ShieldCheck, Lock, AlertCircle, Trophy, GraduationCap, Building2, Award, Download, Eye, X, ArrowRight, Clock, ChevronRight, Sparkles, Code, Zap, Brain } from 'lucide-react';
import { User, Problem, Contest, CertificateConfig, ContestType } from '../../types';
import { Button, Card, Modal, StatusBadge, Pagination } from '../UiComponents';
import { changePassword } from '../../services/api';
import { KnowledgeProfile } from './KnowledgeProfile';

export const StudentProfile = ({
  user,
  contests,
  mistakeProblems,
  onSelectProblem,
  onEnterContest,
  onRemoveMistake,
  onNavigate,
  theme = 'dark'
}: {
  user: User,
  contests: Contest[],
  mistakeProblems: Problem[],
  onSelectProblem: (p: Problem) => void,
  onEnterContest: (c: Contest) => void,
  onRemoveMistake: (id: string) => void,
  onNavigate: (view: string) => void,
  theme?: string
}) => {
  const isDark = theme !== 'light';
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
  const [passForm, setPassForm] = useState({ old: '', new: '', confirm: '' });
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  // Certificate Pagination
  const [certPage, setCertPage] = useState(1);
  const certsPerPage = 3;

  // Certificate Viewing State
  const [viewCertContest, setViewCertContest] = useState<Contest | null>(null);
  const certCanvasRef = useRef<HTMLCanvasElement>(null);

  // Filter contests registered by current user
  const myContests = contests.filter(c => c.isRegistered);

  // Filter contests where the user has an award
  const myAwards = contests.filter(c => c.results?.some(r => r.userId === user.id && r.awardName));
  const totalCertPages = Math.ceil(myAwards.length / certsPerPage);
  const paginatedAwards = myAwards.slice((certPage - 1) * certsPerPage, certPage * certsPerPage);

  const handlePasswordSubmit = async () => {
    if (!passForm.old || !passForm.new || !passForm.confirm) {
      setPassError('请填写所有字段');
      return;
    }
    if (passForm.new !== passForm.confirm) {
      setPassError('两次输入的新密码不一致');
      return;
    }
    if (passForm.new.length < 6) {
      setPassError('新密码长度不能少于6位');
      return;
    }

    try {
      await changePassword({ oldPassword: passForm.old, newPassword: passForm.new });
      setPassError('');
      setPassSuccess(true);
      setTimeout(() => {
        setPassSuccess(false);
        setPasswordModalOpen(false);
        setPassForm({ old: '', new: '', confirm: '' });
      }, 1500);
    } catch (e: any) {
      setPassError(e.response?.data?.message || '修改密码失败');
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // --- Certificate Rendering Logic (Reused for Viewer) ---
  useEffect(() => {
    if (viewCertContest && certCanvasRef.current && viewCertContest.certificateConfig) {
      const ctx = certCanvasRef.current.getContext('2d');
      const config = viewCertContest.certificateConfig;
      const result = viewCertContest.results?.find(r => r.userId === user.id);

      if (ctx && config) {
        const bg = new Image();
        bg.crossOrigin = "anonymous";
        bg.src = config.bgUrl;

        const drawText = () => {
          config.items.forEach(item => {
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `${item.fontWeight || 'normal'} ${item.fontSize}px ${item.fontFamily === 'serif' ? 'STSong, serif' : 'Arial, sans-serif'}`;
            ctx.fillStyle = item.color;

            let text = "";
            if (item.type === 'static-text') {
              text = item.text || "";
            } else {
              if (item.field === 'contestName') text = viewCertContest.title;
              if (item.field === 'name') text = user.name;
              if (item.field === 'award') text = result?.awardName || "优秀奖";
              if (item.field === 'date') text = new Date().toLocaleDateString();
            }
            ctx.fillText(text, item.x, item.y);
          });

          if (config.sealUrl) {
            const seal = new Image();
            seal.crossOrigin = "anonymous";
            seal.src = config.sealUrl;
            seal.onload = () => {
              ctx.globalAlpha = 0.9;
              ctx.drawImage(seal, 580, 350, 120, 120);
              ctx.globalAlpha = 1.0;
            };
          }
        };

        bg.onload = () => {
          ctx.drawImage(bg, 0, 0, ctx.canvas.width, ctx.canvas.height);
          drawText();
        };

        // Fallback
        bg.onerror = () => {
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, 800, 600);
          ctx.strokeRect(10, 10, 780, 580);
          drawText();
        }
      }
    }
  }, [viewCertContest, user]);

  const downloadCertificate = () => {
    if (!certCanvasRef.current || !viewCertContest) return;
    const link = document.createElement('a');
    link.download = `${viewCertContest.title}_${user.name}_证书.png`;
    link.href = certCanvasRef.current.toDataURL();
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto md:space-y-10 animate-fade-in pb-20 md:pb-10 pt-2 md:pt-0">
      
      {/* --- 纯正移动端视图 (Mobile Only) --- */}
      <div className="md:hidden flex flex-col gap-4">
        {/* Mobile Avatar Header */}
        <div className="flex flex-col items-center pt-4 pb-2">
           <div className={`w-20 h-20 rounded-full tech-button-gradient flex items-center justify-center text-3xl font-black text-white shadow-xl mb-3 border-4 ${isDark ? 'border-slate-950' : 'border-white'}`}>
              {user.name[0]}
           </div>
           <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{maskName(user.name)}</h2>
           <p className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'} uppercase tracking-widest mt-1`}>学号: {user.id}</p>
        </div>
        
        {/* Mobile Stats / Quick Info */}
        <div className="grid grid-cols-3 gap-2 px-4 mb-2">
           <div className={`${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100'} rounded-xl p-2 text-center border shadow-sm`}>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-0.5`}>学院</div>
              <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-700'} line-clamp-1`}>{user.college || '-'}</div>
           </div>
           <div className={`${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100'} rounded-xl p-2 text-center border shadow-sm`}>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-0.5`}>专业</div>
              <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-700'} line-clamp-1`}>{user.major || '-'}</div>
           </div>
           <div className={`${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100'} rounded-xl p-2 text-center border shadow-sm`}>
              <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-0.5`}>班级</div>
              <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-700'} line-clamp-1`}>{user.className || '-'}</div>
           </div>
        </div>

        {/* Mobile Menu List */}
        <div className="px-4 flex flex-col gap-3">
           <div className={`${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden shadow-sm`}>
              <button onClick={() => onNavigate('mistakes')} className={`w-full flex items-center justify-between p-4 bg-transparent ${isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50 border-slate-100'} transition-colors border-b`}>
                 <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500"><BookOpen size={16} /></div>
                    <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>逻辑档案 (错题本)</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">{mistakeProblems.length}</span>
                    <ChevronRight size={14} className={isDark ? "text-slate-500" : "text-slate-400"} />
                 </div>
              </button>
              
              <button onClick={() => setPasswordModalOpen(true)} className={`w-full flex items-center justify-between p-4 bg-transparent ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'} transition-colors`}>
                 <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500"><ShieldCheck size={16} /></div>
                    <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>账号安全 & 密码</span>
                 </div>
                 <ChevronRight size={14} className={isDark ? "text-slate-500" : "text-slate-400"} />
              </button>
           </div>
           
           <div className={`${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden shadow-sm`}>
              <div className={`p-3 text-[10px] font-black uppercase tracking-widest border-b ${isDark ? 'bg-slate-950/50 text-slate-500 border-white/5' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>我的比赛</div>
              {myContests.length === 0 ? (
                 <div className="p-4 text-center text-[10px] text-slate-400">暂无报名的比赛</div>
              ) : (
                 myContests.map(c => (
                    <button key={c.id} onClick={() => onEnterContest(c)} className={`w-full flex items-center justify-between p-4 bg-transparent transition-colors border-b last:border-b-0 ${isDark ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50 border-slate-100'}`}>
                       <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0"><Trophy size={16} /></div>
                          <span className={`text-sm font-bold truncate text-left ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{c.title}</span>
                       </div>
                       <ChevronRight size={14} className={`shrink-0 ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </button>
                 ))
              )}
           </div>

           <div className={`${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-white border-slate-100'} rounded-2xl border overflow-hidden shadow-sm mb-4`}>
              <div className={`p-3 text-[10px] font-black uppercase tracking-widest border-b ${isDark ? 'bg-slate-950/50 text-slate-500 border-white/5' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>荣誉证明</div>
              <div className="p-4 flex flex-col items-center">
                 <div className="text-2xl font-black text-yellow-500 mb-1">{myAwards.length}</div>
                 <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>已获得证书数量</div>
                 {myAwards.length > 0 && (
                    <span className={`text-[10px] mt-3 block w-full text-center py-2 rounded-lg ${isDark ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50'}`}>请在电脑端查看或下载高清证书</span>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* --- 电脑端视图 (Desktop Only) --- */}
      <div className="hidden md:block space-y-10">
      {/* User Info Card - Deep Tech Corporate Style */}
      <div className="relative overflow-hidden rounded-[32px] tech-card-glass-dark border border-white/10 shadow-2xl shadow-black/30 p-10 group">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-bl-full opacity-50 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="relative group/avatar">
            <div className="h-32 w-32 tech-button-gradient rounded-[24px] flex items-center justify-center text-4xl text-white font-black shadow-2xl shadow-blue-600/30 transform group-hover/avatar:rotate-6 transition-transform duration-500">
              {user.name[0]}
            </div>
            {/* Status indicator */}
            <div className="absolute -bottom-2 -right-2 bg-[#020617] p-1.5 rounded-full shadow-lg border border-white/10">
              <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#020617] animate-pulse"></div>
            </div>
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h2 className="text-4xl font-black text-white tracking-tight mb-1">{maskName(user.name)}</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">学生档案 / Student Profile</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors group/item">
                <div className="p-2 bg-white/5 rounded-lg shadow-sm text-slate-500 group-hover/item:text-blue-400 transition-colors">
                  <UserIcon size={16} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">学号 Identifier</span>
                  <span className="font-mono font-bold text-white text-base">{user.id}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors group/item">
                <div className="p-2 bg-white/5 rounded-lg shadow-sm text-slate-500 group-hover/item:text-blue-400 transition-colors">
                  <Building2 size={16} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">学院 College</span>
                  <span className="font-bold text-white">{user.college || '未登记'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors group/item">
                <div className="p-2 bg-white/5 rounded-lg shadow-sm text-slate-500 group-hover/item:text-blue-400 transition-colors">
                  <GraduationCap size={16} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">专业 Major</span>
                  <span className="font-bold text-white">{user.major || '未登记'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-colors group/item">
                <div className="p-2 bg-white/5 rounded-lg shadow-sm text-slate-500 group-hover/item:text-blue-400 transition-colors">
                  <Users size={16} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">班级</span>
                  <span className="font-bold text-white">{user.className || '未登记'}</span>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setPasswordModalOpen(true)}
            variant="secondary"
            className="shrink-0 px-6 py-3 h-auto rounded-xl text-xs font-black tracking-widest uppercase gap-2"
          >
            <Key size={16} /> 修改密码
          </Button>
        </div>
      </div>

      {/* KNOWLEDGE GRAPH SECTION */}
      <KnowledgeProfile />

      {/* Certificates Section (Always Visible) */}
      {/* Certificates Section - Deep Tech Style */}
      <div className="tech-card-glass-dark rounded-[32px] border border-white/10 shadow-xl shadow-black/30 overflow-hidden flex flex-col group hover:border-blue-500/30 transition-colors duration-500">
        <div className="px-10 py-8 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500">
              <Award size={22} />
            </div>
            <div>
              <h3 className="font-black text-xl text-white tracking-tight">荣誉证书</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">个人荣誉证明</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white/10 px-3 py-1 rounded-lg border border-white/10">共 {myAwards.length} 张</span>
        </div>

        {myAwards.length === 0 ? (
          <div className="p-16 text-center text-slate-700 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
              <Trophy size={40} className="text-slate-800" />
            </div>
            <p className="text-lg font-bold text-slate-600 uppercase tracking-widest">暂无荣誉证书</p>
            <p className="text-sm text-slate-500 mt-4 max-w-xs leading-relaxed">积极参加比赛，争取获得奖项！保持卓越，更多奖项等你来拿。</p>
          </div>
        ) : (
          <>
            <div className="p-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {paginatedAwards.map(c => {
                const result = c.results?.find(r => r.userId === user.id);
                return (
                  <div key={c.id} className="relative group/cert bg-white rounded-2xl border border-slate-100 p-1 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="absolute inset-x-0 h-1 top-0 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 rounded-t-2xl opacity-0 group-hover/cert:opacity-100 transition-opacity"></div>
                    <div className="p-6 flex flex-col h-full bg-slate-50/50 rounded-xl group-hover/cert:bg-white transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <Trophy size={28} className="text-yellow-500 drop-shadow-sm" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(c.endTime).getFullYear()}</span>
                      </div>

                      <h4 className="text-sm font-black text-slate-800 mb-1 line-clamp-2 leading-tight min-h-[2.5em]">{c.title}</h4>
                      <div className="text-xs font-medium text-slate-400 mb-6">{new Date(c.endTime).toLocaleDateString()}</div>

                      <div className="mt-auto">
                        <div className="text-center py-3 bg-yellow-50/50 rounded-lg border border-yellow-100/50 mb-4">
                          <span className="font-black text-lg text-yellow-600 tracking-tight">{result?.awardName}</span>
                        </div>
                        <Button onClick={() => setViewCertContest(c)} className="w-full h-10 bg-slate-900 text-white hover:bg-blue-600 rounded-xl text-xs font-black tracking-widest uppercase transition-colors shadow-lg shadow-slate-200">
                          查看证书
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-10 pb-8">
              <Pagination
                currentPage={certPage}
                totalPages={totalCertPages}
                onPageChange={setCertPage}
              />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats Column */}
        <div className="space-y-8">
          {/* Mistake Book Summary Card */}
          <div
            onClick={() => onNavigate('mistakes')}
            className="group cursor-pointer relative overflow-hidden rounded-[24px] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 p-6 hover:border-red-200 transition-all duration-300"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <BookOpen size={100} className="text-red-500" />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-red-50 rounded-xl text-red-500">
                  <BookOpen size={24} />
                </div>
                <div className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-red-200">
                  {mistakeProblems.length} <span className="text-[10px] opacity-80 uppercase tracking-widest ml-1">个问题</span>
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-800 mb-2">逻辑档案 (错题本)</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">系统回顾算法薄弱点，优化核心编程逻辑。</p>

              <div className="flex items-center gap-2 text-red-500 text-xs font-black tracking-widest uppercase group/link">
                <span>开始复习</span>
                <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Growth Empowerment Metrics */}
          <div className="rounded-[24px] bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 shadow-xl shadow-slate-200/50 p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-indigo-500 rounded-lg text-white shadow-lg shadow-indigo-500/30">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">成长足迹赋能</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Growth Dashboard</p>
              </div>
            </div>

            <div className="space-y-3 relative z-10">
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-white/50 hover:bg-white transition-colors">
                <div className="flex items-center gap-2">
                  <Code size={14} className="text-blue-500" />
                  <span className="text-xs font-bold text-slate-600">探索的代码行数</span>
                </div>
                <span className="text-sm font-black font-mono text-slate-800">12,450 <span className="text-[10px] text-slate-400">行</span></span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-white/50 hover:bg-white transition-colors">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span className="text-xs font-bold text-slate-600">战胜的 Bug 数量</span>
                </div>
                <span className="text-sm font-black font-mono text-slate-800">342 <span className="text-[10px] text-slate-400">个</span></span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-white/50 hover:bg-white transition-colors">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-yellow-500" />
                  <span className="text-xs font-bold text-slate-600">灵感迸发次数</span>
                </div>
                <span className="text-sm font-black font-mono text-slate-800">89 <span className="text-[10px] text-slate-400">次</span></span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/60 rounded-xl border border-white/50 hover:bg-white transition-colors">
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-purple-500" />
                  <span className="text-xs font-bold text-slate-600">逻辑推理段位</span>
                </div>
                <span className="text-xs font-black text-purple-600 bg-purple-100 px-2 py-1 rounded-md">黄金架构师</span>
              </div>
            </div>
            
            {/* Encouraging message instead of harsh stats */}
            <div className="mt-6 pt-4 border-t border-indigo-100/50">
               <p className="text-xs text-indigo-800/70 font-bold leading-relaxed text-center">
                 "每一次 Debug 都是你通往算法大师的坚实脚印。继续保持好奇心！"
               </p>
            </div>
          </div>
        </div>

        {/* Main Content Column: Contests + Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          {/* My Registered Contests (Restored) */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <Trophy size={20} />
                </div>
                <h3 className="font-black text-lg text-slate-800 tracking-tight">已报名的比赛</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full uppercase tracking-widest">共 {myContests.length} 场</span>
            </div>
            {myContests.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <Trophy size={32} />
                </div>
                <p className="text-slate-500 font-bold mb-1">暂无已报名的比赛</p>
                <p className="text-xs text-slate-400 uppercase tracking-widest">前往比赛大厅报名参加。</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {myContests.map(c => (
                  <div key={c.id} className="p-6 hover:bg-slate-50/80 transition flex flex-col sm:flex-row items-center justify-between gap-6 group">
                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-3">
                        <h4 className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{c.title}</h4>
                        {c.type === ContestType.PROJECT && <span className="text-[9px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full uppercase tracking-wider">项目赛</span>}
                      </div>
                      <div className="flex items-center justify-center sm:justify-start gap-4 text-xs font-bold text-slate-400">
                        <StatusBadge status={c.status} />
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {formatTime(c.startTime)}</span>
                        <span className="text-slate-300">|</span>
                        <span>结束: {formatTime(c.endTime)}</span>
                      </div>
                    </div>

                    {c.status === 'LIVE' ? (
                      <Button onClick={() => onEnterContest(c)} className="h-10 px-6 bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200 rounded-xl text-xs font-black tracking-widest uppercase">
                        进入赛场
                      </Button>
                    ) : c.status === 'ENDED' ? (
                      <Button onClick={() => onEnterContest(c)} variant="secondary" className="h-10 px-6 rounded-xl text-xs font-black tracking-widest uppercase bg-slate-100 hover:bg-slate-200 text-slate-600">
                        查看回顾
                      </Button>
                    ) : (
                      <div className="h-10 px-6 rounded-xl bg-slate-50 border border-slate-100 flex items-center text-xs font-black text-slate-400 uppercase tracking-widest">
                        等待开始
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                <Activity size={20} />
              </div>
              <h3 className="font-black text-lg text-slate-800 tracking-tight">最近活动</h3>
            </div>
            <div className="space-y-4">
              {[
                { text: '通过了 "两数之和"', time: '2小时前', type: 'ac', id: 1 },
                { text: '尝试了 "最长回文子串"', time: '昨天', type: 'wa', id: 2 },
                { text: '报名了 "传智杯校内选拔赛"', time: '3天前', type: 'info', id: 3 }
              ].map((act) => (
                <div key={act.id} className="flex gap-4 p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 hover:border-slate-100 transition-colors group">
                  <div className={`mt-1.5 h-3 w-3 rounded-full shrink-0 shadow-sm ${act.type === 'ac' ? 'bg-green-500 shadow-green-200' : act.type === 'wa' ? 'bg-red-500 shadow-red-200' : 'bg-blue-500 shadow-blue-200'}`} />
                  <div>
                    <p className="text-slate-700 font-bold text-sm mb-1 group-hover:text-slate-900">{act.text}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Certificate Viewer Modal */}
      {viewCertContest && (
        <div className="fixed inset-0 z-[70] bg-slate-900/80 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Award className="text-yellow-500" /> {viewCertContest.title}
              </h3>
              <button onClick={() => setViewCertContest(null)} className="p-1 hover:bg-slate-100 rounded-full">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-8 bg-slate-100 flex items-center justify-center flex-1 overflow-auto">
              <canvas
                ref={certCanvasRef}
                width={800}
                height={600}
                className="bg-white shadow-xl rounded max-w-full h-auto object-contain"
              />
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <Button variant="secondary" onClick={() => setViewCertContest(null)}>关闭</Button>
              <Button onClick={downloadCertificate} className="bg-blue-600 hover:bg-blue-700">
                <Download size={16} /> 下载证书 (PNG)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="修改密码"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPasswordModalOpen(false)}>取消</Button>
            <Button onClick={handlePasswordSubmit} disabled={passSuccess}>
              {passSuccess ? '修改成功' : '确认修改'}
            </Button>
          </>
        }
      >
        {passSuccess ? (
          <div className="py-8 flex flex-col items-center text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} />
            </div>
            <h4 className="text-xl font-bold text-slate-800">密码修改成功</h4>
            <p className="text-slate-500 mt-2">下次登录请使用新密码</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">旧密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="password"
                  value={passForm.old}
                  onChange={(e) => setPassForm({ ...passForm, old: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="请输入当前密码"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">新密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="password"
                  value={passForm.new}
                  onChange={(e) => setPassForm({ ...passForm, new: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="不少于6位"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">确认新密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="password"
                  value={passForm.confirm}
                  onChange={(e) => setPassForm({ ...passForm, confirm: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="再次输入新密码"
                />
              </div>
            </div>

            {passError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} /> {passError}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};


