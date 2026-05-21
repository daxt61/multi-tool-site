import { useState, useCallback, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Trash2, Copy, Check, Info, LinkIcon, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function URLEncoder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [decoded, setDecoded] = useState(initialData?.decoded || '');
  const [encoded, setEncoded] = useState(initialData?.encoded || '');
  const [copiedDecoded, setCopiedDecoded] = useState(false);
  const [copiedEncoded, setCopiedEncoded] = useState(false);

  useEffect(() => {
    onStateChange?.({ decoded, encoded });
  }, [decoded, encoded, onStateChange]);

  const encode = (text: string) => {
    try {
      return encodeURIComponent(text);
    } catch {
      return t('error.invalid_encoding', 'Encoding error');
    }
  };

  const decode = (text: string) => {
    try {
      return decodeURIComponent(text);
    } catch {
      return t('error.invalid_decoding', 'Decoding error');
    }
  };

  const handleDecodedChange = (value: string) => {
    setDecoded(value);
    setEncoded(encode(value));
  };

  const handleEncodedChange = (value: string) => {
    setEncoded(value);
    setDecoded(decode(value));
  };

  const handleCopyDecoded = useCallback(() => {
    if (!decoded) return;
    navigator.clipboard.writeText(decoded);
    setCopiedDecoded(true);
    setTimeout(() => setCopiedDecoded(false), 2000);
  }, [decoded]);

  const handleCopyEncoded = useCallback(() => {
    if (!encoded) return;
    navigator.clipboard.writeText(encoded);
    setCopiedEncoded(true);
    setTimeout(() => setCopiedEncoded(false), 2000);
  }, [encoded]);

  const handleClear = useCallback(() => {
    setDecoded('');
    setEncoded('');
  }, []);


  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Décodé */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="url-decoded" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <LinkIcon className="w-3 h-3 text-indigo-500 transition-transform group-hover:scale-110" /> {t('urlencoder.decoded')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCopyDecoded}
                disabled={!decoded}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedDecoded
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copiedDecoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedDecoded ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={handleClear}
                disabled={!decoded && !encoded}
                aria-label={t('common.clear')}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-transparent transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="url-decoded"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClear();
              }
            }}
            placeholder={t('urlencoder.placeholder_decoded')}
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono resize-none"
          />
        </div>

        {/* Encodé */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="url-encoded" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <Code className="w-3 h-3 text-indigo-500 transition-transform group-hover:scale-110" /> {t('urlencoder.encoded')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCopyEncoded}
                disabled={!encoded}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedEncoded
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copiedEncoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedEncoded ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="url-encoded"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                handleClear();
              }
            }}
            placeholder={t('urlencoder.placeholder_encoded')}
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono resize-none break-all"
          />
        </div>
      </div>

      <div className="flex justify-center gap-6">
        <div className="hidden md:flex flex-col items-center gap-2 text-slate-300">
          <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
          <ArrowRight className="w-6 h-6 transition-transform hover:scale-110" />
          <ArrowLeft className="w-6 h-6 transition-transform hover:scale-110" />
          <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('urlencoder.why_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('urlencoder.why_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-indigo-500" /> {t('urlencoder.live_update_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('urlencoder.live_update_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-indigo-500" /> {t('urlencoder.special_chars_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('urlencoder.special_chars_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
