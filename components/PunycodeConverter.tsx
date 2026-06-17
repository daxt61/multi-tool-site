import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ArrowLeftRight, Copy, Check, Trash2, Info, AlertCircle } from 'lucide-react';
import punycode from 'punycode/';

export function PunycodeConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [unicode, setUnicode] = useState(initialData?.unicode || '');
  const [puny, setPuny] = useState(initialData?.puny || '');
  const [copiedUnicode, setCopiedUnicode] = useState(false);
  const [copiedPuny, setCopiedPuny] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ unicode, puny });
  }, [unicode, puny, onStateChange]);

  const convertToPuny = (text: string) => {
    if (!text) {
      setPuny('');
      setError(null);
      return;
    }
    try {
      // Split by dots to handle full domain names
      const result = text.split('.').map(part => {
        if (!part) return '';
        // If part contains non-ASCII, it's IDN
        if (/[^\x00-\x7F]/.test(part)) {
          return 'xn--' + punycode.encode(part);
        }
        return part;
      }).join('.');
      setPuny(result);
      setError(null);
    } catch (e) {
      setError(t('punycode.error_encode', 'Failed to encode to Punycode'));
    }
  };

  const convertToUnicode = (text: string) => {
    if (!text) {
      setUnicode('');
      setError(null);
      return;
    }
    try {
      const result = text.split('.').map(part => {
        if (part.toLowerCase().startsWith('xn--')) {
          return punycode.decode(part.substring(4));
        }
        return part;
      }).join('.');
      setUnicode(result);
      setError(null);
    } catch (e) {
      setError(t('punycode.error_decode', 'Failed to decode Punycode'));
    }
  };

  const handleUnicodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setUnicode(val);
    convertToPuny(val);
  };

  const handlePunyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPuny(val);
    convertToUnicode(val);
  };

  const handleCopy = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setUnicode('');
    setPuny('');
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 items-center">
        {/* Unicode Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="unicode-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('punycode.unicode_label', 'Unicode / IDN (Text)')}
            </label>
            <button
              onClick={() => handleCopy(unicode, setCopiedUnicode)}
              disabled={!unicode}
              className={`p-1.5 rounded-lg transition-colors ${copiedUnicode ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'} disabled:opacity-50`}
            >
              {copiedUnicode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="unicode-input"
            value={unicode}
            onChange={handleUnicodeChange}
            placeholder="mañana.com"
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>

        {/* Separator / Icon */}
        <div className="lg:col-span-1 flex justify-center">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <ArrowLeftRight className="w-6 h-6 lg:rotate-0 rotate-90" />
          </div>
        </div>

        {/* Punycode Output */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="puny-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('punycode.puny_label', 'Punycode (ASCII)')}
            </label>
            <button
              onClick={() => handleCopy(puny, setCopiedPuny)}
              disabled={!puny}
              className={`p-1.5 rounded-lg transition-colors ${copiedPuny ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'} disabled:opacity-50`}
            >
              {copiedPuny ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="puny-input"
            value={puny}
            onChange={handlePunyChange}
            placeholder="xn--maana-pta.com"
            className="w-full h-64 p-6 bg-slate-900 text-indigo-100 border border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-6 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all font-bold text-sm"
        >
          <Trash2 className="w-4 h-4" /> {t('common.clear')}
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
          <Globe className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('punycode.about_title', 'About Punycode')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('punycode.about_text', 'Punycode is a representation of Unicode with the limited ASCII character subset used for Internet domain names. Using Punycode, host names containing Unicode characters are transcoded to a subset of ASCII for compatibility with the DNS infrastructure. For example, "mañana.com" becomes "xn--maana-pta.com".')}
          </p>
        </div>
      </div>
    </div>
  );
}
