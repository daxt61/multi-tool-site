import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ListOrdered, Copy, Check, RotateCcw, Download, Info, AlertCircle, Sparkles, Settings2, Hash, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export type NumberingSystem = 'integer' | 'alpha-lower' | 'alpha-upper' | 'roman-lower' | 'roman-upper';
export type CounterFormat = 'period' | 'parenthesis' | 'bracket' | 'brace' | 'colon' | 'hash' | 'custom';

interface Preset {
  id: string;
  name: string;
  input: string;
  delimiterMode: 'char' | 'regex';
  delimiterValue: string;
  joinSeparator: string;
  numberingSystem: NumberingSystem;
  counterFormat: CounterFormat;
  customFormat: string;
  skipEmpty: boolean;
  reverseNumbering: boolean;
  startFromZero: boolean;
  trimItems: boolean;
}

const PRESETS: Preset[] = [
  {
    id: 'arabic_checklist',
    name: 'Grocery Checklist (1. 2. 3.)',
    input: 'Apples\nBananas\nAlmond Milk\nSourdough Bread\nGreek Yogurt\nOrganic Honey',
    delimiterMode: 'char',
    delimiterValue: '\\n',
    joinSeparator: '\\n',
    numberingSystem: 'integer',
    counterFormat: 'period',
    customFormat: '%n. ',
    skipEmpty: true,
    reverseNumbering: false,
    startFromZero: false,
    trimItems: true,
  },
  {
    id: 'bengali_semicolon',
    name: 'Zero-Indexed Parenthesis (0) 1) 2))',
    input: '০; ১; ২; ৩; ৪; ৫; ৬; ৭; ৮; ৯; ১০',
    delimiterMode: 'char',
    delimiterValue: '; ',
    joinSeparator: '; ',
    numberingSystem: 'integer',
    counterFormat: 'parenthesis',
    customFormat: '%n) ',
    skipEmpty: true,
    reverseNumbering: false,
    startFromZero: true,
    trimItems: true,
  },
  {
    id: 'alpha_brackets',
    name: 'Alphabetical Column ([a] [b] [c])',
    input: 'white; whitesmoke; gainsboro; lightgray; silver; darkgray; gray; dimgray; black',
    delimiterMode: 'char',
    delimiterValue: '; ',
    joinSeparator: '\\n',
    numberingSystem: 'alpha-lower',
    counterFormat: 'bracket',
    customFormat: '[%n] ',
    skipEmpty: true,
    reverseNumbering: false,
    startFromZero: false,
    trimItems: true,
  },
  {
    id: 'roman_countdown',
    name: 'Countdown in Roman (#X: #IX: #VIII:)',
    input: 'Alpha\nBeta\nGamma\nDelta\nEpsilon\nZeta\nEta\nTheta\nIota\nKappa',
    delimiterMode: 'char',
    delimiterValue: '\\n',
    joinSeparator: '\\n',
    numberingSystem: 'roman-upper',
    counterFormat: 'custom',
    customFormat: '#%n: ',
    skipEmpty: true,
    reverseNumbering: true,
    startFromZero: false,
    trimItems: true,
  },
  {
    id: 'regex_space_braces',
    name: 'Word Splitting & Braces ({%n})',
    input: 'Mercury Venus Earth Mars Jupiter Saturn Uranus Neptune',
    delimiterMode: 'regex',
    delimiterValue: '\\s+',
    joinSeparator: ', ',
    numberingSystem: 'integer',
    counterFormat: 'brace',
    customFormat: '{%n} ',
    skipEmpty: true,
    reverseNumbering: false,
    startFromZero: false,
    trimItems: true,
  },
];

// Helper: Convert integer (>=1) to Excel-like alphabetical string: 1 -> a, 26 -> z, 27 -> aa
function toAlphabetic(num: number, upper = false): string {
  if (num <= 0) return '0';
  let res = '';
  let n = num;
  while (n > 0) {
    n--;
    res = String.fromCharCode(97 + (n % 26)) + res;
    n = Math.floor(n / 26);
  }
  return upper ? res.toUpperCase() : res;
}

// Helper: Convert integer (1..3999) to Roman numerals
function toRoman(num: number, upper = true): string {
  if (num <= 0) return '0';
  const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let roman = '';
  let n = num;
  for (let i = 0; i < val.length; i++) {
    while (n >= val[i]) {
      roman += syms[i];
      n -= val[i];
    }
  }
  return upper ? roman : roman.toLowerCase();
}

function unescapeString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

