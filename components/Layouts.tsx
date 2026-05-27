
import React, { useState } from 'react';
import {
  Code, LogOut, BarChart2, FileText, Users, Award, Trophy, FolderOpen, ChevronLeft, ChevronRight, X, Menu, GraduationCap
} from 'lucide-react';
import { UserRole } from '../types';

import { getNotifications, markAsRead, markAllAsRead } from '../services/api';
import { Notification } from '../types';
import { useEffect } from 'react';
import { Bell, Check, Sun, Moon } from 'lucide-react';

import { useSocket } from '../context/SocketContext';

export const StudentNavbar = ({ user, activeView, setView, onLogout, showToast, theme, onToggleTheme }: any) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    loadNotifications();

    if (socket) {
      socket.on('new_notification', (data: Notification) => {
        setNotifications(prev => [data, ...prev]);
        showToast(` 新消息: ${data.title}`, 'info');
      });
    }

    const interval = setInterval(loadNotifications, 30000);
    return () => {
      clearInterval(interval);
      if (socket) socket.off('new_notification');
    };
  }, [socket]);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async (id: number) => {
    await markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const navItems = [
    { id: 'dashboard', label: '仪表盘', icon: BarChart2 },
    { id: 'playground', label: '工作区', icon: Code },
    { id: 'algo_visualizer', label: '算法演练', icon: FileText },
    { id: 'contests', label: '集训营', icon: Trophy },
    { id: 'mistakes', label: '错题本', icon: FileText },
    { id: 'knowledge', label: '知识图谱', icon: GraduationCap }
  ];

  const handleNavClick = (id: string) => {
    setView(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-[#020617]/40 backdrop-blur-3xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex justify-between h-20">
          <div className="flex items-center gap-12">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('dashboard')}>
              <div className="p-2 bg-blue-600/20 rounded-xl border border-white/10 shadow-lg shadow-blue-500/5 group-hover:scale-105 transition-transform">
                <GraduationCap size={28} className="text-blue-400" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-white">EduCode <span className="text-blue-400">AI</span></span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`px-6 py-2.5 rounded-2xl text-sm font-black tracking-widest transition-all duration-500 relative group
                    ${activeView === item.id
                      ? 'text-blue-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                >
                  {item.label}
                  {activeView === item.id && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]"></span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-2xl transition-all border border-white/10"
              title={theme === 'light' ? '切换为深色模式' : '切换为浅色模式'}
            >
              {theme === 'light' ? (
                <Moon size={20} />
              ) : (
                <Sun size={20} />
              )}
            </button>

            {/* Action Group */}
            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[20px] border border-white/10">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-white/5 rounded-2xl transition-all relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#020617] animate-pulse"></span>
                  )}
                </button>

                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                    <div className="absolute right-0 mt-4 w-96 tech-card-glass-dark rounded-[32px] shadow-3xl z-50 overflow-hidden animate-fade-in-up border border-white/10">
                      <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <span className="font-black text-xs text-slate-400 uppercase tracking-widest">消息通知</span>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-[10px] font-black text-blue-400 hover:underline uppercase tracking-widest">
                            全部已读
                          </button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-12 text-center">
                            <div className="text-slate-700 mb-2 flex justify-center"><Bell size={40} /></div>
                            <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">暂无新消息</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} onClick={() => handleMarkRead(n.id)} className={`p-6 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${!n.is_read ? 'bg-blue-400/10' : ''}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${n.type === 'judge' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {n.type}
                                </span>
                                <span className="text-[9px] font-black text-slate-500">{new Date(n.created_at).getHours()}:{new Date(n.created_at).getMinutes()}</span>
                              </div>
                              <h4 className="text-sm font-black text-white tracking-tight">{n.title}</h4>
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{n.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile Trigger */}
              <button
                onClick={() => setView('profile')}
                className="flex items-center gap-3 pr-3 pl-1.5 py-1 transition-all rounded-2xl hover:bg-white/5 group"
              >
                <div className="h-8 w-8 tech-button-gradient rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                  {user.name[0]}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[10px] font-black text-slate-500 leading-none uppercase tracking-widest mb-1.5">学生</p>
                  <p className="text-xs font-black text-white leading-none tracking-tight">{user.name}</p>
                </div>
              </button>
            </div>

            <button onClick={onLogout} className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all">
              <LogOut size={20} />
            </button>

            {/* Mobile Menu Icon - Hidden because of MobileBottomNav */}
          </div>
        </div>
      </div>
    </nav>
  );
};

