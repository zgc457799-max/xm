import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Brain, Zap, Target, Award, Network } from 'lucide-react';
import { getKnowledgeNodes, getMyMastery } from '../../services/api';
import { KnowledgeNode, StudentMastery } from '../../types';
import { KnowledgeGraphViewer } from './KnowledgeGraphViewer';

export const KnowledgeProfile = () => {
    const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
    const [mastery, setMastery] = useState<StudentMastery[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFullGraph, setShowFullGraph] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [nodesData, masteryData] = await Promise.all([
                    getKnowledgeNodes(),
                    getMyMastery()
                ]);
                setNodes(nodesData);
                setMastery(masteryData);
            } catch (err) {
                console.error("Failed to load knowledge data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Process data for Radar Chart
    // Group by Category and average the score? 
    // Or just pick top 5 categories?
    // Let's assume we show "Category" based radar.
    const radarData = React.useMemo(() => {
        if (!nodes.length) return [];

        const categoryMap = new Map<string, { total: number, count: number }>();

        nodes.forEach(node => {
            if (!categoryMap.has(node.category)) {
                categoryMap.set(node.category, { total: 0, count: 0 });
            }

            // Find mastery for this node
            const m = mastery.find(x => x.node_id === node.id);
            const score = m ? m.mastery_score : 0;

            const cat = categoryMap.get(node.category)!;
            cat.total += score;
            cat.count += 1;
        });

        const data: any[] = [];
        categoryMap.forEach((val, key) => {
            data.push({
                subject: key,
                A: Math.round(val.total / val.count), // Average mastery score
                fullMark: 100
            });
        });

        // Limit to 6 categories for aesthetics if too many
        return data.slice(0, 6);
    }, [nodes, mastery]);

    if (loading) return <div className="p-10 text-center text-slate-400">Loading Knowledge Graph...</div>;

    return (
        <>
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden group">
                {/* Decorative BG */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-full opacity-50 pointer-events-none transition-opacity group-hover:opacity-80"></div>

                {/* Header Action ABS */}
                <div className="absolute top-8 right-8 z-10">
                    <button
                        onClick={() => setShowFullGraph(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white hover:bg-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200 transition-all hover:scale-105 active:scale-95"
                    >
                        <Network size={16} />
                        查看全景图谱
                    </button>
                </div>

                {/* Left: Radar Chart */}
                <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center relative">
                    <div className="absolute top-0 left-0 flex items-center gap-2 mb-4">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                            <Brain size={20} />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="font-black text-lg text-slate-800 tracking-tight">知识画像</h3>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Knowledge Profile</span>
                        </div>
                    </div>

                    {radarData.length > 0 ? (
                        <div className="w-full h-[300px] mt-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                    <PolarGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar
                                        name="能力值"
                                        dataKey="A"
                                        stroke="#4f46e5"
                                        strokeWidth={3}
                                        fill="#6366f1"
                                        fillOpacity={0.2}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.2)' }}
                                        itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-slate-400 text-sm mt-10">暂无数据，请多做题积累数据</div>
                    )}
                </div>

                {/* Right: Detailed Stats / List */}
                <div className="flex-1 space-y-6 pt-10 md:pt-0">
                    <div>
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Target size={16} className="text-blue-500" />
                            重点突破 / Focus Areas
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            {nodes.slice(0, 4).map(node => {
                                const m = mastery.find(x => x.node_id === node.id);
                                const score = m ? m.mastery_score : 0;
                                return (
                                    <div key={node.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors flex flex-col group/card">
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{node.category}</span>
                                        <span className="font-black text-slate-800 text-sm mb-3 group-hover/card:text-blue-600 transition-colors">{node.name}</span>
                                        <div className="mt-auto">
                                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${score}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-100/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap size={60} className="text-yellow-600" />
                        </div>
                        <div className="flex items-start gap-3 relative z-10">
                            <div className="p-2 bg-yellow-100/80 rounded-xl text-yellow-700">
                                <Zap size={18} />
                            </div>
                            <div>
                                <h5 className="font-black text-slate-800 text-sm mb-1">AI 学习建议</h5>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                    根据你的知识图谱，建议加强 <span className="font-black text-indigo-600 px-1 bg-indigo-50 rounded border border-indigo-100">动态规划</span> 和 <span className="font-black text-indigo-600 px-1 bg-indigo-50 rounded border border-indigo-100">图论</span> 模块的练习。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Graph Modal */}
            {showFullGraph && (
                <KnowledgeGraphViewer
                    nodes={nodes}
                    mastery={mastery}
                    onClose={() => setShowFullGraph(false)}
                />
            )}
        </>
    );
};
