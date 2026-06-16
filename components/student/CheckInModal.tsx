import React, { useMemo } from 'react';
import { X, Flame, Calendar as CalendarIcon, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../UiComponents';

interface CheckInModalProps {
   isOpen: boolean;
   onClose: () => void;
   streak: number;
   isCheckedIn: boolean;
   onCheckIn: () => void;
   theme?: string;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
   isOpen,
   onClose,
   streak,
   isCheckedIn,
   onCheckIn,
   theme = 'light'
}) => {
   const isDark = theme === 'dark';

   // Simple logic to generate a calendar for the current month
   const { daysInMonth, emptyDaysAtStart, currentDay } = useMemo(() => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const currentDay = now.getDate();
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      return {
         daysInMonth: lastDay.getDate(),
         emptyDaysAtStart: firstDay.getDay(), // 0 = Sunday, 1 = Monday
         currentDay
      };
   }, []);

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in bg-slate-900/40 backdrop-blur-sm">
         <div 
            className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-in relative border ${
               isDark 
                  ? 'bg-slate-900 border-white/10 shadow-black/50' 
                  : 'bg-white border-slate-100 shadow-xl'
            }`}
         >
            {/* Header & Background Glow */}
            <div className="relative pt-8 pb-6 px-6 overflow-hidden">
               <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -z-10 ${
                  isCheckedIn ? 'bg-orange-500/20' : 'bg-blue-500/20'
               }`} />
               <button 
                  onClick={onClose}
                  className={`absolute top-4 right-4 p-2 rounded-full transition-colors z-10 ${
                     isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                  }`}
               >
                  <X size={20} />
               </button>

               <div className="flex flex-col items-center text-center">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-xl border relative ${
                     isCheckedIn 
                        ? 'bg-gradient-to-br from-orange-400 to-red-500 border-orange-300 text-white shadow-orange-500/30' 
                        : isDark
                           ? 'bg-slate-800 border-white/10 text-slate-400'
                           : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}>
                     <Flame size={40} className={isCheckedIn ? 'animate-pulse' : ''} />
                     {isCheckedIn && (
                        <div className="absolute -top-2 -right-2 bg-white text-green-500 rounded-full p-0.5 border-2 border-orange-400">
                           <CheckCircle size={14} className="fill-current" />
                        </div>
                     )}
                  </div>
                  
                  <h2 className={`text-2xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                     {isCheckedIn ? '今日已完成打卡' : '等待打卡'}
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                     {isCheckedIn ? '太棒了！继续保持学习的热情！' : '打卡记录每天的学习轨迹。'}
                  </p>
               </div>
            </div>

            {/* Streak Counter */}
            <div className={`mx-6 p-5 rounded-2xl mb-6 flex items-center justify-between border ${
               isCheckedIn
                  ? (isDark ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-200')
                  : (isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100')
            }`}>
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                     isCheckedIn 
                        ? (isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-200 text-orange-600')
                        : (isDark ? 'bg-white/10 text-slate-400' : 'bg-white shadow text-slate-500')
                  }`}>
                     <CalendarIcon size={20} />
                  </div>
                  <div>
                     <div className={`text-xs font-bold uppercase tracking-widest ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                     }`}>连续打卡</div>
                     <div className={`text-2xl font-black font-mono leading-none mt-0.5 ${
                        isCheckedIn 
                           ? (isDark ? 'text-orange-400' : 'text-orange-600')
                           : (isDark ? 'text-white' : 'text-slate-800')
                     }`}>
                        {streak} <span className="text-xs font-bold">天</span>
                     </div>
                  </div>
               </div>
               
               {!isCheckedIn && (
                  <Button 
                     onClick={onCheckIn}
                     className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white shadow-lg shadow-orange-500/30 px-6 py-2.5 rounded-xl font-bold tracking-widest"
                  >
                     立即打卡
                  </Button>
               )}
            </div>

            {/* Calendar Grid */}
            <div className={`px-6 pb-8`}>
               <div className="flex items-center justify-between mb-4">
                  <div className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>本月足迹</div>
                  <div className="flex gap-2">
                     <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-orange-400"></span> 已打卡
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-7 gap-y-2 gap-x-1 mb-2">
                  {['日', '一', '二', '三', '四', '五', '六'].map((day, i) => (
                     <div key={day} className={`text-center text-[10px] font-bold uppercase ${
                        i === 0 || i === 6 ? 'text-slate-400' : (isDark ? 'text-slate-500' : 'text-slate-400')
                     }`}>
                        {day}
                     </div>
                  ))}
               </div>

               <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                  {Array.from({ length: emptyDaysAtStart }).map((_, i) => (
                     <div key={`empty-${i}`} className="h-8" />
                  ))}
                  
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                     const dayNum = i + 1;
                     const isToday = dayNum === currentDay;
                     const isPastCheckedIn = dayNum < currentDay && dayNum >= (currentDay - (isCheckedIn ? streak - 1 : streak));
                     const isCurrentCheckedIn = isToday && isCheckedIn;
                     const isChecked = isPastCheckedIn || isCurrentCheckedIn;
                     
                     // Visualize a broken streak day
                     const isMissed = dayNum < currentDay && !isPastCheckedIn && dayNum >= (currentDay - 7);
                     
                     return (
                        <div key={dayNum} className="flex justify-center relative group">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                              isChecked
                                 ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold shadow-md shadow-orange-500/20 scale-110'
                                 : isToday
                                    ? `border-2 border-dashed ${isDark ? 'border-slate-500 text-slate-300' : 'border-slate-400 text-slate-600'} animate-pulse`
                                    : isMissed
                                       ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                       : isDark
                                          ? 'bg-white/5 text-slate-500'
                                          : 'bg-slate-50 text-slate-400'
                           }`}>
                              {isMissed ? <X size={14} className="opacity-50" /> : dayNum}
                           </div>
                        </div>
                     );
                  })}
               </div>
               
               {/* Repair Card UI */}
               <div className={`mt-6 p-4 rounded-xl flex items-center justify-between ${isDark ? 'bg-indigo-900/20 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                   <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                           <span className="text-xl">🎟️</span>
                       </div>
                       <div>
                           <div className={`text-xs font-bold ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>补签卡</div>
                           <div className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>消耗 50 能量玉币，挽救中断的连胜记录</div>
                       </div>
                   </div>
                   <button onClick={() => alert('暂未开放购买！')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-900/50' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                       兑换
                   </button>
               </div>
            </div>
         </div>
      </div>
   );
};
