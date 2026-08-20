import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Repeat, Copy, Check, Trash2, Download, AlertCircle, Settings2, Hash, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;
const MAX_REPEAT = 10000;

export function ListRepeater({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Core State
  const [input, setInput] = useState<string>(initialData?.input || '');
  const [repeatCount, setRepeatCount] = useState<number>(initialData?.repeatCount ?? 3);
  const [repeatMode, setRepeatMode] = useState<'each' | 'sequence'>(initialData?.repeatMode || 'each');

  // Separators & Delimiters State
  const [inDelimiter, setInDelimiter] = useState<string>(initialData?.inDelimiter || 'newline');
  const [customInDelim, setCustomInDelim] = useState<string>(initialData?.customInDelim || '');
  const [outDelimiter, setOutDelimiter] = useState<string>(initialData?.outDelimiter || 'newline');
  const [customOutDelim, setCustomOutDelim] = useState<string>(initialData?.customOutDelim || '');

  // Index / Numbering State
  const [indexingMode, setIndexingMode] = useState<'none' | 'prefix' | 'suffix'>(initialData?.indexingMode || 'none');
  const [indexStart, setIndexStart] = useState<number>(initialData?.indexStart ?? 1);
  const [indexSeparator, setIndexSeparator] = useState<string>(initialData?.indexSeparator || '. ');
  const [indexPad, setIndexPad] = useState<number>(initialData?.indexPad ?? 0);

  // Formatting & Cleanups State
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(initialData?.removeEmpty ?? true);
  const [casing, setCasing] = useState<'asis' | 'lower' | 'upper' | 'capitalize'>(initialData?.casing || 'asis');

  // UI / Copy States
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with parent dashboard
  useEffect(() => {
    onStateChange?.({
      input,
      repeatCount,
      repeatMode,
      inDelimiter,
      customInDelim,
      outDelimiter,
      customOutDelim,
      indexingMode,
      indexStart,
      indexSeparator,
      indexPad,
      trimItems,
      removeEmpty,
      casing,
    });
  }, [
    input,
    repeatCount,
    repeatMode,
    inDelimiter,
    customInDelim,
    outDelimiter,
    customOutDelim,
    indexingMode,
    indexStart,
    indexSeparator,
    indexPad,
    trimItems,
    removeEmpty,
    casing,
    onStateChange,
  ]);

  // Parse input into raw item list
  const rawItems = useMemo(() => {
    if (!input) return [];
    let delim = '\n';
    if (inDelimiter === 'comma') delim = ',';
    else if (inDelimiter === 'semicolon') delim = ';';
    else if (inDelimiter === 'pipe') delim = '|';
    else if (inDelimiter === 'space') delim = ' ';
    else if (inDelimiter === 'custom') delim = customInDelim || '\n';

    let items = input.split(delim);

    if (trimItems) {
      items = items.map((item) => item.trim());
    }

    if (removeEmpty) {
      items = items.filter((item) => item.length > 0);
    }

    if (casing === 'lower') {
      items = items.map((item) => item.toLowerCase());
    } else if (casing === 'upper') {
      items = items.map((item) => item.toUpperCase());
    } else if (casing === 'capitalize') {
      items = items.map((item) =>
        item.replace(/\b\w/g, (char) => char.toUpperCase())
      );
    }

    return items;
  }, [input, inDelimiter, customInDelim, trimItems, removeEmpty, casing]);

  // Compute output result
  const outputResult = useMemo(() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) {
      return t('error.max_length', { max: MAX_LENGTH.toLocaleString() });
    }

    if (rawItems.length === 0) return '';

    const count = Math.min(MAX_REPEAT, Math.max(1, repeatCount));
    const processed: string[] = [];

    if (repeatMode === 'each') {
      // Repeat each item N times consecutively [A, A, B, B]
      rawItems.forEach((item, itemIdx) => {
        for (let i = 0; i < count; i++) {
          let itemVal = item;
          if (indexingMode !== 'none') {
            const idxNum = indexStart + (itemIdx * count) + i;
            let idxStr = idxNum.toString();
            if (indexPad > 0) {
              idxStr = idxStr.padStart(indexPad, '0');
            }
            if (indexingMode === 'prefix') {
              itemVal = `${idxStr}${indexSeparator}${itemVal}`;
            } else {
              itemVal = `${itemVal}${indexSeparator}${idxStr}`;
            }
          }
          processed.push(itemVal);
        }
      });
    } else {
      // Repeat sequence N times [A, B, A, B]
      let globalCounter = 0;
      for (let i = 0; i < count; i++) {
        rawItems.forEach((item) => {
          let itemVal = item;
          if (indexingMode !== 'none') {
            const idxNum = indexStart + globalCounter;
            let idxStr = idxNum.toString();
            if (indexPad > 0) {
              idxStr = idxStr.padStart(indexPad, '0');
            }
            if (indexingMode === 'prefix') {
              itemVal = `${idxStr}${indexSeparator}${itemVal}`;
            } else {
              itemVal = `${itemVal}${indexSeparator}${idxStr}`;
            }
            globalCounter++;
          }
          processed.push(itemVal);
        });
      }
    }

    let joinDelim = '\n';
    if (outDelimiter === 'comma') joinDelim = ', ';
    else if (outDelimiter === 'semicolon') joinDelim = '; ';
    else if (outDelimiter === 'pipe') joinDelim = ' | ';
    else if (outDelimiter === 'space') joinDelim = ' ';
    else if (outDelimiter === 'custom') joinDelim = customOutDelim;

    return processed.join(joinDelim);
  }, [
    input,
    rawItems,
    repeatCount,
    repeatMode,
    indexingMode,
    indexStart,
    indexSeparator,
    indexPad,
    outDelimiter,
    customOutDelim,
    t,
  ]);

  // Copy Action
  const handleCopy = useCallback(() => {
    if (!outputResult) return;
    navigator.clipboard.writeText(outputResult);
    setCopied(true);
    toast.success(t('listrepeater.copied', 'Repeated list copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [outputResult, t]);

  // Download Action
  const handleDownload = useCallback(() => {
    if (!outputResult) return;
    const blob = new Blob([outputResult], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `repeated-list-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'File downloaded'));
  }, [outputResult, t]);

  // Clear Action
  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    toast.success(t('listrepeater.cleared', 'Inputs cleared!'));
  }, [t]);

  // Presets Loader
  const loadPreset = (preset: 'each3' | 'seq5' | 'indexed' | 'rows') => {
    if (preset === 'each3') {
      setInput('Apple\nBanana\nCherry');
      setRepeatCount(3);
      setRepeatMode('each');
      setInDelimiter('newline');
      setOutDelimiter('newline');
      setIndexingMode('none');
    } else if (preset === 'seq5') {
      setInput('Alpha\nBeta\nGamma');
      setRepeatCount(5);
      setRepeatMode('sequence');
      setInDelimiter('newline');
      setOutDelimiter('newline');
      setIndexingMode('none');
    } else if (preset === 'indexed') {
      setInput('User_Auth\nPayment_Gateway\nNotification_Service');
      setRepeatCount(2);
      setRepeatMode('each');
      setInDelimiter('newline');
      setOutDelimiter('newline');
      setIndexingMode('prefix');
      setIndexStart(1);
      setIndexSeparator('#');
      setIndexPad(2);
    } else if (preset === 'rows') {
      setInput('Pending\nApproved\nRejected');
      setRepeatCount(3);
      setRepeatMode('sequence');
      setInDelimiter('newline');
      setOutDelimiter('comma');
      setIndexingMode('suffix');
      setIndexStart(100);
      setIndexSeparator('_');
      setIndexPad(0);
    }
    toast.success(t('listrepeater.preset_loaded', 'Preset loaded successfully!'));
  };

  // Keyboard Shortcuts Safeguard Ref
  const handlersRef = useRef({ clear: handleClear, copy: handleCopy });
  useEffect(() => {
    handlersRef.current = { clear: handleClear, copy: handleCopy };
  }, [handleClear, handleCopy]);

  // Global Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isEditable =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable);

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.clear();
      } else if (
        e.key.toLowerCase() === 'c' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !isEditable
      ) {
        e.preventDefault();
        handlersRef.current.copy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const inputCharCount = input.length;
  const outputCharCount = outputResult.length;
  const outputLineCount = outputResult ? outputResult.split('\n').length : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8" data-testid="list-repeater-container">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Interactive Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 p-1">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          {t('listrepeater.presets', 'Quick Presets')}:
        </span>
        <button
          type="button"
          onClick={() => loadPreset('each3')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🔁 {t('listrepeater.preset_each3', 'Repeat Each Line 3x')}
        </button>
        <button
          type="button"
          onClick={() => loadPreset('seq5')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🔄 {t('listrepeater.preset_seq5', 'Repeat Sequence 5x')}
        </button>
        <button
          type="button"
          onClick={() => loadPreset('indexed')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🏷️ {t('listrepeater.preset_indexed', 'Indexed Batch Keys')}
        </button>
        <button
          type="button"
          onClick={() => loadPreset('rows')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          📊 {t('listrepeater.preset_rows', 'Numbered Row Values')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Textarea Panels */}
        <div className="space-y-4 lg:col-span-2">
          {/* Input Panel */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-1">
            <label htmlFor="list-repeater-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listrepeater.input_title', 'Original List Input')}
            </label>
            <button
              type="button"
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              {t('common.clear', 'Clear')}
              <Kbd className="ml-1 bg-white/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-400">Esc</Kbd>
            </button>
          </div>

          <textarea
            id="list-repeater-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              if (e.target.value.length > MAX_LENGTH) {
                setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
              } else {
                setError(null);
                setInput(e.target.value);
              }
            }}
            placeholder={t('listrepeater.placeholder', 'Enter or paste list items to duplicate or repeat (e.g., Item A\\nItem B)...')}
            className="w-full h-[220px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-base leading-relaxed dark:text-slate-300 font-mono resize-none"
          />

          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            <span>{t('listrepeater.char_count', 'Characters')}: {inputCharCount.toLocaleString()}</span>
            <span>{t('listrepeater.items_count', 'Items')}: {rawItems.length.toLocaleString()}</span>
          </div>

          {/* Output Panel */}
          <div className="flex justify-between items-center px-1 pt-2">
            <label htmlFor="list-repeater-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Repeat className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              {t('listrepeater.output_title', 'Repeated Output List')}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!outputResult}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? t('common.copied') : t('common.copy')}
                <Kbd className="ml-1 bg-white/50 dark:bg-slate-700/20 border-slate-300 dark:border-slate-700 text-slate-400">C</Kbd>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!outputResult}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                {t('common.download')}
              </button>
            </div>
          </div>

          <textarea
            id="list-repeater-output"
            readOnly
            value={outputResult}
            placeholder={t('listrepeater.output_placeholder', 'Repeated list will appear here...')}
            className="w-full h-[220px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none transition-all text-base leading-relaxed dark:text-slate-300 font-mono resize-none text-indigo-600 dark:text-indigo-400"
          />

          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            <span>{t('listrepeater.output_chars', 'Output Chars')}: {outputCharCount.toLocaleString()}</span>
            <span>{t('listrepeater.total_lines', 'Total Lines')}: {outputLineCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Configuration Sidebar */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" aria-hidden="true" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                {t('listrepeater.options_title', 'Repeater Settings')}
              </h3>
            </div>

            {/* Repeat Mode */}
            <div className="space-y-1.5">
              <label htmlFor="repeat-mode-select" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listrepeater.repeat_mode_label', 'Repetition Pattern')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRepeatMode('each')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    repeatMode === 'each'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t('listrepeater.mode_each', 'Each Item (A,A,B,B)')}
                </button>
                <button
                  type="button"
                  onClick={() => setRepeatMode('sequence')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    repeatMode === 'sequence'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t('listrepeater.mode_sequence', 'Sequence (A,B,A,B)')}
                </button>
              </div>
            </div>

            {/* Repeat Count */}
            <div className="space-y-1.5">
              <label htmlFor="repeat-count-input" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listrepeater.repeat_count_label', 'Repeat Multiplier (N Times)')}
              </label>
              <input
                id="repeat-count-input"
                type="number"
                min="1"
                max={MAX_REPEAT}
                value={repeatCount}
                onChange={(e) => setRepeatCount(Math.min(MAX_REPEAT, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Input & Output Delimiters */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-1.5">
                <label htmlFor="in-delim-select" className="text-[10px] font-bold text-slate-400 uppercase">
                  {t('listminifier.in_delim_label', 'Input Delimiter')}
                </label>
                <select
                  id="in-delim-select"
                  value={inDelimiter}
                  onChange={(e) => setInDelimiter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="newline">{t('listseparatorchanger.separator_newline', 'Newline')}</option>
                  <option value="comma">{t('listseparatorchanger.separator_comma', 'Comma')}</option>
                  <option value="semicolon">{t('listseparatorchanger.separator_semicolon', 'Semicolon')}</option>
                  <option value="pipe">{t('listminifier.pipe', 'Pipe (|)')}</option>
                  <option value="space">{t('listseparatorchanger.separator_space', 'Space')}</option>
                  <option value="custom">{t('listseparatorchanger.separator_custom', 'Custom')}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="out-delim-select" className="text-[10px] font-bold text-slate-400 uppercase">
                  {t('listminifier.out_delim_label', 'Output Joiner')}
                </label>
                <select
                  id="out-delim-select"
                  value={outDelimiter}
                  onChange={(e) => setOutDelimiter(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                >
                  <option value="newline">{t('listseparatorchanger.separator_newline', 'Newline')}</option>
                  <option value="comma">{t('listseparatorchanger.separator_comma', 'Comma (, )')}</option>
                  <option value="semicolon">{t('listseparatorchanger.separator_semicolon', 'Semicolon (; )')}</option>
                  <option value="pipe">{t('listminifier.delim_pipe_space', 'Pipe (" | ")')}</option>
                  <option value="space">{t('listseparatorchanger.separator_space', 'Space')}</option>
                  <option value="custom">{t('listseparatorchanger.separator_custom', 'Custom')}</option>
                </select>
              </div>
            </div>

            {inDelimiter === 'custom' && (
              <input
                id="custom-in-delim"
                type="text"
                value={customInDelim}
                onChange={(e) => setCustomInDelim(e.target.value)}
                placeholder="Custom Input Delimiter"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
              />
            )}

            {outDelimiter === 'custom' && (
              <input
                id="custom-out-delim"
                type="text"
                value={customOutDelim}
                onChange={(e) => setCustomOutDelim(e.target.value)}
                placeholder="Custom Output Delimiter"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
              />
            )}

            {/* Index / Numbering Options */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-indigo-500 px-1">
                <Hash className="w-3.5 h-3.5" aria-hidden="true" />
                <label htmlFor="indexing-mode-select" className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                  {t('listrepeater.indexing_label', 'Index / Numbering Attachment')}
                </label>
              </div>

              <select
                id="indexing-mode-select"
                value={indexingMode}
                onChange={(e) => setIndexingMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
              >
                <option value="none">{t('listrepeater.indexing_none', 'None (Disabled)')}</option>
                <option value="prefix">{t('listrepeater.indexing_prefix', 'Prefix (1. Item)')}</option>
                <option value="suffix">{t('listrepeater.indexing_suffix', 'Suffix (Item_1)')}</option>
              </select>

              {indexingMode !== 'none' && (
                <div className="grid grid-cols-3 gap-2 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label htmlFor="idx-start" className="text-[9px] font-bold text-slate-400 uppercase">
                      {t('linenumberadder.start', 'Start')}
                    </label>
                    <input
                      id="idx-start"
                      type="number"
                      value={indexStart}
                      onChange={(e) => setIndexStart(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="idx-sep" className="text-[9px] font-bold text-slate-400 uppercase">
                      {t('linenumberadder.separator', 'Separator')}
                    </label>
                    <input
                      id="idx-sep"
                      type="text"
                      value={indexSeparator}
                      onChange={(e) => setIndexSeparator(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="idx-pad" className="text-[9px] font-bold text-slate-400 uppercase">
                      {t('linenumberadder.padding', 'Pad')}
                    </label>
                    <input
                      id="idx-pad"
                      type="number"
                      min="0"
                      max="10"
                      value={indexPad}
                      onChange={(e) => setIndexPad(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                      className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Checkboxes & Casing */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={trimItems}
                  onChange={(e) => setTrimItems(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <span>{t('listminifier.trim_items', 'Trim item whitespace')}</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={removeEmpty}
                  onChange={(e) => setRemoveEmpty(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <span>{t('listminifier.remove_empty', 'Strip blank items')}</span>
              </label>

              <div className="pt-1">
                <label htmlFor="repeater-casing" className="text-[10px] font-bold text-slate-400 uppercase">
                  {t('listminifier.casing_label', 'Text Casing')}
                </label>
                <select
                  id="repeater-casing"
                  value={casing}
                  onChange={(e) => setCasing(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none mt-1"
                >
                  <option value="asis">{t('listminifier.casing_asis', 'As-Is (Original)')}</option>
                  <option value="lower">{t('listcleaner.lowercase', 'lowercase')}</option>
                  <option value="upper">{t('listcleaner.uppercase', 'UPPERCASE')}</option>
                  <option value="capitalize">{t('listcleaner.capitalize', 'Capitalize Words')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
