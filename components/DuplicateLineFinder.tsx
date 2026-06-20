import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, Trash2, Copy, Check, FileDown, Info, Filter, AlertCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function DuplicateLineFinder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(initialData?.text || '');
  const [caseSensitive, setCaseSensitive] = useState(initialData?.caseSensitive ?? true);
  const [trimLines, setTrimLines] = useState(initialData?.trimLines ?? true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ text, caseSensitive, trimLines });
  }, [text, caseSensitive, trimLines, onStateChange]);

  const stats = useMemo(() => {
    if (!text.trim() || text.length > MAX_LENGTH) {
      return { total: 0, unique: 0, duplicates: 0, items: [] as { line: string; count: number }[] };
    }

    let lines = text.split('\n');
    if (trimLines) lines = lines.map((l: string) => l.trim());

    const counts = new Map<string, number>();
    const originalLines: string[] = [];

    lines.forEach((line: string) => {
      if (line === '' && trimLines) return;
      const key = caseSensitive ? line : line.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
      originalLines.push(line);
    });

    const items = Array.from(counts.entries()).map(([key, count]) => {
      // Find the first occurrence in original lines to preserve case if case-insensitive
      const original = lines.find((l: string) => (caseSensitive ? l : l.toLowerCase()) === key) || key;
      return { line: original, count };
    });

    const duplicateCount = Array.from(counts.values()).filter(c => c > 1).length;

    return {
      total: lines.length,
      unique: counts.size,
      duplicates: duplicateCount,
      items: items.sort((a, b) => b.count - a.count)
    };
  }, [text, caseSensitive, trimLines]);

  const handleRemoveDuplicates = () => {
    let lines = text.split('\n');
    const seen = new Set<string>();
    const result: string[] = [];

    lines.forEach((line: string) => {
      const processed = trimLines ? line.trim() : line;
      const key = caseSensitive ? processed : processed.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        result.push(line);
      }
    });

    setText(result.join('\n'));
  };

  const handleKeepOnlyDuplicates = () => {
    let lines = text.split('\n');
    const counts = new Map<string, number>();

    lines.forEach((line: string) => {
      const processed = trimLines ? line.trim() : line;
      const key = caseSensitive ? processed : processed.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const seenInResult = new Set<string>();
    const result = lines.filter((line: string) => {
      const processed = trimLines ? line.trim() : line;
      const key = caseSensitive ? processed : processed.toLowerCase();
      if ((counts.get(key) || 0) > 1 && !seenInResult.has(key)) {
        seenInResult.add(key);
        return true;
      }
      return false;
    });

    setText(result.join('\n'));
  };

  const handleCopyReport = () => {
    const report = stats.items
      .filter(item => item.count > 1)
      .map(item => `${item.line} (${item.count} times)`)
      .join('\n');

    navigator.clipboard.writeText(report || t('duplicate_finder.no_duplicates'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = useCallback(() => {
    setText('');
    setError(null);
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (text.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  }, [text, t]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        if (e.key === 'Escape' && document.activeElement?.id === 'duplicate-input') {
          handleClear();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        navigator.clipboard.writeText(text);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear, text]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="duplicate-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-500" /> {t('common.input')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleRemoveDuplicates}
                disabled={!text || stats.duplicates === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                {t('duplicate_finder.remove_duplicates')}
              </button>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="duplicate-input"
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('listcleaner.placeholder')}
            className="w-full h-[500px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono resize-none"
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('wordcounter.stat.lines')}</div>
              <div className="text-2xl font-black dark:text-white font-mono" aria-live="polite" aria-atomic="true">{stats.total}</div>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-1">
              <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{t('duplicate_finder.duplicates')}</div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono" aria-live="polite" aria-atomic="true">{stats.duplicates}</div>
            </div>
          </div>

          {/* Options */}
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  {t('listcomparator.case_sensitive')}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={trimLines}
                  onChange={(e) => setTrimLines(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                  {t('listcomparator.trim')}
                </span>
              </label>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <button
                onClick={handleCopyReport}
                disabled={stats.duplicates === 0}
                className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('duplicate_finder.copy_report')}
              </button>
              <button
                onClick={handleKeepOnlyDuplicates}
                disabled={stats.duplicates === 0}
                className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                {t('duplicate_finder.keep_duplicates')}
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
            <Info className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-sm font-bold dark:text-white">{t('duplicate_finder.about_title')}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('duplicate_finder.about_text')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Duplicate Details */}
      {stats.items.some(i => i.count > 1) && (
        <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
            <Search className="w-4 h-4 text-indigo-500" /> {t('duplicate_finder.duplicate_list')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.items.filter(i => i.count > 1).map((item, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex justify-between items-center group hover:border-indigo-500/30 transition-all">
                <span className="font-bold text-slate-700 dark:text-slate-300 truncate mr-4">{item.line}</span>
                <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg whitespace-nowrap">
                  {item.count} x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