export const TeacherSidebar = ({ activeView, setView, onLogout, isMobileOpen, onCloseMobile, theme, onToggleTheme }: any) => {
  const [collapsed, setCollapsed] = useState(false);

  const items = [
    { id: 'dashboard', label: '教学概览', icon: BarChart2 },
    { id: 'banks', label: '题库管理', icon: FolderOpen },
    { id: 'problems', label: '题目管理', icon: FileText },
    { id: 'contests', label: '比赛管理', icon: Trophy },
    { id: 'students', label: '学生管理', icon: Users },
    { id: 'analytics', label: '数据分析', icon: Award },
  ];

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-md animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 h-screen z-50 md:z-10 bg-[#020617]/80 backdrop-blur-3xl text-slate-400 shadow-3xl transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col border-r border-white/5
        ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${collapsed ? 'md:w-24' : 'md:w-72'}
      `}>
        {/* Sidebar Header */}
        <div className={`p-8 flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-4'} mb-10`}>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('dashboard')}>
            <div className="p-2 bg-blue-600/20 rounded-xl border border-white/10 shadow-lg shadow-blue-500/5 group-hover:scale-110 transition-transform shrink-0">
              <GraduationCap size={28} className="text-blue-400" />
            </div>
            {(!collapsed || isMobileOpen) && (
              <span className="font-black text-2xl tracking-tighter text-white whitespace-nowrap animate-pulse drop-shadow-[0_0_12px_rgba(139,92,246,0.65)] hover:drop-shadow-[0_0_18px_rgba(99,102,241,0.8)] transition-all duration-300">
                EduCode <span className="text-blue-400">AI</span>
              </span>
            )}
          </div>
          {isMobileOpen && (
            <button className="text-slate-500 hover:text-white" onClick={onCloseMobile}>
              <X size={24} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 space-y-3 overflow-y-auto custom-scrollbar">
          {items.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  onCloseMobile && onCloseMobile();
                }}
                className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'gap-4 px-6'} py-4 rounded-2xl transition-all duration-300 group relative
                     ${isActive
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                    : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
                title={collapsed ? item.label : ''}
              >
                <item.icon size={22} className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`} />
                {(!collapsed || isMobileOpen) && (
                  <div className="flex flex-col text-left">
                    <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
                  </div>
                )}

                {isActive && !collapsed && (
                  <div className="absolute right-4 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                )}

                {collapsed && !isMobileOpen && (
                  <div className="absolute left-full ml-6 px-4 py-2 bg-slate-800 text-white text-[10px] font-black tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-white/5">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 flex flex-col gap-3">
          <button
            onClick={onToggleTheme}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white transition-all group relative"
            title={collapsed ? (theme === 'light' ? '切换为深色模式' : '切换为浅色模式') : ''}
          >
            {theme === 'light' ? (
              <Moon size={22} className="group-hover:text-blue-400" />
            ) : (
              <Sun size={22} className="group-hover:text-blue-400" />
            )}
            {(!collapsed || isMobileOpen) && <span className="font-black text-xs uppercase tracking-widest">{theme === 'light' ? '深色模式' : '浅色模式'}</span>}
            {collapsed && !isMobileOpen && (
              <div className="absolute left-full ml-6 px-4 py-2 bg-slate-800 text-white text-[10px] font-black tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-2xl border border-white/5">
                {theme === 'light' ? '切换为深色模式' : '切换为浅色模式'}
              </div>
            )}
          </button>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-full items-center gap-4 px-6 py-4 rounded-2xl hover:bg-white/5 text-slate-500 hover:text-white transition-all group"
          >
            {collapsed ? <ChevronRight size={22} className="text-blue-500" /> : <ChevronLeft size={22} />}
            {!collapsed && <span className="font-black text-xs uppercase tracking-widest">收起菜单</span>}
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all group"
          >
            <LogOut size={22} className="group-hover:text-red-500" />
            {(!collapsed || isMobileOpen) && <span className="font-black text-xs uppercase tracking-widest">退出登录</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
