
import React, { useEffect } from 'react';
import { Difficulty } from '../types';
import { CheckCircle, AlertCircle, Info, X, ChevronLeft, ChevronRight } from 'lucide-react';

export const Button = ({ children, variant = 'primary', className = '', disabled, ...props }: any) => {
  const baseStyle = "px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 select-none";
  const variants: any = {
    primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-95",
    secondary: "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white active:scale-95",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 active:scale-95",
    ghost: "text-slate-500 hover:text-white hover:bg-white/5"
  };

  const disabledStyle = disabled ? "opacity-40 cursor-not-allowed shadow-none active:scale-100" : "";

  return (
    <button type="button" disabled={disabled} className={`${baseStyle} ${variants[variant]} ${disabledStyle} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card = ({ children, className = '', onClick }: any) => (
  <div onClick={onClick} className={`tech-card-glass-dark rounded-2xl border border-white/10 shadow-xl ${onClick ? 'cursor-pointer hover:border-blue-500/40 hover:bg-white/10 transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

export const DifficultyBadge = ({ level }: { level: Difficulty }) => {
  const styles = {
    [Difficulty.EASY]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
    [Difficulty.MEDIUM]: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
    [Difficulty.HARD]: 'bg-rose-500/20 text-rose-400 border-rose-500/20',
  };
  const labels = {
    [Difficulty.EASY]: '简单',
    [Difficulty.MEDIUM]: '中等',
    [Difficulty.HARD]: '困难',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${styles[level]}`}>
      {labels[level]}
    </span>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  if (status === 'LIVE') {
    return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span> 进行中</span>;
  }
  if (status === 'UPCOMING') {
    return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/20">未开始</span>;
  }
  return <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 text-slate-500 border border-white/5">已结束</span>;
};

export const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'info' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles: any = {
    success: 'bg-emerald-500/90 border-emerald-400/30',
    error: 'bg-rose-500/90 border-rose-400/30',
    info: 'bg-blue-600/90 border-blue-400/30'
  };

  return (
    <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl text-white shadow-2xl backdrop-blur-xl border flex items-center gap-4 animate-toast font-black text-xs uppercase tracking-widest ${styles[type]}`}>
      {type === 'success' ? <CheckCircle size={20} /> : type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
      <span>{message}</span>
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, footer }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode, footer?: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden tech-card-glass-dark rounded-[32px] shadow-3xl border border-white/10 transform transition-all scale-100 animate-scale-in">
        {/* Decorative flair */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 opacity-50"></div>

        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/5">
          <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white hover:bg-white/5 transition p-2 rounded-full">
            <X size={20} />
          </button>
        </div>
        <div className="p-8 text-slate-300">
          {children}
        </div>
        {footer && (
          <div className="px-8 py-6 bg-white/5 border-t border-white/5 flex justify-end gap-3 backdrop-blur-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void, totalItems?: number }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="px-6 py-3 border-t border-slate-100 flex justify-between items-center bg-slate-50">
      <span className="text-xs text-slate-500">
        第 {currentPage} / {totalPages} 页 {totalItems !== undefined && `(共 ${totalItems} 条)`}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-600"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition text-slate-600"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export const Skeleton = ({ className = '', style }: { className?: string, style?: any }) => (
  <div className={`animate-pulse bg-slate-200 rounded ${className}`} style={style}></div>
);

export const IconButton = ({ children, onClick, className = '', title, disabled, variant = 'ghost', size = 'md' }: any) => {
  const baseStyle = "flex items-center justify-center rounded-lg transition-colors";
  const sizes: any = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3"
  };
  const variants: any = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
    danger: "text-slate-400 hover:bg-red-50 hover:text-red-600",
    active: "bg-white shadow text-blue-600 font-medium"
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`${baseStyle} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};
