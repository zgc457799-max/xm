import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MessageSquare, Send, Trash2, User as UserIcon, Heart, ThumbsUp, Loader2, MoreHorizontal } from 'lucide-react';
import { getComments, addComment, deleteComment, toggleCommentLike } from '../../services/api';
import { User } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import 'katex/dist/katex.min.css'; // Import KaTeX styles
import { Search as SearchIcon, Code as CodeIcon, ChevronDown, ChevronUp, Maximize, Minimize } from 'lucide-react';

interface Comment {
    id: number;
    user_id: string;
    user_name: string;
    user_avatar: string | null;
    user_role: string;
    content: string;
    likes: number;
    is_liked?: boolean;
    created_at: string;
}


const MarkdownCodeBlock = ({ inline, className, children, showToast, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    // 修复：递归提取所有文本内容，避免 String([object Object]) 的问题
    const extractText = (node: any): string => {
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(extractText).join('');
        if (node?.props?.children) return extractText(node.props.children);
        return '';
    };
    const codeContent = extractText(children).replace(/\n$/, '');
    const isTrulyBlock = !inline && (codeContent.includes('\n') || codeContent.length > 20);

    const handleCopy = () => {
        if (copied) return;
        try {
            navigator.clipboard.writeText(codeContent).then(() => {
                setCopied(true);
                if (showToast) showToast('代码已复制', 'success');
                setTimeout(() => setCopied(false), 2000);
            }).catch(() => {
                // fallback
                const el = document.createElement('textarea');
                el.value = codeContent;
                el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
                document.body.appendChild(el);
                el.focus();
                el.select();
                document.execCommand('copy');
                el.remove();
                setCopied(true);
                if (showToast) showToast('代码已复制', 'success');
                setTimeout(() => setCopied(false), 2000);
            });
        } catch {
            if (showToast) showToast('复制失败', 'error');
        }
    };

    if (inline || !isTrulyBlock) {
        return (
            <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[0.95em] border border-slate-200 font-bold mx-0.5" {...props}>
                {children}
            </code>
        );
    }

    return (
        <div className="not-prose my-4 rounded-xl overflow-hidden border border-slate-700 bg-[#1e1e1e] shadow-lg transition-all w-full relative">
            <div className="bg-[#2d2d2d] px-3 py-1.5 border-b border-slate-700 flex justify-between items-center select-none gap-4 relative z-20">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400/60"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-400/60"></div>
                        <div className="w-2 h-2 rounded-full bg-green-400/60"></div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{match ? match[1] : 'code'}</span>
                </div>
                <button
                    className="text-[10px] hover:text-blue-300 transition-all bg-blue-500/10 px-3 py-1.5 rounded border active:scale-90 font-medium min-w-[64px] justify-center relative z-30 cursor-pointer pointer-events-auto text-blue-400 border-blue-500/20"
                    onClick={handleCopy}
                    style={copied ? { color: '#4ade80', borderColor: '#4ade8066' } : {}}
                >
                    {copied ? '已复制!' : '复制代码'}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[13px] m-0 leading-relaxed font-mono text-slate-200 scroll-smooth relative z-10">
                <code className={className} {...props}>
                    {children}
                </code>
            </pre>
        </div>
    );
};

interface DiscussionSectionProps {
    problemId: string;
    currentUser: User;
    showToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const DiscussionSection: React.FC<DiscussionSectionProps> = ({ problemId, currentUser, showToast }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaConfig, setCaptchaConfig] = useState({ q: '', a: 0 });
    const [captchaInput, setCaptchaInput] = useState('');
    const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
    const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
    const [isInputExpanded, setIsInputExpanded] = useState(false);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [modalCode, setModalCode] = useState('');
    const COMMENT_LIMIT = 2000; // Increased to 2000 as requested

    const scrollRef = useRef<HTMLDivElement>(null);

    const markdownComponents = useMemo(() => ({
        code({ node, inline, className, children, ...props }: any) {
            return <MarkdownCodeBlock inline={inline} className={className} showToast={showToast} {...props}>{children}</MarkdownCodeBlock>;
        }
    }), [showToast]);

    useEffect(() => {
        setPage(1);
        setComments([]);
        loadComments(1, true);
    }, [problemId]);

    const loadComments = async (pageNum: number, isInitial = false) => {
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const data = await getComments(problemId, pageNum, 10);
            if (isInitial) {
                setComments(data.comments);
            } else {
                setComments(prev => [...prev, ...data.comments]);
            }
            setTotal(data.total);
            setHasMore(data.comments.length === 10);
        } catch (error) {
            console.error("Failed to load comments", error);
        }
        setIsLoading(false);
    };

    const generateCaptcha = () => {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        const ops = ['+', '-', '*'];
        const op = ops[Math.floor(Math.random() * ops.length)];
        let res = 0;
        if (op === '+') res = a + b;
        else if (op === '-') res = a - b;
        else res = a * b;
        setCaptchaConfig({ q: `${a} ${op} ${b} = ?`, a: res });
        setShowCaptcha(true);
        setCaptchaInput('');
        setIsCaptchaVerified(false);
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        // If captcha is shown, validate it (redundant but safe if they bypass verify button)
        if (showCaptcha && !isCaptchaVerified) {
            if (parseInt(captchaInput) !== captchaConfig.a) {
                setErrorMsg('验证码错误，请重试。');
                generateCaptcha();
                return;
            }
        }

        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            await addComment(problemId, newComment, isCaptchaVerified);
            setNewComment('');
            setShowCaptcha(false);
            setIsCaptchaVerified(false);
            setPage(1);
            loadComments(1, true);
        } catch (error: any) {
            console.error("Failed to post comment", error);
            if (error.response?.data?.code === 'LIMIT_EXCEEDED') {
                setErrorMsg('您今日发帖已达上限，请输入验证码以继续。');
                generateCaptcha();
            } else {
                setErrorMsg('评论发布失败，请稍后重试。');
            }
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("确定要删除这条评论吗？")) return;
        try {
            await deleteComment(id);
            setComments(prev => prev.filter(c => c.id !== id));
            setTotal(prev => prev - 1);
        } catch (error) {
            console.error("Failed to delete comment", error);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedComments(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const openCodeModal = () => {
        setModalCode('');
        setShowCodeModal(true);
    };

    const confirmInsertCode = () => {
        if (!modalCode.trim()) {
            setShowCodeModal(false);
            return;
        }

        const lang = modalCode.trim().startsWith('#include') ? 'cpp' : 'cpp'; // Defaulting to cpp for now
        const wrapped = `\n\`\`\`${lang}\n${modalCode.trim()}\n\`\`\`\n`;

        const textarea = document.querySelector('textarea');
        const cursorPosition = (textarea as any)?.selectionStart || newComment.length;
        const before = newComment.substring(0, cursorPosition);
        const after = newComment.substring(cursorPosition);

        setNewComment(`${before}${wrapped}${after}`);
        setShowCodeModal(false);
        if (showToast) showToast('代码已成功插入并包装', 'success');

        setTimeout(() => {
            if (textarea) textarea.focus();
        }, 100);
    };

    const loadMore = () => {
        if (isLoading || !hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        loadComments(nextPage);
    };

    const handleLike = async (id: number) => {
        try {
            const data = await toggleCommentLike(id);
            setComments(prev => prev.map(c =>
                c.id === id ? { ...c, is_liked: data.liked, likes: data.likes } : c
            ));
        } catch (error) {
            console.error("Failed to toggle like", error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-500" />
                    讨论区 ({total})
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={scrollRef}>
                {comments.length === 0 && !isLoading ? (
                    <div className="text-center text-slate-400 py-12 flex flex-col items-center gap-2">
                        <MessageSquare size={48} className="opacity-10" />
                        <p className="text-sm">还没有人发言，快来抢沙发吧！</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            {comments.map(comment => (
                                <div key={comment.id} className={`p-5 rounded-xl border transition-all duration-300 animate-fade-in group relative shadow-sm hover:shadow-md bg-white ${currentUser.id === comment.user_id
                                    ? 'border-l-4 border-l-blue-500 border-y-slate-100 border-r-slate-100'
                                    : comment.user_role === 'teacher'
                                        ? 'border-l-4 border-l-purple-500 border-y-slate-100 border-r-slate-100'
                                        : 'border-l-4 border-l-transparent border-slate-100 hover:border-slate-200'
                                    }`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm transition-transform group-hover:scale-105">
                                                {comment.user_avatar ? (
                                                    <img src={comment.user_avatar} alt={comment.user_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className={`w-full h-full flex items-center justify-center ${comment.user_role === 'teacher' ? 'text-purple-600' : 'text-slate-400'}`}>
                                                        <UserIcon size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800 text-sm tracking-tight">{comment.user_name}</span>
                                                    {comment.user_role === 'teacher' && (
                                                        <span className="px-2 py-0.5 border border-purple-200 text-purple-600 bg-purple-50 text-[9px] rounded font-black shadow-sm">认证教师</span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                                                    <span className="inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                                                    {new Date(comment.created_at).toLocaleString('zh-CN', { hour12: false })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(currentUser.id === comment.user_id || currentUser.role === 'teacher') && (
                                                <button
                                                    onClick={() => handleDelete(comment.id)}
                                                    className="text-slate-300 hover:text-red-500 transition-all p-1.5 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100"
                                                    title="删除"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleLike(comment.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${comment.is_liked ? 'text-rose-500 bg-rose-50 border border-rose-100' : 'text-slate-400 bg-slate-50 border border-slate-100 hover:border-slate-200'}`}
                                            >
                                                <Heart size={14} fill={comment.is_liked ? "currentColor" : "none"} className={comment.is_liked ? "animate-pulse" : ""} />
                                                {comment.likes > 0 && <span>{comment.likes}</span>}
                                            </button>
                                        </div>
                                    </div>
                                    <div className={`relative ${!expandedComments.has(comment.id) && comment.content.length > 300 ? 'max-h-[300px] overflow-hidden' : ''}`}>
                                        <div className="text-sm text-slate-700 leading-relaxed pl-2 break-words overflow-hidden prose prose-sm prose-slate max-w-none prose-p:my-2 prose-pre:bg-transparent prose-pre:p-0">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
                                                rehypePlugins={[rehypeKatex]}
                                                components={markdownComponents}
                                            >
                                                {comment.content}
                                            </ReactMarkdown>
                                        </div>
                                        {!expandedComments.has(comment.id) && comment.content.length > 300 && (
                                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                                        )}
                                    </div>
                                    {comment.content.length > 300 && (
                                        <div className="flex justify-center mt-3 pt-3 border-t border-slate-50/50">
                                            <button
                                                onClick={() => toggleExpand(comment.id)}
                                                className="text-[11px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 bg-slate-100/50 hover:bg-blue-50 px-4 py-1.5 rounded-full transition-all border border-transparent hover:border-blue-100"
                                            >
                                                {expandedComments.has(comment.id) ? (
                                                    <><ChevronUp size={14} /> 收起全文</>
                                                ) : (
                                                    <><ChevronDown size={14} /> 展开讨论</>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {hasMore && (
                            <div className="flex flex-col items-center gap-3 pt-2 pb-8">
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    已显示 {comments.length} 条 / 共 {total} 条
                                </div>
                                <button
                                    onClick={loadMore}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:shadow-md transition-all disabled:opacity-50 group"
                                >
                                    {isLoading ? <Loader2 size={14} className="animate-spin text-blue-500" /> : <MoreHorizontal size={14} className="group-hover:rotate-90 transition-transform" />}
                                    {isLoading ? '正在努力加载...' : '加载更多精彩评论'}
                                </button>
                            </div>
                        )}

                        {isLoading && page === 1 && (
                            <div className="text-center text-slate-400 py-8">加载中...</div>
                        )}
                    </>
                )}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={openCodeModal}
                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all border border-blue-100"
                        >
                            <CodeIcon size={14} /> 插入代码
                        </button>
                        <button
                            onClick={() => setIsInputExpanded(!isInputExpanded)}
                            className={`p-1 rounded-lg transition-colors ${isInputExpanded ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
                            title={isInputExpanded ? "还原窗口" : "展开窗口"}
                        >
                            {isInputExpanded ? <Minimize size={14} /> : <Maximize size={14} />}
                        </button>
                    </div>
                    <div className={`text-[10px] font-bold ${newComment.length > COMMENT_LIMIT ? 'text-red-500' : 'text-slate-400'}`}>
                        {newComment.length} / {COMMENT_LIMIT}
                    </div>
                </div>
                {errorMsg && (
                    <div className="mb-2 px-3 py-1.5 bg-red-50 border border-red-100 text-red-600 text-[11px] rounded flex items-center justify-between animate-shake">
                        <span>{errorMsg}</span>
                        <button onClick={() => setErrorMsg(null)} className="font-bold opacity-50 hover:opacity-100">×</button>
                    </div>
                )}
                {showCaptcha && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between animate-fade-in group">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-blue-700">验证码:</span>
                            <span className="text-sm font-mono font-bold bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-sm">{captchaConfig.q}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={captchaInput}
                                onChange={(e) => setCaptchaInput(e.target.value)}
                                placeholder="输入答案"
                                className="w-24 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (parseInt(captchaInput) === captchaConfig.a) {
                                        setIsCaptchaVerified(true);
                                        setShowCaptcha(false);
                                        if (showToast) showToast('验证成功，现在可以发布了', 'success');
                                    } else {
                                        if (showToast) showToast('验证码错误，请重新计算', 'error');
                                        else alert('验证码错误');
                                        generateCaptcha();
                                    }
                                }}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition shadow-sm font-bold"
                            >
                                确定验证
                            </button>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="flex-1 relative group">
                        <textarea
                            rows={1}
                            value={newComment}
                            onChange={(e) => {
                                if (e.target.value.length <= COMMENT_LIMIT + 100) { // Slight buffer for typing
                                    setNewComment(e.target.value);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (newComment.length <= COMMENT_LIMIT) {
                                        handleSubmit(e as any);
                                    }
                                }
                            }}
                            placeholder="分享你的解题思路... (支持 Markdown)"
                            className={`w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none ${isInputExpanded ? 'min-h-[200px]' : 'min-h-[40px] max-h-[120px]'}`}
                            disabled={isSubmitting}
                            maxLength={COMMENT_LIMIT}
                        />
                        <div className="hidden group-focus-within:block absolute -top-8 right-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-in fade-in slide-in-from-bottom-1">
                            Shift + Enter 换行 / Enter 发送
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim() || newComment.length > COMMENT_LIMIT}
                        className="h-10 w-10 shrink-0 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center shadow-md shadow-blue-100"
                    >
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </form>
            </div>

            {/* Code Insertion Modal */}
            {showCodeModal && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                <CodeIcon size={18} className="text-blue-500" />
                                粘贴代码片段
                            </h4>
                            <button onClick={() => setShowCodeModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
                        </div>
                        <div className="p-5">
                            <p className="text-[11px] text-slate-500 mb-3">代码将被自动包裹在 Markdown 代码块中，并保留格式。</p>
                            <textarea
                                value={modalCode}
                                onChange={(e) => setModalCode(e.target.value)}
                                placeholder="在这里粘贴你的代码..."
                                className="w-full h-64 p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none custom-scrollbar"
                                autoFocus
                            />
                        </div>
                        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/30">
                            <button
                                onClick={() => setShowCodeModal(false)}
                                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmInsertCode}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-md shadow-blue-100"
                            >
                                确认插入
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
