import { useState, useEffect, useCallback, useMemo } from 'react';
import { Copy, Check, Fingerprint, Download, Trash2, Info, Settings2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford's Base32
const ENCODING_LEN = ENCODING.length;

function encodeTime(now: number, len: number): string {
  let res = "";
  for (let i = len; i > 0; i--) {
    const mod = now % ENCODING_LEN;
    res = ENCODING.charAt(mod) + res;
    now = Math.floor(now / ENCODING_LEN);
  }
  return res;
}

function encodeRandom(len: number): string {
  let res = "";
  const randomValues = new Uint8Array(len);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < len; i++) {
    res += ENCODING.charAt(randomValues[i] % ENCODING_LEN);
  }
  return res;
}

function generateULID(): string {
  return encodeTime(Date.now(), 10) + encodeRandom(16);
}

export function ULIDGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [count, setCount] = useState(initialData?.count ?? 10);
  const [ulids, setUlids] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generate = useCallback(() => {
    const newUlids = Array.from({ length: Math.min(Math.max(1, count), 100) }, () => generateULID());
    setUlids(newUlids);
    setCopiedIndex(null);
  }, [count]);

  useEffect(() => {
    if (ulids.length === 0) generate();
  }, [generate, ulids.length]);

  useEffect(() => {
    onStateChange?.({ count });
  }, [count, onStateChange]);

  const copyToClipboard = (text: string, index: number | 'all') => {
    navigator.clipboard.writeText(text);
    if (typeof index === 'number') {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
    toast.success(index === 'all' ? t('common.copied_all') || 'All ULIDs copied!' : t('common.copied') || 'Copied!');
  };

  const handleDownload = () => {
    const content = ulids.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ulids-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="ulid-count" className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">
                  {t('ulid.count_label') || 'Number of ULIDs'}
                </label>
                <input
                  id="ulid-count"
                  type="number"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                />
              </div>

              <button
                onClick={generate}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <RefreshCw className="w-5 h-5" />
                {t('common.generate') || 'Generate'}
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-3xl space-y-4">
            <h4 className="font-bold flex items-center gap-2 dark:text-white">
              <Info className="w-4 h-4 text-indigo-500" /> {t('ulid.what_is_title') || 'What is a ULID?'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('ulid.what_is_text') || 'ULID (Universally Unique Lexicographically Sortable Identifier) is a 128-bit identifier compatible with UUID that is lexicographically sortable. It consists of a 48-bit timestamp and 80-bit randomness.'}
            </p>
            <ul className="text-[10px] space-y-1 text-slate-400 font-bold uppercase tracking-tight list-disc list-inside">
              <li>{t('ulid.feat_sortable') || 'Lexicographically sortable'}</li>
              <li>{t('ulid.feat_case') || 'Case-insensitive'}</li>
              <li>{t('ulid.feat_base32') || 'Crockford\'s Base32 encoding'}</li>
            </ul>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-indigo-500" /> {t('common.result')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(ulids.join('\n'), 'all')}
                disabled={ulids.length === 0}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Copy className="w-3 h-3" /> {t('common.copy_all') || 'Copy All'}
              </button>
              <button
                onClick={handleDownload}
                disabled={ulids.length === 0}
                className="text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto no-scrollbar p-4 space-y-2">
              {ulids.map((ulid, index) => (
                <div
                  key={index}
                  className={`group flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    copiedIndex === index
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-indigo-500/30'
                  }`}
                >
                  <code className={`font-mono text-sm md:text-base font-bold ${copiedIndex === index ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    {ulid}
                  </code>
                  <button
                    onClick={() => copyToClipboard(ulid, index)}
                    className={`p-2 rounded-xl transition-all ${
                      copiedIndex === index
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-700 shadow-sm'
                    }`}
                  >
                    {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
