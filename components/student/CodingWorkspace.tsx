
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronRight, Play, CheckCircle, Plus, Brain, FileText, Zap, Layers, BookOpen, AlertCircle, Terminal, RotateCcw, Bug, Cloud, RefreshCw, MessageSquare, PanelRightClose, PanelRightOpen, Heart, ThumbsUp, Maximize2, X, Sparkles } from 'lucide-react';
import Editor, { loader } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import { Problem, User, Contest } from '../../types';
import { Button, DifficultyBadge, IconButton } from '../UiComponents';
import { DiscussionSection } from './DiscussionSection';
import { analyzeProblem, getAIHint, getLogicFlowchart, analyzeError, submitCode, getSubmission, validateProblem } from '../../services/api';
import { MobileSymbolBar } from './MobileSymbolBar';

// Configure Monaco Loader to use a reliable CDN
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.46.0/min/vs' } });

// Configure Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose', // Allow HTML and complex styles
  flowchart: {
    htmlLabels: true,
    padding: 40, // Increase padding even more
    useMaxWidth: false,
    curve: 'basis'
  },
  themeVariables: {
    primaryColor: '#eff6ff', // blue-50
    primaryTextColor: '#1e293b', // slate-800
    primaryBorderColor: '#3b82f6', // blue-500
    lineColor: '#64748b', // slate-500
    secondaryColor: '#f8fafc', // slate-50
    tertiaryColor: '#ffffff', // white
    fontFamily: 'arial, sans-serif', // Use more standard font to ensure calculation matches display
    fontSize: '14px',
  }
});

type SupportedLang = 'c' | 'cpp' | 'python' | 'java';

const DEFAULT_CODE_MAP: Record<SupportedLang, string> = {
  c: `#include <stdio.h>\n\nint main() {\n    // Write C code here\n    printf("Hello World!\\n");\n    return 0;\n}`,
  cpp: `#include <iostream>\n\nusing namespace std;\n\nint main() {\n    // Write C++ code here\n    cout << "Hello World!" << endl;\n    return 0;\n}`,
  python: `def main():\n    # Write Python code here\n    print("Hello World!")\n\nif __name__ == "__main__":\n    main()`,
  java: `public class Main {\n    public static void main(String[] args) {\n        // Write Java code here\n        System.out.println("Hello World!");\n    }\n}`
};

