import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Info, ArrowLeftRight, Activity, RotateCcw } from 'lucide-react';

const MAX_LENGTH = 5000;

export function LevenshteinDistance({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [str1, setStr1] = useState(initialData?.str1 || '');
  const [str2, setStr2] = useState(initialData?.str2 || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ str1, str2 });
  }, [str1, str2, onStateChange]);

  const handleSwap = useCallback(() => {
    const s1 = str1;
    const s2 = str2;
    setStr1(s2);
    setStr2(s1);
  }, [str1, str2]);

  const handleClear = useCallback(() => {
    setStr1('');
    setStr2('');
  }, []);

  const results = useMemo(() => {
    if (!str1 && !str2) return null;
    if (str1.length > MAX_LENGTH || str2.length > MAX_LENGTH) {
      return { error: t('error.max_length', { max: MAX_LENGTH.toLocaleString() }) };
    }

    const calculateLevenshtein = (a: string, b: string): number => {
      const matrix = [];

      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }

      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }

      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }

      return matrix[b.length][a.length];
    };

    const distance = calculateLevenshtein(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = maxLength === 0 ? 100 : ((maxLength - distance) / maxLength) * 100;

    return {
      distance,
      similarity: similarity.toFixed(2),
      maxLength
    };
  }, [str1, str2, t]);

  const handleCopyDistance = useCallback(() => {
    if (results && 'distance' in results && results.distance !== undefined) {
      navigator.clipboard.writeText(results.distance.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [results]);

  const handlersRef = useRef({ handleSwap, handleClear, handleCopyDistance });
  useEffect(() => {
    handlersRef.current = { handleSwap, handleClear, handleCopyDistance };
  }, [handleSwap, handleClear, handleCopyDistance]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
        return;
      }

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopyDistance();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handlersRef.current.handleSwap();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="str1" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('levenshtein.string1', 'String 1')}
            </label>
            <div className="flex gap-2 items-center">
              <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> {t('common.reset')}
              </button>
            </div>
          </div>
          <textarea
            id="str1"
            value={str1}
            onChange={(e) => setStr1(e.target.value)}
            placeholder={t('levenshtein.placeholder1', 'Enter first text...')}
            className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>

        <div className="absolute left-1/2 top-[calc(50%-1.5rem)] -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-2">
          <button
            onClick={handleSwap}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl hover:border-indigo-500 hover:text-indigo-500 transition-all group"
            title={`${t('common.swap')} (S)`}
          >
            <ArrowLeftRight className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" />
          </button>
          <kbd className="hidden md:inline-flex items-center justify-center w-5 h-5 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900">S</kbd>
        </div>

        <div className="space-y-4">
          <label htmlFor="str2" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            {t('levenshtein.string2', 'String 2')}
          </label>
          <textarea
            id="str2"
            value={str2}
            onChange={(e) => setStr2(e.target.value)}
            placeholder={t('levenshtein.placeholder2', 'Enter second text...')}
            className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center md:hidden">
        <button
          onClick={handleSwap}
          className="flex items-center gap-2 px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400"
        >
          <ArrowLeftRight className="w-4 h-4" /> {t('common.swap')}
        </button>
      </div>

      {results && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          { 'error' in results ? (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl text-rose-600 dark:text-rose-400 font-bold text-center">
              {results.error}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-8 bg-indigo-500 text-white rounded-[2rem] shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                <Activity className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12 transition-transform group-hover:scale-110" />
                <div className="relative z-10 space-y-2">
                  <div className="text-xs font-black uppercase tracking-widest opacity-70">
                    {t('levenshtein.distance', 'Levenshtein Distance')}
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="text-5xl font-black tracking-tighter">{results.distance}</div>
                    <button
                      onClick={handleCopyDistance}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors mb-1 flex items-center gap-1.5 group/copy"
                      title={`${t('common.copy')} (C)`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {!copied && <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 border border-white/20 rounded text-[10px] font-bold bg-black/10">C</kbd>}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {t('levenshtein.similarity', 'Similarity')}
                  </div>
                  <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                    {results.similarity}%
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                    style={{ width: `${results.similarity}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('levenshtein.about_title', 'About Levenshtein Distance')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('levenshtein.about_text', 'The Levenshtein distance is a string metric for measuring the difference between two sequences. Informally, it is the minimum number of single-character edits (insertions, deletions or substitutions) required to change one word into the other. It is widely used in spell checkers, DNA analysis, and plagiarism detection.')}
          </p>
        </div>
      </div>
    </div>
  );
}
