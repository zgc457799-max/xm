
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { KnowledgeNode, StudentMastery } from '../../types';
import { X, ZoomIn, ZoomOut, Maximize, Target, Sun, Moon, ShieldCheck, Cpu, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    nodes: KnowledgeNode[];
    mastery: StudentMastery[];
    onClose: () => void;
}

const GRAPH_WIDTH = 5000;
const GRAPH_HEIGHT = 3000;

const CATEGORY_CONFIG: Record<string, { color: string, icon: any, shape: string }> = {
    '算法': {
        color: '#f59e0b',
        icon: Cpu,
        shape: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)'
    },
    'Algorithm': {
        color: '#f59e0b',
        icon: Cpu,
        shape: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)'
    },
    '数据结构': {
        color: '#8b5cf6',
        icon: ShieldCheck,
        shape: 'rounded-[12px]'
    },
    'Data Structure': {
        color: '#8b5cf6',
        icon: ShieldCheck,
        shape: 'rounded-[12px]'
    },
    '基础语法': {
        color: '#3b82f6',
        icon: Code2,
        shape: 'rounded-full'
    },
    'Syntax': {
        color: '#3b82f6',
        icon: Code2,
        shape: 'rounded-full'
    },
};

const calculateLayout = (nodes: KnowledgeNode[]) => {
    const levels: Record<string, number> = {};
    nodes.forEach(n => { levels[n.id] = 0; });

    let changed = true;
    let loops = 0;
    while (changed && loops < 20) {
        changed = false;
        loops++;
        nodes.forEach(node => {
            const prereqs = node.prerequisites || [];
            if (prereqs.length > 0) {
                const maxPrereqLevel = Math.max(...prereqs.map(p => levels[p] || 0));
                if (levels[node.id] <= maxPrereqLevel) {
                    levels[node.id] = maxPrereqLevel + 1;
                    changed = true;
                }
            }
        });
    }

    const levelsArray: KnowledgeNode[][] = [];
    nodes.forEach(node => {
        const l = levels[node.id];
        if (!levelsArray[l]) levelsArray[l] = [];
        levelsArray[l].push(node);
    });

    const layoutNodes: any[] = [];
    const levelWidth = 600;
    const startX = 600;

    levelsArray.forEach((levelNodes, levelIndex) => {
        const x = startX + levelIndex * levelWidth;
        const totalInLevel = levelNodes.length;
        const startY = GRAPH_HEIGHT / 2 - (totalInLevel * 200) / 2;

        levelNodes.forEach((node, nodeIndex) => {
            layoutNodes.push({
                ...node,
                x: x,
                y: startY + nodeIndex * 240,
                level: levelIndex
            });
        });
    });

    return layoutNodes;
};

