import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Scissors, Copy, Check, Trash2, Download, Settings2, Sliders,
  ListFilter, Info, AlertCircle, Sparkles, Layers, ArrowRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_ITEMS = 10000;

export type SliceMode = 'range' | 'step' | 'headtail' | 'chunk';

interface Preset {
  id: string;
  labelKey: string;
  defaultText: string;
  mode: SliceMode;
  config: {
    startIndex?: number;
    endIndex?: number;
    stepSize?: number;
    startOffset?: number;
    headTailPosition?: 'head' | 'tail';
    headTailCount?: number;
    chunkSize?: number;
    chunkDelimiter?: string;
  };
}

const PRESETS: Preset[] = [
  {
    id: 'first-10',
    labelKey: 'listslicer.preset_first_10',
    defaultText: 'First 10 Items',
    mode: 'headtail',
    config: { headTailPosition: 'head', headTailCount: 10 }
  },
  {
    id: 'last-5',
    labelKey: 'listslicer.preset_last_5',
    defaultText: 'Last 5 Items',
    mode: 'headtail',
    config: { headTailPosition: 'tail', headTailCount: 5 }
  },
  {
    id: 'every-2nd',
    labelKey: 'listslicer.preset_every_2nd',
    defaultText: 'Every 2nd Item (Odd)',
    mode: 'step',
    config: { stepSize: 2, startOffset: 1 }
  },
  {
    id: 'chunks-of-3',
    labelKey: 'listslicer.preset_chunks_3',
    defaultText: 'Chunks of 3 Items',
    mode: 'chunk',
    config: { chunkSize: 3, chunkDelimiter: '\n---\n' }
  }
];

