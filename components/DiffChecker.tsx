import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Split, ArrowRight, Trash2, Copy, Check, ArrowLeftRight, Info, Search, LayoutPanelLeft, LayoutList, RotateCcw, Download, FileCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';

interface DiffItem {
  type: 'unchanged' | 'added' | 'removed' | 'empty';
  text: string;
  line1?: number;
  line2?: number;
  chars?: { type: 'added' | 'removed' | 'unchanged', text: string }[];
}

export function DiffChecker({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text1, setText1] = useState(initialData?.text1 || '');
  const [text2, setText2] = useState(initialData?.text2 || '');
  const [viewMode, setViewMode] = useState<'unified' | 'split'>(initialData?.viewMode || 'unified');
  const [ignoreCase, setIgnoreCase] = useState(initialData?.ignoreCase || false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(initialData?.ignoreWhitespace || false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ text1, text2, viewMode, ignoreCase, ignoreWhitespace });
  }, [text1, text2, viewMode, ignoreCase, ignoreWhitespace, onStateChange]);

  const MAX_LENGTH = 50000; // 50KB safety limit

  const diffResult = useMemo(() => {
    const lines1 = text1.slice(0, MAX_LENGTH).split('\n');
    const lines2 = text2.slice(0, MAX_LENGTH).split('\n');

    const compareStrings = (s1: string, s2: string) => {
      let t1 = s1;
      let t2 = s2;
      if (ignoreCase) {
        t1 = t1.toLowerCase();
        t2 = t2.toLowerCase();
      }
      if (ignoreWhitespace) {
        t1 = t1.trim();
        t2 = t2.trim();
      }
      return t1 === t2;
    };

    const n = lines1.length;
    const m = lines2.length;
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (compareStrings(lines1[i - 1], lines2[j - 1])) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const diff: DiffItem[] = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && compareStrings(lines1[i - 1], lines2[j - 1])) {
        diff.unshift({ type: 'unchanged', text: lines1[i - 1], line1: i, line2: j });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({ type: 'added', text: lines2[j - 1], line2: j });
        j--;
      } else {
        diff.unshift({ type: 'removed', text: lines1[i - 1], line1: i });
        i--;
      }
    }

    // Secondary pass for character-level diff on modified lines
    const finalDiff: DiffItem[] = [];
    const MAX_CHAR_DIFF_LENGTH = 2000;

    for (let k = 0; k < diff.length; k++) {
      const current = diff[k];
      const next = diff[k + 1];

      if (current.type === 'removed' && next?.type === 'added') {
        // We have a modification (removed then added)
        // Only perform char-level diff if lines are not too long to avoid performance hits
        if (current.text.length + next.text.length < MAX_CHAR_DIFF_LENGTH) {
          const charDiff1 = getCharDiff(current.text, next.text);

          finalDiff.push({
            ...current,
            chars: charDiff1.filter(c => c.type !== 'added')
          });
          finalDiff.push({
            ...next,
            chars: charDiff1.filter(c => c.type !== 'removed')
          });
        } else {
          finalDiff.push(current);
          finalDiff.push(next);
        }
        k++; // Skip next
      } else {
        finalDiff.push(current);
      }
    }

    return finalDiff;
  }, [text1, text2, ignoreCase, ignoreWhitespace]);

  const handleSwap = useCallback(() => {
    const t1 = text1;
    setText1(text2);
    setText2(t1);
  }, [text1, text2]);

  const handleCopy = useCallback(() => {
    const result = diffResult.map(item => `${item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' '} ${item.text}`).join('\n');
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [diffResult]);

  const handleReset = useCallback(() => {
    setText1('');
    setText2('');
  }, []);

  const handleDownload = useCallback(() => {
    const result = diffResult.map(item => `${item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' '} ${item.text}`).join('\n');
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diff-${Date.now()}.diff`;
    link.click();
    URL.revokeObjectURL(url);
  }, [diffResult]);

  const handleExportHTML = useCallback(() => {
    const rows = diffResult.map(item => {
      const color = item.type === 'added' ? '#dcfce7' : item.type === 'removed' ? '#fee2e2' : 'transparent';
      const textColor = item.type === 'added' ? '#166534' : item.type === 'removed' ? '#991b1b' : '#334155';
      const prefix = item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' ';
      return `<div style="background-color: ${color}; color: ${textColor}; padding: 2px 8px; font-family: monospace; white-space: pre-wrap; border-bottom: 1px solid #f1f5f9;">
        <span style="opacity: 0.5; margin-right: 10px;">${prefix}</span>${item.text || ' '}
      </div>`;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Diff Report - Toolbox</title>
          <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 20px; font-family: sans-serif; background-color: #f8fafc;">
          <div style="max-width: 1000px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="padding: 20px; border-bottom: 1px solid #e2e8f0; background: #f1f5f9;">
              <h1 style="margin: 0; font-size: 18px; color: #0f172a;">Diff Report</h1>
              <p style="margin: 5px 0 0; font-size: 12px; color: #64748b;">Generated on ${new Date().toLocaleString()}</p>
            </div>
            <div style="padding: 10px;">
              ${rows}
            </div>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diff-${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }, [diffResult]);

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const handleSwapRef = useRef(handleSwap);
  const handleCopyRef = useRef(handleCopy);
  const handleResetRef = useRef(handleReset);

  useEffect(() => {
    handleSwapRef.current = handleSwap;
    handleCopyRef.current = handleCopy;
    handleResetRef.current = handleReset;
  }, [handleSwap, handleCopy, handleReset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSwapRef.current();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopyRef.current();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleResetRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function getCharDiff(s1: string, s2: string) {
    const compareChars = (c1: string, c2: string) => {
      if (ignoreCase) return c1.toLowerCase() === c2.toLowerCase();
      return c1 === c2;
    };

    const n = s1.length;
    const m = s2.length;
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (compareChars(s1[i - 1], s2[j - 1])) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }

    const res: { type: 'added' | 'removed' | 'unchanged', text: string }[] = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      let type: 'added' | 'removed' | 'unchanged';
      let char: string;

      if (i > 0 && j > 0 && compareChars(s1[i - 1], s2[j - 1])) {
        type = 'unchanged';
        char = s1[i - 1];
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        type = 'added';
        char = s2[j - 1];
        j--;
      } else {
        type = 'removed';
        char = s1[i - 1];
        i--;
      }

      if (res.length > 0 && res[0].type === type) {
        res[0].text = char + res[0].text;
      } else {
        res.unshift({ type, text: char });
      }
    }
    return res;
  }

  const splitDiffResult = useMemo(() => {
    const left: DiffItem[] = [];
    const right: DiffItem[] = [];

    const diff = diffResult;

    for (let k = 0; k < diff.length; k++) {
      const item = diff[k];
      if (item.type === 'unchanged') {
        left.push(item);
        right.push(item);
      } else if (item.type === 'removed') {
        left.push(item);
        if (diff[k+1]?.type !== 'added') {
          right.push({ type: 'empty', text: '' });
        }
      } else if (item.type === 'added') {
        if (diff[k-1]?.type !== 'removed') {
          left.push({ type: 'empty', text: '' });
        }
        right.push(item);
      }
    }

    return { left, right };
  }, [diffResult]);

  const onScrollLeft = () => {
    if (leftScrollRef.current && rightScrollRef.current) {
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    }
  };

  const onScrollRight = () => {
    if (leftScrollRef.current && rightScrollRef.current) {
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
    }
  };

  const isTooLong = text1.length > MAX_LENGTH || text2.length > MAX_LENGTH;

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {isTooLong && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-4 rounded-2xl flex items-center gap-3 text-amber-800 dark:text-amber-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
          <Info className="w-5 h-5 flex-shrink-0" />
          {t('diffchecker.error_max_length')}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="text1" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('diffchecker.original_text')}</label>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
              <button
                onClick={handleReset}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> {t('common.reset')}
              </button>
            </div>
          </div>
          <textarea
            id="text1"
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            placeholder={t('diffchecker.placeholder_original')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2">
          <button
            onClick={handleSwap}
            className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20 transition-all hover:scale-110 active:scale-95 group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            aria-label={t('diffchecker.swap_aria')}
          >
            <ArrowLeftRight className="w-6 h-6 transition-transform group-hover:rotate-180 duration-500" />
          </button>
          <Kbd modifier={null} className="hidden sm:inline-flex border-slate-200 dark:border-slate-800 text-slate-400">S</Kbd>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="text2" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('diffchecker.new_text')}</label>
          </div>
          <textarea
            id="text2"
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            placeholder={t('diffchecker.placeholder_new')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <Split className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">{t('diffchecker.differences_title')}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4 mr-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={ignoreCase}
                  onChange={(e) => setIgnoreCase(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  {t('diffchecker.ignore_case')}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={ignoreWhitespace}
                  onChange={(e) => setIgnoreWhitespace(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  {t('diffchecker.ignore_whitespace')}
                </span>
              </label>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('unified')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  viewMode === 'unified'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" /> {t('diffchecker.view_unified')}
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  viewMode === 'split'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <LayoutPanelLeft className="w-3.5 h-3.5" /> {t('diffchecker.view_split')}
              </button>
            </div>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={handleDownload}
                disabled={!text1 && !text2}
                className="text-xs font-bold px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center gap-2 disabled:opacity-50"
                title="Download .diff"
              >
                <Download className="w-3.5 h-3.5" /> .diff
              </button>
              <button
                onClick={handleExportHTML}
                disabled={!text1 && !text2}
                className="text-xs font-bold px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-all flex items-center gap-2 disabled:opacity-50"
                title="Export as HTML"
              >
                <FileCode className="w-3.5 h-3.5" /> HTML
              </button>
            </div>

            <button
              onClick={handleCopy}
              disabled={!text1 && !text2}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              } disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t('common.copied') : t('diffchecker.copy_result')}
              {!copied && <Kbd modifier={null} className="ml-1 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-slate-700">C</Kbd>}
            </button>
          </div>
        </div>
        <div className="p-4 md:p-8 font-mono text-sm space-y-1 overflow-x-auto max-h-[600px]" aria-live="polite" aria-atomic="true">
          {text1 === '' && text2 === '' ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-400 italic">{t('diffchecker.placeholder_output')}</p>
            </div>
          ) : viewMode === 'unified' ? (
            diffResult.map((item, index) => (
              <div
                key={index}
                className={`flex gap-4 px-3 py-1.5 rounded-lg border ${
                  item.type === 'added' ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' :
                  item.type === 'removed' ? 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' :
                  'text-slate-600 dark:text-slate-400 border-transparent'
                }`}
              >
                <span className="w-6 select-none opacity-50 font-black flex-shrink-0">
                  {item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' '}
                </span>
                <span className="whitespace-pre-wrap break-all">
                  {item.chars ? (
                    item.chars.map((c, i) => (
                      <span key={i} className={
                        c.type === 'added' ? 'bg-emerald-200 dark:bg-emerald-500/30' :
                        c.type === 'removed' ? 'bg-rose-200 dark:bg-rose-500/30' : ''
                      }>
                        {c.text}
                      </span>
                    ))
                  ) : (
                    item.text || ' '
                  )}
                </span>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-2 gap-4 min-w-[800px] h-[600px]">
              <div
                ref={leftScrollRef}
                onScroll={onScrollLeft}
                className="space-y-1 overflow-y-auto no-scrollbar pr-2 border-r border-slate-200 dark:border-slate-800"
              >
                {splitDiffResult.left.map((item, index) => (
                   <div
                   key={index}
                   className={`flex gap-4 px-3 py-1 rounded-lg border h-[1.75rem] items-center ${
                     item.type === 'removed' ? 'bg-rose-50 border-rose-100 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' :
                     item.type === 'empty' ? 'bg-slate-50/50 dark:bg-slate-800/30 border-transparent opacity-20' :
                     'text-slate-600 dark:text-slate-400 border-transparent'
                   }`}
                 >
                   <span className="w-8 select-none opacity-50 font-mono text-[10px] text-right flex-shrink-0">
                     {item.line1 || ''}
                   </span>
                   <span className="whitespace-pre overflow-x-auto no-scrollbar text-xs">
                     {item.chars ? (
                        item.chars.map((c, i) => (
                          <span key={i} className={c.type === 'removed' ? 'bg-rose-200 dark:bg-rose-500/40' : ''}>
                            {c.text}
                          </span>
                        ))
                     ) : (
                       item.text || ' '
                     )}
                   </span>
                 </div>
                ))}
              </div>
              <div
                ref={rightScrollRef}
                onScroll={onScrollRight}
                className="space-y-1 overflow-y-auto no-scrollbar pl-2"
              >
                {splitDiffResult.right.map((item, index) => (
                   <div
                   key={index}
                   className={`flex gap-4 px-3 py-1 rounded-lg border h-[1.75rem] items-center ${
                     item.type === 'added' ? 'bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' :
                     item.type === 'empty' ? 'bg-slate-50/50 dark:bg-slate-800/30 border-transparent opacity-20' :
                     'text-slate-600 dark:text-slate-400 border-transparent'
                   }`}
                 >
                   <span className="w-8 select-none opacity-50 font-mono text-[10px] text-right flex-shrink-0">
                     {item.line2 || ''}
                   </span>
                   <span className="whitespace-pre overflow-x-auto no-scrollbar text-xs">
                     {item.chars ? (
                        item.chars.map((c, i) => (
                          <span key={i} className={c.type === 'added' ? 'bg-emerald-200 dark:bg-emerald-500/40' : ''}>
                            {c.text}
                          </span>
                        ))
                     ) : (
                       item.text || ' '
                     )}
                   </span>
                 </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('diffchecker.guide_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('diffchecker.guide_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Split className="w-4 h-4 text-indigo-500" /> {t('diffchecker.line_by_line_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('diffchecker.line_by_line_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-500" /> {t('diffchecker.swap_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('diffchecker.swap_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
