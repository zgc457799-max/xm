import React, { useRef, useEffect } from 'react';
import { Award, Download } from 'lucide-react';
import { Button } from '../UiComponents';
import html2canvas from 'html2canvas';
import { CertificateConfig } from '../../types';
import { maskName } from '../../utils';

interface CertificateProps {
    userName: string;
    contestTitle: string;
    rank: number;
    awardName: string;
    date: string;
    code: string;
    config?: CertificateConfig;
    onClose: () => void;
}

export const CertificateView: React.FC<CertificateProps> = ({ userName, contestTitle, rank, awardName, date, code, config, onClose }) => {
    const certRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Canvas Rendering Logic (from StudentProfile.tsx)
    useEffect(() => {
        if (config && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
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
                            if (item.field === 'contestName') text = contestTitle;
                            if (item.field === 'name') text = userName;
                            if (item.field === 'award') text = awardName;
                            if (item.field === 'date') text = date;
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

                // Fallback for BG error
                bg.onerror = () => {
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(0, 0, 800, 600);
                    ctx.strokeRect(10, 10, 780, 580);
                    drawText();
                }
            }
        }
    }, [config, userName, contestTitle, awardName, date]);

    const handleDownload = async () => {
        try {
            if (config && canvasRef.current) {
                const link = document.createElement('a');
                link.download = `${contestTitle}_${userName}_证书.png`;
                link.href = canvasRef.current.toDataURL('image/png');
                link.click();
            } else if (certRef.current) {
                const canvas = await html2canvas(certRef.current, { scale: 2 });
                const link = document.createElement('a');
                link.download = `Certificate_${code}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }
        } catch (err) {
            console.error("Failed to generate certificate image", err);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Award className="text-yellow-500" /> 获奖证书
                    </h3>
                    <div className="flex gap-2">
                        <Button onClick={handleDownload} className="flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700">
                            <Download size={16} /> 保存图片
                        </Button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500">
                            关闭
                        </button>
                    </div>
                </div>

                {/* Certificate Area */}
                <div className="flex-1 overflow-auto p-8 bg-slate-200 flex justify-center items-center">
                    {config ? (
                        <canvas
                            ref={canvasRef}
                            width={800}
                            height={600}
                            className="bg-white shadow-2xl rounded max-w-full h-auto object-contain"
                        />
                    ) : (
                        <div
                            ref={certRef}
                            className="w-[800px] h-[600px] bg-white shadow-lg relative flex flex-col items-center justify-center text-center p-12 border-[12px] border-double border-yellow-600/30"
                            style={{
                                backgroundImage: 'radial-gradient(circle at center, #fff 0%, #fef3c7 100%)'
                            }}
                        >
                            {/* Decorative Corner */}
                            <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-yellow-600"></div>
                            <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-yellow-600"></div>
                            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-yellow-600"></div>
                            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-yellow-600"></div>

                            {/* Content */}
                            <div className="mb-8">
                                <Award size={64} className="text-yellow-600 mx-auto mb-4" />
                                <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-wider uppercase mb-2">荣誉证书</h1>
                                <div className="w-24 h-1 bg-yellow-600 mx-auto"></div>
                            </div>

                            <div className="space-y-6 max-w-2xl">
                                <p className="text-lg text-slate-600 font-serif">兹证明</p>
                                <h2 className="text-3xl font-bold text-slate-900 underline decoration-yellow-400/50 underline-offset-8 decoration-2">{maskName(userName)}</h2>

                                <p className="text-lg text-slate-600 font-serif leading-relaxed">
                                    在 <span className="font-bold text-slate-800">"{contestTitle}"</span> 中表现优异，
                                    荣获 <span className="text-yellow-700 font-bold text-2xl mx-1">{awardName}</span>。
                                </p>

                                <p className="text-slate-500 italic">特发此证，以资鼓励。</p>
                            </div>

                            {/* Footer */}
                            <div className="absolute bottom-12 w-full px-12 flex justify-between items-end">
                                <div className="text-left text-xs text-slate-400 font-mono">
                                    证书编号: {code}<br />
                                    验证地址: educode.ai/verify
                                </div>
                                <div className="text-right">
                                    <div className="text-slate-800 font-bold font-serif mb-1">EduCode AI 竞赛组委会</div>
                                    <div className="text-sm text-slate-500">{date}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