export function ListSlicer({
  initialData,
  onStateChange
}: {
  initialData?: any;
  onStateChange?: (state: any) => void;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Core Inputs
  const [input, setInput] = useState<string>(
    initialData?.input ??
      'Apple\nBanana\nCherry\nDragonfruit\nElderberry\nFig\nGrape\nHoneydew\nKiwi\nLemon\nMango\nNectarine'
  );
  const [mode, setMode] = useState<SliceMode>(initialData?.mode || 'range');

  // Input & Output Delimiters
  const [inputDelimiter, setInputDelimiter] = useState<string>(initialData?.inputDelimiter || 'newline');
  const [customInputDelim, setCustomInputDelim] = useState<string>(initialData?.customInputDelim || ',');
  const [outputDelimiter, setOutputDelimiter] = useState<string>(initialData?.outputDelimiter || 'newline');
  const [customOutputDelim, setCustomOutputDelim] = useState<string>(initialData?.customOutputDelim || ', ');

  // Range Mode Config
  const [startIndex, setStartIndex] = useState<number>(initialData?.startIndex ?? 1);
  const [endIndex, setEndIndex] = useState<number>(initialData?.endIndex ?? 5);
  const [zeroBased, setZeroBased] = useState<boolean>(initialData?.zeroBased ?? false);
  const [inclusiveEnd, setInclusiveEnd] = useState<boolean>(initialData?.inclusiveEnd ?? true);

  // Step Mode Config
  const [stepSize, setStepSize] = useState<number>(initialData?.stepSize ?? 2);
  const [startOffset, setStartOffset] = useState<number>(initialData?.startOffset ?? 1);

  // Head / Tail Mode Config
  const [headTailPosition, setHeadTailPosition] = useState<'head' | 'tail'>(initialData?.headTailPosition || 'head');
  const [headTailCount, setHeadTailCount] = useState<number>(initialData?.headTailCount ?? 5);

  // Chunk Mode Config
  const [chunkSize, setChunkSize] = useState<number>(initialData?.chunkSize ?? 3);
  const [chunkDelimiter, setChunkDelimiter] = useState<string>(initialData?.chunkDelimiter ?? '\n---\n');

  // Action / Toast state
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with parent component
  useEffect(() => {
    onStateChange?.({
      input,
      mode,
      inputDelimiter,
      customInputDelim,
      outputDelimiter,
      customOutputDelim,
      startIndex,
      endIndex,
      zeroBased,
      inclusiveEnd,
      stepSize,
      startOffset,
      headTailPosition,
      headTailCount,
      chunkSize,
      chunkDelimiter
    });
  }, [
    input,
    mode,
    inputDelimiter,
    customInputDelim,
    outputDelimiter,
    customOutputDelim,
    startIndex,
    endIndex,
    zeroBased,
    inclusiveEnd,
    stepSize,
    startOffset,
    headTailPosition,
    headTailCount,
    chunkSize,
    chunkDelimiter,
    onStateChange
  ]);

  // Handle Input Changes & Length Checks
  const handleInputChange = (val: string) => {
    setInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
    } else {
      setError(null);
    }
  };

  // Clear inputs
  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
    toast.success(t('listslicer.cleared_toast', 'Cleared list input'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  // Parse Raw Items Array
  const rawItems = useMemo(() => {
    if (!input || input.length > MAX_LENGTH) return [];

    let splitPattern: string | RegExp = '\n';
    if (inputDelimiter === 'comma') splitPattern = ',';
    else if (inputDelimiter === 'semicolon') splitPattern = ';';
    else if (inputDelimiter === 'space') splitPattern = /\s+/;
    else if (inputDelimiter === 'pipe') splitPattern = '|';
    else if (inputDelimiter === 'custom') splitPattern = customInputDelim || '\n';

    return input
      .split(splitPattern)
      .map(item => item.trim())
      .filter(Boolean);
  }, [input, inputDelimiter, customInputDelim]);

  // Joiner helper function
  const getJoiner = useCallback(() => {
    if (outputDelimiter === 'comma') return ', ';
    if (outputDelimiter === 'semicolon') return '; ';
    if (outputDelimiter === 'space') return ' ';
    if (outputDelimiter === 'pipe') return ' | ';
    if (outputDelimiter === 'custom') return customOutputDelim;
    return '\n';
  }, [outputDelimiter, customOutputDelim]);

  // Core Slicing Computation
  const slicedResult = useMemo(() => {
    if (error || rawItems.length === 0) return { text: '', itemCount: 0 };

    const total = rawItems.length;
    const joiner = getJoiner();
    let resultItems: string[] = [];

    if (mode === 'range') {
      let start = Math.max(0, startIndex);
      let end = Math.max(0, endIndex);

      if (!zeroBased) {
        start = Math.max(0, start - 1);
        if (inclusiveEnd) {
          end = Math.max(0, end);
        } else {
          end = Math.max(0, end - 1);
        }
      } else if (!inclusiveEnd) {
        end = Math.max(0, end);
      } else {
        end = Math.max(0, end + 1);
      }

      resultItems = rawItems.slice(start, Math.min(total, end));
    } else if (mode === 'step') {
      const step = Math.max(1, stepSize);
      const offset = zeroBased ? Math.max(0, startOffset) : Math.max(0, startOffset - 1);

      for (let i = offset; i < total; i += step) {
        resultItems.push(rawItems[i]);
      }
    } else if (mode === 'headtail') {
      const count = Math.max(1, headTailCount);
      if (headTailPosition === 'head') {
        resultItems = rawItems.slice(0, count);
      } else {
        resultItems = rawItems.slice(Math.max(0, total - count));
      }
    } else if (mode === 'chunk') {
      const size = Math.max(1, chunkSize);
      const chunks: string[] = [];

      for (let i = 0; i < total; i += size) {
        const chunk = rawItems.slice(i, i + size);
        chunks.push(chunk.join(joiner));
      }

      return {
        text: chunks.join(chunkDelimiter),
        itemCount: total
      };
    }

    return {
      text: resultItems.join(joiner),
      itemCount: resultItems.length
    };
  }, [
    rawItems,
    mode,
    startIndex,
    endIndex,
    zeroBased,
    inclusiveEnd,
    stepSize,
    startOffset,
    headTailPosition,
    headTailCount,
    chunkSize,
    chunkDelimiter,
    error,
    getJoiner
  ]);

  // Copy output
  const handleCopy = useCallback(() => {
    if (!slicedResult.text) return;
    navigator.clipboard.writeText(slicedResult.text);
    setCopied(true);
    toast.success(t('listslicer.copied_toast', 'Copied sliced list to clipboard'));
    setTimeout(() => setCopied(false), 2000);
  }, [slicedResult.text, t]);

  // Global keydown listeners via handlersRef
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditable =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active?.getAttribute('contenteditable') === 'true';

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
        return;
      }

      if (!isEditable && e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load Preset Handler
  const handleApplyPreset = (preset: Preset) => {
    setMode(preset.mode);
    if (preset.config.startIndex !== undefined) setStartIndex(preset.config.startIndex);
    if (preset.config.endIndex !== undefined) setEndIndex(preset.config.endIndex);
    if (preset.config.stepSize !== undefined) setStepSize(preset.config.stepSize);
    if (preset.config.startOffset !== undefined) setStartOffset(preset.config.startOffset);
    if (preset.config.headTailPosition !== undefined) setHeadTailPosition(preset.config.headTailPosition);
    if (preset.config.headTailCount !== undefined) setHeadTailCount(preset.config.headTailCount);
    if (preset.config.chunkSize !== undefined) setChunkSize(preset.config.chunkSize);
    if (preset.config.chunkDelimiter !== undefined) setChunkDelimiter(preset.config.chunkDelimiter);

    toast.success(t('listslicer.preset_applied', 'Loaded preset configuration'));
  };

  // Download Output Handler
  const handleDownload = () => {
    if (!slicedResult.text) return;
    const blob = new Blob([slicedResult.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sliced-list-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Quick Presets Banner */}
      <div className="flex flex-wrap items-center gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-slate-400 mr-2">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
          <span>{t('listslicer.presets', 'Quick Presets')}:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              {t(preset.labelKey, preset.defaultText)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Textarea */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label
              htmlFor="list-slicer-input"
              className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer flex items-center gap-2"
            >
              <Scissors className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <span>{t('listslicer.input_label', 'Input List')}</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 font-mono">
                {rawItems.length.toLocaleString()} {t('listslicer.items', 'items')} ({input.length.toLocaleString()} {t('common.chars', 'chars')})
              </span>
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('common.clear')}</span>
                <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">
                  Esc
                </Kbd>
              </button>
            </div>
          </div>

          <textarea
            id="list-slicer-input"
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t('listslicer.input_placeholder', 'Enter list items here (one per line)...')}
            autoComplete="off"
            spellCheck={false}
            className="w-full h-[420px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />

          {/* Delimiter controls */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="space-y-1.5">
              <label htmlFor="input-delim-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('listslicer.input_delimiter', 'Input Separator')}
              </label>
              <select
                id="input-delim-select"
                value={inputDelimiter}
                onChange={(e) => setInputDelimiter(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="newline">{t('listslicer.delim_newline', 'New Line (\\n)')}</option>
                <option value="comma">{t('listslicer.delim_comma', 'Comma (, )')}</option>
                <option value="semicolon">{t('listslicer.delim_semicolon', 'Semicolon (; )')}</option>
                <option value="space">{t('listslicer.delim_space', 'Space')}</option>
                <option value="pipe">{t('listslicer.delim_pipe', 'Pipe (|)')}</option>
                <option value="custom">{t('listslicer.delim_custom', 'Custom String')}</option>
              </select>

              {inputDelimiter === 'custom' && (
                <input
                  type="text"
                  value={customInputDelim}
                  onChange={(e) => setCustomInputDelim(e.target.value)}
                  placeholder="e.g. , "
                  className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="output-delim-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('listslicer.output_delimiter', 'Output Separator')}
              </label>
              <select
                id="output-delim-select"
                value={outputDelimiter}
                onChange={(e) => setOutputDelimiter(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="newline">{t('listslicer.delim_newline', 'New Line (\\n)')}</option>
                <option value="comma">{t('listslicer.delim_comma', 'Comma (, )')}</option>
                <option value="semicolon">{t('listslicer.delim_semicolon', 'Semicolon (; )')}</option>
                <option value="space">{t('listslicer.delim_space', 'Space')}</option>
                <option value="pipe">{t('listslicer.delim_pipe', 'Pipe (|)')}</option>
                <option value="custom">{t('listslicer.delim_custom', 'Custom String')}</option>
              </select>

              {outputDelimiter === 'custom' && (
                <input
                  type="text"
                  value={customOutputDelim}
                  onChange={(e) => setCustomOutputDelim(e.target.value)}
                  placeholder="e.g. , "
                  className="w-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Mode Config & Output */}
        <div className="lg:col-span-6 space-y-6">
          {/* Slicing Configuration Box */}
          <div className="bg-white dark:bg-slate-900/50 p-6 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-500">
              <Sliders className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t('listslicer.mode_title', 'Slicing Options')}
              </span>
            </div>

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              {(['range', 'step', 'headtail', 'chunk'] as SliceMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    mode === m
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                  }`}
                >
                  {t(`listslicer.mode_${m}`, m)}
                </button>
              ))}
            </div>

            {/* Mode Configuration Form Fields */}
            {mode === 'range' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="range-start-idx" className="text-[10px] font-bold text-slate-400 uppercase">
                      {t('listslicer.start_index', 'Start Index')}
                    </label>
                    <input
                      id="range-start-idx"
                      type="number"
                      value={startIndex}
                      onChange={(e) => setStartIndex(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="range-end-idx" className="text-[10px] font-bold text-slate-400 uppercase">
                      {t('listslicer.end_index', 'End Index')}
                    </label>
                    <input
                      id="range-end-idx"
                      type="number"
                      value={endIndex}
                      onChange={(e) => setEndIndex(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={zeroBased}
                      onChange={(e) => setZeroBased(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>{t('listslicer.zero_based', '0-based indexing')}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inclusiveEnd}
                      onChange={(e) => setInclusiveEnd(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <span>{t('listslicer.inclusive_end', 'Inclusive end boundary')}</span>
                  </label>
                </div>
              </div>
            )}

            {mode === 'step' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label htmlFor="step-size" className="text-[10px] font-bold text-slate-400 uppercase">
                    {t('listslicer.step_size', 'Step / Every N-th Item')}
                  </label>
                  <input
                    id="step-size"
                    type="number"
                    min="1"
                    value={stepSize}
                    onChange={(e) => setStepSize(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="start-offset" className="text-[10px] font-bold text-slate-400 uppercase">
                    {t('listslicer.start_offset', 'Start Offset')}
                  </label>
                  <input
                    id="start-offset"
                    type="number"
                    min="1"
                    value={startOffset}
                    onChange={(e) => setStartOffset(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            )}

            {mode === 'headtail' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label htmlFor="ht-position" className="text-[10px] font-bold text-slate-400 uppercase">
                    {t('listslicer.position', 'Position')}
                  </label>
                  <select
                    id="ht-position"
                    value={headTailPosition}
                    onChange={(e) => setHeadTailPosition(e.target.value as 'head' | 'tail')}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="head">{t('listslicer.head', 'Head (First N items)')}</option>
                    <option value="tail">{t('listslicer.tail', 'Tail (Last N items)')}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ht-count" className="text-[10px] font-bold text-slate-400 uppercase">
                    {t('listslicer.count', 'Number of Items')}
                  </label>
                  <input
                    id="ht-count"
                    type="number"
                    min="1"
                    value={headTailCount}
                    onChange={(e) => setHeadTailCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            )}

            {mode === 'chunk' && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label htmlFor="chunk-size" className="text-[10px] font-bold text-slate-400 uppercase">
                    {t('listslicer.chunk_size', 'Chunk Size')}
                  </label>
                  <input
                    id="chunk-size"
                    type="number"
                    min="1"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="chunk-delimiter" className="text-[10px] font-bold text-slate-400 uppercase">
                    {t('listslicer.chunk_delimiter', 'Chunk Group Separator')}
                  </label>
                  <input
                    id="chunk-delimiter"
                    type="text"
                    value={chunkDelimiter}
                    onChange={(e) => setChunkDelimiter(e.target.value)}
                    placeholder="e.g. \n---\n"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Output Textarea */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label
                htmlFor="list-slicer-output"
                className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer flex items-center gap-2"
              >
                <ListFilter className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                <span>{t('common.output', 'Output')}</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 font-mono mr-2">
                  {slicedResult.itemCount.toLocaleString()} {t('listslicer.items', 'items')}
                </span>
                <button
                  onClick={handleDownload}
                  disabled={!slicedResult.text}
                  className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl hover:bg-indigo-100 disabled:opacity-50 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  title={t('common.download')}
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!slicedResult.text}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? t('common.copied') : t('common.copy')}</span>
                  <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-slate-200 dark:border-slate-700 text-slate-400">
                    C
                  </Kbd>
                </button>
              </div>
            </div>

            <textarea
              id="list-slicer-output"
              value={slicedResult.text}
              readOnly
              placeholder={t('listslicer.output_placeholder', 'Sliced list result will appear here...')}
              className="w-full h-64 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Info / Description Box */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
          <Info className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('listslicer.about_title', 'About List Slicer')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'listslicer.about_desc',
              'Extract specific ranges, step intervals, head/tail elements, or chunks from multiline lists. Operates entirely client-side for maximum privacy and speed.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
