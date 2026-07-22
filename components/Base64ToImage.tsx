import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Copy, Check, Trash2, Image as ImageIcon, Download, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

export function Base64ToImage({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [base64, setBase64] = useState(initialData?.base64 || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ base64 });
  }, [base64, onStateChange]);

  const MAX_LENGTH = 1000000; // 1MB for images in base64 is reasonable

  const cleanBase64 = (str: string) => {
    return str.trim().replace(/^data:image\/[a-z+]+;base64,/, '');
  };

  const getFullDataUrl = useCallback((str: string) => {
    const s = str.trim();
    if (s.startsWith('data:image/')) return s;

    const cleaned = cleanBase64(s);
    // Detect format from magic bytes (first few chars of base64)
    let format = 'png';
    if (cleaned.startsWith('iVBORw0KGgo')) format = 'png';
    else if (cleaned.startsWith('/9j/')) format = 'jpeg';
    else if (cleaned.startsWith('R0lGOD')) format = 'gif';
    else if (cleaned.startsWith('UklGR')) format = 'webp';
    else if (cleaned.startsWith('PHN2Zy')) format = 'svg+xml';

    return `data:image/${format};base64,${cleaned}`;
  }, []);

  const handleDownload = useCallback(() => {
    if (!base64 || error) return;
    const link = document.createElement('a');
    link.href = getFullDataUrl(base64);
    link.download = `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [base64, error, getFullDataUrl]);

  const handleCopy = useCallback(() => {
    if (!base64 || error) return;
    navigator.clipboard.writeText(getFullDataUrl(base64));
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [base64, error, getFullDataUrl, t]);

  const handleClear = useCallback(() => {
    setBase64('');
    setError(null);
    textareaRef.current?.focus();
  }, []);

  const handleBase64Change = (val: string) => {
    setBase64(val);
    if (val.length > MAX_LENGTH) {
      setError(t('base64image.error_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  // Safe Keyboard shortcuts ref-backed implementation
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );

      if (isEditable) {
        if (activeEl === textareaRef.current && e.key === 'Escape') {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="base64-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
            {t('base64image.input_label')}
          </label>
          <div className="flex items-center gap-2">
            <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
            <button
              onClick={handleClear}
              disabled={!base64}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
        </div>
        <textarea
          id="base64-input"
          ref={textareaRef}
          value={base64}
          onChange={(e) => handleBase64Change(e.target.value)}
          placeholder={t('base64image.placeholder')}
          autoComplete="off"
          spellCheck={false}
          className={`w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-3xl outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-xs leading-relaxed dark:text-slate-300 break-all resize-none`}
        />
      </div>

      {base64 && !error && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('base64image.preview_label')}</label>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleCopy}
                title={`${t('base64image.copy_data_url')} (C)`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? t('common.copied') : t('base64image.copy_data_url')}</span>
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex border-slate-200 dark:border-slate-800 text-slate-400 dark:bg-slate-900">C</Kbd>}
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 flex items-center justify-center min-h-[300px] overflow-hidden">
            <img
              src={getFullDataUrl(base64)}
              alt={t('base64image.preview_label')}
              className="max-w-full max-h-[500px] object-contain rounded-xl shadow-2xl"
              onError={() => setError(t('base64image.error_invalid'))}
              onLoad={() => setError(null)}
            />
          </div>
        </div>
      )}

      {!base64 && (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-4">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <ImageIcon className="w-8 h-8" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {t('base64image.empty_state')}
          </p>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4">{t('base64image.about_title')}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('base64image.about_text')}
        </p>
      </div>
    </div>
  );
}
