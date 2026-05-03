import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle, AlertTriangle, Settings } from 'lucide-react';
import { changePassword, getSystemSettings, updateSystemSettings } from '../../services/api';
import { Button } from '../UiComponents';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isTeacherOrAdmin?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isTeacherOrAdmin = false }) => {
    const [activeTab, setActiveTab] = useState<'password' | 'system'>('password');

    // Password State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // System Settings State
    const [aiProvider, setAiProvider] = useState('gemini');
    const [geminiKey, setGeminiKey] = useState('');
    const [geminiModel, setGeminiModel] = useState('gemini-1.5-flash');
    const [siliconKey, setSiliconKey] = useState('');
    const [siliconModel, setSiliconModel] = useState('Pro/deepseek-ai/DeepSeek-V3');
    const [aliyunKey, setAliyunKey] = useState('');
    const [aliyunModel, setAliyunModel] = useState('qwen3.5-flash-2026-02-23');
    const [disableReasoning, setDisableReasoning] = useState(false);

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    useEffect(() => {
        if (isOpen && isTeacherOrAdmin && activeTab === 'system') {
            fetchSettings();
        }
    }, [isOpen, activeTab]);

    const fetchSettings = async () => {
        try {
            const data = await getSystemSettings();
            setAiProvider(data.ai_provider || 'gemini');
            setGeminiKey(data.gemini_api_key || '');
            setGeminiModel(data.gemini_model || 'gemini-1.5-flash');
            setSiliconKey(data.siliconflow_api_key || '');
            setSiliconModel(data.siliconflow_model || 'Pro/deepseek-ai/DeepSeek-V3');
            setAliyunKey(data.aliyun_api_key || '');
            setAliyunModel(data.aliyun_model || 'qwen3.5-flash-2026-02-23');
            setDisableReasoning(data.disable_reasoning === 'true');
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    };

    if (!isOpen) return null;

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setStatus({ type: 'error', msg: '两次输入的新密码不一致' });
            return;
        }

        if (newPassword.length < 6) {
            setStatus({ type: 'error', msg: '新密码长度至少需要6位' });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            await changePassword({ oldPassword, newPassword });
            setStatus({ type: 'success', msg: '密码修改成功' });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                onClose();
                setStatus(null);
            }, 1500);
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.response?.data?.message || '修改失败，请检查旧密码' });
        } finally {
            setLoading(false);
        }
    };

    const handleSystemSettingsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            await updateSystemSettings({
                ai_provider: aiProvider,
                gemini_api_key: geminiKey,
                gemini_model: geminiModel,
                siliconflow_api_key: siliconKey,
                siliconflow_model: siliconModel,
                aliyun_api_key: aliyunKey,
                aliyun_model: aliyunModel,
                disable_reasoning: disableReasoning ? 'true' : 'false'
            });
            setStatus({ type: 'success', msg: '系统设置保存成功' });
            setTimeout(() => {
                setStatus(null);
            }, 2000);
        } catch (err: any) {
            setStatus({ type: 'error', msg: err.response?.data?.message || '保存失败' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Lock size={18} className="text-blue-500" />
                        系统设置
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                {isTeacherOrAdmin && (
                    <div className="flex border-b border-slate-200 px-6">
                        <button
                            className={`py-3 px-4 font-medium text-sm border-b-2 transition ${activeTab === 'password' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            onClick={() => { setActiveTab('password'); setStatus(null); }}
                        >
                            修改密码
                        </button>
                        <button
                            className={`py-3 px-4 font-medium text-sm border-b-2 transition ${activeTab === 'system' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                            onClick={() => { setActiveTab('system'); setStatus(null); }}
                        >
                            AI 模型配置
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {status && (
                        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                            {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                            {status.msg}
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">当前密码</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="请输入当前使用的密码"
                                    value={oldPassword}
                                    onChange={e => setOldPassword(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">新密码</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="至少 6 位字符"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">确认新密码</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="再次输入新密码"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" disabled={loading} className="w-full justify-center">
                                    {loading ? '提交中...' : '确认修改'}
                                </Button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'system' && isTeacherOrAdmin && (
                        <form onSubmit={handleSystemSettingsSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">AI 提供商</label>
                                <select
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition bg-white"
                                    value={aiProvider}
                                    onChange={e => setAiProvider(e.target.value)}
                                >
                                    <option value="gemini">Google Gemini</option>
                                    <option value="siliconflow">硅基流动 (SiliconFlow)</option>
                                    <option value="aliyun">阿里云百炼 (Qwen)</option>
                                </select>
                            </div>

                            {aiProvider === 'gemini' && (
                                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Gemini API Key</label>
                                        <input
                                            type="password"
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            placeholder="留空则使用服务器环境变量"
                                            value={geminiKey}
                                            onChange={e => setGeminiKey(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">文本模型名称</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            placeholder="gemini-1.5-flash"
                                            value={geminiModel}
                                            onChange={e => setGeminiModel(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {aiProvider === 'siliconflow' && (
                                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">SiliconFlow API Key</label>
                                        <input
                                            type="password"
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            placeholder="sk-..."
                                            value={siliconKey}
                                            onChange={e => setSiliconKey(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">文本模型选择</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                                            value={siliconModel}
                                            onChange={e => setSiliconModel(e.target.value)}
                                        >
                                            <option value="Pro/deepseek-ai/DeepSeek-V3">Pro/deepseek-ai/DeepSeek-V3 (推荐)</option>
                                            <option value="deepseek-ai/DeepSeek-V3">deepseek-ai/DeepSeek-V3 (免费版)</option>
                                            <option value="stepfun-ai/Step-3.5-Flash">stepfun-ai/Step-3.5-Flash (阶跃星辰)</option>
                                            <option value="Pro/MiniMaxAI/MiniMax-M2.5">Pro/MiniMaxAI/MiniMax-M2.5</option>
                                            <option value="Pro/zai-org/GLM-5">Pro/zai-org/GLM-5</option>
                                            <option value="Pro/zai-org/GLM-4.7">Pro/zai-org/GLM-4.7</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {aiProvider === 'aliyun' && (
                                <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">Aliyun API Key</label>
                                        <input
                                            type="password"
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                            placeholder="sk-..."
                                            value={aliyunKey}
                                            onChange={e => setAliyunKey(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-600 mb-1">文本模型选择</label>
                                        <select
                                            className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                                            value={aliyunModel}
                                            onChange={e => setAliyunModel(e.target.value)}
                                        >
                                            <option value="qwen3.5-flash-2026-02-23">qwen3.5-flash-2026-02-23 (推荐, 快速)</option>
                                            <option value="qwen3.5-plus-2026-02-15">qwen3.5-plus-2026-02-15 (强大)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 pb-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${disableReasoning ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                        {disableReasoning && <CheckCircle size={14} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={disableReasoning}
                                        onChange={(e) => setDisableReasoning(e.target.checked)}
                                    />
                                    <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 transition">
                                        关闭深度推理模式 (极速响应)
                                    </span>
                                </label>
                                <p className="text-xs text-slate-400 mt-1 ml-7">
                                    开启此项后，模型在响应 AI 助教请求时将不生成 &lt;think&gt; 过程，以舍弃一部分复杂推理能力换取超高响应速度。
                                </p>
                            </div>

                            <div className="pt-2">
                                <Button type="submit" disabled={loading} className="w-full justify-center">
                                    {loading ? '保存中...' : '保存 AI 配置'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
