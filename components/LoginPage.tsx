import React, { useState, useEffect, ChangeEvent } from 'react';
import { GraduationCap, User as UserIcon, Lock, Eye, EyeOff, AlertCircle, Mail, Briefcase, BookOpen, Users } from 'lucide-react';
import { UserRole, User } from '../types';
import { login, register } from '../services/api';

export const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  const [isRegistering, setIsRegistering] = useState(false);

  // Form states
  const [id, setId] = useState(''); // Used as login account, and as student ID / teacher ID in registration
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [major, setMajor] = useState('');
  const [className, setClassName] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setId('');
    setPassword('');
    setEmail('');
    setName('');
    setCollege('');
    setMajor('');
    setClassName('');
    setError('');
  }, [role, isRegistering]);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name || !id) {
       setError('请填写所有必填信息');
       return;
    }
    setLoading(true);
    setError('');
    try {
      await register({
        id,
        email,
        password,
        name,
        role,
        college,
        major,
        className
      });
      // automatically login after register
      const data = await login(email, password);
      // clear any old localStorage stats for the new account
      localStorage.removeItem('educode_student_score');
      localStorage.removeItem('educode_student_coins');
      localStorage.removeItem('educode_student_streak');
      localStorage.removeItem('edu_streak');
      localStorage.removeItem('edu_last_checkin');
      localStorage.removeItem('edu_solved_problems');
      onLogin(data.user);
    } catch (err: any) {
      console.error(err);
      setError('注册失败: ' + (err.response?.data?.message || '未知错误'));
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
      <nav className="relative z-30 w-full px-6 sm:px-16 xl:px-56 py-6 sm:py-8 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white text-2xl sm:text-3xl font-black tracking-tighter cursor-pointer hover:opacity-90 transition-opacity">
          <div className="p-1.5 sm:p-2 bg-blue-600/20 rounded-xl border border-white/10 shadow-lg shadow-blue-500/5">
            <GraduationCap size={28} className="text-blue-400 sm:w-8 sm:h-8" />
          </div>
          <span>EduCode <span className="text-blue-400">AI</span></span>
        </div>
      </nav>

      {/* 主内容区域 */}
      <div className="relative z-10 flex-1 flex flex-col xl:flex-row px-6 sm:px-16 xl:px-56 -mt-4 sm:-mt-12 xl:-mt-16">
        {/* 左侧：品牌展示区 - 向中心聚拢 (移动端隐藏) */}
        <div className="flex-1 hidden xl:flex flex-col justify-center py-10 sm:py-16 xl:py-0 animate-fade-in-left text-center xl:text-left">
          <div className="xl:min-h-[600px] flex flex-col justify-center">
            {/* 主标题 */}
            <h2 className="text-4xl sm:text-6xl xl:text-8xl font-black text-white mb-4 sm:mb-8 xl:mb-10 leading-[1.15] sm:leading-[1.1] tracking-tight drop-shadow-xl">
              智教编程 <br className="hidden sm:block" />
              <span className="inline-block sm:hidden">&nbsp;</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">产教协同</span>
            </h2>
            
            {/* 副标题 */}
            <p className="text-sm sm:text-xl xl:text-2xl text-slate-300 font-medium max-w-xl mx-auto xl:mx-0 leading-relaxed opacity-90 mb-6 sm:mb-8 xl:mb-12">
              AI赋能的沉浸式编程教育平台。连接学术课堂与真实产业，开启你的代码竞赛之旅。
            </p>

            {/* 数据模块 */}
            <div className="flex gap-8 sm:gap-12 xl:gap-20 items-center justify-center xl:justify-start">
              <div className="flex flex-col gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl xl:text-5xl font-black text-white">5000+</span>
                <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em]">活跃学员</span>
              </div>
              <div className="h-8 sm:h-12 w-[1px] bg-white/10"></div>
              <div className="flex flex-col gap-1 sm:gap-2">
                <span className="text-3xl sm:text-4xl xl:text-5xl font-black text-white">200+</span>
                <span className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em]">实战项目</span>
              </div>
            </div>
          </div>
        </div>

      {/* 右侧：登录卡片区域 - 移动端垂直居中，桌面端右侧对齐 */}
        <div className="flex-1 xl:flex-none w-full xl:w-auto xl:min-w-[550px] flex flex-col justify-center xl:justify-start items-center xl:items-end xl:pt-24 pb-12 sm:pb-24 xl:pb-12 overflow-y-auto max-h-screen [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="w-full max-w-[480px] bg-white/5 backdrop-blur-3xl rounded-[32px] sm:rounded-[48px] p-6 sm:p-10 xl:p-14 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.6)] border border-white/10 animate-fade-in-up my-auto xl:my-0">
            {/* 标题 */}
            <div className="mb-6 sm:mb-8 text-center xl:text-left">
              <h3 className="text-2xl sm:text-3xl xl:text-4xl font-black text-white mb-2 tracking-tight">
                {isRegistering ? '立即注册' : '欢迎回来'}
              </h3>
              <p className="text-slate-400 font-bold text-xs sm:text-sm xl:text-base">
                {isRegistering ? '填写信息开启编程之旅' : '使用您的账号探索编程的无限可能'}
              </p>
            </div>

            {/* 错误反馈 */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-100 rounded-[20px] px-4 py-3 sm:px-5 sm:py-4 mb-6 sm:mb-8 flex items-center gap-3 animate-shake backdrop-blur-md">
                <AlertCircle size={20} className="text-red-400 shrink-0 sm:w-[22px] sm:h-[22px]" />
                <span className="font-bold text-xs sm:text-sm">{error}</span>
              </div>
            )}

            {/* 通道切换按钮 */}
            <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-[18px] sm:rounded-2xl mb-6 sm:mb-8 border border-white/10">
              <button
                onClick={() => setRole(UserRole.STUDENT)}
                className={`flex-1 py-2.5 sm:py-3.5 rounded-[14px] sm:rounded-xl font-black text-[11px] sm:text-xs xl:text-sm tracking-widest transition-all duration-300 ${
                  role === UserRole.STUDENT
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-blue-600/20'
                }`}
              >
                学生通道
              </button>
              <button
                onClick={() => setRole(UserRole.TEACHER)}
                className={`flex-1 py-2.5 sm:py-3.5 rounded-[14px] sm:rounded-xl font-black text-[11px] sm:text-xs xl:text-sm tracking-widest transition-all duration-300 ${
                  role === UserRole.TEACHER
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-blue-600/20'
                }`}
              >
                教师通道
              </button>
            </div>

            {/* 登录/注册表单 */}
            <form className="space-y-4 sm:space-y-5 xl:space-y-6" onSubmit={isRegistering ? handleRegister : handleLogin}>
              
              {isRegistering && (
                <>
                  <div className="space-y-2">
                    <label className="block text-slate-500 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] ml-2">
                      注册邮箱 Email *
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors w-[18px] h-[18px]" />
                      <input
                        className="w-full pl-12 pr-5 py-3 sm:py-4 rounded-[20px] bg-white/5 border border-white/10 text-white font-bold text-sm sm:text-base placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                        placeholder="请输入您的邮箱地址"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-slate-500 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] ml-2">
                      真实姓名 Name *
                    </label>
                    <div className="relative group">
                      <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors w-[18px] h-[18px]" />
                      <input
                        className="w-full pl-12 pr-5 py-3 sm:py-4 rounded-[20px] bg-white/5 border border-white/10 text-white font-bold text-sm sm:text-base placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                        placeholder="您的真实姓名"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="block text-slate-500 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] ml-2">
                  {isRegistering ? (role === UserRole.STUDENT ? '学号 Student ID *' : '工号 Teacher ID *') : '账号/邮箱 Account'}
                </label>
                <div className="relative group">
                  <UserIcon className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors sm:w-[20px] sm:h-[20px] w-[18px] h-[18px]" />
                  <input
                    className="w-full pl-12 sm:pl-16 pr-5 sm:pr-6 py-3 sm:py-4 xl:py-5 rounded-[20px] sm:rounded-[26px] bg-white/5 border border-white/10 text-white font-bold text-sm sm:text-base xl:text-lg placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all backdrop-blur-md"
                    placeholder={isRegistering ? (role === UserRole.STUDENT ? '您的学号' : '您的教职工号') : '请输入您的账号或邮箱'}
                    type="text"
                    value={id}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setId(e.target.value)}
                    required
                  />
                </div>
              </div>

              {isRegistering && role === UserRole.STUDENT && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-slate-500 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] ml-2">学院 College</label>
                      <div className="relative group">
                        <input
                          className="w-full px-5 py-3 rounded-[20px] bg-white/5 border border-white/10 text-white font-bold text-sm placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                          placeholder="例如: 计算机学院"
                          value={college}
                          onChange={(e) => setCollege(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-slate-500 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] ml-2">专业 Major</label>
                      <div className="relative group">
                        <input
                          className="w-full px-5 py-3 rounded-[20px] bg-white/5 border border-white/10 text-white font-bold text-sm placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                          placeholder="例如: 软件工程"
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-slate-500 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em] ml-2">班级 Class</label>
                    <div className="relative group">
                      <input
                        className="w-full px-5 py-3 rounded-[20px] bg-white/5 border border-white/10 text-white font-bold text-sm placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                        placeholder="例如: 软工2301"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center px-2 sm:px-3">
                  <label className="block text-slate-500 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em]">
                    密码 Password *
                  </label>
                  {!isRegistering && (
                    <a href="#" className="text-[10px] sm:text-[11px] font-black text-blue-400 hover:text-blue-300 transition-colors" onClick={(e: React.MouseEvent) => e.preventDefault()}>
                      忘记密码？
                    </a>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors sm:w-[20px] sm:h-[20px] w-[18px] h-[18px]" />
                  <input
                    className="w-full pl-12 sm:pl-16 pr-12 sm:pr-16 py-3 sm:py-4 xl:py-5 rounded-[20px] sm:rounded-[26px] bg-white/5 border border-white/10 text-white font-bold text-sm sm:text-base xl:text-lg placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all backdrop-blur-md"
                    placeholder="请输入您的密码"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye size={20} className="sm:w-[22px] sm:h-[22px]" /> : <EyeOff size={20} className="sm:w-[22px] sm:h-[22px]" />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  className="w-full py-4 sm:py-5 xl:py-6 rounded-[20px] sm:rounded-[26px] bg-gradient-to-r from-blue-600 to-blue-400 text-white font-black text-lg sm:text-xl tracking-[0.15em] transition-all hover:scale-[1.01] active:scale-[0.98] shadow-[0_15px_30px_-8px_rgba(37,99,235,0.5)] sm:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_25px_50px_-12px_rgba(37,99,235,0.6)] disabled:opacity-50"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "正在处理..." : (isRegistering ? "立即注册并登录" : "立即登录")}
                </button>
              </div>
            </form>

            {/* 切换登录/注册入口 */}
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-white/5 text-center">
              <p className="text-slate-400 text-xs sm:text-sm font-bold">
                {isRegistering ? '已有账号？' : '还没有账号？'}
                <button
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="ml-2 text-blue-400 hover:text-blue-300 transition-colors tracking-wide focus:outline-none"
                >
                  {isRegistering ? '返回登录' : '立即注册'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
