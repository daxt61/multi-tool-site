import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ListOrdered, Copy, Check, Trash2, Download, Settings2, Type, Sparkles, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function LineNumberAdder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || '');
  const [start, setStart] = useState<number>(initialData?.start ?? 1);
  const [step, setStep] = useState<number>(initialData?.step ?? 1);
  const [separator, setSeparator] = useState<string>(initialData?.separator ?? '. ');
  const [padding, setPadding] = useState<number>(initialData?.padding ?? 0);
  const [align, setAlign] = useState<'left' | 'right'>(initialData?.align || 'left');
  const [copied, setCopied] = useState<boolean>(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ input, start, step, separator, padding, align });
  }, [input, start, step, separator, padding, align, onStateChange]);

  const output = useMemo(() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) return t('error.max_length', { max: MAX_LENGTH.toLocaleString() });

    const lines = input.split('\n');
    return lines.map((line: string, index: number) => {
      const num = start + (index * step);
      let numStr = num.toString();

      if (padding > 0) {
        numStr = numStr.padStart(padding, '0');
      }

      if (align === 'right' && padding > 0) {
        numStr = numStr.padStart(padding, ' ');
      }

      return `${numStr}${separator}${line}`;
    }).join('\n');
  }, [input, start, step, separator, padding, align, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied', 'Copied to clipboard'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    toast.success(t('common.cleared', 'Cleared'));
    inputRef.current?.focus();
  }, [t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `numbered-text-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('linenumberadder.toast_downloaded', 'File downloaded'));
  }, [output, t]);

  const handlePreset = useCallback((presetInput: string, presetStart = 1, presetStep = 1, presetSep = '. ', presetPad = 0, presetAlign: 'left' | 'right' = 'left') => {
    setInput(presetInput);
    setStart(presetStart);
    setStep(presetStep);
    setSeparator(presetSep);
    setPadding(presetPad);
    setAlign(presetAlign);
    toast.success(t('linenumberadder.toast_preset_loaded', 'Preset loaded'));
    inputRef.current?.focus();
  }, [t]);

  // Keyboard shortcut handlers ref
  const handlersRef = useRef({ handleClear, handleCopy, output });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy, output };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isEditable = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;
      const isButton = activeEl instanceof HTMLButtonElement || activeEl?.getAttribute('role') === 'button';

      if (e.key === 'Escape') {
        if (isEditable) {
          (activeEl as HTMLElement).blur();
        } else {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditable && !isButton) {
        if (handlersRef.current.output) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isOverflow = input.length > MAX_LENGTH;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mr-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          {t('linenumberadder.presets_label', 'Presets')}
        </span>
        <button
          type="button"
          onClick={() => handlePreset('const a = 10;\nconst b = 20;\nconsole.log(a + b);', 1, 1, '. ', 0, 'left')}
          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all cursor-pointer"
        >
          {t('linenumberadder.preset_code_lines', 'Standard Code Lines (1. )')}
        </button>
        <button
          type="button"
          onClick={() => handlePreset('System initialized\nConnecting to database\nQuery executed successfully\nService ready', 1, 1, ': ', 3, 'left')}
          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all cursor-pointer"
        >
          {t('linenumberadder.preset_padded_logs', 'Padded Log Lines (001: )')}
        </button>
        <button
          type="button"
          onClick={() => handlePreset('Review pull request\nRun end-to-end tests\nDeploy to production', 1, 1, ') ', 0, 'left')}
          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all cursor-pointer"
        >
          {t('linenumberadder.preset_markdown_list', 'Markdown Ordered List (1) )')}
        </button>
        <button
          type="button"
          onClick={() => handlePreset('Section A\nSection B\nSection C\nSection D', 10, 5, ' - ', 0, 'left')}
          className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-all cursor-pointer"
        >
          {t('linenumberadder.preset_custom_step', 'Step by 5 (10, 15, 20)')}
        </button>
      </div>

      {isOverflow && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t('linenumberadder.max_length_exceeded', { max: MAX_LENGTH })}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.options')}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="start-num" className="text-[10px] font-bold text-slate-400 uppercase px-1 cursor-pointer">
                  {t('linenumberadder.start', 'Start Number')}
                </label>
                <input
                  id="start-num"
                  type="number"
                  value={start}
                  onChange={(e) => setStart(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="step-num" className="text-[10px] font-bold text-slate-400 uppercase px-1 cursor-pointer">
                  {t('linenumberadder.step', 'Step')}
                </label>
                <input
                  id="step-num"
                  type="number"
                  value={step}
                  onChange={(e) => setStep(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="separator-str" className="text-[10px] font-bold text-slate-400 uppercase px-1 cursor-pointer">
                  {t('linenumberadder.separator', 'Separator')}
                </label>
                <input
                  id="separator-str"
                  type="text"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="padding-width" className="text-[10px] font-bold text-slate-400 uppercase px-1 cursor-pointer">
                  {t('linenumberadder.padding', 'Padding Width')}
                </label>
                <input
                  id="padding-width"
                  type="number"
                  min="0"
                  max="10"
                  value={padding}
                  onChange={(e) => setPadding(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('linenumberadder.align', 'Alignment')}</label>
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setAlign('left')}
                    aria-pressed={align === 'left'}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${align === 'left' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    {t('common.align_left', 'Left')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlign('right')}
                    aria-pressed={align === 'right'}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${align === 'right' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    {t('common.align_right', 'Right')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="line-number-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
                <Type className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.input')}
              </label>
              <button
                type="button"
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                {t('common.clear', 'Clear')}
                <Kbd modifier={null} className="text-[10px]">Esc</Kbd>
              </button>
            </div>
            <textarea
              ref={inputRef}
              id="line-number-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('linenumberadder.placeholder', 'Enter text to add line numbers...')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="line-number-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
                <ListOrdered className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.output')}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!output || isOverflow}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.download', 'Download')}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!output || isOverflow}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                  } disabled:opacity-50`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                  {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
                  <Kbd modifier={null} className="text-[10px]">C</Kbd>
                </button>
              </div>
            </div>
            <textarea
              id="line-number-output"
              value={output}
              readOnly
              className="w-full h-64 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2rem] outline-none font-mono text-sm leading-relaxed resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
