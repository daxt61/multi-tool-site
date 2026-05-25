import { useState, useEffect, useCallback } from 'react';
import { Shield, Copy, Check, Trash2, AlertCircle, Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function HMACGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [message, setMessage] = useState(initialData?.message || '');
  const [secretKey, setSecretKey] = useState(initialData?.secretKey || '');
  const [algorithm, setAlgorithm] = useState<'SHA-256' | 'SHA-384' | 'SHA-512'>(initialData?.algorithm || 'SHA-256');
  const [hmac, setHmac] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ message, secretKey, algorithm });
  }, [message, secretKey, algorithm, onStateChange]);

  const generateHMAC = useCallback(async () => {
    if (!message || !secretKey) {
      setHmac('');
      return;
    }

    if (message.length > MAX_LENGTH || secretKey.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }

    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secretKey);
      const messageData = encoder.encode(message);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: algorithm },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const hashArray = Array.from(new Uint8Array(signature));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setHmac(hashHex);
      setError(null);
    } catch (e: any) {
      setError(t('hashgenerator.error_generation') + ' : ' + e.message);
    }
  }, [message, secretKey, algorithm, t]);

  useEffect(() => {
    generateHMAC();
  }, [generateHMAC]);

  const handleCopy = () => {
    if (!hmac) return;
    navigator.clipboard.writeText(hmac);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setMessage('');
    setSecretKey('');
    setHmac('');
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="hmac-message" className="block text-xs font-black uppercase tracking-widest text-slate-400">
              {t('common.input')} (Message)
            </label>
            <button
              onClick={handleClear}
              disabled={!message && !secretKey}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors disabled:opacity-50"
            >
              {t('common.clear')}
            </button>
          </div>
          <textarea
            id="hmac-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('hashgenerator.input_placeholder')}
            className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <label htmlFor="hmac-key" className="block text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            {t('hmac.secret_key')}
          </label>
          <div className="relative">
            <input
              id="hmac-key"
              type="text"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder={t('hmac.key_placeholder')}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300"
            />
            <Key className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              {t('hmac.algorithm')}
            </label>
            <div className="flex gap-2">
              {(['SHA-256', 'SHA-384', 'SHA-512'] as const).map((algo) => (
                <button
                  key={algo}
                  onClick={() => setAlgorithm(algo)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                    algorithm === algo
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {algo}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('hmac.result')}
          </label>
          <button
            onClick={handleCopy}
            disabled={!hmac}
            className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              copied
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-transparent hover:bg-indigo-100 dark:hover:bg-indigo-500/20 disabled:opacity-50'
            }`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl font-mono text-sm break-all text-indigo-300 min-h-[5rem] flex items-center justify-center">
          {hmac || <span className="text-slate-500 italic opacity-50">{t('hmac.waiting')}</span>}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] flex items-start gap-4 border border-indigo-100 dark:border-indigo-900/20">
        <Shield className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-1" />
        <div className="text-sm">
          <p className="font-bold mb-1 text-slate-900 dark:text-white">{t('hmac.about_title')}</p>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('hmac.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
