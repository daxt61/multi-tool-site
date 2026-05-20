import React, { useState, useMemo, useEffect } from 'react';
import { Search, Hash, Info, Copy, Check, Grid, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UnicodeBlock {
  name: string;
  start: number;
  end: number;
}

const BLOCKS: UnicodeBlock[] = [
  { name: 'Basic Latin', start: 0x0020, end: 0x007F },
  { name: 'Latin-1 Supplement', start: 0x0080, end: 0x00FF },
  { name: 'Latin Extended-A', start: 0x0100, end: 0x017F },
  { name: 'Greek and Coptic', start: 0x0370, end: 0x03FF },
  { name: 'Cyrillic', start: 0x0400, end: 0x04FF },
  { name: 'Hebrew', start: 0x0590, end: 0x05FF },
  { name: 'Arabic', start: 0x0600, end: 0x06FF },
  { name: 'Devanagari', start: 0x0900, end: 0x097F },
  { name: 'Thai', start: 0x0E00, end: 0x0E7F },
  { name: 'Mathematical Operators', start: 0x2200, end: 0x22FF },
  { name: 'Box Drawing', start: 0x2500, end: 0x257F },
  { name: 'Emojis (Smiley)', start: 0x1F600, end: 0x1F64F },
  { name: 'Emojis (Transport)', start: 0x1F680, end: 0x1F6FF },
  { name: 'Emojis (Misc)', start: 0x1F300, end: 0x1F5FF },
];

export function UnicodeTable({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(initialData?.search || '');
  const [selectedBlock, setSelectedBlock] = useState<UnicodeBlock>(BLOCKS[0]);
  const [copiedChar, setCopiedChar] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ search, blockIndex: BLOCKS.indexOf(selectedBlock) });
  }, [search, selectedBlock, onStateChange]);

  const handleCopy = (char: string) => {
    navigator.clipboard.writeText(char);
    setCopiedChar(char);
    setTimeout(() => setCopiedChar(null), 2000);
  };

  const characters = useMemo(() => {
    if (search.trim()) {
      // Very basic search by name/hex if we had a full database,
      // but here we just filter the current range or show specific char if hex entered
      if (search.startsWith('U+') || search.startsWith('0x')) {
        try {
          const code = parseInt(search.replace('U+', '').replace('0x', ''), 16);
          if (!isNaN(code)) return [code];
        } catch(e) {}
      }
      // If it's a single char, show its info
      if (search.length === 1) return [search.charCodeAt(0)];

      return [];
    }

    const chars = [];
    for (let i = selectedBlock.start; i <= selectedBlock.end; i++) {
      chars.push(i);
    }
    return chars;
  }, [selectedBlock, search]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="relative group flex-grow max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('unicode.search_placeholder', 'Search char, hex (U+0041), or block...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          {BLOCKS.map((block) => (
            <button
              key={block.name}
              onClick={() => { setSelectedBlock(block); setSearch(''); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                selectedBlock.name === block.name && !search
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              {block.name}
            </button>
          ))}
        </div>
      </div>

      {characters.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {characters.map((code) => {
            const char = String.fromCodePoint(code);
            const hex = code.toString(16).toUpperCase().padStart(4, '0');
            const isCopied = copiedChar === char;

            return (
              <button
                key={code}
                onClick={() => handleCopy(char)}
                className={`relative group p-4 bg-white dark:bg-slate-900 border ${
                  isCopied ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-500/50'
                } rounded-2xl transition-all flex flex-col items-center gap-3`}
              >
                <div className="text-3xl h-10 flex items-center justify-center dark:text-white">
                  {char}
                </div>
                <div className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                  U+{hex}
                </div>
                {isCopied && (
                  <div className="absolute inset-0 bg-emerald-500/90 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-in fade-in duration-200">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Copy className="w-3 h-3 text-slate-300" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
          <Hash className="w-12 h-12 mx-auto text-slate-300 mb-4 opacity-20" />
          <p className="text-slate-500 font-medium">{t('unicode.no_results', 'No characters found matching your search.')}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-3">
          <h4 className="font-black flex items-center gap-2 dark:text-white uppercase tracking-tight">
            <Info className="w-4 h-4 text-indigo-500" /> {t('unicode.how_to_use', 'How to use')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Browse character blocks using the categories above or search for a specific character by entering it or its hexadecimal code (e.g., <code>U+0041</code> for 'A'). Click any character to copy it to your clipboard.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-black flex items-center gap-2 dark:text-white uppercase tracking-tight">
            <Grid className="w-4 h-4 text-indigo-500" /> {t('unicode.blocks_title', 'Unicode Blocks')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Unicode is organized into blocks of related characters. This tool covers the most common ranges including Latin scripts, mathematical symbols, and various emoji sets.
          </p>
        </div>
      </div>
    </div>
  );
}
