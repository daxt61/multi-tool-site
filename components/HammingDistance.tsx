import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Binary, Type, Copy, Check, Trash2, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

type HammingMode = 'text' | 'binary';

export function HammingDistance({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text1, setText1] = useState(initialData?.text1 || '');
  const [text2, setText2] = useState(initialData?.text2 || '');
  const [mode, setMode] = useState<HammingMode>(initialData?.mode || 'text');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ text1, text2, mode });
  }, [text1, text2, mode, onStateChange]);

  const result = useMemo(() => {
    if (!text1 || !text2) return null;
    if (text1.length !== text2.length) {
      return { error: t('hamming.error_length') };
    }

    let distance = 0;
    const diffMap: boolean[] = [];

    for (let i = 0; i < text1.length; i++) {
      if (text1[i] !== text2[i]) {
        distance++;
        diffMap.push(true);
      } else {
        diffMap.push(false);
      }
    }

    const similarity = ((text1.length - distance) / text1.length * 100).toFixed(2);

    return { distance, diffMap, similarity };
  }, [text1, text2, mode, t]);

  const handleClear = useCallback(() => {
    setText1('');
    setText2('');
  }, []);

  const handleSwap = useCallback(() => {
    const temp = text1;
    setText1(text2);
    setText2(temp);
  }, [text1, text2]);

  const copyResult = useCallback(() => {
    if (!result || 'error' in result) return;
    navigator.clipboard.writeText(String(result.distance));
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [result, t]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable && e.key !== 'Escape') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleSwap();
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        copyResult();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear, handleSwap, copyResult]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center px-1">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setMode('text')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              mode === 'text'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Type className="w-4 h-4 inline-block mr-2" /> {t('common.text')}
          </button>
          <button
            onClick={() => setMode('binary')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              mode === 'binary'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Binary className="w-4 h-4 inline-block mr-2" /> {t('common.binary')}
          </button>
        </div>
        <button
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
        >
          <Trash2 className="w-3 h-3" /> {t('common.clear')}
          <Kbd modifier={null} className="ml-1 bg-white/50 dark:bg-black/20 border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label htmlFor="text1" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('hamming.input1')}</label>
          <textarea
            id="text1"
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg resize-none dark:text-white"
            placeholder={mode === 'binary' ? '10101010' : 'ABCDEFG'}
          />
        </div>
        <div className="space-y-4">
          <label htmlFor="text2" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('hamming.input2')}</label>
          <textarea
            id="text2"
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg resize-none dark:text-white"
            placeholder={mode === 'binary' ? '10101111' : 'ABCFGHJ'}
          />
        </div>
      </div>

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
          {'error' in result ? (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
              <AlertCircle className="w-5 h-5" />
              {result.error}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">{t('hamming.distance')}</div>
                  <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{result.distance}</div>
                  <button onClick={copyResult} className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-wider">
                    {copied ? t('common.copied') : t('common.copy')}
                  </button>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">{t('hamming.similarity')}</div>
                  <div className="text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{result.similarity}%</div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-400">{t('hamming.length')}</div>
                  <div className="text-4xl font-black text-slate-900 dark:text-white font-mono">{text1.length}</div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('hamming.visualization')}</h4>
                <div className="flex flex-wrap gap-1 font-mono text-xl p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800">
                  {text1.split('').map((char: string, i: number) => (
                    <div key={i} className="flex flex-col items-center">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${result.diffMap[i] ? 'bg-rose-500/10 text-rose-500 font-black ring-1 ring-rose-500/20' : 'text-slate-400'}`}>
                        {char}
                      </span>
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${result.diffMap[i] ? 'bg-rose-500/10 text-rose-500 font-black ring-1 ring-rose-500/20' : 'text-slate-400'}`}>
                        {text2[i]}
                      </span>
                      <div className={`mt-2 w-1.5 h-1.5 rounded-full ${result.diffMap[i] ? 'bg-rose-500' : 'bg-transparent'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
        <Info className="w-6 h-6 text-indigo-500 shrink-0 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-100">{t('hamming.how_title')}</h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
            {t('hamming.how_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
