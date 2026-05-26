import { useState, useEffect, useCallback } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, ArrowRightLeft, Download, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function Base64ToHex({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [base64Input, setBase64Input] = useState(initialData?.base64Input || '');
  const [hexInput, setHexInput] = useState(initialData?.hexInput || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'base64' | 'hex' | null>(null);

  useEffect(() => {
    onStateChange?.({ base64Input, hexInput });
  }, [base64Input, hexInput, onStateChange]);

  const base64ToHex = (b64: string) => {
    try {
      const binary = atob(b64);
      let hex = '';
      for (let i = 0; i < binary.length; i++) {
        const h = binary.charCodeAt(i).toString(16).padStart(2, '0');
        hex += h;
      }
      return hex.toUpperCase();
    } catch (e) {
      return null;
    }
  };

  const hexToBase64 = (hex: string) => {
    try {
      const cleanHex = hex.replace(/[^0-9A-Fa-f]/g, '');
      if (cleanHex.length % 2 !== 0) return null;
      let binary = '';
      for (let i = 0; i < cleanHex.length; i += 2) {
        binary += String.fromCharCode(parseInt(cleanHex.substr(i, 2), 16));
      }
      return btoa(binary);
    } catch (e) {
      return null;
    }
  };

  const handleBase64Change = (val: string) => {
    setBase64Input(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError('');
    const hex = base64ToHex(val);
    if (hex !== null) {
      setHexInput(hex);
    } else if (val.trim()) {
      setError(t('error.invalid_decoding'));
    }
  };

  const handleHexChange = (val: string) => {
    setHexInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError('');
    const b64 = hexToBase64(val);
    if (b64 !== null) {
      setBase64Input(b64);
    } else if (val.trim() && val.replace(/[^0-9A-Fa-f]/g, '').length % 2 !== 0) {
       // Just wait for more chars
    } else if (val.trim()) {
      setError(t('error.invalid_encoding'));
    }
  };

  const handleCopy = (text: string, type: 'base64' | 'hex') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setBase64Input('');
    setHexInput('');
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-800 text-indigo-500">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="base64-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Base64</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(base64Input, 'base64')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all border ${
                  copied === 'base64'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent'
                }`}
              >
                {copied === 'base64' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied === 'base64' ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={handleClear}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <textarea
            id="base64-input"
            value={base64Input}
            onChange={(e) => handleBase64Change(e.target.value)}
            placeholder="SGVsbG8="
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-500" />
              <label htmlFor="hex-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Hexadecimal</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(hexInput, 'hex')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all border ${
                  copied === 'hex'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent'
                }`}
              >
                {copied === 'hex' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied === 'hex' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="hex-input"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="48656C6C6F"
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('base64hex.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('base64hex.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
