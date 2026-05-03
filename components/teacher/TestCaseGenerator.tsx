import React, { useState } from 'react';
import { Terminal, Save, Loader2, RefreshCw } from 'lucide-react';
import { Button, Card } from '../UiComponents';
import { generateTestCases } from '../../services/api';

interface TestCase {
    input: string;
    output: string;
}

interface TestCaseGeneratorProps {
    problemDescription: string; // Passed from parent (e.g. current form state)
    onSaveCases: (cases: TestCase[]) => void;
    showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const TestCaseGenerator: React.FC<TestCaseGeneratorProps> = ({ problemDescription, onSaveCases, showToast }) => {
    const [count, setCount] = useState(5);
    const [loading, setLoading] = useState(false);
    const [cases, setCases] = useState<TestCase[]>([]);

    const handleGenerate = async () => {
        if (!problemDescription.trim()) {
            showToast("请先填写题目描述", "info");
            return;
        }
        setLoading(true);
        try {
            const result = await generateTestCases(problemDescription, count);
            // Validating results array type
            if (Array.isArray(result)) {
                setCases(result);
            } else {
                showToast("生成格式异常", "error");
            }
        } catch (e) {
            console.error(e);
            showToast('生成失败', 'error');
        }
        setLoading(false);
    };

    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                        <Terminal size={20} />
                    </div>
                    <h3 className="font-bold text-lg">AI 测试用例生成</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">数量:</span>
                    <select
                        className="bg-slate-100 border-none rounded px-2 py-1 text-sm outline-none"
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                    >
                        <option value={3}>3</option>
                        <option value={5}>5</option>
                        <option value={8}>8</option>
                        <option value={10}>10</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                <Button
                    className="w-full bg-purple-600 hover:bg-purple-700 shadow-purple-200"
                    onClick={handleGenerate}
                    disabled={loading || !problemDescription}
                >
                    {loading ? <><Loader2 className="animate-spin mr-2" size={16} /> 正在思考生成 {count} 组数据...</> : <><RefreshCw className="mr-2" size={16} /> 立即生成</>}
                </Button>

                {cases.length > 0 && (
                    <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">预览 (点击保存以应用)</span>
                            <Button size="sm" onClick={() => onSaveCases(cases)} className="h-8 text-xs bg-green-600 hover:bg-green-700">
                                <Save size={14} className="mr-1" /> 保存全部 ({cases.length})
                            </Button>
                        </div>

                        <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 max-h-60 overflow-y-auto space-y-3">
                            {cases.map((c, idx) => (
                                <div key={idx} className="border-b border-slate-700 pb-2 last:border-0 last:pb-0">
                                    <div className="flex gap-2 mb-1">
                                        <span className="text-purple-400 font-bold select-none">$ In_{idx + 1}:</span>
                                        <span className="whitespace-pre-wrap">{c.input}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="text-green-400 font-bold select-none">$ Out_{idx + 1}:</span>
                                        <span className="whitespace-pre-wrap">{c.output}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};
