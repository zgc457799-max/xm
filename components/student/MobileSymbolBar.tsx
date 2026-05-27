import React from 'react';

interface MobileSymbolBarProps {
  onInsertSymbol: (symbol: string) => void;
}

export const MobileSymbolBar: React.FC<MobileSymbolBarProps> = ({ onInsertSymbol }) => {
  const symbols = [
    { label: '{ }', value: '{}' },
    { label: '( )', value: '()' },
    { label: '[ ]', value: '[]' },
    { label: ';', value: ';' },
    { label: 'Tab', value: '    ' },
    { label: '=', value: '=' },
    { label: ':', value: ':' },
    { label: '"', value: '"' },
    { label: "'", value: "'" },
    { label: '<', value: '<' },
    { label: '>', value: '>' },
    { label: '+', value: '+' },
    { label: '-', value: '-' },
    { label: '*', value: '*' },
    { label: '/', value: '/' },
    { label: '%', value: '%' }
  ];

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-[#2d2d2d] border-b border-black overflow-x-auto custom-scrollbar select-none shrink-0 scrollbar-none md:hidden">
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 shrink-0 border-r border-[#3c3c3c] pr-2">
        快捷键
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {symbols.map((sym, index) => (
          <button
            key={index}
            onClick={() => onInsertSymbol(sym.value)}
            className="px-3 py-1.5 bg-[#3c3c3c] hover:bg-[#4c4c4c] text-slate-200 active:bg-blue-600 active:text-white rounded-lg text-xs font-bold font-mono shadow-sm transition-all shrink-0 active:scale-95"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {sym.label}
          </button>
        ))}
      </div>
    </div>
  );
};
