import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Shuffle, Copy, Check, Trash2, Download, AlertCircle, Sparkles, RefreshCcw, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

export function ListShuffler({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputTextAreaRef = useRef<HTMLTextAreaElement>(null);

  // Input state
  const [input, setInput] = useState(initialData?.input || '');
  const [inDelimiter, setInDelimiter] = useState(initialData?.inDelimiter || 'newline');
  const [customInDelimiter, setCustomInDelimiter] = useState(initialData?.customInDelimiter || '');

  // Output state
  const [outDelimiter, setOutDelimiter] = useState(initialData?.outDelimiter || 'newline');
  const [customOutDelimiter, setCustomOutDelimiter] = useState(initialData?.customOutDelimiter || '');

  // Shuffle settings
  const [algorithm, setAlgorithm] = useState<'standard' | 'secure'>(initialData?.algorithm || 'secure');
  const [rounds, setRounds] = useState<number>(initialData?.rounds || 1);
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? true);
  const [removeEmpty, setRemoveEmpty] = useState<boolean>(initialData?.removeEmpty ?? true);
  const [casing, setCasing] = useState<'asis' | 'upper' | 'lower' | 'capitalize'>(initialData?.casing || 'asis');

  // Result state
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with parent
  useEffect(() => {
    onStateChange?.({
      input,
      inDelimiter,
      customInDelimiter,
      outDelimiter,
      customOutDelimiter,
      algorithm,
      rounds,
      trimItems,
      removeEmpty,
      casing,
    });
  }, [
    input,
    inDelimiter,
    customInDelimiter,
    outDelimiter,
    customOutDelimiter,
    algorithm,
    rounds,
    trimItems,
    removeEmpty,
    casing,
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

    // Apply casing
    if (casing === 'upper') {
      items = items.map(item => item.toUpperCase());
    } else if (casing === 'lower') {
      items = items.map(item => item.toLowerCase());
    } else if (casing === 'capitalize') {
      items = items.map(item => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase());
    }

    return items;
  }, [inDelimiter, customInDelimiter, trimItems, removeEmpty, casing]);

  // Core shuffling algorithm
  const performShuffle = useCallback(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);

    let items = parseItems(input);
    if (items.length === 0) {
      setResult('');
      return;
    }

    // Perform shuffle multiple rounds
    let shuffled = [...items];
    const totalRounds = Math.max(1, Math.min(10, rounds));

    for (let r = 0; r < totalRounds; r++) {
      for (let i = shuffled.length - 1; i > 0; i--) {
        let j = 0;
        if (algorithm === 'secure') {
          j = getSecureRandomInt(i + 1);
        } else {
          j = Math.floor(Math.random() * (i + 1));
        }
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
    }

    // Join with output delimiter
    let joinDelimiter = '\n';
    if (outDelimiter === 'comma') joinDelimiter = ', ';
    else if (outDelimiter === 'semicolon') joinDelimiter = '; ';
    else if (outDelimiter === 'space') joinDelimiter = ' ';
    else if (outDelimiter === 'custom') joinDelimiter = customOutDelimiter || '\n';

    setResult(shuffled.join(joinDelimiter));
  }, [input, parseItems, rounds, algorithm, outDelimiter, customOutDelimiter, t]);

  // Trigger shuffle when input or settings change
  useEffect(() => {
    performShuffle();
  }, [input, inDelimiter, customInDelimiter, outDelimiter, customOutDelimiter, algorithm, rounds, trimItems, removeEmpty, casing, performShuffle]);

  // Presets load
  const loadPreset = (type: 'raffle' | 'numbers' | 'cards') => {
    let presetText = '';
    if (type === 'raffle') {
      presetText = ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah'].join('\n');
      setInDelimiter('newline');
      setOutDelimiter('newline');
    } else if (type === 'numbers') {
      presetText = Array.from({ length: 20 }, (_, i) => (i + 1).toString()).join('\n');
      setInDelimiter('newline');
      setOutDelimiter('comma');
    } else if (type === 'cards') {
      const suits = ['♠', '♥', '♦', '♣'];
      const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const deck: string[] = [];
      suits.forEach(s => values.forEach(v => deck.push(`${v}${s}`)));
      presetText = deck.join(', ');
      setInDelimiter('comma');
      setOutDelimiter('space');
    }
    setInput(presetText);
    toast.success(t('listshuffler.preset_loaded', 'Preset loaded successfully!'));
  };

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success(t('listshuffler.copied', 'Shuffled list copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [result, t]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shuffled_list.txt';
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
    toast.success(t('listshuffler.cleared', 'Inputs cleared!'));
  }, [t]);

  // Keyboard Shortcuts via handlersRef
  const handlersRef = useRef({
    clear: handleClear,
    copy: handleCopy,
    shuffle: performShuffle,
  });

  useEffect(() => {
    handlersRef.current = {
      clear: handleClear,
      copy: handleCopy,
      shuffle: performShuffle,
    };
  }, [handleClear, handleCopy, performShuffle]);

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
        handlersRef.current.shuffle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const inputItemCount = useMemo(() => parseItems(input).length, [input, parseItems]);
  const outputItemCount = useMemo(() => result ? result.split(
    outDelimiter === 'newline' ? '\n' :
    outDelimiter === 'comma' ? ', ' :
    outDelimiter === 'semicolon' ? '; ' :
    outDelimiter === 'space' ? ' ' :
    customOutDelimiter || '\n'
  ).length : 0, [result, outDelimiter, customOutDelimiter]);

  return (
    <div className="max-w-6xl mx-auto space-y-8" data-testid="list-shuffler-container">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Preset selections */}
      <div className="flex flex-wrap items-center gap-2 p-1">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-2">
          {t('listshuffler.presets', 'Presets')} :
        </span>
        <button
          onClick={() => loadPreset('raffle')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🎟️ {t('listshuffler.preset_raffle', 'Raffle Names')}
        </button>
        <button
          onClick={() => loadPreset('numbers')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🔢 {t('listshuffler.preset_numbers', 'Numbers 1-20')}
        </button>
        <button
          onClick={() => loadPreset('cards')}
          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/30 text-slate-600 dark:text-slate-300 transition-all"
        >
          🃏 {t('listshuffler.preset_cards', 'Deck of Cards')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input panel */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-1">
            <label htmlFor="shuffler-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('listshuffler.input_title', 'Your List to Shuffle')}
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
            id="shuffler-input"
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
            placeholder={t('listshuffler.placeholder', 'Enter list items, one per line or custom separator...')}
            className="w-full h-[240px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-base leading-relaxed dark:text-slate-300 font-mono resize-none"
          />

          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            <span>{t('listshuffler.char_count', 'Characters')}: {input.length.toLocaleString()}</span>
            <span>{t('listshuffler.item_count', 'Items')}: {inputItemCount}</span>
          </div>

          {/* Output panel */}
          <div className="flex justify-between items-center px-1 pt-2">
            <label htmlFor="shuffler-output" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('listshuffler.output_title', 'Shuffled List')}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={performShuffle}
                disabled={!input}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-800 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shuffle className="w-3.5 h-3.5" aria-hidden="true" />
                {t('listshuffler.reshuffle', 'Shuffle')}
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
            id="shuffler-output"
            readOnly
            value={result}
            placeholder={t('listshuffler.output_placeholder_text', 'Shuffled output will appear here...')}
            className="w-full h-[240px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none transition-all text-base leading-relaxed dark:text-slate-300 font-mono resize-none"
          />

          <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
            <span>{t('listshuffler.output_char_count', 'Characters')}: {result.length.toLocaleString()}</span>
            <span>{t('listshuffler.output_item_count', 'Items')}: {outputItemCount}</span>
          </div>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" aria-hidden="true" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                {t('listshuffler.settings_section', 'Shuffle Settings')}
              </h3>
            </div>

            {/* Input Delimiter */}
            <div className="space-y-1.5">
              <label htmlFor="shuffler-in-delim" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listshuffler.in_delim_label', 'Input Separator')}
              </label>
              <select
                id="shuffler-in-delim"
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
                <label htmlFor="shuffler-custom-in-delim" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('listshuffler.custom_in_delim_label', 'Custom Input Delimiter')}
                </label>
                <input
                  id="shuffler-custom-in-delim"
                  type="text"
                  value={customInDelimiter}
                  onChange={(e) => setCustomInDelimiter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                  placeholder="ex: |"
                />
              </div>
            )}

            {/* Output Delimiter */}
            <div className="space-y-1.5">
              <label htmlFor="shuffler-out-delim" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listshuffler.out_delim_label', 'Output Separator')}
              </label>
              <select
                id="shuffler-out-delim"
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
                <label htmlFor="shuffler-custom-out-delim" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('listshuffler.custom_out_delim_label', 'Custom Output Delimiter')}
                </label>
                <input
                  id="shuffler-custom-out-delim"
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
              <label htmlFor="shuffler-algo" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listshuffler.algo_label', 'Randomization Algorithm')}
              </label>
              <select
                id="shuffler-algo"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as 'standard' | 'secure')}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="secure">🛡️ {t('listshuffler.algo_secure', 'Secure Cryptographic (Web Crypto)')}</option>
                <option value="standard">🎲 {t('listshuffler.algo_standard', 'Standard Math.random')}</option>
              </select>
            </div>

            {/* Rounds selection */}
            <div className="space-y-1.5">
              <label htmlFor="shuffler-rounds" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listshuffler.rounds_label', 'Shuffle Rounds')}: {rounds}
              </label>
              <input
                id="shuffler-rounds"
                type="range"
                min="1"
                max="10"
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Overrides / Flags */}
            <div className="pt-2 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={trimItems}
                  onChange={(e) => setTrimItems(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <span>{t('listshuffler.trim', 'Trim list items whitespace')}</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold select-none text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={removeEmpty}
                  onChange={(e) => setRemoveEmpty(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4"
                />
                <span>{t('listshuffler.remove_empty', 'Remove empty items')}</span>
              </label>
            </div>

            {/* Casing modifications */}
            <div className="space-y-1.5 pt-2">
              <label htmlFor="shuffler-casing" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                {t('listshuffler.casing_label', 'Casing Modifier')}
              </label>
              <select
                id="shuffler-casing"
                value={casing}
                onChange={(e) => setCasing(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="asis">{t('listshuffler.casing_asis', 'As-Is (Keep original)')}</option>
                <option value="upper">{t('listcleaner.uppercase', 'UPPERCASE')}</option>
                <option value="lower">{t('listcleaner.lowercase', 'lowercase')}</option>
                <option value="capitalize">{t('listcleaner.capitalize', 'Capitalize')}</option>
              </select>
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