// Internal Mermaid Component
const MermaidChart = ({ code }: { code: string }) => {
  const [svg, setSvg] = useState<string>('');
  const [renderError, setRenderError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      if (!code) return;
      setRenderError(false);
      try {
        // Clean code: remove potential markdown markers if backend service didn't catch them
        let cleanCode = code.replace(/```mermaid/g, '').replace(/```/g, '').trim();

        // Robustness fix: Handle escaped quotes that break Mermaid rendering in some environments
        // If we have "foo: \"bar\"", Mermaid might fail. Better to replace with single quotes.
        cleanCode = cleanCode.replace(/\\"/g, "'");

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, cleanCode);
        if (isMounted) setSvg(svg);
      } catch (error) {
        console.error("Mermaid parsing failed:", error);
        if (isMounted) setRenderError(true);
      }
    };

    renderDiagram();

    return () => { isMounted = false; };
  }, [code]);

  if (renderError) {
    return (
      <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-600 text-xs">
        <div className="flex items-center gap-2 font-bold mb-2">
          <AlertCircle size={14} />
          <span>流程图渲染失败</span>
        </div>
        <p className="opacity-80 mb-2">可能是生成的语法不正确，原始代码如下：</p>
        <pre className="whitespace-pre-wrap font-mono bg-white p-3 rounded border border-red-100 text-slate-600">{code}</pre>
      </div>
    );
  }

  return (
    <div
      className="mermaid-container bg-white p-10 rounded-xl border border-slate-200 shadow-sm overflow-visible flex justify-center animate-fade-in"
      style={{
        minWidth: 'fit-content',
        fontFamily: 'arial, sans-serif' // Explicitly match mermaid init font
      }}
    >
      <style>{`
        .mermaid-container svg {
          overflow: visible !important;
          max-width: none !important;
        }
        .mermaid-container .label {
          font-family: arial, sans-serif !important;
          color: #1e293b !important;
        }
        .mermaid-container .node rect, .mermaid-container .node polygon {
          stroke-width: 1.5px !important;
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
};

const MarkdownCodeBlockWorkspace = ({ inline, className, children, showToast, ...props }: any) => {
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

  // 核心逻辑：如果 AI 将本应是行内代码的内容（超短且单行）误传为代码块，我们手动将其降级为行内渲染，以节省空间
  const isTrulyBlock = !inline && (codeContent.includes('\n') || codeContent.length > 15);

  const handleCopy = () => {
    if (copied) return;
    navigator.clipboard.writeText(codeContent).then(() => {
      setCopied(true);
      if (showToast) showToast('代码已复制', 'success');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
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
  };

  if (inline || !isTrulyBlock) {
    return (
      <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono text-[0.95em] border border-slate-200 font-bold mx-0.5" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="not-prose my-3 rounded-xl overflow-hidden border border-slate-700 bg-[#1e1e1e] shadow-lg transition-all w-full">
      <div className="bg-[#2d2d2d] px-3 py-1.5 border-b border-slate-700 flex justify-between items-center select-none gap-4">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-red-400/60"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-400/60"></div>
            <div className="w-2 h-2 rounded-full bg-green-400/60"></div>
          </div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{match ? match[1] : 'code'}</span>
        </div>
        <button
          className="text-[10px] hover:text-blue-300 transition-all bg-blue-500/10 px-3 py-1.5 rounded border active:scale-90 font-medium min-w-[64px] justify-center text-blue-400 border-blue-500/20"
          onClick={handleCopy}
          style={copied ? { color: '#4ade80', borderColor: '#4ade8066' } : {}}
        >
          {copied ? '已复制!' : '复制代码'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] m-0 leading-relaxed font-mono text-slate-200">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};

interface CodingWorkspaceProps {
  user: User;
  problem: Problem;
  onBack: () => void;
  isInMistakeBook: boolean;
  onToggleMistake: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
  isContestMode?: boolean;
  contest?: Contest;
  onPrevProblem?: () => void;
  onNextProblem?: () => void;
  onSubmissionComplete?: () => void;
  hideDescription?: boolean;
  theme?: 'light' | 'dark';
}

export const CodingWorkspace: React.FC<CodingWorkspaceProps> = ({
  user,
  problem,
  onBack,
  isInMistakeBook,
  onToggleMistake,
  showToast,
  isContestMode = false,
  contest,
  onPrevProblem,
  onNextProblem,
  onSubmissionComplete,
  hideDescription = false,
  theme = 'dark'
}) => {
  const isDark = theme !== 'light';
  const [activeRightTab, setActiveRightTab] = useState<'ai' | 'discuss'>('ai');
  // Mobile Responsiveness
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // check on mount
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const insertTextAtCursor = (text: string) => {
    if (editorRef.current && monacoRef.current) {
      const editor = editorRef.current;
      const selection = editor.getSelection();
      const range = new monacoRef.current.Range(
        selection.startLineNumber,
        selection.startColumn,
        selection.endLineNumber,
        selection.endColumn
      );
      const id = { major: 1, minor: 1 };
      const textEdit = { identifier: id, range: range, text: text, forceMoveMarkers: true };
      editor.executeEdits("my-source", [textEdit]);
      
      // Auto reposition cursor if brackets
      if (text === '{}' || text === '()' || text === '[]') {
        const newPos = {
          lineNumber: selection.startLineNumber,
          column: selection.startColumn + 1
        };
        editor.setSelection(new monacoRef.current.Selection(
          newPos.lineNumber, newPos.column, newPos.lineNumber, newPos.column
        ));
      }
      
      editor.focus();
    }
  };

  // Layout & UI State
  // Default open sidebar in workspace/playground mode IF NOT on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  
  // Update sidebar state when mobile state is detected
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else if (hideDescription) {
      // In playground mode on desktop, default to open
      setIsSidebarOpen(true);
    }
  }, [isMobile, hideDescription]);

  const [splits, setSplits] = useState({ 
    left: hideDescription ? 0 : 25, 
    editor: 70, 
    sidebar: 450 
  }); 

  const markdownComponents = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      return <MarkdownCodeBlockWorkspace inline={inline} className={className} showToast={showToast} {...props}>{children}</MarkdownCodeBlockWorkspace>;
    }
  }), [showToast]);

  const [isEnded, setIsEnded] = useState(() => {
    if (!contest) return false;
    return new Date() > new Date(contest.endTime);
  });

  useEffect(() => {
    if (!contest || isEnded) return;

    const interval = setInterval(() => {
      if (new Date() > new Date(contest.endTime)) {
        setIsEnded(true);
        showToast("比赛已结束，停止作答", "info");
        clearInterval(interval);
      }
    }, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, [contest, isEnded, showToast]);

  const canSubmit = !isEnded && (!contest || !contest.isSubmitted);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      console.log('Global paste event detected', e.clipboardData?.getData('text'));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const target = e.target as HTMLElement;
        // Only intercept if we are in the editor area or the body
        if (target.classList.contains('view-lines') || target.tagName === 'BODY' || target.closest('.monaco-editor')) {
          console.log('Intercepting Ctrl+V for manual paste');
          e.preventDefault();
          handleManualPaste();
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleManualPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (editorRef.current) {
        const selection = editorRef.current.getSelection();
        if (!selection) return;
        const range = new monacoRef.current.Range(
          selection.startLineNumber,
          selection.startColumn,
          selection.endLineNumber,
          selection.endColumn
        );
        editorRef.current.executeEdits('manual-paste', [
          { range, text, forceMoveMarkers: true }
        ]);
        showToast("已从剪贴板粘贴", "success");
      }
    } catch (err) {
      console.error('Failed to read clipboard', err);
      showToast("粘贴失败，请授权剪贴板访问权限", "error");
    }
  };


  const [aiOutput, setAiOutput] = useState<{ type: string, content: string } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showFlowchartZoom, setShowFlowchartZoom] = useState(false); // Zoom Modal state
  const [showAiCompare, setShowAiCompare] = useState(false); // AI Compare Modal state
  // Cache for AI results: {concept: string, hint: string, ... }
  const [aiCache, setAiCache] = useState<Record<string, string>>({});

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<{ type: 'info' | 'error' | 'success', text: string }[]>([]);
  const [executionOutput, setExecutionOutput] = useState<{ stdout: string | null, stderr: string | null } | null>(null);
  const [manualInput, setManualInput] = useState<string>("");
  const [isManualMode, setIsManualMode] = useState<boolean>(hideDescription || false);

  // Editor State
  const [language, setLanguage] = useState<SupportedLang>('c');
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const debounceTimer = useRef<any>(null);

  // Storage Keys (Scoped by User and Mode)
  const isPlayground = hideDescription || problem.id === 'playground';
  const storageSuffix = isPlayground ? 'playground' : problem.id;
  const codeStorageKey = `educode_workspace_${user.id}_${storageSuffix}`;
  const aiCacheKey = `educode_ai_cache_${user.id}_${storageSuffix}`;

  // Load initial code from localStorage
  const [codeMap, setCodeMap] = useState<Record<SupportedLang, string>>(() => {
    try {
      const saved = localStorage.getItem(codeStorageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load code from storage", e);
    }
    return DEFAULT_CODE_MAP;
  });

  // Load AI cache from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(aiCacheKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAiCache(parsed);
        // If there's a cached concept, show it by default if nothing else is showing
        if (parsed.concept && !aiOutput) {
          setAiOutput({ type: 'concept', content: parsed.concept });
        }
      }
    } catch (e) {
      console.error("Failed to load AI cache", e);
    }
  }, [problem.id, aiCacheKey]);

  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save Code
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(codeStorageKey, JSON.stringify(codeMap));
      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [codeMap, codeStorageKey]);

  // Helper to update AI Cache
  const updateAiCache = (type: string, content: string) => {
    const newCache = { ...aiCache, [type]: content };
    setAiCache(newCache);
    localStorage.setItem(aiCacheKey, JSON.stringify(newCache));
  };

  const currentCode = codeMap[language];
  const currentPath = {
    c: 'main.c',
    cpp: 'main.cpp',
    python: 'main.py',
    java: 'Main.java'
  }[language];

  // --- Client Side Validator (Linter) ---
  const validateCode = useCallback((code: string, lang: SupportedLang) => {
    if (!monacoRef.current || !editorRef.current) return [];

    const markers: any[] = [];
    const model = editorRef.current.getModel();
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;

      if (!trimmed) return;
      // Skip comments
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

      // C/C++/Java Heuristics
      if (lang === 'c' || lang === 'cpp' || lang === 'java') {
        // Skip includes/imports
        if (trimmed.startsWith('#include') || trimmed.startsWith('import') || trimmed.startsWith('package')) return;

        const lastChar = trimmed.slice(-1);
        // Common syntax error: Statement not ending in semicolon, brace, or specific keywords
        // This is a rough heuristic for demo purposes
        const isControlStatement = trimmed.startsWith('if') || trimmed.startsWith('else') || trimmed.startsWith('for') || trimmed.startsWith('while') || trimmed.startsWith('switch') || trimmed.startsWith('case') || trimmed.startsWith('default');

        if (!isControlStatement && ![';', '{', '}', ')', ':'].includes(lastChar)) {
          // Check for specific variable declarations or function calls that definitely need semicolons
          if ((trimmed.startsWith('int ') || trimmed.startsWith('float ') || trimmed.startsWith('double ') || trimmed.startsWith('char ') || trimmed.startsWith('String ') || trimmed.startsWith('return') || trimmed.startsWith('printf') || trimmed.startsWith('System.out') || trimmed.startsWith('cout'))) {
            markers.push({
              startLineNumber: lineNum,
              startColumn: 1,
              endLineNumber: lineNum,
              endColumn: line.length + 1,
              message: 'Syntax Error: Expected \';\' at end of statement',
              severity: 8 // MarkerSeverity.Error
            });
          }
        }
      }

      // Python Heuristics
      if (lang === 'python') {
        const needsColon = trimmed.startsWith('def ') || trimmed.startsWith('if ') || trimmed.startsWith('elif ') || trimmed.startsWith('else') || trimmed.startsWith('for ') || trimmed.startsWith('while ') || trimmed.startsWith('class ');
        if (needsColon && !trimmed.endsWith(':')) {
          markers.push({
            startLineNumber: lineNum,
            startColumn: 1,
            endLineNumber: lineNum,
            endColumn: line.length + 1,
            message: 'Syntax Error: Expected \':\'',
            severity: 8 // MarkerSeverity.Error
          });
        }
      }
    });

    monacoRef.current.editor.setModelMarkers(model, 'owner', markers);
    return markers;
  }, []);

  const handleCodeChange = (value: string | undefined) => {
    const val = value || '';
    setCodeMap(prev => ({ ...prev, [language]: val }));
    setIsSaving(true);

    // Debounce validation (500ms)
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      validateCode(val, language);
    }, 500);
  };

  const handleResetCode = () => {
    if (window.confirm('确定要重置当前语言的代码吗？')) {
      const newCode = DEFAULT_CODE_MAP[language];
      setCodeMap(prev => ({ ...prev, [language]: newCode }));
      setIsSaving(true);
      // Trigger validation after reset
      setTimeout(() => validateCode(newCode, language), 100);
    }
  };

  // --- Resizable Layout State ---
  // Resize Logic
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<'left' | 'editor' | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      if (isDragging.current === 'left') {
        const x = e.clientX - rect.left;
        const p = (x / rect.width) * 100;
        setSplits(prev => ({ ...prev, left: Math.min(Math.max(p, 15), 50) }));
      } else if (isDragging.current === 'editor') {
        const y = e.clientY - rect.top;
        const p = (y / rect.height) * 100;
        setSplits(prev => ({ ...prev, editor: Math.min(Math.max(p, 20), 85) }));
      } else if (isDragging.current === 'sidebar' && isSidebarOpen) {
        const x = rect.right - e.clientX;
        setSplits(prev => ({ ...prev, sidebar: Math.min(Math.max(x, 280), 800) }));
      }
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = null;
        document.body.style.cursor = 'default';
        document.body.style.userSelect = 'auto';
        const frames = document.querySelectorAll('iframe');
        frames.forEach(f => f.style.pointerEvents = 'auto');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, []);

  const startDrag = (divider: 'left' | 'editor' | 'sidebar') => {
    isDragging.current = divider;
    document.body.style.cursor = divider === 'editor' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
    const frames = document.querySelectorAll('iframe');
    frames.forEach(f => f.style.pointerEvents = 'none');
  };

  // --- Autocomplete Logic (Monaco) ---
  const completionDisposables = useRef<any[]>([]);
  useEffect(() => {
    return () => {
      completionDisposables.current.forEach(d => d.dispose());
    };
  }, []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Focus for better UX and interaction
    editor.focus();

    // Deep interception for environment isolation
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      console.log('Monaco Command: Ctrl+V detected');
      handleManualPaste();
    });

    // Trigger initial validation
    setTimeout(() => validateCode(currentCode, language), 500);

    try {
      completionDisposables.current.forEach(d => d.dispose());
      completionDisposables.current = [];

      if (!monaco || !monaco.languages) return;

      const insertSnippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
      const kindSnippet = monaco.languages.CompletionItemKind.Snippet;
      const kindFunction = monaco.languages.CompletionItemKind.Function;

      const register = (lang: string, suggestions: any[]) => {
        try {
          const d = monaco.languages.registerCompletionItemProvider(lang, {
            provideCompletionItems: () => ({ suggestions: JSON.parse(JSON.stringify(suggestions)) })
          });
          completionDisposables.current.push(d);
        } catch (e) {
          console.warn(`Failed to register snippets for ${lang}`, e);
        }
      };

      register('c', [
        { label: 'main', kind: kindSnippet, insertText: 'int main() {\n\t${1}\n\treturn 0;\n}', insertTextRules: insertSnippet, detail: 'Main Function' },
        { label: 'printf', kind: kindFunction, insertText: 'printf("${1:%s}\\n", ${2});', insertTextRules: insertSnippet, detail: 'Print' }
      ]);
      register('python', [
        { label: 'def', kind: kindSnippet, insertText: 'def ${1:func}(${2:args}):\n\t${3:pass}', insertTextRules: insertSnippet, detail: 'Function' },
        { label: 'print', kind: kindFunction, insertText: 'print(${1})', insertTextRules: insertSnippet, detail: 'Print' }
      ]);
    } catch (error) {
      console.error("Error in editor mount:", error);
    }
  };

  // Re-validate when language changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      validateCode(codeMap[language], language);
    }
  }, [language, codeMap, validateCode]);

  const handleAiAction = async (action: 'concept' | 'hint' | 'flowchart' | 'debug', forceRefresh = false) => {
    setActiveRightTab('ai');
    setIsSidebarOpen(true);

    // 1. Check Cache
    if (!forceRefresh && aiCache[action]) {
      setAiOutput({ type: action, content: aiCache[action] });
      return;
    }

    // 2. Call API
    setIsAiLoading(true);
    setAiOutput(null);

    let result = "";
    try {
      if (action === 'concept') {
        result = await analyzeProblem(problem.description, language);
      } else if (action === 'hint') {
        result = await getAIHint(problem.description, currentCode, language);
      } else if (action === 'flowchart') {
        const conceptCtx = aiCache['concept'] ? `考点分析: ${aiCache['concept']}` : '';
        const hintCtx = aiCache['hint'] ? `思路分析: ${aiCache['hint']}` : '';
        const combinedCtx = [conceptCtx, hintCtx].filter(Boolean).join('\n');
        result = await getLogicFlowchart(problem.description, language, combinedCtx);
      } else if (action === 'debug') {
        const errorText = consoleLogs.filter(l => l.type === 'error').map(l => l.text).join('\n');
        result = await analyzeError(problem.description, currentCode, errorText || executionOutput?.stderr || "Code not running as expected.");
      }

      // 3. Update State & Cache
      if (result && !result.includes("AI 服务当前不可用")) {
        updateAiCache(action, result);
      }
      setAiOutput({ type: action, content: result });
    } catch (e) {
      setAiOutput({ type: 'error', content: 'AI Service Error: Please try again later.' });
    }
    setIsAiLoading(false);
  };

  const isServiceError = (text: string) => text.includes("AI 服务") || text.includes("无法分析");

  const getSimulatedOutput = (code: string, lang: SupportedLang) => {
    let regex;
    if (lang === 'c') regex = /printf\s*\(\s*"([^"]+)"/;
    else if (lang === 'cpp') regex = /cout\s*<<\s*"([^"]+)"/;
    else if (lang === 'python') regex = /print\s*\(\s*["']([^"']+)["']/;
    else regex = /System\.out\.println\s*\(\s*"([^"]+)"/;

    const match = code.match(regex);
    if (match && match[1]) return match[1].replace(/\\n/g, '\n');
    return "Program finished with exit code 0";
  };

  const simulateExecution = async (isSubmit: boolean) => {
    setIsRunning(true);
    setConsoleLogs([{ type: 'info', text: isSubmit ? '正在连接判题实验室...' : '正在准备运行环境...' }]);
    setExecutionOutput(null);

    // Run Playground Test (Dry Run)
    if (!isSubmit) {
      const isManual = hideDescription || isManualMode;
      const testInput = isManual ? manualInput : problem.inputExample;
      const testOutput = isManual ? null : problem.outputExample;

      setConsoleLogs(prev => [...prev, { type: 'info', text: '正在初始化测试环境...' }]);

      if (isManual) {
        setConsoleLogs(prev => [...prev, { type: 'info', text: `[手动输入测试]:\n${testInput || '(无内容)'}` }]);
      } else {
        // Only show problem examples if not in manual mode
        if (!problem.inputExample && !problem.outputExample) {
          setConsoleLogs(prev => [...prev, { type: 'error', text: '警告：当前题目未配置测试样例。' }]);
        } else {
          setConsoleLogs(prev => [...prev,
          { type: 'info', text: `[系统样例输入]:\n${problem.inputExample || '(None)'}` },
          { type: 'info', text: `[预期输出]:\n${problem.outputExample || '(None)'}` }
          ]);
        }
      }

      try {
        const result = await validateProblem({
          code: currentCode,
          language: language,
          testCases: [{ input: testInput, output: testOutput }]
        });

        const isSuccessful = result.status === 'AC' || (isManual && result.status === 'WA');
        if (isSuccessful) {
          setConsoleLogs(prev => [...prev,
          { type: 'success', text: isManual ? 'Execution Finished' : 'Test Passed!' },
          { type: 'info', text: isManual ? `Output:\n${result.first_fail?.actual || '(No Output)'}` : `Output Results:\n${result.first_fail?.actual || 'None'}` }
          ]);
        } else {
          const errorDetail = result.error || result.first_fail?.actual || 'None';
          setConsoleLogs(prev => [...prev,
          { type: 'error', text: isManual ? `Execution ${result.status}` : `Test Failed: ${result.status}` },
          { type: 'error', text: `Details: ${errorDetail}` }
          ]);
        }
      } catch (e) {
        setConsoleLogs(prev => [...prev, { type: 'error', text: '执行失败，请检查网络或代码语法。' }]);
      }
      setIsRunning(false);
      return;
    }

    try {
      const result = await submitCode({
        problem_id: problem.id,
        contest_id: contest?.id,
        language: language,
        code_content: currentCode
      });

      const submissionId = result.submission_id;
      setConsoleLogs(prev => [...prev, { type: 'info', text: `Submission ID: ${submissionId}. Waiting for judge...` }]);

      // Poll for result
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const sub = await getSubmission(submissionId);
          if (sub.status !== 'PENDING') {
            clearInterval(pollInterval);
            setIsRunning(false);

            if (sub.status === 'AC') {
              setConsoleLogs(prev => [...prev, { type: 'success', text: `Result: Accepted (Score: ${sub.score})` }]);
              showToast('恭喜！答案正确 (AC)', 'success');
              if (onSubmissionComplete) onSubmissionComplete();
            } else {
              setConsoleLogs(prev => [...prev, { type: 'error', text: `Result: ${sub.status} (Score: ${sub.score})` }]);
              showToast(`未通过: ${sub.status}`, 'error');
            }

            setExecutionOutput({
              stdout: `Time: ${sub.time_used || 0}ms\nMemory: ${sub.memory_used || 0}KB`,
              stderr: sub.status !== 'AC' ? (sub.error_message || 'Check your logic or syntax.') : null
            });
          } else if (attempts > 20) { // Timeout 20s
            clearInterval(pollInterval);
            setIsRunning(false);
            setConsoleLogs(prev => [...prev, { type: 'error', text: 'Judge Timeout' }]);
          }
        } catch (e) {
          console.error(e);
          clearInterval(pollInterval);
          setIsRunning(false);
        }
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setConsoleLogs(prev => [...prev, { type: 'error', text: 'Submission Failed: ' + (err.response?.data?.message || err.message) }]);
      setIsRunning(false);
    }
  };

  const hasErrors = consoleLogs.some(log => log.type === 'error') || !!executionOutput?.stderr;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'bg-[#18181c]' : 'bg-slate-50'} animate-fade-in fixed inset-0 z-50`}>
      {/* Immersive Header */}
      <div className={`h-14 border-b ${isDark ? 'border-[#2d2d30] bg-[#1e1e1f]' : 'border-slate-200 bg-white'} flex items-center justify-between px-4 flex-shrink-0 shadow-sm`}>
        <div className="flex items-center gap-4">
          <IconButton onClick={onBack} title="返回" className={isDark ? "hover:bg-white/5 text-slate-300 hover:text-white" : ""}>
            <ChevronRight size={20} className="rotate-180" />
          </IconButton>
          <div className="flex items-center gap-3">
            <h2 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{problem.title}</h2>
            <DifficultyBadge level={problem.difficulty} />
          </div>
          {isContestMode && (
            <div className={`flex items-center gap-1 ml-4 border-l ${isDark ? 'border-[#2d2d30]' : 'border-slate-200'} pl-4`}>
              <IconButton onClick={onPrevProblem} title="上一题" disabled={!onPrevProblem} className="h-8 w-8">
                <ChevronRight size={18} className="rotate-180" />
              </IconButton>
              <IconButton onClick={onNextProblem} title="下一题" disabled={!onNextProblem} className="h-8 w-8">
                <ChevronRight size={18} />
              </IconButton>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isEnded && (
            <span className="flex items-center text-red-500 text-xs font-bold mr-2">
              <AlertCircle size={14} className="mr-1" /> 比赛已结束
            </span>
          )}
          {contest?.isSubmitted && (
            <span className="flex items-center text-slate-500 text-xs font-bold mr-2">
              <CheckCircle size={14} className="mr-1" /> 已交卷
            </span>
          )}
          <Button variant="secondary" disabled={isRunning || !canSubmit} onClick={() => simulateExecution(false)} className="text-sm h-9 px-3">
            {isRunning ? <span className="animate-spin mr-1">⏳</span> : <Play size={14} />} 运行测试
          </Button>
          {!hideDescription && (
            <Button disabled={isRunning || !canSubmit} onClick={() => simulateExecution(true)} className="text-sm h-9 px-4 bg-green-600 hover:bg-green-700 shadow-green-200">
              {isRunning ? '评测中...' : '提交代码'}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex overflow-hidden ${isMobile ? 'flex-col overflow-y-auto' : ''}`} ref={containerRef}>

        {/* Left: Description - Conditional Render */}
        {!hideDescription && (
          <div style={{ width: isMobile ? '100%' : `${splits.left}%` }} className={`border-r ${isDark ? 'border-[#2d2d30] bg-[#1e1e1f] text-slate-300' : 'border-slate-200 bg-white text-slate-800'} h-full overflow-y-auto p-6 scroll-smooth shrink-0 ${isMobile ? 'h-1/2 border-b' : ''}`}>
            <div className={`prose ${isDark ? 'prose-invert' : 'prose-slate'} prose-sm max-w-none`}>
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                {problem.description}
              </ReactMarkdown>
              <h4 className={`mt-6 font-semibold border-l-4 border-blue-500 pl-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>输入样例</h4>
              <pre className={`p-3 rounded-lg border mt-2 text-xs font-mono overflow-x-auto ${isDark ? 'bg-[#18181c] border-[#2d2d30] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{problem.inputExample}</pre>
              <h4 className={`mt-4 font-semibold border-l-4 border-blue-500 pl-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>输出样例</h4>
              <pre className={`p-3 rounded-lg border mt-2 text-xs font-mono overflow-x-auto ${isDark ? 'bg-[#18181c] border-[#2d2d30] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{problem.outputExample}</pre>
            </div>
            
            {!isContestMode && (
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <div className="text-slate-400 text-xs italic">
                  遇到困难？试试右侧的 AI 辅助
                </div>
                <button 
                  onClick={onToggleMistake}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isInMistakeBook ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}
                >
                  <Heart size={14} fill={isInMistakeBook ? "currentColor" : "none"} />
                  {isInMistakeBook ? '移出错题本' : '加入错题本'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Divider 1 - Only if description is shown */}
        {!hideDescription && !isMobile && (
          <div 
            className={`w-1.5 cursor-col-resize transition-colors active:bg-blue-600 flex-shrink-0 z-10 ${isDark ? 'bg-[#18181c] border-x border-[#2d2d30] hover:bg-blue-600' : 'bg-slate-100 hover:bg-blue-400'}`}
            onMouseDown={() => startDrag('left')}
          />
        )}

        {/* Middle: Editor + Console */}
        <div className={`flex-1 flex flex-col min-w-0 ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
          {/* Editor Area */}
          <div style={{ height: isMobile ? '600px' : `${splits.editor}%` }} className={`flex flex-col relative shrink-0 border-b ${isDark ? 'border-black' : 'border-slate-200'}`}>
            <div className={`flex justify-between items-center text-xs select-none px-2 py-1.5 border-b ${isDark ? 'bg-[#252526] text-white border-black' : 'bg-slate-100 text-slate-800 border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedLang)}
                  className={`px-2 py-1 rounded border focus:border-blue-500 focus:outline-none cursor-pointer font-sans ${isDark ? 'bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white border-[#3c3c3c]' : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'}`}
                >
                  <option value="c">C (GCC 9.3.0)</option>
                  <option value="cpp">C++ (G++ 9.3.0)</option>
                  <option value="python">Python 3 (3.8.10)</option>
                  <option value="java">Java (OpenJDK 17)</option>
                </select>
                <div className={`flex items-center gap-1 ml-2 pl-2 border-l opacity-80 ${isDark ? 'border-gray-600' : 'border-slate-300'}`}>
                  <Cloud size={12} className={isSaving ? "text-yellow-400 animate-pulse" : "text-green-400"} />
                  <span className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{isSaving ? '保存中...' : `已保存 ${lastSaved.toLocaleTimeString()}`}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <IconButton
                  onClick={handleResetCode}
                  title="重置代码"
                  className={`hover:bg-opacity-20 hover:bg-slate-500 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  size="sm"
                >
                  <RotateCcw size={12} /> <span className="ml-1 text-xs">重置</span>
                </IconButton>
                <IconButton
                  onClick={handleManualPaste}
                  title="备用粘贴 (点击后需授权)"
                  className={`hover:bg-opacity-20 hover:bg-blue-500 ${isDark ? 'text-blue-400 hover:text-white' : 'text-blue-600 hover:text-blue-900'}`}
                  size="sm"
                >
                  <Zap size={12} />
                </IconButton>
              </div>
            </div>
            {isMobile && <MobileSymbolBar onInsertSymbol={insertTextAtCursor} />}
            <div className="flex-1 relative overflow-hidden">
              <Editor
                height="100%"
                theme={isDark ? "vs-dark" : "vs"}
                path={currentPath}
                language={language}
                value={currentCode}
                onChange={handleCodeChange}
                onMount={handleEditorDidMount}
                loading={<div className="text-slate-400 text-sm p-4">正在加载编辑器资源...</div>}
                options={useMemo(() => ({
                  minimap: { enabled: !isMobile, scale: 0.75, renderCharacters: false },
                  fontSize: isMobile ? 15 : 14,
                  wordWrap: isMobile ? "on" : "off",
                  fontFamily: "'Consolas', 'Courier New', monospace",
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  glyphMargin: false,
                  folding: true,
                  padding: { top: 16, bottom: 16 },
                  suggest: { showWords: true, showSnippets: true },
                  quickSuggestions: true,
                  contextmenu: true,
                  bracketPairColorization: { enabled: true },
                  renderWhitespace: 'selection',
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  mouseWheelZoom: true,
                  readOnly: !canSubmit,
                  domReadOnly: false,
                }), [canSubmit, isMobile])}
              />
            </div>
          </div>

          {!isMobile && (
            <div className={`h-1.5 cursor-row-resize z-20 transition-colors flex items-center justify-center border-y ${isDark ? 'bg-[#252526] hover:bg-blue-500 border-black' : 'bg-slate-100 hover:bg-blue-400 border-slate-200'}`} onMouseDown={() => startDrag('editor')}>
              <div className={`w-16 h-0.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
            </div>
          )}

          {/* Console Area */}
          <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'}`}>
            <div className={`px-4 py-1 border-b text-xs flex items-center justify-between shrink-0 ${isDark ? 'bg-[#252526] border-black text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
              <div className="flex items-center gap-2">
                <Terminal size={12} /> 控制台
              </div>
              <div className={`flex items-center rounded-md p-0.5 border ${isDark ? 'bg-[#1e1e1e] border-[#3c3c3c]' : 'bg-white border-slate-200'}`}>
                 <button 
                  onClick={() => setIsManualMode(false)}
                  className={`px-2 py-0.5 rounded transition-all ${!isManualMode ? (isDark ? 'bg-[#3c3c3c] text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm border border-slate-200/50') : 'hover:text-slate-400'}`}
                 >
                   系统样例
                 </button>
                 <button 
                  onClick={() => setIsManualMode(true)}
                  className={`px-2 py-0.5 rounded transition-all ${isManualMode ? (isDark ? 'bg-[#3c3c3c] text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm border border-slate-200/50') : 'hover:text-slate-400'}`}
                 >
                   手动输入
                 </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto font-mono text-sm custom-scrollbar flex flex-col">
              {/* Manual Input Area at the top of console if enabled */}
              {isManualMode && (
                <div className={`p-3 border-b shrink-0 ${isDark ? 'bg-[#252526]/50 border-black' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[10px] mb-1.5 uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Plus size={10} /> 输入测试数据 (Stdin)
                  </div>
                  <textarea 
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="在此输入您的测试数据..."
                    className={`w-full h-24 p-2 rounded border focus:border-blue-500 focus:outline-none text-xs resize-none placeholder:opacity-30 ${isDark ? 'bg-[#1e1e1e] text-slate-300 border-[#3c3c3c]' : 'bg-white text-slate-800 border-slate-200'}`}
                  />
                </div>
              )}

              <div className={`p-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {consoleLogs.length === 0 && !isRunning && !executionOutput ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 opacity-40">
                    <Terminal size={40} className="mb-2" />
                    <p className="text-xs">{isManualMode ? '准备就绪，输入数据后点击运行' : '等待程序运行...'}</p>
                  </div>
                ) : (
                  <div className="space-y-1 pb-4">
                    {consoleLogs.map((log, i) => (
                      <div key={i} className={`${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-500 font-bold' : (isDark ? 'text-slate-400' : 'text-slate-500')}`}>
                        <span className="opacity-40 mr-2">$</span>
                        <span className="whitespace-pre-wrap">{log.text}</span>
                      </div>
                    ))}
                    {executionOutput && (
                      <div className={`mt-4 border-t pt-4 animate-fade-in text-xs ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                        <div className="text-[10px] text-slate-500 mb-2 uppercase tracking-wider font-sans">Output Stream</div>
                        {executionOutput.stdout && (
                          <div className={`whitespace-pre-wrap pl-3 border-l-2 mb-2 ${isDark ? 'text-white border-slate-600' : 'text-slate-800 border-slate-300'}`}>{executionOutput.stdout}</div>
                        )}
                        {executionOutput.stderr && (
                          <div className={`text-red-400 whitespace-pre-wrap pl-3 border-l-2 ${isDark ? 'border-red-800' : 'border-red-300'}`}>{executionOutput.stderr}</div>
                        )}
                      </div>
                    )}
                    {isRunning && <div className="text-blue-500 mt-2 animate-pulse inline-block">▋</div>}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-[#007acc] text-white text-[10px] px-2 py-0.5 flex justify-between items-center select-none shrink-0">
              <div className="flex gap-3">
                <span>Ln 1, Col 1</span>
                <span>UTF-8</span>
              </div>
              <span className="font-bold">{language.toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Resizable Divider for Sidebar */}
        {isSidebarOpen && !isMobile && (
          <div
            className={`w-1.5 cursor-col-resize z-20 transition-colors flex items-center justify-center border-x ${isDark ? 'bg-[#18181c] border-[#2d2d30] hover:bg-blue-600' : 'bg-slate-100 border-slate-200 hover:bg-blue-400'}`}
            onMouseDown={() => startDrag('sidebar')}
          >
            <div className={`h-10 w-0.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
          </div>
        )}

        {/* Right Sidebar: AI & Discussion */}
        <div
          className={`flex flex-col transition-all duration-300 ease-in-out shrink-0 border-l ${isDark ? 'bg-[#1e1e1f] border-[#2d2d30]' : 'bg-white border-slate-200'} ${isSidebarOpen ? (isMobile ? 'w-full h-1/2' : '') : 'w-0 overflow-hidden'}`}
          style={{ width: isSidebarOpen && !isMobile ? `${splits.sidebar}px` : undefined }}
        >
          {isSidebarOpen && (
            <>
              {/* Tab Switcher - Conditional Discuss */}
              <div className={`flex px-4 pt-4 border-b items-center justify-between shrink-0 ${isDark ? 'border-white/5 bg-[#1e1e1f]' : 'border-slate-100 bg-white'}`}>
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveRightTab('ai')}
                    className={`pb-3 text-sm font-bold transition-all relative ${activeRightTab === 'ai' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    AI 助教
                    {activeRightTab === 'ai' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-in fade-in zoom-in-95" />}
                  </button>
                  {!hideDescription && (
                    <button
                      onClick={() => setActiveRightTab('discuss')}
                      className={`pb-3 text-sm font-bold transition-all relative ${activeRightTab === 'discuss' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      讨论区
                      {activeRightTab === 'discuss' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full animate-in fade-in zoom-in-95" />}
                    </button>
                  )}
                </div>
                
                {/* Collapse Button */}
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className={`mb-3 p-1.5 rounded-lg transition-all ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                  title="折叠面板"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${isDark ? 'bg-[#1e1e1f]' : 'bg-white'}`}>
                {activeRightTab === 'discuss' && !isContestMode ? (
                  <DiscussionSection problemId={problem.id} currentUser={user} showToast={showToast} />
                ) : !isContestMode ? (
                  <div className="space-y-4">
                    {/* Top Action Area: Simplified for Playground, Full for Problem Practice */}
                    {!hideDescription ? (
                      <>
                        {/* 新增：强调 AI 驾驭能力的卡片 */}
                        <div className={`border rounded-xl p-4 shadow-sm mb-4 ${isDark ? 'bg-gradient-to-br from-blue-950/20 to-indigo-950/20 border-blue-900/30' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100/50'}`}>
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                              <Brain size={18} />
                            </div>
                            <div>
                              <h4 className={`font-bold text-sm mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>驾驭与组合 AI 工具</h4>
                              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                真正的能力不是依赖模型，而是<strong>掌握如何驾驭和组合使用不同的 AI 工具</strong>。学会提出好问题，分析不同方案。
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowAiCompare(true)}
                            className={`mt-3 w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${isDark ? 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10' : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300'}`}
                          >
                            <Sparkles size={14} className="text-blue-500" />
                            <span>「排序题」AI 方案对比演示</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleAiAction('concept')} disabled={isAiLoading} className={`p-3 border rounded-lg shadow-sm transition text-xs text-center flex flex-col items-center gap-2 group ${isAiLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'} ${isDark ? 'bg-white/5 border-white/5 text-slate-300 hover:border-blue-500/30' : 'bg-white border border-blue-100 text-slate-700 hover:border-blue-300'}`}>
                          <div className={`p-2 rounded-full transition ${isDark ? 'bg-white/5 group-hover:bg-blue-500/20' : 'bg-blue-50 group-hover:bg-blue-100'}`}><BookOpen size={18} className="text-blue-500" /></div>
                          分析考点
                        </button>
                        <button onClick={() => handleAiAction('hint')} disabled={isAiLoading} className={`p-3 border rounded-lg shadow-sm transition text-xs text-center flex flex-col items-center gap-2 group ${isAiLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'} ${isDark ? 'bg-white/5 border-white/5 text-slate-300 hover:border-purple-500/30' : 'bg-white border border-purple-100 text-slate-700 hover:border-purple-300'}`}>
                          <div className={`p-2 rounded-full transition ${isDark ? 'bg-white/5 group-hover:bg-purple-500/20' : 'bg-purple-50 group-hover:bg-purple-100'}`}><Zap size={18} className="text-purple-500" /></div>
                          分析思路
                        </button>
                        <button onClick={() => handleAiAction('flowchart')} disabled={isAiLoading} className={`p-3 border rounded-lg shadow-sm transition text-xs text-center flex flex-col items-center gap-2 group ${isAiLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'} ${isDark ? 'bg-white/5 border-white/5 text-slate-300 hover:border-green-500/30' : 'bg-white border border-green-100 text-slate-700 hover:border-green-300'}`}>
                          <div className={`p-2 rounded-full transition ${isDark ? 'bg-white/5 group-hover:bg-green-500/20' : 'bg-green-50 group-hover:bg-green-100'}`}><Layers size={18} className="text-green-500" /></div>
                          生成流程图
                        </button>
                        <button
                          onClick={() => handleAiAction('debug')}
                          disabled={!hasErrors || isAiLoading}
                          className={`p-3 border rounded-lg shadow-sm transition text-xs text-center flex flex-col items-center gap-2 group relative
                              ${hasErrors 
                                ? (isDark ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50 text-red-400 cursor-pointer' : 'bg-red-50 border-red-200 hover:border-red-400 cursor-pointer text-red-700') 
                                : (isDark ? 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed opacity-40' : 'bg-slate-50 border-slate-100 cursor-not-allowed text-slate-400 opacity-60')}
                            `}
                        >
                          <div className={`p-2 rounded-full transition ${hasErrors ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600') : (isDark ? 'bg-white/5 text-slate-600' : 'bg-slate-200 text-slate-400')}`}>
                            <Bug size={18} />
                          </div>
                          智能纠错 {hasErrors && <span className="animate-pulse w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2"></span>}
                        </button>
                      </div>
                      </>
                    ) : (
                      <div className={`rounded-xl p-5 border ${isDark ? 'bg-gradient-to-br from-blue-950/20 to-indigo-950/20 border-blue-900/30' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100/50'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 bg-blue-500 rounded-lg text-white shadow-sm">
                            <Sparkles size={16} />
                          </div>
                          <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>AI 助教智能诊断</h4>
                        </div>
                        <p className={`text-xs mb-5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          AI 将为您分析代码中的潜在逻辑错误、语法偏差及性能瓶颈，并提供更优的编码建议。
                        </p>
                        <button
                          onClick={() => handleAiAction('debug')}
                          disabled={isAiLoading}
                          className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm ${isDark ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600'}`}
                        >
                          {isAiLoading ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Zap size={14} />
                              立即运行诊断 (Mock演示)
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Loading Indicator */}
                    {isAiLoading && !aiOutput && (
                      <div className="flex justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full border-4 border-slate-100"></div>
                            <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
                          </div>
                          <span className="text-sm text-slate-500 font-medium animate-pulse">AI 正在思考中...</span>
                        </div>
                      </div>
                    )}

                    {/* AI Response Output */}
                    {aiOutput && (
                      <div className={`rounded-xl p-5 shadow-sm animate-fade-in break-words overflow-hidden relative border ${isDark ? 'bg-white/5 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-800'}`}>
                        <div className={`flex items-center justify-between mb-4 pb-3 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                           <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-lg ${
                                aiOutput.type === 'concept' ? 'bg-blue-100 text-blue-600' :
                                aiOutput.type === 'hint' ? 'bg-purple-100 text-purple-600' :
                                aiOutput.type === 'flowchart' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-red-100 text-red-600'
                              }`}>
                                {aiOutput.type === 'concept' ? <BookOpen size={16} /> :
                                 aiOutput.type === 'hint' ? <Zap size={16} /> :
                                 aiOutput.type === 'flowchart' ? <Layers size={16} /> :
                                 <Bug size={16} />}
                              </div>
                              <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {aiOutput.type === 'concept' ? '考点解析' :
                                 aiOutput.type === 'hint' ? '解题思路' :
                                 aiOutput.type === 'flowchart' ? '逻辑流程图' :
                                 '诊断结果'}
                              </span>
                           </div>
                           <button
                             onClick={() => handleAiAction(aiOutput.type as any, true)}
                             disabled={isAiLoading}
                             className={`p-2 rounded-lg transition-all ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50'}`}
                             title="重新生成"
                           >
                             <RefreshCw size={14} className={isAiLoading ? 'animate-spin' : ''} />
                           </button>
                        </div>

                        {isServiceError(aiOutput.content) ? (
                          <div className={`p-4 rounded-xl flex items-start gap-3 border ${isDark ? 'bg-red-950/20 text-red-400 border-red-900/30' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            <AlertCircle className="shrink-0 mt-0.5" size={18} />
                            <div>
                              <h4 className="font-bold text-sm">诊断中断</h4>
                              <p className="text-xs mt-1 leading-relaxed opacity-90">{aiOutput.content}</p>
                            </div>
                          </div>
                        ) : aiOutput.type === 'flowchart' ? (
                          <div className="w-full relative group/chart">
                            <div className="overflow-x-auto mb-2 pb-2">
                              <MermaidChart code={aiOutput.content} />
                            </div>
                            <button
                              onClick={() => setShowFlowchartZoom(true)}
                              className={`absolute top-0 right-0 p-2 border rounded-lg shadow-sm transition-all opacity-0 group-hover/chart:opacity-100 flex items-center gap-1.5 text-[10px] font-bold ${isDark ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-blue-400' : 'bg-white/90 border-slate-200 text-slate-500 hover:text-blue-600'}`}
                            >
                              <Maximize2 size={12} />
                              放大视图
                            </button>
                          </div>
                        ) : (
                          <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert text-slate-300' : 'prose-slate'}`}>
                            <ReactMarkdown
                              remarkPlugins={[remarkMath, remarkGfm]}
                              rehypePlugins={[rehypeKatex]}
                              components={markdownComponents}
                            >
                              {aiOutput.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* Sidebar Toggle when closed */}
        {!isSidebarOpen && !isMobile && !isContestMode && (
          <button
            onClick={toggleSidebar}
            className="fixed right-0 top-1/2 -translate-y-1/2 bg-slate-800 text-white p-1.5 rounded-l-md shadow-lg z-30 hover:bg-blue-600 transition-all flex flex-col items-center gap-2 group"
          >
            <PanelRightOpen size={18} />
            <span className="[writing-mode:vertical-lr] text-[10px] tracking-widest font-bold py-2 opacity-70 group-hover:opacity-100">AI 助教 / 讨论</span>
          </button>
        )}

        {/* Zoom Modal */}
        {showFlowchartZoom && aiOutput?.type === 'flowchart' && (
          <div
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-fade-in"
            onClick={() => setShowFlowchartZoom(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">解题流程逻辑图 (放大预览)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">基于当前 ${language.toUpperCase()} 语言环境生成的逻辑闭合流程</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFlowchartZoom(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 md:p-16 flex items-start justify-center bg-slate-50/10 custom-scrollbar relative">
                <div className="min-w-full min-h-full flex items-center justify-center scale-105 md:scale-125 origin-center transform-gpu py-20 px-20">
                  <MermaidChart code={aiOutput.content} />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-white text-center">
                <p className="text-[11px] text-slate-400">提示：您可以拖动滚动条查看完整流程。点击背景或右上角按钮关闭。</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Compare Modal */}
        {showAiCompare && (
          <div
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-fade-in"
            onClick={() => setShowAiCompare(false)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-6xl h-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">AI 方案对比分析（同一道排序题）</h3>
                    <p className="text-xs text-slate-500 mt-0.5">对比不同大模型对同一题目的生成代码思路与优劣</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiCompare(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 bg-slate-50/30 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                  {/* GPT-4 */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="bg-slate-800 text-white p-3 flex justify-between items-center">
                      <span className="font-bold text-sm">GPT-4 / Claude 3.5</span>
                      <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded">通用大模型</span>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                      <div className="mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">代码思路</span>
                        <p className="text-sm text-slate-700 mt-1">倾向于提供最标准、最易懂的解法（如内置的 <code>sort()</code> 或标准的快速排序），包含详尽的注释。</p>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wider">优势</span>
                        <p className="text-sm text-slate-700 mt-1">逻辑严密，异常处理全面，可读性极强，适合初学者学习标准实现。</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-red-500 uppercase tracking-wider">劣势</span>
                        <p className="text-sm text-slate-700 mt-1">有时过于冗长，可能未针对竞赛平台的时间/空间复杂度做极限优化（如位运算、快速IO）。</p>
                      </div>
                      <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100">
                        <pre className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap">
{`// 标准快速排序
void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* GitHub Copilot */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
                      <span className="font-bold text-sm">GitHub Copilot</span>
                      <span className="text-[10px] bg-blue-500 px-2 py-0.5 rounded">代码补全模型</span>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                      <div className="mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">代码思路</span>
                        <p className="text-sm text-slate-700 mt-1">基于当前上下文（如刚写的 <code>for</code> 循环）推断下一步，倾向于生成短小精悍的片段。</p>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wider">优势</span>
                        <p className="text-sm text-slate-700 mt-1">无缝融入现有代码风格，编码速度极快，无需离开 IDE 即可完成基础排序逻辑。</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-red-500 uppercase tracking-wider">劣势</span>
                        <p className="text-sm text-slate-700 mt-1">缺乏全局视野，若前置逻辑有误，它可能会“顺着错误写”。较难独立完成复杂的算法设计。</p>
                      </div>
                      <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-100">
                        <pre className="text-[11px] font-mono text-slate-600 whitespace-pre-wrap">
{`// 基于上下文的补全
for (int i = 0; i < n-1; i++) {
    for (int j = 0; j < n-i-1; j++) {
        if (arr[j] > arr[j+1]) {
            swap(&arr[j], &arr[j+1]);
        }
    }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* 自研 AI */}
                  <div className="bg-white rounded-xl border border-blue-300 shadow-md flex flex-col overflow-hidden ring-1 ring-blue-100">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-3 flex justify-between items-center">
                      <span className="font-bold text-sm">自研竞赛 AI</span>
                      <span className="text-[10px] bg-blue-400/50 px-2 py-0.5 rounded">竞赛特化模型</span>
                    </div>
                    <div className="p-4 flex-1 overflow-y-auto">
                      <div className="mb-3">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">代码思路</span>
                        <p className="text-sm text-slate-700 mt-1">直接针对竞赛考点，使用性能最优解法（如 <code>std::sort</code> 配合自定义 <code>cmp</code>），并自动补充快速 IO。</p>
                      </div>
                      <div className="mb-3">
                        <span className="text-xs font-bold text-green-600 uppercase tracking-wider">优势</span>
                        <p className="text-sm text-slate-700 mt-1">深度契合评测机制，避免 TLE/MLE，提供复杂度分析，针对特定题型有独家优化。</p>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-red-500 uppercase tracking-wider">劣势</span>
                        <p className="text-sm text-slate-700 mt-1">对某些业务级或工程级的非算法问题可能表现不如通用模型全面。</p>
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-100">
                        <pre className="text-[11px] font-mono text-blue-900 whitespace-pre-wrap">
{`// 竞赛特化优化
ios_base::sync_with_stdio(false);
cin.tie(NULL);
// 使用优化的 std::sort
std::sort(arr, arr + n, [](int a, int b) {
    return a > b; // 降序
});`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-lg">
                  <Brain size={16} />
                  <span>驾驭 AI 的核心：在规划阶段用通用大模型，在编码阶段用 Copilot，在优化和竞赛冲刺阶段用特化 AI。</span>
                </div>
                <Button variant="primary" onClick={() => setShowAiCompare(false)}>
                  我明白了
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};