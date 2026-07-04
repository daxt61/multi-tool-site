import { useState, useEffect, useMemo, useCallback } from 'react';
import { Phone, Copy, Check, Trash2, FileText, Download, AlertCircle, Info, Filter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

export function PhoneExtractor({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [deduplicate, setDeduplicate] = useState(initialData?.deduplicate ?? true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ text, deduplicate });
  }, [text, deduplicate, onStateChange]);

  const extracted = useMemo(() => {
    if (!text.trim() || text.length > MAX_LENGTH) return [];

    // Robust phone number regex
    // Matches international (+xx), local (0x), spaces, dots, dashes, parentheses
    const phoneRegex = /(?:\+?\d{1,4}[-.\s]?)?\(?\d{1,4}?\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,9}/g;

    const matches = text.match(phoneRegex) || [];
    const cleaned = matches
      .map((m: string) => m.trim())
      .filter((m: string) => {
        // Basic validation: must have at least 5 digits to be a phone number
        const digits = m.replace(/\D/g, '');
        return digits.length >= 5 && digits.length <= 15;
      });

    return deduplicate ? Array.from(new Set(cleaned)) : cleaned;
  }, [text, deduplicate]);

  const handleCopy = useCallback(() => {
    if (extracted.length === 0) return;
    navigator.clipboard.writeText(extracted.join('\n'));
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [extracted, t]);

  const handleDownload = useCallback(() => {
    if (extracted.length === 0) return;
    const blob = new Blob([extracted.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phone-numbers-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [extracted]);

  const handleClear = () => {
    setText('');
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('phone.input_label')}</label>
            <button
              onClick={handleClear}
              disabled={!text}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (e.target.value.length > MAX_LENGTH) {
                setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
              } else {
                setError(null);
              }
            }}
            placeholder={t('phone.placeholder')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('phone.results_label')}</label>
              <button
                onClick={() => setDeduplicate(!deduplicate)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all border ${
                  deduplicate
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Filter className="w-3 h-3" /> {t('phone.deduplicate')}
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={extracted.length === 0}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
                title={t('common.download')}
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={extracted.length === 0}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>

          <div className="h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 overflow-y-auto space-y-2">
            {extracted.length > 0 ? (
              extracted.map((num: string, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-500/30 transition-all">
                  <span className="font-mono text-sm dark:text-slate-200">{num}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(num);
                      toast.success(t('common.copied'));
                    }}
                    className="p-1.5 text-slate-400 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                <Phone className="w-12 h-12 opacity-20" />
                <p className="font-bold italic text-sm">{t('phone.no_results')}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end px-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t('phone.count', { count: extracted.length })}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('phone.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('phone.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