export function ListItemCounter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input ?? PRESETS[0].input);
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId ?? PRESETS[0].id);

  const [delimiterMode, setDelimiterMode] = useState<'char' | 'regex'>(initialData?.delimiterMode ?? PRESETS[0].delimiterMode);
  const [delimiterValue, setDelimiterValue] = useState<string>(initialData?.delimiterValue ?? PRESETS[0].delimiterValue);
  const [joinSeparator, setJoinSeparator] = useState<string>(initialData?.joinSeparator ?? PRESETS[0].joinSeparator);

  const [numberingSystem, setNumberingSystem] = useState<NumberingSystem>(initialData?.numberingSystem ?? PRESETS[0].numberingSystem);
  const [counterFormat, setCounterFormat] = useState<CounterFormat>(initialData?.counterFormat ?? PRESETS[0].counterFormat);
  const [customFormat, setCustomFormat] = useState<string>(initialData?.customFormat ?? PRESETS[0].customFormat);

  const [skipEmpty, setSkipEmpty] = useState<boolean>(initialData?.skipEmpty ?? PRESETS[0].skipEmpty);
  const [reverseNumbering, setReverseNumbering] = useState<boolean>(initialData?.reverseNumbering ?? PRESETS[0].reverseNumbering);
  const [startFromZero, setStartFromZero] = useState<boolean>(initialData?.startFromZero ?? PRESETS[0].startFromZero);
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? PRESETS[0].trimItems);

  const [copied, setCopied] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        input,
        activePresetId,
        delimiterMode,
        delimiterValue,
        joinSeparator,
        numberingSystem,
        counterFormat,
        customFormat,
        skipEmpty,
        reverseNumbering,
        startFromZero,
        trimItems,
      });
    }
  }, [
    input,
    activePresetId,
    delimiterMode,
    delimiterValue,
    joinSeparator,
    numberingSystem,
    counterFormat,
    customFormat,
    skipEmpty,
    reverseNumbering,
    startFromZero,
    trimItems,
    onStateChange,
  ]);

  const handleInputChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      toast.error(t('listcounter.error_max_length', `Input exceeds maximum length of ${MAX_LENGTH} characters`));
      return;
    }
    setInput(val);
    setActivePresetId(null);
  };

  const handleApplyPreset = (preset: Preset) => {
    setInput(preset.input);
    setActivePresetId(preset.id);
    setDelimiterMode(preset.delimiterMode);
    setDelimiterValue(preset.delimiterValue);
    setJoinSeparator(preset.joinSeparator);
    setNumberingSystem(preset.numberingSystem);
    setCounterFormat(preset.counterFormat);
    setCustomFormat(preset.customFormat);
    setSkipEmpty(preset.skipEmpty);
    setReverseNumbering(preset.reverseNumbering);
    setStartFromZero(preset.startFromZero);
    setTrimItems(preset.trimItems);
    toast.success(t('listcounter.toast_preset_loaded', `Loaded preset: ${preset.name}`));

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleReset = () => {
    setInput('');
    setActivePresetId(null);
    setParseError(null);
    toast.success(t('listcounter.toast_cleared', 'Inputs cleared'));
    inputRef.current?.focus();
  };

  const { parsedItems, countedResult, totalItems } = useMemo(() => {
    if (!input) {
      return { parsedItems: [], countedResult: '', totalItems: 0 };
    }

    try {
      let rawTokens: string[] = [];
      const actualDelimiter = unescapeString(delimiterValue);

      if (delimiterMode === 'char') {
        if (actualDelimiter === '') {
          rawTokens = Array.from(input);
        } else {
          rawTokens = input.split(actualDelimiter);
        }
      } else {
        if (!delimiterValue) {
          rawTokens = Array.from(input);
        } else {
          let pattern = delimiterValue;
          let flags = '';
          const match = delimiterValue.match(/^\/(.*?)\/([gimsuy]*)$/);
          if (match) {
            pattern = match[1];
            flags = match[2];
          }
          const regex = new RegExp(pattern, flags);
          rawTokens = input.split(regex);
        }
      }

      let items = rawTokens;
      if (trimItems) {
        items = items.map((s) => s.trim());
      }
      if (skipEmpty) {
        items = items.filter((s) => s.length > 0);
      }

      setParseError(null);

      const count = items.length;
      if (count === 0) {
        return { parsedItems: [], countedResult: '', totalItems: 0 };
      }

      // Generate formatted counter string for index i (0..count-1)
      const formatCounter = (i: number): string => {
        let ordinal = startFromZero ? i : i + 1;
        if (reverseNumbering) {
          ordinal = startFromZero ? count - 1 - i : count - i;
        }

        let symbol = '';
        if (numberingSystem === 'integer') {
          symbol = String(ordinal);
        } else if (numberingSystem === 'alpha-lower') {
          symbol = toAlphabetic(ordinal <= 0 ? 1 : ordinal, false);
        } else if (numberingSystem === 'alpha-upper') {
          symbol = toAlphabetic(ordinal <= 0 ? 1 : ordinal, true);
        } else if (numberingSystem === 'roman-lower') {
          symbol = toRoman(ordinal <= 0 ? 1 : ordinal, false);
        } else if (numberingSystem === 'roman-upper') {
          symbol = toRoman(ordinal <= 0 ? 1 : ordinal, true);
        }

        if (counterFormat === 'period') {
          return `${symbol}. `;
        } else if (counterFormat === 'parenthesis') {
          return `${symbol}) `;
        } else if (counterFormat === 'bracket') {
          return `[${symbol}] `;
        } else if (counterFormat === 'brace') {
          return `{${symbol}} `;
        } else if (counterFormat === 'colon') {
          return `${symbol}: `;
        } else if (counterFormat === 'hash') {
          return `#${symbol} `;
        } else if (counterFormat === 'custom') {
          const tmpl = customFormat || '%n. ';
          return tmpl.replace(/%n/g, symbol);
        }
        return `${symbol}. `;
      };

      const countedItems = items.map((item, idx) => {
        const prefix = formatCounter(idx);
        return `${prefix}${item}`;
      });

      const effectiveJoin = unescapeString(joinSeparator);
      const outputText = countedItems.join(effectiveJoin);

      return {
        parsedItems: items,
        countedResult: outputText,
        totalItems: items.length,
      };
    } catch (err: any) {
      setParseError(err?.message || 'Invalid regular expression');
      return { parsedItems: [], countedResult: '', totalItems: 0 };
    }
  }, [
    input,
    delimiterMode,
    delimiterValue,
    joinSeparator,
    numberingSystem,
    counterFormat,
    customFormat,
    skipEmpty,
    reverseNumbering,
    startFromZero,
    trimItems,
  ]);

  const handleCopy = useCallback(() => {
    if (!countedResult) return;
    navigator.clipboard.writeText(countedResult);
    setCopied(true);
    toast.success(t('listcounter.toast_copied', 'Enumerated list copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [countedResult, t]);

  const handleDownload = (format: 'txt' | 'json' | 'csv') => {
    if (!countedResult) return;
    let content = countedResult;
    let mimeType = 'text/plain';
    const filename = `counted-list.${format}`;

    if (format === 'json') {
      const rows = countedResult.split(unescapeString(joinSeparator));
      content = JSON.stringify(rows, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      const rows = countedResult.split(unescapeString(joinSeparator));
      content = rows.map((r, i) => `${i + 1},"${r.replace(/"/g, '""')}"`).join('\n');
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('listcounter.toast_downloaded', `Exported ${format.toUpperCase()} file!`));
  };

  const handlersRef = useRef({ handleReset, handleCopy });
  handlersRef.current = { handleReset, handleCopy };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        if (e.key === 'Escape') {
          handlersRef.current.handleReset();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Quick Presets Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          <span>{t('listcounter.presets_title', 'Quick Presets')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isSelected}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Input & Options & Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input and Delimiter Options */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="list-counter-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listcounter.input_label', 'Input List')}
            </label>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-1.5"
              title={`${t('common.clear', 'Clear')} (Esc)`}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              {t('common.clear', 'Clear')}
              <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-slate-800">
                Esc
              </Kbd>
            </button>
          </div>

          <textarea
            ref={inputRef}
            id="list-counter-input"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t('listcounter.placeholder_input', 'Enter items to enumerate (e.g. one per line)...')}
            className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200 resize-none shadow-inner"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Delimiter Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listcounter.delimiter_settings', 'Input Separator Options')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listcounter.split_mode', 'Item Separator Mode')}
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setDelimiterMode('char');
                      setActivePresetId(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      delimiterMode === 'char'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {t('listcounter.by_character', 'Character')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDelimiterMode('regex');
                      setActivePresetId(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all ${
                      delimiterMode === 'regex'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {t('listcounter.by_regex', 'Regexp')}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="delimiter-value-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {delimiterMode === 'char'
                    ? t('listcounter.char_delimiter', 'Input Separator (\\n, comma, etc.)')
                    : t('listcounter.regex_delimiter', 'Regexp (e.g. \\s+ or /[,;]/)')}
                </label>
                <input
                  id="delimiter-value-input"
                  type="text"
                  value={delimiterValue}
                  onChange={(e) => {
                    setDelimiterValue(e.target.value);
                    setActivePresetId(null);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={skipEmpty}
                  onChange={(e) => {
                    setSkipEmpty(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500/20"
                />
                <span>{t('listcounter.skip_empty', 'Skip Empty Items')}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={trimItems}
                  onChange={(e) => {
                    setTrimItems(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500/20"
                />
                <span>{t('listcounter.trim_items', 'Trim Spaces Around Items')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Output & Numbering Controls */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="list-counter-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              {t('common.result', 'Result')}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-[11px] font-bold">
                <button
                  onClick={() => handleDownload('txt')}
                  disabled={!countedResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export TXT"
                >
                  TXT
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  disabled={!countedResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export JSON"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={!countedResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export CSV"
                >
                  CSV
                </button>
              </div>

              <button
                onClick={handleCopy}
                disabled={!countedResult}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                } disabled:opacity-50`}
                title={`${t('common.copy', 'Copy')} (C)`}
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-slate-800">C</Kbd>}
              </button>
            </div>
          </div>

          <textarea
            id="list-counter-output"
            value={countedResult}
            readOnly
            placeholder={t('listcounter.output_placeholder', 'Numbered list items will appear here...')}
            className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none cursor-default shadow-inner"
          />

          {/* Numbering Formatting Controls Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listcounter.numbering_settings', 'Numbering & Counter Options')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="numbering-system-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listcounter.num_system', 'Counting System')}
                </label>
                <select
                  id="numbering-system-select"
                  value={numberingSystem}
                  onChange={(e) => {
                    setNumberingSystem(e.target.value as NumberingSystem);
                    setActivePresetId(null);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="integer">{t('listcounter.sys_integer', 'Arabic Integers (1, 2, 3...)')}</option>
                  <option value="alpha-lower">{t('listcounter.sys_alpha_lower', 'Alphabetic Lower (a, b, c...)')}</option>
                  <option value="alpha-upper">{t('listcounter.sys_alpha_upper', 'Alphabetic Upper (A, B, C...)')}</option>
                  <option value="roman-lower">{t('listcounter.sys_roman_lower', 'Roman Lower (i, ii, iii...)')}</option>
                  <option value="roman-upper">{t('listcounter.sys_roman_upper', 'Roman Upper (I, II, III...)')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="counter-format-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listcounter.counter_format', 'Format Template')}
                </label>
                <select
                  id="counter-format-select"
                  value={counterFormat}
                  onChange={(e) => {
                    setCounterFormat(e.target.value as CounterFormat);
                    setActivePresetId(null);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="period">1. (Dot / Period)</option>
                  <option value="parenthesis">1) (Parenthesis)</option>
                  <option value="bracket">[1] (Square Bracket)</option>
                  <option value="brace">{'{1}'} (Curly Brace)</option>
                  <option value="colon">1: (Colon)</option>
                  <option value="hash">#1 (Hash Prefix)</option>
                  <option value="custom">{t('listcounter.format_custom', 'Custom (%n Pattern)')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="join-separator-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listcounter.join_separator', 'Join Character')}
                </label>
                <input
                  id="join-separator-input"
                  type="text"
                  value={joinSeparator}
                  onChange={(e) => {
                    setJoinSeparator(e.target.value);
                    setActivePresetId(null);
                  }}
                  placeholder="\\n"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {counterFormat === 'custom' && (
              <div className="space-y-1 pt-1">
                <label htmlFor="custom-format-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listcounter.custom_format_label', 'Custom Pattern (%n = counter value, e.g. "#%n: " or "Step %n -> ")')}
                </label>
                <input
                  id="custom-format-input"
                  type="text"
                  value={customFormat}
                  onChange={(e) => {
                    setCustomFormat(e.target.value);
                    setActivePresetId(null);
                  }}
                  placeholder="%n. "
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-4 pt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={startFromZero}
                  onChange={(e) => {
                    setStartFromZero(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500/20"
                />
                <span>{t('listcounter.start_zero', 'Start from Zero (0-indexed)')}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={reverseNumbering}
                  onChange={(e) => {
                    setReverseNumbering(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500/20"
                />
                <span>{t('listcounter.reverse_numbering', 'Reverse Numbering (Countdown)')}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {parseError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Summary Metrics Bar */}
      {parsedItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listcounter.stat_total_items', 'Enumerated Items')}
            </span>
            <span className="text-xl font-black font-mono text-slate-800 dark:text-slate-100">{totalItems}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listcounter.stat_system', 'Counting System')}
            </span>
            <span className="text-sm font-black uppercase font-mono text-indigo-600 dark:text-indigo-400">{numberingSystem}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listcounter.stat_format', 'Format')}
            </span>
            <span className="text-sm font-black uppercase font-mono text-emerald-600 dark:text-emerald-400">{counterFormat}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listcounter.stat_direction', 'Order')}
            </span>
            <span className="text-sm font-black uppercase font-mono text-amber-600 dark:text-amber-400">
              {reverseNumbering ? 'Countdown (Desc)' : 'Ascending'}
            </span>
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('listcounter.about_title', 'About List Item Counter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'listcounter.about_text',
              'Inspired by onlinetools.com, the List Item Counter enumerates items in any list. Choose from Arabic numbers, alphabetic sequences, or Roman numerals with brackets, dots, parentheses, or custom %n pattern templates. Supports regex/character delimiters, reverse ordering, zero-indexing, and clean exports.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
