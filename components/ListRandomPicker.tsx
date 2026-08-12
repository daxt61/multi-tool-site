import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Shuffle, Copy, Check, Trash2, Download, AlertCircle, Sparkles, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;
const MAX_PICK_QUANTITY = 10000;

export function ListRandomPicker({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputTextAreaRef = useRef<HTMLTextAreaElement>(null);

  // Input state
  const [input, setInput] = useState(initialData?.input || '');
  const [inDelimiter, setInDelimiter] = useState(initialData?.inDelimiter || 'newline');
  const [customInDelimiter, setCustomInDelimiter] = useState(initialData?.customInDelimiter || '');

  // Selection state
  const [quantity, setPickQuantity] = useState<number>(initialData?.quantity || 1);
  const [withReplacement, setWithReplacement] = useState<boolean>(initialData?.withReplacement ?? false);
  const [algorithm, setAlgorithm] = useState<'standard' | 'secure'>(initialData?.algorithm || 'secure');

  // Output formatting
  const [outDelimiter, setOutDelimiter] = useState(initialData?.outDelimiter || 'newline');
  const [customOutDelimiter, setCustomOutDelimiter] = useState(initialData?.customOutDelimiter || '');
  const [sorting, setSorting] = useState<'asis' | 'alpha' | 'alpha-desc' | 'numeric'>(initialData?.sorting || 'asis');
  const [prefixIndex, setPrefixIndex] = useState<boolean>(initialData?.prefixIndex ?? false);

  // Clean settings
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(initialData?.removeEmpty ?? true);

  // Result state
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with parent URL sharing
  useEffect(() => {
    onStateChange?.({
      input,
      inDelimiter,
      customInDelimiter,
      quantity,
      withReplacement,
      algorithm,
      outDelimiter,
      customOutDelimiter,
      sorting,
      prefixIndex,
      trimItems,
      removeEmpty,
    });
  }, [
    input,
    inDelimiter,
    customInDelimiter,
    quantity,
    withReplacement,
    algorithm,
    outDelimiter,
    customOutDelimiter,
    sorting,
    prefixIndex,
    trimItems,
    removeEmpty,
    onStateChange,
  ]);

  // Parse input into items
  const parseItems = useCallback((text: string): string[] => {
    if (!text) return [];
    let delimiter = '\n';
    if (inDelimiter === 'comma') delimiter = ',';
    else if (inDelimiter === 'semicolon') delimiter = ';';
    else if (inDelimiter === 'space') delimiter = ' ';
    else if (inDelimiter === 'custom') delimiter = customInDelimiter || '\n';

    let items = text.split(delimiter);

    if (trimItems) {
      items = items.map(item => item.trim());
    }
    if (removeEmpty) {
      items = items.filter(item => item.length > 0);
    }

    return items;
  }, [inDelimiter, customInDelimiter, trimItems, removeEmpty]);

  // Total available parsed items
  const inputItems = useMemo(() => parseItems(input), [input, parseItems]);

  // Handle Pick Quantity Constraints
  const maxAvailableQuantity = useMemo(() => {
    if (withReplacement) return MAX_PICK_QUANTITY;
    return Math.max(1, inputItems.length);
  }, [withReplacement, inputItems.length]);

  // Automatically clamp quantity if available items change
  useEffect(() => {
    if (!withReplacement && quantity > inputItems.length) {
      setPickQuantity(Math.max(1, inputItems.length));
    }
  }, [inputItems.length, withReplacement, quantity]);

  // Core pick algorithm
  const performPick = useCallback(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);

    if (inputItems.length === 0) {
      setResult('');
      return;
    }

    const q = Math.max(1, Math.min(MAX_PICK_QUANTITY, quantity));
    const picked: string[] = [];

    if (withReplacement) {
      // Pick with replacement (duplicates allowed)
      for (let i = 0; i < q; i++) {
        let idx = 0;
        if (algorithm === 'secure') {
          idx = getSecureRandomInt(inputItems.length);
        } else {
          idx = Math.floor(Math.random() * inputItems.length);
        }
        picked.push(inputItems[idx]);
      }
    } else {
      // Pick without replacement (no duplicates)
      const available = [...inputItems];
      const limit = Math.min(q, available.length);
      for (let i = 0; i < limit; i++) {
        let idx = 0;
        if (algorithm === 'secure') {
          idx = getSecureRandomInt(available.length);
        } else {
          idx = Math.floor(Math.random() * available.length);
        }
        picked.push(available[idx]);
        available.splice(idx, 1);
      }
    }

    // Apply sorting
    if (sorting === 'alpha') {
      picked.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    } else if (sorting === 'alpha-desc') {
      picked.sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));
    } else if (sorting === 'numeric') {
      picked.sort((a, b) => {
        const numA = parseFloat(a.replace(/[^0-9.-]/g, ''));
        const numB = parseFloat(b.replace(/[^0-9.-]/g, ''));
        if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
      });
    }

    // Apply prefixing
    let formattedPicked = picked;
    if (prefixIndex) {
      formattedPicked = picked.map((item, idx) => `${idx + 1}. ${item}`);
    }

    // Join with output delimiter
    let joinDelimiter = '\n';
    if (outDelimiter === 'comma') joinDelimiter = ', ';
    else if (outDelimiter === 'semicolon') joinDelimiter = '; ';
    else if (outDelimiter === 'space') joinDelimiter = ' ';
    else if (outDelimiter === 'custom') joinDelimiter = customOutDelimiter || '\n';

    setResult(formattedPicked.join(joinDelimiter));
  }, [input, inputItems, quantity, withReplacement, algorithm, sorting, prefixIndex, outDelimiter, customOutDelimiter, t]);

  // Recalculate pick result if input or settings change, but manual triggering can be done with S/Shuffle button too
  useEffect(() => {
    performPick();
  }, [input, inDelimiter, customInDelimiter, quantity, withReplacement, algorithm, outDelimiter, customOutDelimiter, sorting, prefixIndex, trimItems, removeEmpty, performPick]);

  // Presets load
  const loadPreset = (type: 'coin' | 'raffle' | 'dinner' | 'days' | 'numbers') => {
    let presetText = '';
    if (type === 'coin') {
      presetText = ['Heads', 'Tails'].join('\n');
      setInDelimiter('newline');
      setOutDelimiter('newline');
      setPickQuantity(1);
      setWithReplacement(false);
    } else if (type === 'raffle') {
      presetText = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah', 'Isla', 'Jack'].join('\n');
      setInDelimiter('newline');
      setOutDelimiter('newline');
      setPickQuantity(3);
      setWithReplacement(false);
    } else if (type === 'dinner') {
      presetText = ['Pizza', 'Sushi', 'Burgers', 'Salad', 'Pasta', 'Tacos', 'Ramen', 'Steak'].join('\n');
      setInDelimiter('newline');
      setOutDelimiter('newline');
      setPickQuantity(1);
      setWithReplacement(false);
    } else if (type === 'days') {
      presetText = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].join('\n');
      setInDelimiter('newline');
      setOutDelimiter('comma');
      setPickQuantity(2);
      setWithReplacement(false);
    } else if (type === 'numbers') {
      presetText = Array.from({ length: 50 }, (_, i) => (i + 1).toString()).join(', ');
      setInDelimiter('comma');
      setOutDelimiter('comma');
      setPickQuantity(5);
      setWithReplacement(true);
    }
    setInput(presetText);
    toast.success(t('listpicker.preset_loaded', 'Preset loaded successfully!'));
  };

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success(t('listpicker.copied', 'Picked elements copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [result, t]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'picked_items.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'File downloaded'));
  }, [result, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setResult('');
    setError(null);
    if (inputTextAreaRef.current) {
      inputTextAreaRef.current.focus();
    }
    toast.success(t('listpicker.cleared', 'Inputs cleared!'));
  }, [t]);

  // Keyboard Shortcuts via handlersRef to avoid stale closures
  const handlersRef = useRef({
    clear: handleClear,
    copy: handleCopy,
    pick: performPick,
  });

  useEffect(() => {
    handlersRef.current = {
      clear: handleClear,
      copy: handleCopy,
      pick: performPick,
    };
  }, [handleClear, handleCopy, performPick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable = (el: HTMLElement | null) => {
        if (!el) return false;
        const tag = el.tagName.toLowerCase();
        return tag === 'input' || tag === 'textarea' || el.isContentEditable;
      };

      const active = document.activeElement as HTMLElement;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.clear();
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditable(active)) {
        e.preventDefault();
        handlersRef.current.copy();
      } else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey && !e.altKey && !isEditable(active)) {
        e.preventDefault();
        handlersRef.current.pick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const inputItemCount = inputItems.length;
  const outputItemCount = useMemo(() => result ? result.split(
    outDelimiter === 'newline' ? '\n' :
    outDelimiter === 'comma' ? ', ' :
    outDelimiter === 'semicolon' ? '; ' :
    outDelimiter === 'space' ? ' ' :
    customOutDelimiter || '\n'
  ).length : 0, [result, outDelimiter, customOutDelimiter]);

  return (
    <div className="max-w-6xl mx-auto space-y-8" data-testid="list-random-picker-container">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Preset selections */}
      <div className="flex flex-wrap items-center gap-2 p-1">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2">
          {t('listpicker.presets', 'Presets')} :
        </span>
        <button
          onClick={() => loadPreset('coin')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🪙 {t('listpicker.preset_coin', 'Coin Flip')}
        </button>
        <button
          onClick={() => loadPreset('raffle')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🎟️ {t('listpicker.preset_raffle', 'Raffle Names')}
        </button>
        <button
          onClick={() => loadPreset('dinner')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🍽️ {t('listpicker.preset_dinner', 'Dinner Choices')}
        </button>
        <button
          onClick={() => loadPreset('days')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          📅 {t('listpicker.preset_days', 'Days of Week')}
        </button>
        <button
          onClick={() => loadPreset('numbers')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🔢 {t('listpicker.preset_numbers', 'Numbers 1-50')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input panel */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-1">
            <label htmlFor="picker-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('listpicker.input_title', 'Your List of Items')}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                {t('common.clear', 'Clear')}
                <Kbd className="ml-1 bg-white/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-400">Esc</Kbd>
              </button>
            </div>
          </div>

          <textarea
            id="picker-input"
            ref={inputTextAreaRef}
            value={input}
            onChange={(e) => {
              if (e.target.value.length > MAX_LENGTH) {
                setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
              } else {
                setError(null);
                setInput(e.target.value);
              }
            }}
            placeholder={t('listpicker.placeholder', 'Enter list items, one per line or custom separator...')}
            className="w-full h-[240px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-base leading-relaxed dark:text-slate-300 font-mono resize-none"
          />

          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            <span>{t('listpicker.char_count', 'Characters')}: {input.length.toLocaleString()}</span>
            <span>{t('listpicker.item_count', 'Items')}: {inputItemCount}</span>
          </div>

          {/* Output panel */}
          <div className="flex justify-between items-center px-1 pt-2">
            <label htmlFor="picker-output" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('listpicker.output_title', 'Picked Items')}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={performPick}
                disabled={!input || inputItemCount === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shuffle className="w-3.5 h-3.5" aria-hidden="true" />
                {t('listpicker.pick_again', 'Pick Random')}
                <Kbd className="ml-1 bg-white/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800 text-indigo-400">S</Kbd>
              </button>
              <button
                onClick={handleCopy}
                disabled={!result}
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
                onClick={handleDownload}
                disabled={!result}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                {t('common.download')}
              </button>
            </div>
          </div>

          <textarea
            id="picker-output"
            readOnly
            value={result}
            placeholder={t('listpicker.output_placeholder_text', 'Picked random items will appear here...')}
            className="w-full h-[240px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none transition-all text-base leading-relaxed dark:text-slate-300 font-mono resize-none"
          />

          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            <span>{t('listpicker.output_char_count', 'Characters')}: {result.length.toLocaleString()}</span>
            <span>{t('listpicker.output_item_count', 'Items')}: {outputItemCount}</span>
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" aria-hidden="true" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                {t('listpicker.settings_section', 'Picker Settings')}
              </h3>
            </div>

            {/* Input Delimiter */}
            <div className="space-y-1.5">
              <label htmlFor="picker-in-delim" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listpicker.in_delim_label', 'Input Separator')}
              </label>
              <select
                id="picker-in-delim"
                value={inDelimiter}
                onChange={(e) => setInDelimiter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="newline">{t('listseparatorchanger.separator_newline', 'Newline')}</option>
                <option value="comma">{t('listseparatorchanger.separator_comma', 'Comma')}</option>
                <option value="semicolon">{t('listseparatorchanger.separator_semicolon', 'Semicolon')}</option>
                <option value="space">{t('listseparatorchanger.separator_space', 'Space')}</option>
                <option value="custom">{t('listseparatorchanger.separator_custom', 'Custom')}</option>
              </select>
            </div>

            {inDelimiter === 'custom' && (
              <div className="space-y-1.5">
                <label htmlFor="picker-custom-in-delim" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('listpicker.custom_in_delim_label', 'Custom Input Delimiter')}
                </label>
                <input
                  id="picker-custom-in-delim"
                  type="text"
                  value={customInDelimiter}
                  onChange={(e) => setCustomInDelimiter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  placeholder="ex: |"
                />
              </div>
            )}

            {/* Selection Quantity */}
            <div className="space-y-1.5">
              <label htmlFor="picker-quantity" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listpicker.quantity_label', 'Number of Items to Pick')}: {quantity}
              </label>
              <input
                id="picker-quantity"
                type="range"
                min="1"
                max={maxAvailableQuantity}
                value={quantity}
                onChange={(e) => setPickQuantity(Math.max(1, Math.min(MAX_PICK_QUANTITY, parseInt(e.target.value) || 1)))}
                className="w-full accent-indigo-600"
              />
              <div className="flex gap-2">
                <input
                  id="picker-quantity-number"
                  type="number"
                  min="1"
                  max={maxAvailableQuantity}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setPickQuantity(Math.max(1, Math.min(maxAvailableQuantity, val)));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            {/* Allow duplicates / replacement */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={withReplacement}
                  onChange={(e) => setWithReplacement(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <span>{t('listpicker.with_replacement', 'With Replacement (Allow duplicates)')}</span>
              </label>
            </div>

            {/* Output Delimiter */}
            <div className="space-y-1.5">
              <label htmlFor="picker-out-delim" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listpicker.out_delim_label', 'Output Separator')}
              </label>
              <select
                id="picker-out-delim"
                value={outDelimiter}
                onChange={(e) => setOutDelimiter(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="newline">{t('listseparatorchanger.separator_newline', 'Newline')}</option>
                <option value="comma">{t('listseparatorchanger.separator_comma', 'Comma')}</option>
                <option value="semicolon">{t('listseparatorchanger.separator_semicolon', 'Semicolon')}</option>
                <option value="space">{t('listseparatorchanger.separator_space', 'Space')}</option>
                <option value="custom">{t('listseparatorchanger.separator_custom', 'Custom')}</option>
              </select>
            </div>

            {outDelimiter === 'custom' && (
              <div className="space-y-1.5">
                <label htmlFor="picker-custom-out-delim" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('listpicker.custom_out_delim_label', 'Custom Output Delimiter')}
                </label>
                <input
                  id="picker-custom-out-delim"
                  type="text"
                  value={customOutDelimiter}
                  onChange={(e) => setCustomOutDelimiter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  placeholder="ex: |"
                />
              </div>
            )}

            {/* Randomness Source Selection */}
            <div className="space-y-1.5">
              <label htmlFor="picker-algo" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listpicker.algo_label', 'Randomization Algorithm')}
              </label>
              <select
                id="picker-algo"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as 'standard' | 'secure')}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="secure">🛡️ {t('listpicker.algo_secure', 'Secure Cryptographic (Web Crypto)')}</option>
                <option value="standard">🎲 {t('listpicker.algo_standard', 'Standard Math.random')}</option>
              </select>
            </div>

            {/* Sorting modifications */}
            <div className="space-y-1.5">
              <label htmlFor="picker-sorting" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listpicker.sorting_label', 'Sorting')}
              </label>
              <select
                id="picker-sorting"
                value={sorting}
                onChange={(e) => setSorting(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="asis">{t('listpicker.sorting_asis', 'As-Is / As Picked (Unsorted)')}</option>
                <option value="alpha">{t('listcleaner.sort_asc', 'Alphabetical (A-Z)')}</option>
                <option value="alpha-desc">{t('listcleaner.sort_desc', 'Reverse Alphabetical (Z-A)')}</option>
                <option value="numeric">{t('listcleaner.sort_numeric', 'Numerical')}</option>
              </select>
            </div>

            {/* Pre-fixes / Flags */}
            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={prefixIndex}
                  onChange={(e) => setPrefixIndex(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <span>{t('listpicker.prefix_index', 'Prefix picked items with numbering (1., 2...)')}</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={trimItems}
                  onChange={(e) => setTrimItems(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <span>{t('listpicker.trim', 'Trim list items whitespace')}</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={removeEmpty}
                  onChange={(e) => setRemoveEmpty(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <span>{t('listpicker.remove_empty', 'Remove empty items')}</span>
              </label>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 leading-relaxed space-y-2">
            <h4 className="font-bold text-slate-700 dark:text-slate-300">{t('common.privacy', 'Privacy')}</h4>
            <p>{t('common.privacy_desc', 'All processing is done locally in your browser. Your data never leaves your device.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
