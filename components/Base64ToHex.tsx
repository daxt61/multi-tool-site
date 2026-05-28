import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Trash2, ArrowLeftRight, FileCode, Hash, Info, AlertCircle, Download } from 'lucide-react';
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

  const base64ToHex = useCallback((b64: string) => {
    try {
      setError('');
      if (!b64.trim()) {
        setHexInput('');
        return;
      }

      if (b64.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      const binaryString = atob(b64);
      const hex = Array.from(binaryString)
        .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();

      setHexInput(hex);
    } catch (e: any) {
      setError(t('error.invalid_encoding'));
    }
  }, [t]);

  const hexToBase64 = useCallback((hex: string) => {
    try {
      setError('');
      const cleanHex = hex.replace(/[^0-9A-Fa-f]/g, '');

      if (!cleanHex) {
        setBase64Input('');
        return;
      }

      if (cleanHex.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      if (cleanHex.length % 2 !== 0) {
        setError(t('b64hex.error_odd_hex'));
        return;
      }

      const binaryString = cleanHex.match(/.{1,2}/g)!
        .map(byte => String.fromCharCode(parseInt(byte, 16)))
        .join('');

      setBase64Input(btoa(binaryString));
    } catch (e: any) {
      setError(t('error.invalid_decoding'));
    }
  }, [t]);

  const handleBase64Change = (val: string) => {
    setBase64Input(val);
    base64ToHex(val);
  };

  const handleHexChange = (val: string) => {
    setHexInput(val);
    hexToBase64(val);
  };

  const copyToClipboard = (text: string, type: 'base64' | 'hex') => {
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

  const handleDownload = (content: string, filename: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
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
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>

        {/* Base64 Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="base64-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Base64</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(base64Input, 'data.b64')}
                disabled={!base64Input}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={() => copyToClipboard(base64Input, 'base64')}
                disabled={!base64Input}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'base64'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                } disabled:opacity-50`}
              >
                {copied === 'base64' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'base64' ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={handleClear}
                disabled={!base64Input && !hexInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            id="base64-input"
            value={base64Input}
            onChange={(e) => handleBase64Change(e.target.value)}
            placeholder="SGVsbG8gV29ybGQh"
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>

        {/* Hex Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" />
              <label htmlFor="hex-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Hexadecimal</label>
            </div>
            <div className="flex gap-2">
               <button
                onClick={() => handleDownload(hexInput, 'data.hex')}
                disabled={!hexInput}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={() => copyToClipboard(hexInput, 'hex')}
                disabled={!hexInput}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'hex'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                } disabled:opacity-50`}
              >
                {copied === 'hex' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'hex' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="hex-input"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            placeholder="48 65 6C 6C 6F 20 57 6F 72 6C 64 21"
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('b64hex.what_is_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('b64hex.what_is_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-500" /> {t('b64hex.base64_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('b64hex.base64_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-500" /> {t('b64hex.hex_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('b64hex.hex_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
