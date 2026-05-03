import React, { useState, useEffect, ChangeEvent } from 'react';
import { GraduationCap, User as UserIcon, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { UserRole, User } from '../types';
import { login } from '../services/api';

export const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setId('');
    setPassword('');
  }, [role]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await login(id, password);
      onLogin(data.user);
    } catch (err: any) {
      console.error(err);
      setError('登录失败: ' + (err.response?.data?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden font-sans bg-[#020617] flex flex-col">
      {/* 背景图片与特效区域 */}
      <div className="absolute inset-0 z-0">
        <img
          alt="智慧教学场景"
          className="w-full h-full object-cover brightness-[0.6] contrast-[1.2]"
          src="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#020617] via-[#0f172a]/80 to-[#1e1b4b]/90"></div>
        <div className="absolute inset-0 animate-grid-pulse" 
          style={{ 
            backgroundImage: `linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}>
        </div>
      </div>

      {/* 通用透明导航栏 */}
      <nav className="relative z-30 w-full px-8 sm:px-16 xl:px-56 py-8 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white text-3xl font-black tracking-tighter cursor-pointer hover:opacity-90 transition-opacity">
          <div className="p-2 bg-blue-600/20 rounded-xl border border-white/10 shadow-lg shadow-blue-500/5">
            <GraduationCap size={32} className="text-blue-400" />
          </div>
          <span>EduCode <span className="text-blue-400">AI</span></span>
        </div>
      </nav>

      {/* 主内容区域 */}
      <div className="relative z-10 flex-1 flex flex-col xl:flex-row px-8 sm:px-16 xl:px-56 -mt-8 sm:-mt-12 xl:-mt-16">
        {/* 左侧：品牌展示区 - 向中心聚拢 */}
        <div className="flex-1 flex flex-col justify-center py-16 xl:py-0 animate-fade-in-left text-center xl:text-left">
          <div className="xl:min-h-[600px] flex flex-col justify-center">
            {/* 主标题 */}
            <h2 className="text-5xl sm:text-6xl xl:text-8xl font-black text-white mb-8 xl:mb-10 leading-[1.1] tracking-tight">
              智教编程 <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">产教协同</span>
            </h2>
            
            {/* 副标题 - 缩小间距，让统计数据上抬 */}
            <p className="text-xl sm:text-2xl text-slate-300 font-medium max-w-xl mx-auto xl:mx-0 leading-relaxed opacity-80 mb-8 xl:mb-12">
              AI赋能的沉浸式编程教育平台。连接学术课堂与真实产业，开启你的代码竞赛之旅。
            </p>

            {/* 数据模块 - 紧跟副标题 */}
            <div className="flex gap-12 sm:gap-20 items-center justify-center xl:justify-start">
              <div className="flex flex-col gap-2">
                <span className="text-4xl sm:text-5xl font-black text-white">5000+</span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-[0.25em]">活跃学员</span>
              </div>
              <div className="h-12 w-[1px] bg-white/10"></div>
              <div className="flex flex-col gap-2">
                <span className="text-4xl sm:text-5xl font-black text-white">200+</span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-[0.25em]">实战项目</span>
              </div>
            </div>
          </div>
        </div>

      {/* 右侧：登录卡片区域 - 严格右对齐且增加右边留白 */}
        <div className="w-full xl:w-auto xl:min-w-[550px] flex justify-center xl:justify-end pt-8 xl:pt-24 pb-24 xl:pb-12">
          <div className="w-full max-w-[480px] bg-white/5 backdrop-blur-3xl rounded-[48px] p-10 sm:p-12 xl:p-14 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.6)] border border-white/10 animate-fade-in-up self-start">
            {/* 标题 */}
            <div className="mb-10 text-center xl:text-left">
              <h3 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">欢迎回来</h3>
              <p className="text-slate-400 font-bold text-sm sm:text-base">使用您的账号探索编程的无限可能</p>
            </div>

            {/* 错误反馈 */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-100 rounded-2xl px-5 py-4 mb-8 flex items-center gap-3 animate-shake backdrop-blur-md">
                <AlertCircle size={22} className="text-red-400 shrink-0" />
                <span className="font-bold text-sm">{error}</span>
              </div>
            )}

            {/* 通道切换按钮 */}
            <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl mb-10 border border-white/10">
              <button
                onClick={() => setRole(UserRole.STUDENT)}
                className={`flex-1 py-3.5 rounded-xl font-black text-xs sm:text-sm tracking-widest transition-all duration-300 ${
                  role === UserRole.STUDENT
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-blue-600/20'
                }`}
              >
                学生通道
              </button>
              <button
                onClick={() => setRole(UserRole.TEACHER)}
                className={`flex-1 py-3.5 rounded-xl font-black text-xs sm:text-sm tracking-widest transition-all duration-300 ${
                  role === UserRole.TEACHER
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-blue-600/20'
                }`}
              >
                教师通道
              </button>
            </div>

            {/* 登录表单 */}
            <form className="space-y-7 sm:space-y-8" onSubmit={handleLogin}>
              <div className="space-y-3">
                <label className="block text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] ml-2">
                  账号 Identity
                </label>
                <div className="relative group">
                  <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                  <input
                    className="w-full pl-16 pr-6 py-5 rounded-[26px] bg-white/5 border border-white/10 text-white font-bold text-lg placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all backdrop-blur-md"
                    id="username"
                    placeholder="请输入您的账号"
                    type="text"
                    value={id}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setId(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-3">
                  <label className="block text-slate-500 text-[11px] font-black uppercase tracking-[0.3em]">
                    密码 Password
                  </label>
                  <a href="#" className="text-[11px] font-black text-blue-400 hover:text-blue-300 transition-colors" onClick={(e: React.MouseEvent) => e.preventDefault()}>
                    忘记密码？
                  </a>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                  <input
                    className="w-full pl-16 pr-16 py-5 rounded-[26px] bg-white/5 border border-white/10 text-white font-bold text-lg placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all backdrop-blur-md"
                    id="password"
                    placeholder="请输入您的密码"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye size={22} /> : <EyeOff size={22} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  className="w-full py-6 rounded-[26px] bg-gradient-to-r from-blue-600 to-blue-400 text-white font-black text-xl tracking-[0.15em] transition-all hover:scale-[1.01] active:scale-[0.98] shadow-[0_20px_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.6)] disabled:opacity-50"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "正在处理..." : "立即登录"}
                </button>
              </div>
            </form>

            {/* 极简注册入口 */}
            <div className="mt-10 pt-8 border-t border-white/5 text-center">
              <p className="text-slate-400 text-sm font-bold">
                还没有账号？ 
                <a href="#" className="ml-2 text-blue-400 hover:text-blue-300 transition-colors tracking-wide">
                  立即注册
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
