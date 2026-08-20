import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Repeat, Copy, Check, Trash2, Download, AlertCircle, Info, Type, Hash, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_OUTPUT_LENGTH = 100000;

export function TextRepeater({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState<string>(initialData?.text || '');
  const [count, setCount] = useState<number>(initialData?.count || 10);
  const [separatorType, setSeparatorType] = useState<'none' | 'space' | 'newline' | 'custom'>(initialData?.separatorType || 'newline');
  const [customSeparator, setCustomSeparator] = useState<string>(initialData?.customSeparator || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ text, count, separatorType, customSeparator });
  }, [text, count, separatorType, customSeparator, onStateChange]);

  const output = useMemo(() => {
    if (!text || count <= 0) return '';

    let sep = '';
    if (separatorType === 'space') sep = ' ';
    else if (separatorType === 'newline') sep = '\n';
    else if (separatorType === 'custom') sep = customSeparator;

    const singleRepeatLength = text.length + sep.length;
    const estimatedTotalLength = singleRepeatLength * count - sep.length;

    if (estimatedTotalLength > MAX_OUTPUT_LENGTH) {
      return null;
    }

    return Array(count).fill(text).join(sep);
  }, [text, count, separatorType, customSeparator]);

  useEffect(() => {
    if (output === null) {
      setError(t('error.max_length', { max: MAX_OUTPUT_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  }, [output, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('textrepeater.copied_toast'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `text-repeat-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('textrepeater.downloaded_toast'));
  }, [output, t]);

  const handleClear = useCallback(() => {
    setText('');
    setCount(10);
    setSeparatorType('newline');
    setCustomSeparator('');
    setError(null);
    inputRef.current?.focus();
    toast.success(t('textrepeater.cleared_toast'));
  }, [t]);

  const applyPreset = useCallback((presetText: string, presetCount: number, presetSep: 'none' | 'space' | 'newline' | 'custom', customSep = '') => {
    setText(presetText);
    setCount(presetCount);
    setSeparatorType(presetSep);
    setCustomSeparator(customSep);
    setError(null);
    inputRef.current?.focus();
    toast.success(t('textrepeater.preset_loaded'));
  }, [t]);

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).isContentEditable
      );

      if (containerRef.current && !containerRef.current.contains(activeElement) && activeElement !== document.body) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === 'c' || e.key === 'C') && !isEditable && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Presets and Shortcuts Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
            {t('textrepeater.presets_label')}
          </span>
          <button
            onClick={() => applyPreset('ECHO ', 5, 'space')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 transition-all"
          >
            {t('textrepeater.preset_echo')}
          </button>
          <button
            onClick={() => applyPreset('=', 40, 'none')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 transition-all"
          >
            {t('textrepeater.preset_divider')}
          </button>
          <button
            onClick={() => applyPreset('• Item', 5, 'newline')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 transition-all"
          >
            {t('textrepeater.preset_bullets')}
          </button>
          <button
            onClick={() => applyPreset('Row #', 5, 'newline')}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500/50 transition-all"
          >
            {t('textrepeater.preset_rows')}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Kbd modifier={null}>Esc</Kbd>
          <span className="text-xs text-slate-400 dark:text-slate-500">{t('common.reset')}</span>
          <span className="text-slate-300 dark:text-slate-700 mx-1">•</span>
          <Kbd modifier={null}>C</Kbd>
          <span className="text-xs text-slate-400 dark:text-slate-500">{t('common.copy')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.input')}
              </label>
              <button
                onClick={handleClear}
                disabled={!text && count === 10 && separatorType === 'newline' && !customSeparator}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                aria-label={t('common.clear')}
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('common.clear')}</span>
                <Kbd modifier={null} className="ml-1 text-[10px] bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800">Esc</Kbd>
              </button>
            </div>
            <textarea
              id="text-input"
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('textrepeater.placeholder')}
              className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label htmlFor="repeat-count" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.count')}
              </label>
              <input
                id="repeat-count"
                type="number"
                min="1"
                max="10000"
                value={count}
                onChange={(e) => setCount(Math.min(10000, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                <Repeat className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('texthex.separator')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={separatorType === 'none'}
                  onClick={() => setSeparatorType('none')}
                  className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${separatorType === 'none' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                  {t('jsontojava.none')}
                </button>
                <button
                  type="button"
                  aria-pressed={separatorType === 'space'}
                  onClick={() => setSeparatorType('space')}
                  className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${separatorType === 'space' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                  {t('texthex.space')}
                </button>
                <button
                  type="button"
                  aria-pressed={separatorType === 'newline'}
                  onClick={() => setSeparatorType('newline')}
                  className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${separatorType === 'newline' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                  LF
                </button>
                <button
                  type="button"
                  aria-pressed={separatorType === 'custom'}
                  onClick={() => setSeparatorType('custom')}
                  className={`py-2 px-3 rounded-xl text-[10px] font-black uppercase transition-all border ${separatorType === 'custom' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                  {t('common.options')}
                </button>
              </div>
            </div>
          </div>

          {separatorType === 'custom' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <label htmlFor="custom-sep" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('textrepeater.custom_separator')}</label>
              <input
                id="custom-sep"
                type="text"
                value={customSeparator}
                onChange={(e) => setCustomSeparator(e.target.value)}
                placeholder="Ex: - "
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="output-text" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  aria-label={t('common.download')}
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                  <span>{copied ? t('common.copied') : t('common.copy')}</span>
                  <Kbd modifier={null} className="ml-1 text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600">C</Kbd>
                </button>
              </div>
            </div>
            <textarea
              id="output-text"
              readOnly
              value={output || ''}
              placeholder={output === null ? t('error.max_length', { max: MAX_OUTPUT_LENGTH.toLocaleString() }) : t('textrepeater.output_placeholder')}
              className="w-full h-[320px] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none text-lg leading-relaxed dark:text-white font-mono resize-none shadow-inner"
            />
            <div className="flex justify-between items-center px-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t('wordcounter.stat.characters')}: {output?.length || 0} / {MAX_OUTPUT_LENGTH}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('textrepeater.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('textrepeater.about_text', { max: MAX_OUTPUT_LENGTH.toLocaleString() })}
          </p>
        </div>
      </div>
    </div>
  );
}
