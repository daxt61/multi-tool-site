import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, Info, Shield, Download, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

export function SVGToCSS({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [svg, setSvg] = useState(initialData?.svg || '');
  const [mode, setMode] = useState<'uri' | 'base64'>(initialData?.mode || 'uri');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ svg, mode });
  }, [svg, mode, onStateChange]);

  const converted = useMemo(() => {
    if (!svg.trim() || svg.length > MAX_LENGTH) return '';

    const cleanSvg = svg.trim();

    if (mode === 'base64') {
      try {
        const b64 = btoa(new TextEncoder().encode(cleanSvg).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        return `url("data:image/svg+xml;base64,${b64}")`;
      } catch (e) {
        return 'Error: Invalid SVG for base64 encoding';
      }
    } else {
      // URI Encoding (often smaller for SVG)
      const encoded = encodeURIComponent(cleanSvg)
        .replace(/'/g, "%27")
        .replace(/"/g, "%22");
      return `url("data:image/svg+xml,${encoded}")`;
    }
  }, [svg, mode]);

  const handleCopy = useCallback(() => {
    if (!converted) return;
    navigator.clipboard.writeText(`background-image: ${converted};`);
    setCopied(true);
    toast.success(t('common.copied') || 'Copié !');
    setTimeout(() => setCopied(false), 2000);
  }, [converted, t]);

  const handleClear = useCallback(() => {
    setSvg('');
    setError(null);
    toast.success(t('robotstxt.toast_cleared') || 'Effacé !');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [t]);

  // Use standard secure handlersRef pattern for keyboard shortcuts
  const handlersRef = useRef({ handleClear, handleCopy, converted });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, converted };
  }, [handleClear, handleCopy, converted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.hasAttribute('contenteditable')
      );

      // Escape to clear inputs/reset state and restore focus
      if (e.key === 'Escape') {
        handlersRef.current.handleClear();
      }

      // 'C' to copy generated output when not typing
      if (e.key.toLowerCase() === 'c' && !isEditable && handlersRef.current.converted) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSvgChange = (val: string) => {
    setSvg(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }) || `L'entrée est trop longue. Limite de ${MAX_LENGTH.toLocaleString()} caractères.`);
    } else {
      setError(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="flex justify-between items-center px-1">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode('uri')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'uri'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t('svg_to_css.mode_uri')}
          </button>
          <button
            onClick={() => setMode('base64')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'base64'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {t('svg_to_css.mode_base64')}
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
          <button
            onClick={handleClear}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" /> {t('common.clear')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            <label htmlFor="svg-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              {t('svg_to_css.source')}
            </label>
          </div>
          <textarea
            ref={inputRef}
            id="svg-input"
            value={svg}
            onChange={(e) => handleSvgChange(e.target.value)}
            placeholder='<svg xmlns="http://www.w3.org/2000/svg" ...> ... </svg>'
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output & Preview */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('svg_to_css.preview')}</h3>
              </div>
            </div>
            <div className="h-40 bg-slate-100 dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center relative group">
               {/* Pattern preview */}
               <div
                 className="absolute inset-0 opacity-10 dark:opacity-20"
                 style={{ backgroundImage: `radial-gradient(#6366f1 1px, transparent 0)`, backgroundSize: '24px 24px' }}
               />
               <div
                 className="w-24 h-24 bg-contain bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110"
                 style={{ backgroundImage: converted }}
               />
               {(!svg.trim() || svg.length > MAX_LENGTH) && (
                 <p className="text-sm font-bold text-slate-300 dark:text-slate-700">{t('svg_to_css.placeholder')}</p>
               )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('svg_to_css.property')}</h3>
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900">C</kbd>
                <button
                  onClick={handleCopy}
                  disabled={!converted}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <div className="p-6 bg-slate-900 dark:bg-black rounded-3xl font-mono text-xs text-indigo-300 break-all border border-slate-800 shadow-xl max-h-40 overflow-y-auto scrollbar-thin">
              {converted ? `background-image: ${converted};` : t('svg_to_css.placeholder_code')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('svg_to_css.why_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('svg_to_css.why_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('svg_to_css.comparison_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('svg_to_css.comparison_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
