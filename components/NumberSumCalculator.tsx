import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Calculator, Copy, Check, Trash2, Download,
  Sigma, AlertCircle, RotateCcw, Sparkles, Layers, ListOrdered
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

interface Preset {
  id: string;
  nameKey: string;
  input: string;
  mode: 'smart' | 'delimiter';
  delimiter: string;
  printRunningSum: boolean;
  showSumDetails: boolean;
}

const PRESETS: Preset[] = [
  {
    id: 'simple',
    nameKey: 'numbersum.preset_simple',
    input: "10\n20\n30\n45\n50",
    mode: 'delimiter',
    delimiter: '\n',
    printRunningSum: false,
    showSumDetails: false
  },
  {
    id: 'receipt',
    nameKey: 'numbersum.preset_receipt',
    input: "Bought 3 apples for $4.50, 2 milks for $3.00, and 1 bread for $2.50.",
    mode: 'smart',
    delimiter: '\n',
    printRunningSum: true,
    showSumDetails: true
  },
  {
    id: 'sequence',
    nameKey: 'numbersum.preset_sequence',
    input: "1\n2\n3\n4\n5\n6\n7\n8\n9\n10",
    mode: 'delimiter',
    delimiter: '\n',
    printRunningSum: true,
    showSumDetails: false
  },
  {
    id: 'decimals_negatives',
    nameKey: 'numbersum.preset_decimals',
    input: "12.5, -4.2, 8.7, -15.0, 100.25",
    mode: 'delimiter',
    delimiter: ',',
    printRunningSum: false,
    showSumDetails: false
  }
];

