import { useState, useCallback, useEffect } from 'react';
import { Copy, Check, RefreshCw, Trash2, Fingerprint, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32

export function ULIDGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [ulids, setUlids] = useState<string[]>(initialData?.ulids || []);
  const [count, setCount] = useState(initialData?.count || 1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    onStateChange?.({ ulids, count });
  }, [ulids, count, onStateChange]);

  const encodeTime = (now: number, len: number) => {
    let str = "";
    for (let i = len; i > 0; i--) {
      const mod = now % 32;
      str = ENCODING.charAt(mod) + str;
      now = (now - mod) / 32;
    }
    return str;
  };

  const encodeRandom = (len: number) => {
    let str = "";
    const randomBytes = new Uint8Array(len);
    window.crypto.getRandomValues(randomBytes);
    for (let i = 0; i < len; i++) {
      str += ENCODING.charAt(randomBytes[i] % 32);
    }
    return str;
  };

  const generateULID = useCallback(() => {
    return encodeTime(Date.now(), 10) + encodeRandom(16);
  }, []);

  const generateULIDs = useCallback(() => {
    const newUlids = [];
    const safeCount = Math.min(Math.max(1, count), 100);
    for (let i = 0; i < safeCount; i++) {
      newUlids.push(generateULID());
    }
    setUlids(newUlids);
    setCopiedIndex(null);
  }, [count, generateULID]);

  const copyToClipboard = useCallback((ulid: string, index: number) => {
    navigator.clipboard.writeText(ulid);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, []);

  const copyAll = useCallback(() => {
    navigator.clipboard.writeText(ulids.join('\n'));
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  }, [ulids]);

  const handleClear = useCallback(() => {
    setUlids([]);
    setCopiedIndex(null);
  }, []);

  const handleDownload = useCallback(() => {
    if (ulids.length === 0) return;
    const blob = new Blob([ulids.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ulids-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [ulids]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" && (document.activeElement as HTMLInputElement).type === "text") return;
      if (document.activeElement?.tagName === "TEXTAREA") return;

      if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Enter') {
        if (document.activeElement?.tagName !== "BUTTON") {
          e.preventDefault();
          generateULIDs();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear, generateULIDs]);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-end items-center gap-2 px-1">
        <button
          onClick={handleDownload}
          disabled={ulids.length === 0}
          className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Download className="w-3 h-3" /> {t('common.download')}
        </button>
        <button
          onClick={handleClear}
          disabled={ulids.length === 0}
          aria-label={t('common.clear')}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> {t('common.clear')}
          <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900 ml-1">Esc</kbd>
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-end gap-4 mb-6">
          <div className="flex-1 w-full">
            <label htmlFor="ulid-count" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 px-1 cursor-pointer">
              {t('uuid.count_label', 'Number of ULIDs to generate')}
            </label>
            <input
              id="ulid-count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={generateULIDs}
              className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none group"
            >
              <RefreshCw className="w-5 h-5 transition-transform group-hover:rotate-180" />
              {t('random.generate')}
            </button>
          </div>
        </div>

        {ulids.length > 1 && (
          <button
            onClick={copyAll}
            className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              copiedIndex === -1
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {copiedIndex === -1 ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copiedIndex === -1 ? t('common.copied') : t('passwordgenerator.copy_all')}
          </button>
        )}
      </div>

      {ulids.length > 0 ? (
        <div
          className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500"
          aria-live="polite"
          aria-atomic="true"
        >
          {ulids.map((ulid, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:border-indigo-500/30 transition-all group"
            >
              <code className="font-mono text-sm md:text-base text-slate-700 dark:text-slate-300 break-all">{ulid}</code>
              <button
                onClick={() => copyToClipboard(ulid, index)}
                className={`p-2.5 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedIndex === index
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                }`}
                aria-label={t('common.copy')}
              >
                {copiedIndex === index ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5 transition-transform group-hover:scale-110" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-16 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-600">
            <Fingerprint className="w-8 h-8 transition-transform hover:scale-110" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">{t('ulid.empty_title', 'No ULID generated')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t('ulid.empty_hint', 'Click "Generate" to create unique identifiers.')}</p>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl p-6 text-sm text-indigo-900 dark:text-indigo-400 flex gap-4 items-start">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500">
          <Fingerprint className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold mb-1">{t('ulid.about_title', 'What is a ULID?')}</p>
          <p className="opacity-80 leading-relaxed">
            {t('ulid.about_text', 'ULID (Universally Unique Lexicographically Sortable Identifier) is a 128-bit identifier that is compatible with UUID. It is lexicographically sortable, contains a 48-bit timestamp, and is encoded using Crockfords Base32 for better readability.')}
          </p>
        </div>
      </div>
    </div>
  );
}