export const KnowledgeGraphViewer = ({ nodes, mastery, onClose }: Props) => {
    const layoutNodes = useMemo(() => calculateLayout(nodes), [nodes]);
    const [scale, setScale] = useState(0.4);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const containerRef = useRef<HTMLDivElement>(null);

    const centerGraph = useCallback(() => {
        if (!containerRef.current || layoutNodes.length === 0) return;
        const rect = containerRef.current.getBoundingClientRect();

        const minX = Math.min(...layoutNodes.map(n => n.x)) - 300;
        const maxX = Math.max(...layoutNodes.map(n => n.x)) + 300;
        const minY = Math.min(...layoutNodes.map(n => n.y)) - 200;
        const maxY = Math.max(...layoutNodes.map(n => n.y)) + 200;

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        setOffset({
            x: rect.width / 2 - centerX * scale,
            y: rect.height / 2 - centerY * scale
        });
    }, [layoutNodes, scale]);

    useEffect(() => {
        const timer = setTimeout(centerGraph, 100);
        return () => clearTimeout(timer);
    }, [nodes]);

    const handleWheel = (e: React.WheelEvent) => {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(s => Math.min(Math.max(s * delta, 0.1), 2));
    };

    const isLight = theme === 'light';

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-10 animate-fade-in">
            {/* The Floating Window */}
            <div
                ref={containerRef}
                className={`relative w-full h-full max-w-[1400px] max-h-[900px] rounded-[56px] shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-hidden flex items-center justify-center transition-all duration-700 border border-white/10 ${isLight ? 'bg-[#fcfdfe]' : 'bg-[#020617]'
                    }`}
            >
                {/* Background Grid */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{
                        backgroundImage: `radial-gradient(${isLight ? '#000' : '#4f46e5'} 1.5px, transparent 1.5px)`,
                        backgroundSize: '50px 50px',
                        transform: `translate(${offset.x * 0.1}px, ${offset.y * 0.1}px)`
                    }}
                />

                {/* Top Header Bar inside the window */}
                <div className="absolute top-0 left-0 right-0 p-10 flex justify-between items-start z-[150] pointer-events-none">
                    <div className="pointer-events-auto">
                        <motion.div
                            initial={{ x: -30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex items-center gap-5"
                        >
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-700 rounded-[24px] shadow-2xl shadow-indigo-500/30 flex items-center justify-center text-white rotate-6">
                                <Target size={36} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className={`text-4xl font-black tracking-tighter ${isLight ? 'text-slate-900' : 'text-white'}`}>全景知识谱系</h2>
                                <p className={`text-[10px] font-black uppercase tracking-[0.6em] mt-2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Visual Knowledge Intelligence System</p>
                            </div>
                        </motion.div>
                    </div>

                    <div className="flex items-center gap-5 pointer-events-auto">
                        <button
                            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                            className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all shadow-xl border ${isLight ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                                } hover:scale-110 active:scale-95`}
                        >
                            {isLight ? <Moon size={28} /> : <Sun size={28} />}
                        </button>

                        <div className={`flex items-center gap-1 p-1 rounded-[24px] border shadow-xl ${isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
                            }`}>
                            <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className={`p-4 rounded-[20px] transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-white'}`}><ZoomIn size={22} /></button>
                            <button onClick={() => setScale(s => Math.max(s - 0.1, 0.1))} className={`p-4 rounded-[20px] transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-white'}`}><ZoomOut size={22} /></button>
                            <div className={`w-px h-8 mx-1 ${isLight ? 'bg-slate-200' : 'bg-white/10'}`}></div>
                            <button onClick={centerGraph} className={`p-4 rounded-[20px] transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-white/10 text-white'}`}><Maximize size={22} /></button>
                        </div>

                        {/* HIGHLY VISIBLE CLOSE BUTTON */}
                        <button
                            onClick={onClose}
                            className="group w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-red-500/40 transition-all hover:scale-110 active:scale-90"
                        >
                            <X size={34} strokeWidth={3} className="transition-transform group-hover:rotate-90 duration-300" />
                        </button>
                    </div>
                </div>

                {/* Interaction Area */}
                <div
                    className="w-full h-full cursor-grab active:cursor-grabbing relative"
                    onWheel={handleWheel}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onMouseMove={(e) => {
                        if (isDragging) {
                            setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
                        }
                    }}
                >
                    <div
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            width: GRAPH_WIDTH,
                            height: GRAPH_HEIGHT,
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            transformOrigin: '0 0',
                            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                        }}
                    >
                        {/* SVG Layer */}
                        <svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} className="absolute inset-0 overflow-visible pointer-events-none">
                            <defs>
                                <marker id="arrow" markerWidth="10" markerHeight="10" refX="45" refY="5" orient="auto">
                                    <path d="M0,0 L10,5 L0,10 Z" fill={isLight ? '#94a3b8' : '#334155'} />
                                </marker>
                            </defs>
                            {layoutNodes.map(node => {
                                const prereqs = node.prerequisites || [];
                                return prereqs.map((pid: string) => {
                                    const target = layoutNodes.find((n: any) => n.id === pid);
                                    if (!target) return null;
                                    const mCurrent = mastery.find(x => x.node_id === node.id);
                                    const isLearned = (mCurrent?.mastery_score || 0) > 0;
                                    const style = CATEGORY_CONFIG[target.category] || { color: '#64748b' };

                                    return (
                                        <motion.path
                                            key={`${target.id}-${node.id}`}
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 0.5 }}
                                            d={`M ${target.x} ${target.y} C ${target.x + 300} ${target.y}, ${node.x - 300} ${node.y}, ${node.x} ${node.y}`}
                                            stroke={isLearned ? style.color : (isLight ? '#e2e8f0' : '#1e293b')}
                                            strokeWidth={isLearned ? 5 : 2}
                                            fill="none"
                                            markerEnd="url(#arrow)"
                                        />
                                    );
                                });
                            })}
                        </svg>

                        {/* Nodes Layer */}
                        {layoutNodes.map(node => {
                            const m = mastery.find(x => x.node_id === node.id);
                            const score = m ? m.mastery_score : 0;
                            const { color, icon: Icon, shape } = CATEGORY_CONFIG[node.category] || { color: '#64748b', icon: Target, shape: 'rounded-3xl' };
                            const isCircle = shape === 'rounded-full';

                            let cardStyle = isLight
                                ? "bg-white/80 backdrop-blur-md border-slate-200 text-slate-800 shadow-xl"
                                : "bg-slate-900/60 backdrop-blur-xl border-white/5 text-slate-300";

                            if (score >= 80) {
                                cardStyle = isLight ? `border-green-500 bg-white ring-8 ring-green-500/10` : `border-green-400 bg-green-500/20 ring-8 ring-green-500/10`;
                            } else if (score > 20) {
                                cardStyle = isLight ? `border-blue-500 bg-white ring-8 ring-blue-500/10` : `border-blue-400 bg-blue-500/20 ring-8 ring-blue-500/10 text-white`;
                            }

                            return (
                                <div
                                    key={node.id}
                                    style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}
                                    className="absolute pointer-events-auto"
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.15, y: -20, rotate: node.category === '算法' ? 3 : 1 }}
                                        className={`relative ${isCircle ? 'w-56 h-56' : 'w-80 h-48'} p-10 border-2 flex flex-col justify-between transition-all duration-300 cursor-pointer ${cardStyle}`}
                                        style={{
                                            clipPath: node.category === '算法' ? shape : 'none',
                                            borderRadius: node.category !== '算法' ? (isCircle ? '50%' : '48px') : '0'
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div
                                                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${isLight ? 'bg-slate-100' : 'bg-white/10'}`}
                                                style={{ color: score > 20 ? color : (isLight ? '#cbd5e1' : '#334155') }}
                                            >
                                                <Icon size={28} strokeWidth={2.5} />
                                            </div>
                                            <div className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-[0.2em] ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-black/60 text-slate-500'
                                                }`}>
                                                {node.category}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <h4 className={`font-black text-xl tracking-tight leading-none ${isLight ? 'text-slate-800' : 'text-white'}`}>{node.name}</h4>
                                            <div className="space-y-2.5">
                                                <div className={`h-3 w-full rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-black/40'}`}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${score}%` }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: color, opacity: 0.9 }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom Legend */}
                <div className={`absolute bottom-10 left-10 flex items-center gap-12 px-10 py-6 rounded-[32px] border transition-all ${isLight ? 'bg-white/80 border-slate-200' : 'bg-slate-900/80 border-white/10'
                    } backdrop-blur-2xl shadow-2xl z-50`}>
                    {[
                        { label: 'Unstarted', color: isLight ? '#e2e8f0' : '#1e293b' },
                        { label: 'Learning', color: '#3b82f6' },
                        { label: 'Mastered', color: '#22c55e' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 15px ${item.color}40` }} />
                            <span className={`text-[11px] font-black uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