export function NumberSumCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  const [input, setInput] = useState<string>(initialData?.input || "10\n20\n30\n45\n50");
  const [mode, setMode] = useState<'smart' | 'delimiter'>(initialData?.mode || 'delimiter');
  const [delimiter, setDelimiter] = useState<string>(initialData?.delimiter || '\n');
  const [customDelimiter, setCustomDelimiter] = useState<string>(initialData?.customDelimiter || '');
  const [printRunningSum, setPrintRunningSum] = useState<boolean>(initialData?.printRunningSum || false);
  const [showSumDetails, setShowSumDetails] = useState<boolean>(initialData?.showSumDetails || false);

  const [copiedSum, setCopiedSum] = useState(false);
  const [copiedRunning, setCopiedRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, mode, delimiter, customDelimiter, printRunningSum, showSumDetails });
  }, [input, mode, delimiter, customDelimiter, printRunningSum, showSumDetails, onStateChange]);

  const activeDelimiter = useMemo(() => {
    if (delimiter === 'custom') return customDelimiter;
    if (delimiter === '\\n' || delimiter === '\n') return '\n';
    if (delimiter === '\\t' || delimiter === '\t') return '\t';
    return delimiter;
  }, [delimiter, customDelimiter]);

  const parsedNumbers = useMemo(() => {
    if (!input || input.length > MAX_LENGTH) return [];

    if (mode === 'smart') {
      // Regex matches optional minus sign, digits, and optional decimal part
      const matches = input.match(/-?\d+(?:\.\d+)?/g);
      if (!matches) return [];
      return matches.map(m => parseFloat(m)).filter(n => !isNaN(n));
    } else {
      // Split by chosen delimiter
      const delim = activeDelimiter || '\n';
      const parts = input.split(delim);
      const nums: number[] = [];
      for (const p of parts) {
        const trimmed = p.trim();
        if (trimmed !== '') {
          const val = parseFloat(trimmed.replace(',', '.'));
          if (!isNaN(val)) {
            nums.push(val);
          }
        }
      }
      return nums;
    }
  }, [input, mode, activeDelimiter]);

  const calculation = useMemo(() => {
    if (parsedNumbers.length === 0) {
      return {
        sum: 0,
        count: 0,
        mean: 0,
        min: 0,
        max: 0,
        runningSums: [],
        details: []
      };
    }

    let currentSum = 0;
    const runningSums: number[] = [];
    const details: string[] = [];
    let min = parsedNumbers[0];
    let max = parsedNumbers[0];

    parsedNumbers.forEach((n, idx) => {
      currentSum += n;
      runningSums.push(currentSum);

      if (n < min) min = n;
      if (n > max) max = n;

      if (idx === 0) {
        details.push(`${n}`);
      } else {
        const addends = parsedNumbers.slice(0, idx + 1).join(' + ');
        details.push(`${currentSum} (${addends})`);
      }
    });

    return {
      sum: currentSum,
      count: parsedNumbers.length,
      mean: currentSum / parsedNumbers.length,
      min,
      max,
      runningSums,
      details
    };
  }, [parsedNumbers]);

  const runningOutputText = useMemo(() => {
    if (showSumDetails) {
      return calculation.details.join('\n');
    }
    return calculation.runningSums.join('\n');
  }, [calculation, showSumDetails]);

  const handleCopySum = useCallback(() => {
    navigator.clipboard.writeText(calculation.sum.toString());
    setCopiedSum(true);
    toast.success(t('numbersum.copied_sum_toast'));
    setTimeout(() => setCopiedSum(false), 2000);
  }, [calculation.sum, t]);

  const handleCopyRunning = useCallback(() => {
    navigator.clipboard.writeText(runningOutputText);
    setCopiedRunning(true);
    toast.success(t('numbersum.copied_running_toast'));
    setTimeout(() => setCopiedRunning(false), 2000);
  }, [runningOutputText, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
    toast.success(t('numbersum.cleared_toast'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleLoadPreset = useCallback((preset: Preset) => {
    setInput(preset.input);
    setMode(preset.mode);
    setDelimiter(preset.delimiter);
    setPrintRunningSum(preset.printRunningSum);
    setShowSumDetails(preset.showSumDetails);
    setError(null);
    toast.success(t('numbersum.preset_loaded_toast'));
  }, [t]);

  const handleDownload = useCallback(() => {
    const textToDownload = printRunningSum ? runningOutputText : calculation.sum.toString();
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `number-sum-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('numbersum.downloaded_toast'));
  }, [printRunningSum, runningOutputText, calculation.sum, t]);

  // Keyboard shortcut handlers
  const handlersRef = useRef({ handleClear, handleCopySum });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopySum };
  }, [handleClear, handleCopySum]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      const { handleClear, handleCopySum } = handlersRef.current;

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopySum();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8" data-testid="number-sum-container">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Presets Bar */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          {t('numbersum.presets')}
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleLoadPreset(preset)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none"
          >
            {t(preset.nameKey)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Inputs & Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="number-sum-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Sigma className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                {t('numbersum.input_label')}
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClear}
                  disabled={!input}
                  title={`${t('common.clear')} (Esc)`}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.clear')}
                  <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
                </button>
              </div>
            </div>

            <textarea
              id="number-sum-input"
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (e.target.value.length > MAX_LENGTH) {
                  setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
                } else {
                  setError(null);
                }
              }}
              placeholder={t('numbersum.placeholder')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-base font-mono dark:text-slate-200 resize-none"
            />
          </div>

          {/* Mode & Extraction Settings */}
          <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('numbersum.extraction_settings')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('numbersum.mode_label')}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('smart')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      mode === 'smart'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t('numbersum.mode_smart')}
                  </button>
                  <button
                    onClick={() => setMode('delimiter')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      mode === 'delimiter'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {t('numbersum.mode_delimiter')}
                  </button>
                </div>
              </div>

              {mode === 'delimiter' && (
                <div className="space-y-2">
                  <label htmlFor="delimiter-select" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {t('numbersum.delimiter_label')}
                  </label>
                  <select
                    id="delimiter-select"
                    value={delimiter}
                    onChange={(e) => setDelimiter(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="\n">{t('numbersum.delim_newline')}</option>
                    <option value=",">{t('numbersum.delim_comma')}</option>
                    <option value=";">{t('numbersum.delim_semicolon')}</option>
                    <option value=" ">{t('numbersum.delim_space')}</option>
                    <option value="\t">{t('numbersum.delim_tab')}</option>
                    <option value="custom">{t('numbersum.delim_custom')}</option>
                  </select>
                </div>
              )}
            </div>

            {mode === 'delimiter' && delimiter === 'custom' && (
              <div className="space-y-1">
                <label htmlFor="custom-delimiter-input" className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {t('numbersum.custom_delimiter_label')}
                </label>
                <input
                  id="custom-delimiter-input"
                  type="text"
                  value={customDelimiter}
                  onChange={(e) => setCustomDelimiter(e.target.value)}
                  placeholder="e.g. | or --"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={printRunningSum}
                  onChange={(e) => setPrintRunningSum(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                {t('numbersum.option_running_sum')}
              </label>

              {printRunningSum && (
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={showSumDetails}
                    onChange={(e) => setShowSumDetails(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  {t('numbersum.option_sum_details')}
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Main Results & Statistics */}
        <div className="space-y-6">
          <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calculator className="w-6 h-6 opacity-80" aria-hidden="true" />
                <h3 className="text-xl font-black">{t('numbersum.result_title')}</h3>
              </div>
              <button
                onClick={handleDownload}
                title={t('common.download')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-white/50 outline-none"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-indigo-100 text-xs font-black uppercase tracking-widest">{t('numbersum.total_sum')}</span>
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight break-all">
                {parsedNumbers.length > 0 ? calculation.sum.toLocaleString(undefined, { maximumFractionDigits: 6 }) : '0'}
              </div>
            </div>

            <button
              onClick={handleCopySum}
              disabled={parsedNumbers.length === 0}
              className={`w-full py-3.5 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-white/50 outline-none ${
                copiedSum ? 'bg-emerald-500 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {copiedSum ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              {copiedSum ? t('common.copied') : t('numbersum.copy_sum')}
              {!copiedSum && <Kbd modifier={null} className="hidden sm:inline-flex border-indigo-200 bg-indigo-50 text-indigo-600 ml-1">C</Kbd>}
            </button>
          </div>

          {/* Statistics Grid */}
          <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('numbersum.statistics_title')}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400">{t('numbersum.stat_count')}</span>
                <div className="text-lg font-black font-mono dark:text-white">{calculation.count}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400">{t('numbersum.stat_mean')}</span>
                <div className="text-lg font-black font-mono dark:text-white truncate">
                  {calculation.count > 0 ? calculation.mean.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400">{t('numbersum.stat_min')}</span>
                <div className="text-lg font-black font-mono dark:text-white truncate">
                  {calculation.count > 0 ? calculation.min.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-400">{t('numbersum.stat_max')}</span>
                <div className="text-lg font-black font-mono dark:text-white truncate">
                  {calculation.count > 0 ? calculation.max.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '0'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Running Sum Output Block */}
      {printRunningSum && (
        <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {showSumDetails ? t('numbersum.sum_details_output') : t('numbersum.running_sum_output')}
            </h3>
            <button
              onClick={handleCopyRunning}
              disabled={calculation.count === 0}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none ${
                copiedRunning
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                  : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30'
              }`}
            >
              {copiedRunning ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
              {copiedRunning ? t('common.copied') : t('common.copy')}
            </button>
          </div>

          <textarea
            readOnly
            value={runningOutputText}
            placeholder={t('numbersum.running_placeholder')}
            className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono text-xs text-slate-700 dark:text-slate-300 resize-none"
          />
        </div>
      )}

      {/* Guide & Informational Section */}
      <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          {t('numbersum.about_title')}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {t('numbersum.about_desc')}
        </p>
      </div>
    </div>
  );
}
