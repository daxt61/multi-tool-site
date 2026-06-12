import { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, Unlock, Copy, Check, RotateCcw, Info, AlertCircle, Shield, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 10000;
const MAX_RAILS = 20;

export function RailFenceCipher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [rails, setRails] = useState(initialData?.rails ?? 3);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>(initialData?.mode || 'encrypt');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encrypt = (input: string, numRails: number) => {
    if (numRails <= 1 || input.length <= numRails) return input;

    const fence: string[][] = Array.from({ length: numRails }, () => []);
    let rail = 0;
    let direction = 1;

    for (const char of input) {
      fence[rail].push(char);
      rail += direction;
      if (rail === 0 || rail === numRails - 1) direction *= -1;
    }

    return fence.flat().join('');
  };

  const decrypt = (input: string, numRails: number) => {
    if (numRails <= 1 || input.length <= numRails) return input;

    const pattern: number[] = [];
    let rail = 0;
    let direction = 1;

    for (let i = 0; i < input.length; i++) {
      pattern.push(rail);
      rail += direction;
      if (rail === 0 || rail === numRails - 1) direction *= -1;
    }

    const railLengths = new Array(numRails).fill(0);
    for (const r of pattern) railLengths[r]++;

    const railsData: string[][] = [];
    let current = 0;
    for (let i = 0; i < numRails; i++) {
      railsData.push(input.substring(current, current + railLengths[i]).split(''));
      current += railLengths[i];
    }

    let result = '';
    for (const r of pattern) {
      result += railsData[r].shift();
    }

    return result;
  };

  const result = text.length <= MAX_LENGTH ? (mode === 'encrypt' ? encrypt(text, rails) : decrypt(text, rails)) : '';

  useEffect(() => {
    onStateChange?.({ rails, mode });
  }, [rails, mode, onStateChange]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleReset = useCallback(() => {
    setText('');
    setError(null);
  }, []);

  const handleTextChange = (val: string) => {
    setText(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  // Keyboard Shortcuts
  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  }, [handleReset, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) {
        if (e.key === 'Escape') {
          handlersRef.current.handleReset();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode('encrypt')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === 'encrypt'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Lock className="w-4 h-4" /> {t('stringescaper.escape')}
          </button>
          <button
            onClick={() => setMode('decrypt')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === 'decrypt'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Unlock className="w-4 h-4" /> {t('stringescaper.unescape')}
          </button>
        </div>

        <div className="flex gap-2 items-center">
          <kbd className="hidden md:inline-flex items-center justify-center w-6 h-6 border rounded text-xs font-bold ml-1 transition-all bg-black/10 border-white/20 text-white/70 group-hover:bg-black/20 dark:bg-slate-100 dark:border-slate-200 dark:text-slate-400">Esc</kbd>
          <button
            onClick={handleReset}
            disabled={!text}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" /> {t('common.reset')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="rail-count" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-500" /> {t('railfence.rails')} : {rails}
              </label>
              <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{rails}</span>
            </div>
            <input
              id="rail-count"
              type="range"
              min="2"
              max={MAX_RAILS}
              value={rails}
              onChange={(e) => setRails(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-4">
            <label htmlFor="rail-input" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" /> {t('common.input')}
            </label>
            <textarea
              id="rail-input"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={t('stringescaper.placeholder_input')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none font-medium"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('common.result')}
            </label>
            <div className="flex gap-2 items-center">
              <kbd className="hidden md:inline-flex items-center justify-center w-6 h-6 border rounded text-xs font-bold ml-1 transition-all bg-black/10 border-white/20 text-white/70 group-hover:bg-black/20 dark:bg-slate-100 dark:border-slate-200 dark:text-slate-400">C</kbd>
              <button
                onClick={handleCopy}
                disabled={!result}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <div
            className="w-full h-[400px] p-8 bg-slate-900 dark:bg-black border border-slate-800 rounded-[2.5rem] font-mono text-xl text-indigo-400 break-all overflow-y-auto leading-relaxed shadow-xl shadow-indigo-500/5"
          >
            {result || <span className="text-slate-700 italic">{t('base64.placeholder_base64')}</span>}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('railfence.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('railfence.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
