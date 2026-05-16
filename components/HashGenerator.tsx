import { useState, useEffect } from 'react';
import { Shield, Copy, Check, Trash2, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function HashGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState(initialData?.inputText || '');
  const [hashes, setHashes] = useState<{ [key: string]: string }>(initialData?.hashes || {
    'SHA-256': '',
    'SHA-384': '',
    'SHA-512': '',
  });

  useEffect(() => {
    onStateChange?.({ inputText, hashes });
  }, [inputText, hashes]);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateHashes = async (text: string) => {
    setInputText(text);

    if (text.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setHashes({ 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });
      return;
    }

    setError(null);

    if (!text) {
      setHashes({ 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });
      return;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);

      const hashAlgorithms = ['SHA-256', 'SHA-384', 'SHA-512'];
      const newHashes: { [key: string]: string } = {};

      for (const algo of hashAlgorithms) {
        const hashBuffer = await crypto.subtle.digest(algo, data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        newHashes[algo] = hashHex;
      }

      setHashes(newHashes);
    } catch (e: any) {
      setError(t('hashgenerator.error_generation') + ' : ' + e.message);
    }
  };

  const copyToClipboard = (text: string, algo: string) => {
    navigator.clipboard.writeText(text);
    setCopied(algo);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setInputText('');
    setHashes({ 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label htmlFor="hash-input" className="block text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
            {t('hashgenerator.input_label')}
          </label>
          <button
            onClick={handleClear}
            disabled={!inputText}
            aria-label={t('common.clear')}
            className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-transparent transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-3 h-3" /> {t('common.clear')}
          </button>
        </div>
        <textarea
          id="hash-input"
          value={inputText}
          onChange={(e) => generateHashes(e.target.value)}
          placeholder={t('hashgenerator.input_placeholder')}
          className={`w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-3xl outline-none focus:ring-2 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
        />
      </div>

      <div className="grid gap-6">
        {Object.entries(hashes).map(([algo, hash]) => (
          <div key={algo} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold tracking-widest">
                {algo}
              </span>
              <button
                onClick={() => copyToClipboard(hash, algo)}
                disabled={!hash}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === algo
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
                aria-label={copied === algo ? t('common.copied') : `${t('common.copy')} ${algo}`}
              >
                {copied === algo ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === algo ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <div className="font-mono text-sm break-all bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              {hash || t('hashgenerator.waiting')}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] flex items-start gap-4 border border-indigo-100 dark:border-indigo-900/20">
        <Shield className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
        <div className="text-sm">
          <p className="font-bold mb-1 text-slate-900 dark:text-white">{t('hashgenerator.security_note_title')}</p>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('hashgenerator.security_note_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
