import { useState, useCallback, useEffect } from 'react';
import { Fingerprint, Copy, Check, RefreshCcw, Settings, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DEFAULT_ALPHABET = 'usejm_ad-68h9kqst_pyfrvbg21345oz710';
const ALPHABETS = {
  default: 'usejm_ad-68h9kqst_pyfrvbg21345oz710',
  numbers: '0123456789',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  alphanumeric: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  hex: '0123456789abcdef',
};

export function NanoIDGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [length, setLength] = useState(initialData?.length || 21);
  const [alphabet, setAlphabet] = useState(initialData?.alphabet || DEFAULT_ALPHABET);
  const [ids, setIds] = useState<string[]>([]);
  const [count, setCount] = useState(initialData?.count || 10);
  const [copied, setCopied] = useState<number | 'all' | null>(null);

  const generateID = useCallback((len: number, alpha: string) => {
    const bytes = new Uint8Array(len);
    window.crypto.getRandomValues(bytes);
    let id = '';
    for (let i = 0; i < len; i++) {
      id += alpha[bytes[i] % alpha.length];
    }
    return id;
  }, []);

  const handleGenerate = useCallback(() => {
    const newIds = Array.from({ length: count }, () => generateID(length, alphabet));
    setIds(newIds);
  }, [length, alphabet, count, generateID]);

  useEffect(() => {
    handleGenerate();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const isBodyFocused = document.activeElement === document.body;
      const isModifierPressed = e.metaKey || e.ctrlKey || e.altKey || e.shiftKey;

      if (!isModifierPressed) {
        if ((e.key.toLowerCase() === 'r') || (e.code === 'Space' && isBodyFocused)) {
          e.preventDefault();
          handleGenerate();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate]);

  useEffect(() => {
    onStateChange?.({ length, alphabet, count });
  }, [length, alphabet, count, onStateChange]);

  const handleCopy = (text: string, index: number | 'all') => {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <Settings className="w-4 h-4" />
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('nanoid.settings')}</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('nanoid.length', { length })}</label>
              <input
                type="range"
                min="1"
                max="128"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('nanoid.quantity', { count })}</label>
              <input
                type="range"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <Fingerprint className="w-4 h-4" />
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('nanoid.alphabet')}</h3>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Object.entries(ALPHABETS).map(([name, val]) => (
                <button
                  key={name}
                  onClick={() => setAlphabet(val)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    alphabet === val
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={alphabet}
              onChange={(e) => setAlphabet(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder={t('nanoid.custom_placeholder')}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleGenerate}
          title={`${t('nanoid.generate')} (R)`}
          aria-label={`${t('nanoid.generate')} (R)`}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <RefreshCcw className="w-5 h-5" /> {t('nanoid.generate')}
          <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 border border-white/20 rounded text-[10px] font-bold bg-white/5 text-white/50 ml-1">R</kbd>
        </button>
      </div>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('nanoid.generated_title')}</h3>
          {ids.length > 0 && (
            <button
              onClick={() => handleCopy(ids.join('\n'), 'all')}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copied === 'all'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'text-indigo-600 dark:text-indigo-400 border-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }`}
            >
              {copied === 'all' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === 'all' ? t('common.copied') : t('nanoid.copy_all')}
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-2">
          {ids.map((id, index) => (
            <div
              key={index}
              className="group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all"
            >
              <code className="font-mono text-sm dark:text-slate-300 break-all">{id}</code>
              <button
                onClick={() => handleCopy(id, index)}
                aria-label={t('common.copy')}
                className={`p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === index
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-400 hover:text-indigo-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100'
                }`}
              >
                {copied === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-900/20 p-8 rounded-[2rem] flex gap-6">
        <div className="shrink-0 w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-amber-900 dark:text-amber-100">{t('nanoid.about_title')}</h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
            {t('nanoid.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
