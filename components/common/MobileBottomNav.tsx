import React from 'react';
import { BarChart2, BookOpen, Trophy, User } from 'lucide-react';

interface MobileBottomNavProps {
  activeView: string;
  setView: (view: string) => void;
  mistakeCount?: number;
  theme?: 'light' | 'dark';
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  setView,
  mistakeCount = 0,
  theme
}) => {
  const isDark = theme !== 'light';
  const navItems = [
    { id: 'dashboard', label: '首页', icon: BarChart2 },
    { id: 'algo_visualizer', label: '题库', icon: BookOpen },
    { id: 'contests', label: '竞赛', icon: Trophy },
    { id: 'profile', label: '我的', icon: User }
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 lg:hidden">
      <div className={`px-4 py-3 rounded-[24px] flex justify-around items-center border shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-lg ${isDark ? 'tech-card-glass-dark border-white/10 bg-slate-950/70' : 'bg-white/90 border-slate-200/50 shadow-slate-200/50'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="flex flex-col items-center justify-center relative py-1 px-3 rounded-2xl transition-all duration-300 active:scale-90"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Active Background Glow */}
              {isActive && (
                <span className="absolute inset-0 bg-blue-500/10 rounded-xl blur-sm transition-all duration-300"></span>
              )}

              {/* Icon with Active Coloring */}
              <div className={`relative transition-all duration-300 ${isActive ? (isDark ? 'text-blue-400 -translate-y-1.5' : 'text-blue-600 -translate-y-1.5') : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
                
                {/* Badge for Mistakes or Notifications */}
                {(item as any).badge && (item as any).badge > 0 ? (
                  <span className={`absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border scale-90 animate-pulse ${isDark ? 'border-slate-950' : 'border-white'}`}>
                    {(item as any).badge}
                  </span>
                ) : null}
              </div>

              {/* Label */}
              <span className={`text-[10px] font-black tracking-widest mt-1 transition-all duration-300 ${isActive ? (isDark ? 'text-blue-400 opacity-100' : 'text-blue-600 opacity-100') : (isDark ? 'text-slate-500 opacity-80' : 'text-slate-400 opacity-80')}`}>
                {item.label}
              </span>

              {/* Glowing active indicator line */}
              {isActive && (
                <span className="absolute bottom-0 w-4 h-0.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
