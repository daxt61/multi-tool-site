import { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Trash2, ArrowRightLeft, FileCode, Type, Download, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function Base64Tool({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [base64, setBase64] = useState(initialData?.base64 || '');
  const [urlSafe, setUrlSafe] = useState(initialData?.urlSafe ?? false);
  const [wrapLength, setWrapLength] = useState<'off' | '64' | '76'>(initialData?.wrapLength || 'off');
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ text, base64, urlSafe, wrapLength });
  }, [text, base64, urlSafe, wrapLength, onStateChange]);

  // Wrap utility
  const wrapText = useCallback((str: string, len: number): string => {
    const regex = new RegExp(`.{1,${len}}`, 'g');
    return str.match(regex)?.join('\n') || str;
  }, []);

  const encode = useCallback((input: string) => {
    try {
      if (!input) return '';
      const bytes = new TextEncoder().encode(input);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      let result = btoa(binary);
      if (urlSafe) {
        result = result.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      } else {
        if (wrapLength === '64') {
          result = wrapText(result, 64);
        } else if (wrapLength === '76') {
          result = wrapText(result, 76);
        }
      }
      return result;
    } catch (e) {
      return 'Error';
    }
  }, [urlSafe, wrapLength, wrapText]);

  const decode = useCallback((input: string) => {
    try {
      if (!input) return '';
      // Strip newlines / spaces for decoding
      let inputToDecode = input.replace(/[\r\n\s]/g, '');
      if (urlSafe) {
        inputToDecode = inputToDecode.replace(/-/g, '+').replace(/_/g, '/');
        while (inputToDecode.length % 4) inputToDecode += '=';
      }
      const binary = atob(inputToDecode);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return 'Error';
    }
  }, [urlSafe]);

  useEffect(() => {
    if (text) {
      setBase64(encode(text));
    }
  }, [urlSafe, wrapLength, encode, text]);

  // Live validation for Base64 input
  useEffect(() => {
    if (!base64) {
      setValidationWarning(null);
      return;
    }
    const cleanB64 = base64.replace(/[\r\n\s]/g, '');
    let isValid = true;
    if (urlSafe) {
      isValid = /^[A-Za-z0-9_-]*={0,2}$/.test(cleanB64);
    } else {
      isValid = /^[A-Za-z0-9+/]*={0,2}$/.test(cleanB64);
    }

    if (!isValid) {
      setValidationWarning(t('base64.invalid_warning') || 'Warning: Contains invalid Base64 characters.');
    } else if (!urlSafe && cleanB64.length % 4 !== 0) {
      setValidationWarning(t('base64.padding_warning') || 'Warning: Invalid padding length.');
    } else {
      setValidationWarning(null);
    }
  }, [base64, urlSafe, t]);

  const [copied, setCopied] = useState<'text' | 'base64' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (value: string) => {
    if (value.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setText(value);
      setBase64('');
      return;
    }
    setError(null);
    setText(value);
    setBase64(encode(value));
  };

  const handleBase64Change = (value: string) => {
    if (value.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setBase64(value);
      setText('');
      return;
    }
    setError(null);
    setBase64(value);
    const decoded = decode(value);
    if (decoded !== 'Error') {
      setText(decoded);
    } else {
      setText('');
    }
  };

  const copyToClipboard = useCallback((val: string, type: 'text' | 'base64') => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(type);
    toast.success(t('tool.link_copied') || 'Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  }, [t]);

  const handleClear = useCallback(() => {
    setText('');
    setBase64('');
    setError(null);
    setValidationWarning(null);
    textInputRef.current?.focus();
    toast.success(t('recent.cleared') || 'Cleared');
  }, [t]);

  const handleDownload = () => {
    if (!base64) return;
    const blob = new Blob([base64], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'encoded_base64.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlersRef = useRef({
    copyToClipboard,
    handleClear,
    text,
    base64
  });

  useEffect(() => {
    handlersRef.current = { copyToClipboard, handleClear, text, base64 };
  }, [copyToClipboard, handleClear, text, base64]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (handlersRef.current.base64) {
          handlersRef.current.copyToClipboard(handlersRef.current.base64, 'base64');
        } else if (handlersRef.current.text) {
          handlersRef.current.copyToClipboard(handlersRef.current.text, 'text');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {validationWarning && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-center gap-3 text-amber-600 dark:text-amber-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {validationWarning}
        </div>
      )}

      {/* Wrapping configuration panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-6 items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('base64.wrap_format') || 'Line Wrapping'}
          </span>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setWrapLength('off')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                wrapLength === 'off'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t('base64.wrap_off') || 'Off'}
            </button>
            <button
              onClick={() => setWrapLength('64')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                wrapLength === '64'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              64 chars
            </button>
            <button
              onClick={() => setWrapLength('76')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                wrapLength === '76'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              76 chars
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
          <button
            onClick={handleClear}
            className="text-xs font-bold px-4 py-2.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1.5 border border-transparent focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-4 h-4" /> {t('common.clear') || 'Clear'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('base64.clear_text')}</label>
            </div>
            <div className="flex gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!text) return;
                    const blob = new Blob([text], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'decoded_text.txt';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  disabled={!text}
                  className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                  title={t('common.download')}
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  onClick={() => copyToClipboard(text, 'text')}
                  disabled={!text}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                    copied === 'text'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'text' ? t('common.copied') : t('common.copy')}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setUrlSafe(!urlSafe)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    urlSafe
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {t('base64.url_safe')}
                </button>
              </div>
            </div>
          </div>
          <textarea
            id="text-input"
            ref={textInputRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={t('base64.placeholder_text')}
            className={`w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-3xl outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>

        {/* Base64 Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="base64-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('base64.title')}</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!base64}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('common.download')}
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={() => copyToClipboard(base64, 'base64')}
                disabled={!base64}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                  copied === 'base64'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 shadow-sm'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied === 'base64' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 'base64' ? t('common.copied') : t('common.copy')}
                {copied !== 'base64' && <Kbd modifier={null} className="hidden sm:inline-flex items-center justify-center w-4 h-4 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="base64-input"
            value={base64}
            onChange={(e) => handleBase64Change(e.target.value)}
            placeholder={t('base64.placeholder_base64')}
            className={`w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-3xl outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 break-all resize-none`}
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4">{t('base64.about_title')}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('base64.about_text')}
        </p>
      </div>
    </div>
  );
}
