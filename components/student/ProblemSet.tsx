import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft, 
  CheckCircle, 
  Layers, 
  Search as SearchIcon,
  Sparkles,
  Zap,
  Trophy,
  HelpCircle
} from 'lucide-react';
import { Problem, ProblemBank, Difficulty } from '../../types';
import { Button, Card, DifficultyBadge, Skeleton, IconButton } from '../UiComponents';
import { getProblems, getBanks } from '../../services/api';

export const ProblemSet = ({ 
  problems: propProblems, 
  onSelectProblem,
  banks: propBanks,
  theme = 'dark'
}: { 
  problems: Problem[], 
  onSelectProblem: (p: Problem) => void,
  banks?: ProblemBank[],
  theme?: 'light' | 'dark'
}) => {
  const isDark = theme !== 'light';
  // --- UI/Game States ---
  const [activeIndex, setActiveIndex] = useState(0); // Dynamically selected bank index
  const [score, setScore] = useState(() => Number(localStorage.getItem('educode_student_score')) || 245);
  const [coins, setCoins] = useState(() => Number(localStorage.getItem('educode_student_coins')) || 350);
  const [streakDays, setStreakDays] = useState(() => Number(localStorage.getItem('educode_student_streak')) || 12);
  
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [difficultyFilter, setDifficultyFilter] = useState('全部');
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchedProblems, setFetchedProblems] = useState<Problem[]>(propProblems);
  const [fetchedBanks, setFetchedBanks] = useState<ProblemBank[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom floating notifications state
  const [showPopup, setShowPopup] = useState(false);
  const [popupMsg, setPopupMsg] = useState('');
  
  const triggerPopup = (msg: string) => {
    setPopupMsg(msg);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const ANGLE = 40; // Orbit angle spacing in degrees to completely prevent card overlap
  const R = 230; // Radius of orbit track

  // --- Load Banks dynamically on Mount / Sync with Prop ---
  useEffect(() => {
    if (propBanks && propBanks.length > 0) {
      setFetchedBanks(propBanks);
    } else {
      const loadBanks = async () => {
        try {
          const banksData = await getBanks();
          if (Array.isArray(banksData)) {
            setFetchedBanks(banksData);
          }
        } catch (e) {
          console.error("Failed to load banks", e);
        }
      };
      loadBanks();
    }
  }, [propBanks]);

  // --- Generate Dial Nodes dynamically from actual database ProblemBanks ---
  const dialNodes = useMemo(() => {
    const neonColors = ['#f89820', '#3776ab', '#a8b9cc', '#00add8', '#00599c', '#a855f7', '#ec4899', '#10b981'];
    
    return fetchedBanks.map((bank, i) => {
      const titleLower = bank.title.toLowerCase();
      let eng = 'Quantum Codebank';
      if (titleLower.includes('java')) eng = 'Java Platform';
      else if (titleLower.includes('python')) eng = 'Python Core';
      else if (titleLower.includes('c语言') || titleLower.includes('c 语言') || (titleLower.includes('c') && !titleLower.includes('css') && !titleLower.includes('c++') && !titleLower.includes('cpp'))) eng = 'C Standard';
      else if (titleLower.includes('c++') || titleLower.includes('cpp')) eng = 'C++ Modern';
      else if (titleLower.includes('go')) eng = 'Go Language';
      else if (titleLower.includes('sql') || titleLower.includes('数据库')) eng = 'SQL Database';
      else if (titleLower.includes('蓝桥杯')) eng = 'Lanqiao Cup';
      else if (titleLower.includes('传智杯')) eng = 'Chuanzhi Cup';
      
      return {
        id: bank.id,
        label: bank.title,
        eng: eng,
        color: neonColors[i % neonColors.length]
      };
    });
  }, [fetchedBanks]);

  const dialNodesLength = dialNodes.length;

  // --- Sync selectedBank dynamically from dial activeIndex ---
  useEffect(() => {
    if (fetchedBanks.length > 0) {
      const safeIndex = Math.min(activeIndex, fetchedBanks.length - 1);
      if (safeIndex !== activeIndex) {
        setActiveIndex(safeIndex);
      }
      setSelectedBank(fetchedBanks[safeIndex]);
    }
  }, [activeIndex, fetchedBanks]);

  // --- Query database dynamically for problems when selected bank/filters change ---
  useEffect(() => {
    const loadProblems = async () => {
      setLoading(true);
      try {
        const problemsData = await getProblems({
          bankId: selectedBank?.id === 'uncategorized' ? undefined : selectedBank?.id,
          difficulty: difficultyFilter === '全部' ? undefined : difficultyFilter,
          search: searchTerm || undefined
        });
        if (Array.isArray(problemsData)) {
          setFetchedProblems(problemsData);
        }
      } catch (e) {
        console.error("Failed to fetch problems", e);
      } finally {
        setLoading(false);
      }
    };
    loadProblems();
  }, [selectedBank, difficultyFilter, searchTerm]);

  // --- Adaptive 御笔 Rank Progression Logic ---
  const getRankName = (scoreVal: number) => {
    if (scoreVal <= 100) return '新手译手';
    if (scoreVal <= 300) return '初阶码农';
    if (scoreVal <= 600) return '极客极境';
    return '算法圣手';
  };

  const getRankBounds = (scoreVal: number) => {
    if (scoreVal <= 100) return { min: 0, max: 100, label: '新手译手' };
    if (scoreVal <= 300) return { min: 101, max: 300, label: '初阶码农' };
    if (scoreVal <= 600) return { min: 301, max: 600, label: '极客极境' };
    return { min: 601, max: 1200, label: '算法圣手' };
  };

  const currentRank = getRankName(score);
  const bounds = getRankBounds(score);
  const progressPercent = Math.min(100, Math.max(0, ((score - bounds.min) / (bounds.max - bounds.min)) * 100));

  // --- Persist state dynamically in LocalStorage ---
  useEffect(() => {
    localStorage.setItem('educode_student_score', String(score));
    localStorage.setItem('educode_student_coins', String(coins));
    localStorage.setItem('educode_student_streak', String(streakDays));
  }, [score, coins, streakDays]);

  // --- Gesture Controls for Dial Tracker ---
  const [lastScrollTime, setLastScrollTime] = useState(0);
  const handleWheel = (e: React.WheelEvent) => {
    if (dialNodesLength === 0) return;
    const now = Date.now();
    if (now - lastScrollTime < 180) return; // Throttling wheel events
    setLastScrollTime(now);
    
    if (e.deltaY > 0) {
      setActiveIndex(prev => (prev + 1) % dialNodesLength);
    } else {
      setActiveIndex(prev => (prev - 1 + dialNodesLength) % dialNodesLength);
    }
  };

  const handleCardClick = (index: number) => {
    setActiveIndex(index);
  };

  const handleSelectProblemClick = (problem: Problem) => {
    const scoreAdd = 15;
    const coinsAdd = 25;
    setScore(prev => prev + scoreAdd);
    setCoins(prev => prev + coinsAdd);
    
    if (Math.random() > 0.8) {
      setStreakDays(prev => prev + 1);
    }
    
    triggerPopup(`🌟 修行为 +${scoreAdd} | 💎 能量玉币 +${coinsAdd}! 《${problem.title}》修行开启！`);
    
    setTimeout(() => {
      onSelectProblem(problem);
    }, 1000);
  };

  return (
    <div 
      className={`w-full min-h-screen transition-all duration-300 relative overflow-hidden font-sans pb-16 pt-4 ${isDark ? 'bg-slate-950 text-white' : 'bg-transparent text-slate-800'}`}
      style={{
        backgroundImage: isDark
          ? 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 1px, transparent 1px)'
          : 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Floating Sparkle Rewards Notification */}
      {showPopup && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[100] px-6 py-3.5 border rounded-full shadow-2xl flex items-center gap-3 animate-bounce font-black text-xs uppercase tracking-widest backdrop-blur-md transition-all duration-300 ${
          isDark 
            ? 'bg-slate-900/90 border-amber-400/40 text-white shadow-[0_0_20px_rgba(245,158,11,0.35)]' 
            : 'bg-white/95 border-amber-500/40 text-slate-800 shadow-[0_4px_20px_rgba(245,158,11,0.2)]'
        }`}>
          <Sparkles className="text-amber-400 animate-pulse" size={16} />
          <span>{popupMsg}</span>
        </div>
      )}

      {/* Background Soft Glow */}
      <div className={`absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all duration-300 ${isDark ? 'bg-cyan-500/5' : 'bg-cyan-500/[0.02]'}`} />
      <div className={`absolute bottom-1/4 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all duration-300 ${isDark ? 'bg-purple-500/5' : 'bg-purple-500/[0.02]'}`} />

      <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-6">
        
        {/* ================= HEADER ROW: TITLE & HUD ================= */}
        <div className={`flex flex-col md:flex-row justify-between items-center gap-6 pb-4 border-b transition-all duration-300 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
          <div>
            <h1 className={`text-2xl font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">深空轨星盘</span>
              <span className="text-slate-400 text-lg font-light">|</span>
              <span className="text-amber-500 text-lg font-bold">金玉修行阁</span>
            </h1>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs mt-1`}>拨动星轨切换题库，研磨核心算法以叩开仙关大道。</p>
          </div>

          {/* Gold Jade Ruby HUD Capsule */}
          <div className={`flex flex-wrap md:flex-nowrap items-center gap-5 px-6 py-2 border border-amber-500/30 backdrop-blur-md rounded-full select-none transition-all duration-300 ${
            isDark 
              ? 'bg-slate-900/80 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
              : 'bg-white/85 shadow-[0_4px_20px_rgba(245,158,11,0.08)] text-slate-850'
          }`}>
            {/* Energy Coins (Ruby) */}
            <div className="flex items-center gap-2 group cursor-help" title="修行所获能量玉币，可兑换秘宝">
              <Sparkles size={16} className="text-rose-500 group-hover:animate-bounce transition-transform duration-300" />
              <span className="text-slate-550 text-[10px] font-black uppercase tracking-wider">能量玉币:</span>
              <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-red-400 bg-clip-text text-transparent font-black text-sm tracking-wide drop-shadow-[0_0_6px_rgba(244,63,94,0.3)]">
                {coins} 💎
              </span>
            </div>
            
            <div className={`w-[1px] h-4 hidden md:block ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            
            {/* Practice Days (Gold) */}
            <div className="flex items-center gap-2 group cursor-help" title="连续坚持刷题打卡天数，以固道基！">
              <Zap size={16} className="text-amber-400 group-hover:scale-115 transition-transform" />
              <span className="text-slate-550 text-[10px] font-black uppercase tracking-wider">连刷天数:</span>
              <span className="text-amber-500 font-black text-sm tracking-wide drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]">
                {streakDays} 天 ⚡
              </span>
            </div>
            
            <div className={`w-[1px] h-4 hidden md:block ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            
            {/* Trophy Rank */}
            <div className="flex items-center gap-2 group cursor-help" title="您的御笔修行境界，根据积分修为自动突破">
              <Trophy size={16} className="text-amber-400 filter drop-shadow-[0_0_4px_rgba(245,158,11,0.5)] group-hover:rotate-12 transition-transform" />
              <span className="text-slate-555 text-[10px] font-black uppercase tracking-wider">御笔境界:</span>
              <span className={`bg-gradient-to-r ${isDark ? 'from-amber-400 to-yellow-200' : 'from-amber-600 to-yellow-600'} bg-clip-text text-transparent font-black text-xs tracking-widest px-3 py-0.5 rounded-full border bg-amber-500/5 ${isDark ? 'border-amber-500/20' : 'border-amber-500/30'}`}>
                《{currentRank}》
              </span>
            </div>
          </div>
        </div>

        {/* ================= MAIN CONTAINER: DIAL SELECTOR & PROBLEM ZONE ================= */}
        <div className="flex flex-col lg:flex-row gap-8 items-start relative overflow-visible">
          
          {/* ================= LEFT COLUMN: DIAL SELECTOR ================= */}
          <div className="w-full lg:w-[280px] shrink-0 flex flex-col items-center justify-start relative lg:min-h-[520px] overflow-visible">
            
            {/* Mobile View: Horizontal Tabs (Scrollable) */}
            <div className="lg:hidden w-full flex overflow-x-auto gap-3 py-2 no-scrollbar">
              {dialNodes.map((lang, i) => (
                <button
                  key={lang.id}
                  onClick={() => setActiveIndex(i)}
                  className={`px-4 py-2.5 rounded-xl border flex items-center gap-2.5 shrink-0 transition-all duration-300 ${
                    activeIndex === i 
                      ? isDark 
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]' 
                        : 'bg-cyan-50 border-cyan-400 text-cyan-700 font-bold shadow-[0_4px_12px_rgba(6,182,212,0.15)]'
                      : isDark
                        ? 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-300'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lang.color }} />
                  <span className="text-xs tracking-wide line-clamp-1">{lang.label}</span>
                </button>
              ))}
            </div>
            
            {/* Desktop View: Semicircular Rotating Star Dial */}
            <div className="hidden lg:block relative w-full h-[480px] overflow-visible select-none">
              
              {/* Concentric Quantum Orbits with Cyan Glows */}
              <div className={`absolute rounded-full border pointer-events-none w-[460px] h-[460px] top-[10px] -left-[230px] transition-all duration-300 ${isDark ? 'border-cyan-500/15 shadow-[0_0_20px_rgba(6,182,212,0.03)]' : 'border-cyan-500/10 shadow-[0_4px_20px_rgba(6,182,212,0.01)]'}`} />
              <div className={`absolute rounded-full border pointer-events-none w-[390px] h-[390px] top-[45px] -left-[195px] transition-all duration-300 ${isDark ? 'border-cyan-500/10' : 'border-cyan-500/5'}`} />
              <div className={`absolute rounded-full border pointer-events-none w-[320px] h-[320px] top-[80px] -left-[160px] transition-all duration-300 ${isDark ? 'border-cyan-500/5' : 'border-cyan-500/[0.02]'}`} />
              
              {/* Aiming Laser Grid Aligning horizontal active node */}
              <div className={`absolute top-[240px] left-0 -translate-y-1/2 w-[230px] h-[1.5px] bg-gradient-to-r from-transparent pointer-events-none transition-all duration-300 z-0 ${
                isDark ? 'via-cyan-500/40 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'via-cyan-400/30 to-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
              }`} />
              <div className="absolute left-[230px] top-[240px] -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none z-0">
                <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-cyan-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-50 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></span>
              </div>
              
              {/* Semicircular Rotating Dial */}
              <div 
                className={`absolute top-[240px] -left-[230px] -translate-y-1/2 w-[460px] h-[460px] rounded-full border transition-transform duration-700 cubic-bezier(0.16, 1, 0.3, 1) z-10 ${
                  isDark ? 'border-cyan-500/20 shadow-[0_0_40px_rgba(6,182,212,0.05)] bg-slate-950/20' : 'border-cyan-500/10 shadow-[0_4px_30px_rgba(6,182,212,0.02)] bg-white/5'
                }`}
                style={{ transform: `translateY(-50%) rotate(${-activeIndex * ANGLE}deg)` }}
                onWheel={handleWheel}
              >
                {/* Dial inner details */}
                <div className={`absolute inset-6 rounded-full border border-dashed pointer-events-none ${isDark ? 'border-cyan-500/10' : 'border-cyan-500/5'}`} />
                <div className={`absolute inset-12 rounded-full border pointer-events-none ${isDark ? 'border-cyan-500/5' : 'border-cyan-500/[0.02]'}`} />
                <div className={`absolute inset-20 rounded-full border border-dashed pointer-events-none ${isDark ? 'border-cyan-500/5' : 'border-cyan-500/[0.02]'}`} />
                
                {/* Dial target ticks */}
                {dialNodes.map((_, i) => {
                  const angleDeg = i * ANGLE;
                  return (
                    <div
                      key={i}
                      className={`absolute left-1/2 top-1/2 w-5 h-[1px] origin-left pointer-events-none ${isDark ? 'bg-cyan-400/30' : 'bg-cyan-500/20'}`}
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angleDeg}deg) translate(210px, 0)`
                      }}
                    />
                  );
                })}
                
                {/* Dial Language nodes */}
                {dialNodes.map((lang, i) => {
                  const angleDeg = i * ANGLE;
                  const angleRad = (angleDeg * Math.PI) / 180;
                  const x = R * Math.cos(angleRad);
                  const y = R * Math.sin(angleRad);
                  const isActive = activeIndex === i;
                  
                  // Calculate circular shortest relative distance
                  const diff = i - activeIndex;
                  let circularDiff = diff;
                  if (circularDiff > dialNodesLength / 2) circularDiff -= dialNodesLength;
                  if (circularDiff < -dialNodesLength / 2) circularDiff += dialNodesLength;
                  
                  const isVisible = Math.abs(circularDiff * ANGLE) <= 100;
                  const opacity = isVisible 
                    ? Math.max(0, 1 - (Math.abs(circularDiff * ANGLE) - 60) / 40) // Smoothly fade out towards top/bottom edges
                    : 0;
                  
                  return (
                    <div
                      key={lang.id}
                      onClick={() => handleCardClick(i)}
                      className="absolute cursor-pointer select-none group origin-center transition-all duration-300"
                      style={{
                        left: `${230 + x}px`,
                        top: `${230 + y}px`,
                        transform: `translate(-50%, -50%) rotate(${activeIndex * ANGLE}deg)`,
                        zIndex: isActive ? 30 : 10,
                        opacity: opacity,
                        pointerEvents: isVisible ? 'auto' : 'none'
                      }}
                    >
                      {/* Interactive Dial Node Card */}
                      <div className={`w-[145px] p-3 rounded-xl border transition-all duration-300 flex flex-col items-start gap-1 backdrop-blur-md ${
                        isActive 
                          ? isDark
                            ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.45)] scale-110' 
                            : 'bg-cyan-50 border-cyan-400 text-cyan-800 shadow-[0_4px_15px_rgba(6,182,212,0.25)] scale-110'
                          : isDark
                            ? 'bg-slate-900/60 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-900/80 scale-100'
                            : 'bg-white/85 border-slate-200 text-slate-600 hover:border-cyan-400/40 hover:bg-white shadow-sm scale-100'
                      }`}>
                        <div className="flex items-center gap-2 w-full">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ 
                              backgroundColor: lang.color,
                              boxShadow: isActive ? `0 0 10px ${lang.color}` : 'none'
                            }} 
                          />
                          <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-cyan-500 font-bold' : 'text-slate-400 group-hover:text-slate-500'}`}>
                            {lang.eng}
                          </span>
                        </div>
                        <span className={`text-xs font-black tracking-wide transition-colors line-clamp-1 w-full text-left ${
                          isActive 
                            ? isDark ? 'text-white' : 'text-slate-800' 
                            : isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-800'
                        }`}>
                          {lang.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Scroll Indicator Guide */}
            <p className={`hidden lg:block ${isDark ? 'text-slate-500' : 'text-slate-400'} text-[10px] uppercase font-black tracking-[0.15em] absolute bottom-2 select-none animate-pulse`}>
              鼠标滚轮 / 点击进行星盘切换
            </p>
          </div>

          {/* ================= RIGHT COLUMN: XP HUB & QUESTION BANK LIST ================= */}
          <div className="flex-1 w-full space-y-6">

            {/* ================= XP PROGRESSION HUB ================= */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 rounded-2xl border transition-all duration-300 backdrop-blur-md relative overflow-hidden ${
              isDark 
                ? 'border-cyan-500/20 bg-slate-900/40 shadow-[0_0_20px_rgba(6,182,212,0.03)]' 
                : 'border-slate-200 bg-white/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] text-slate-800'
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
              
              {/* Column 1: QA Science */}
              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-black text-cyan-500 tracking-wider flex items-center gap-1.5 uppercase select-none">
                    <Trophy size={16} className="text-amber-500 animate-pulse" /> 修行功德谱与境界突破
                  </h3>
                  <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-xs mt-1`}>金玉修行积分是您实战能力的数字烙印，用于提升天梯御笔境界。</p>
                </div>
                
                {/* Q&A List */}
                <div className="space-y-3 pt-2 text-xs">
                  <div>
                    <span className="text-amber-500 font-bold block">① 如何获取积分？</span>
                    <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'} block pl-3 leading-relaxed`}>
                      完成各模块专题测评、AI在线推题测评、或坚持连刷打卡，均可以源源不断积攒积分修为。
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-500 font-bold block">② 怎么知道具体分值？</span>
                    <span className={`${isDark ? 'text-slate-400' : 'text-slate-600'} block pl-3 leading-relaxed`}>
                      顶部黄金 HUD 栏、本卡片进度 gap 和每次提交答题反馈时均会实时展示您的当前修为。
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2: Wedge-Shaped XP Progress Bar */}
              <div className="flex flex-col justify-center space-y-4">
                <div className="flex justify-between items-end select-none">
                  <div>
                    <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-[10px] font-black uppercase tracking-widest block`}>修为进度</span>
                    <span className={`${isDark ? 'text-white' : 'text-slate-800'} font-bold text-sm tracking-wide font-mono`}>
                      {score} <span className="text-slate-400">/</span> {bounds.max} XP
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'} text-[10px] font-black uppercase tracking-widest block`}>当前段位</span>
                    <span className={`${isDark ? 'text-amber-400' : 'text-amber-600'} font-black text-xs tracking-widest`}>
                      《{bounds.label}》
                    </span>
                  </div>
                </div>

                {/* wedge-shaped progress bar container */}
                <div 
                  className={`relative h-14 w-full rounded-xl border flex items-center px-4 overflow-hidden transition-all duration-300 ${
                    isDark ? 'bg-cyan-950/20 border-cyan-500/10' : 'bg-slate-100/50 border-slate-200'
                  }`}
                  style={{
                    boxShadow: isDark ? 'inset 0 0 10px rgba(6, 182, 212, 0.05)' : 'none'
                  }}
                >
                  {/* Glow backing */}
                  <div className="absolute inset-0 bg-cyan-500/5 blur-sm animate-pulse pointer-events-none" />
                  
                  {/* Wedge shaped Progress clip-path */}
                  <div 
                    className={`relative w-full h-8 overflow-hidden ${isDark ? 'bg-slate-900/60' : 'bg-slate-200/60'}`}
                    style={{
                      clipPath: 'polygon(0% 40%, 100% 15%, 100% 85%, 0% 60%)'
                    }}
                  >
                    {/* Inner glowing wedge gradient */}
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(34,211,238,0.4)]"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Progress helper tip */}
                <p className={`${isDark ? 'text-slate-500' : 'text-slate-400'} text-[10px] leading-relaxed text-right select-none`}>
                  {score >= 601 
                    ? '已证无上大道，恭喜您列位仙班之巅！'
                    : `距离突破至《${getRankName(bounds.max + 5)}》还需积攒 ${bounds.max - score} 积分修为`
                  }
                </p>
              </div>
            </div>

            {/* ================= FILTERS ROW ================= */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl transition-all duration-300 ${
              isDark ? 'bg-slate-900/20 border border-white/5' : 'bg-white/50 border border-slate-200 shadow-sm'
            }`}>
              
              {/* Difficulty selector tabs */}
              <div className="flex gap-2">
                {['全部', '简单', '中等', '困难'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDifficultyFilter(filter)}
                    className={`px-4 py-2 text-xs rounded-lg transition-all duration-300 border font-black uppercase tracking-widest ${
                      difficultyFilter === filter 
                        ? isDark
                          ? 'bg-cyan-950/80 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.15)]' 
                          : 'bg-cyan-50 text-cyan-600 border-cyan-300 shadow-sm'
                        : isDark
                          ? 'bg-slate-900/40 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700 shadow-sm'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Bank selector dropdown (Supports custom virtual banks seamlessly) */}
              <div className="flex flex-col md:flex-row gap-3 items-center w-full md:w-auto">
                <div className="relative w-full md:w-48">
                  <select
                    value={selectedBank?.id || ''}
                    onChange={(e) => {
                      const matched = fetchedBanks.find(b => b.id === e.target.value);
                      if (matched) {
                        setSelectedBank(matched);
                        const langIndex = fetchedBanks.findIndex(b => b.id === e.target.value);
                        if (langIndex !== -1) {
                          setActiveIndex(langIndex);
                        }
                      }
                    }}
                    className={`w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all cursor-pointer appearance-none font-bold ${
                      isDark 
                        ? 'bg-slate-900 border-white/10 text-white hover:bg-slate-800' 
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    {fetchedBanks.map(b => (
                      <option key={b.id} value={b.id} className={isDark ? 'bg-slate-900 text-white font-bold' : 'bg-white text-slate-850 font-bold'}>
                        📚 {b.title}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">▼</div>
                </div>

                {/* Input Search Box */}
                <div className="relative group w-full md:w-64">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜寻题目名称、标签或关键字..."
                    className={`w-full border rounded-xl px-4 py-2.5 pl-10 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-400 font-bold ${
                      isDark
                        ? 'bg-slate-900 border-white/10 focus:bg-slate-800 text-white'
                        : 'bg-white border-slate-200 focus:bg-slate-50 text-slate-805 shadow-sm'
                    }`}
                  />
                  <SearchIcon className={`absolute left-3.5 top-3.5 transition-colors ${isDark ? 'text-slate-500 group-focus-within:text-cyan-400' : 'text-slate-400 group-focus-within:text-cyan-500'}`} size={14} />
                </div>
              </div>
            </div>

            {/* ================= TABLE LIST ZONE ================= */}
            <div className={`border rounded-2xl shadow-xl overflow-hidden backdrop-blur-md transition-all duration-300 ${
              isDark 
                ? 'border-white/10 bg-slate-900/10' 
                : 'border-slate-200 bg-white/70 shadow-[0_4px_24px_rgba(0,0,0,0.03)]'
            }`}>
              {loading ? (
                // Shimmer Loading Skeleton
                <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-200'}`}>
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="p-6 flex items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <Skeleton className={`w-6 h-6 rounded-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                        <div className="space-y-2">
                          <Skeleton className={`h-4 w-48 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                          <Skeleton className={`h-3 w-24 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Skeleton className={`h-6 w-16 rounded ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                        <Skeleton className={`h-4 w-12 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : fetchedProblems.length === 0 ? (
                <div className={`p-16 text-center font-black uppercase tracking-[0.2em] text-xs select-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  本星盘轨道下暂无匹配的修行试炼题
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className={`text-[10px] font-black uppercase tracking-[0.2em] border-b select-none transition-all duration-300 ${
                    isDark 
                      ? 'bg-white/5 text-slate-400 border-white/5' 
                      : 'bg-slate-100/55 text-slate-500 border-slate-200'
                  }`}>
                    <tr>
                      <th className="px-8 py-5 w-24">状态</th>
                      <th className="px-8 py-5">试炼法题</th>
                      <th className="px-8 py-5 w-32">试炼难度</th>
                      <th className="px-8 py-5 w-32 text-center">仙劫通过率</th>
                      <th className="px-8 py-5 w-32 text-right">功行</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-all duration-300 ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                    {fetchedProblems.map((problem) => (
                      <tr 
                        key={problem.id} 
                        className={`transition-all duration-300 group cursor-pointer ${
                          isDark 
                            ? 'hover:bg-cyan-950/20' 
                            : 'hover:bg-cyan-50/45'
                        }`}
                        onClick={() => handleSelectProblemClick(problem)}
                      >
                        <td className="px-8 py-6">
                          {problem.isSolved ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                              <CheckCircle size={14} className="text-emerald-500 animate-pulse" />
                            </div>
                          ) : (
                            <div className={`w-6 h-6 rounded-full border transition-all duration-300 ${
                              isDark 
                                ? 'border-white/20 group-hover:border-cyan-400 group-hover:shadow-[0_0_8px_rgba(6,182,212,0.3)]' 
                                : 'border-slate-300 group-hover:border-cyan-500 group-hover:shadow-[0_2px_8px_rgba(6,182,212,0.25)]'
                            }`} />
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                            <span className={`text-sm font-bold transition-colors ${
                              isDark 
                                ? 'text-white group-hover:text-cyan-400' 
                                : 'text-slate-800 group-hover:text-cyan-600'
                            }`}>
                              {problem.title}
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {(problem.tags || []).slice(0, 3).map(tag => (
                                <span key={tag} className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border transition-all duration-300 ${
                                  isDark 
                                    ? 'text-slate-400 bg-white/5 border-white/5' 
                                    : 'text-slate-500 bg-slate-100 border-slate-200'
                                }`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <DifficultyBadge level={problem.difficulty} />
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className={`text-xs font-mono tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {problem.passRate || '0.0%'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ml-auto transition-colors ${
                            isDark 
                              ? 'text-cyan-400 group-hover:text-cyan-300' 
                              : 'text-cyan-600 group-hover:text-cyan-700'
                          }`}>
                            参悟去 <ChevronRight size={14} className="group-hover:translate-x-1.5 transition-transform duration-300" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};