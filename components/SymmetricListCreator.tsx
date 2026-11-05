import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { FlipHorizontal, Copy, Check, RotateCcw, Download, Info, AlertCircle, Sparkles, Settings2, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

interface Preset {
  id: string;
  name: string;
  input: string;
  delimiterMode: 'char' | 'regex';
  delimiterValue: string;
  symmetryType: 'mirrored' | 'centered' | 'minimal';
  joinSeparator: string;
  deleteEmpty: boolean;
  trimItems: boolean;
}

const PRESETS: Preset[] = [
  {
    id: 'block_wave',
    name: 'Unicode Height Wave (Centered)',
    input: '▁ ▂ ▃ ▄ ▅ ▆ ▇ █',
    delimiterMode: 'char',
    delimiterValue: ' ',
    symmetryType: 'centered',
    joinSeparator: ' ',
    deleteEmpty: false,
    trimItems: false,
  },
  {
    id: 'classical_elements',
    name: 'Classical Elements (Minimal)',
    input: 'Fire\nAir\nWater\nEarth\nWater',
    delimiterMode: 'char',
    delimiterValue: '\n',
    symmetryType: 'minimal',
    joinSeparator: '\n',
    deleteEmpty: true,
    trimItems: true,
  },
  {
    id: 'greek_mirror',
    name: 'Greek Alphabet (Mirrored)',
    input: 'Alpha Beta Gamma Delta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omicron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega',
    delimiterMode: 'regex',
    delimiterValue: '\\s+',
    symmetryType: 'mirrored',
    joinSeparator: ' ',
    deleteEmpty: true,
    trimItems: true,
  },
  {
    id: 'hex_bytes',
    name: 'Hex Memory Spectrum (Minimal)',
    input: '0x10, 0x20, 0x30, 0x40, 0x30',
    delimiterMode: 'char',
    delimiterValue: ',',
    symmetryType: 'minimal',
    joinSeparator: ', ',
    deleteEmpty: true,
    trimItems: true,
  },
];

export function SymmetricListCreator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input ?? PRESETS[0].input);
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId ?? PRESETS[0].id);

  const [delimiterMode, setDelimiterMode] = useState<'char' | 'regex'>(initialData?.delimiterMode ?? PRESETS[0].delimiterMode);
  const [delimiterValue, setDelimiterValue] = useState<string>(initialData?.delimiterValue ?? PRESETS[0].delimiterValue);

  const [symmetryType, setSymmetryType] = useState<'mirrored' | 'centered' | 'minimal'>(
    initialData?.symmetryType ?? PRESETS[0].symmetryType
  );
  const [joinSeparator, setJoinSeparator] = useState<string>(initialData?.joinSeparator ?? PRESETS[0].joinSeparator);
  const [deleteEmpty, setDeleteEmpty] = useState<boolean>(initialData?.deleteEmpty ?? PRESETS[0].deleteEmpty);
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? PRESETS[0].trimItems);

  const [copied, setCopied] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Sync state to parent if available
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        input,
        activePresetId,
        delimiterMode,
        delimiterValue,
        symmetryType,
        joinSeparator,
        deleteEmpty,
        trimItems,
      });
    }
  }, [input, activePresetId, delimiterMode, delimiterValue, symmetryType, joinSeparator, deleteEmpty, trimItems, onStateChange]);

  const handleInputChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      toast.error(t('symmetriclist.error_max_length', `Input exceeds maximum length of ${MAX_LENGTH} characters`));
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
    setSymmetryType(preset.symmetryType);
    setJoinSeparator(preset.joinSeparator);
    setDeleteEmpty(preset.deleteEmpty);
    setTrimItems(preset.trimItems);
    toast.success(t('symmetriclist.toast_preset_loaded', `Loaded preset: ${preset.name}`));

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleReset = () => {
    setInput('');
    setActivePresetId(null);
    setParseError(null);
    toast.success(t('symmetriclist.toast_cleared', 'Inputs cleared'));
    inputRef.current?.focus();
  };

  const unescapeString = (str: string) => {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  };

  const isPalindromeArray = (arr: string[]): boolean => {
    let l = 0;
    let r = arr.length - 1;
    while (l < r) {
      if (arr[l] !== arr[r]) return false;
      l++;
      r--;
    }
    return true;
  };

  const { parsedItems, symmetricItems, outputResult, addedItemsCount, isAlreadySymmetric } = useMemo(() => {
    if (!input) {
      return { parsedItems: [], symmetricItems: [], outputResult: '', addedItemsCount: 0, isAlreadySymmetric: false };
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
      if (deleteEmpty) {
        items = items.filter((s) => s.length > 0);
      }

      setParseError(null);

      if (items.length === 0) {
        return { parsedItems: [], symmetricItems: [], outputResult: '', addedItemsCount: 0, isAlreadySymmetric: false };
      }

      const alreadySym = items.length > 1 && isPalindromeArray(items);
      let resultItems: string[] = [];

      if (symmetryType === 'mirrored') {
        // [a, b, c] -> [a, b, c, c, b, a]
        const rev = [...items].reverse();
        resultItems = [...items, ...rev];
      } else if (symmetryType === 'centered') {
        // [a, b, c] -> [a, b, c, b, a]
        const tailRev = items.slice(0, -1).reverse();
        resultItems = [...items, ...tailRev];
      } else {
        // Minimal symmetry: find longest suffix of `items` that is a palindrome
        // The remaining prefix before that suffix is reversed and appended
        let longestPalSuffixLen = 1;
        for (let i = 0; i < items.length; i++) {
          const suffix = items.slice(i);
          if (isPalindromeArray(suffix)) {
            longestPalSuffixLen = suffix.length;
            break;
          }
        }
        const neededPrefix = items.slice(0, items.length - longestPalSuffixLen);
        const toAppend = [...neededPrefix].reverse();
        resultItems = [...items, ...toAppend];
      }

      const effectiveJoin = unescapeString(joinSeparator);
      const textOutput = resultItems.join(effectiveJoin);

      return {
        parsedItems: items,
        symmetricItems: resultItems,
        outputResult: textOutput,
        addedItemsCount: resultItems.length - items.length,
        isAlreadySymmetric: alreadySym,
      };
    } catch (err: any) {
      setParseError(err?.message || 'Invalid regular expression');
      return { parsedItems: [], symmetricItems: [], outputResult: '', addedItemsCount: 0, isAlreadySymmetric: false };
    }
  }, [input, delimiterMode, delimiterValue, symmetryType, joinSeparator, deleteEmpty, trimItems]);

  const handleCopy = useCallback(() => {
    if (!outputResult) return;
    navigator.clipboard.writeText(outputResult);
    setCopied(true);
    toast.success(t('symmetriclist.toast_copied', 'Symmetric list copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [outputResult, t]);

  const handleDownload = (format: 'txt' | 'json' | 'csv') => {
    if (!outputResult) return;
    let content = outputResult;
    let mimeType = 'text/plain';
    const filename = `symmetric-list.${format}`;

    if (format === 'json') {
      content = JSON.stringify(symmetricItems, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      content = symmetricItems.map((val) => `"${val.replace(/"/g, '""')}"`).join(',');
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('symmetriclist.toast_downloaded', `Exported ${format.toUpperCase()} file!`));
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
          <span>{t('symmetriclist.presets_title', 'Quick Presets')}</span>
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
        {/* Left Column: Input and Input Separator Options */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="symmetric-list-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FlipHorizontal className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('symmetriclist.input_label', 'Input List')}
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
            id="symmetric-list-input"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t('symmetriclist.placeholder_input', 'Enter list items to make symmetrical...')}
            className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200 resize-none shadow-inner"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Delimiter Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('symmetriclist.delimiter_settings', 'Delimiter & Splitting')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('symmetriclist.split_mode', 'Delimiter Type')}
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
                    {t('symmetriclist.by_character', 'Character')}
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
                    {t('symmetriclist.by_regex', 'Regexp')}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="sym-delimiter-value" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {delimiterMode === 'char' ? t('symmetriclist.char_delimiter', 'Input Separator Character') : t('symmetriclist.regex_delimiter', 'Input Separator Regexp')}
                </label>
                <input
                  id="sym-delimiter-value"
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
                  checked={deleteEmpty}
                  onChange={(e) => {
                    setDeleteEmpty(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500/20"
                />
                <span>{t('symmetriclist.delete_empty', 'Remove Empty Items')}</span>
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
                <span>{t('symmetriclist.trim_items', 'Trim Item Whitespace')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Output & Symmetry Algorithm Choice */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="symmetric-list-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              {t('common.result', 'Symmetric Result')}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-[11px] font-bold">
                <button
                  onClick={() => handleDownload('txt')}
                  disabled={!outputResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export TXT"
                >
                  TXT
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  disabled={!outputResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export JSON"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={!outputResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export CSV"
                >
                  CSV
                </button>
              </div>

              <button
                onClick={handleCopy}
                disabled={!outputResult}
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
            id="symmetric-list-output"
            value={outputResult}
            readOnly
            placeholder={t('symmetriclist.output_placeholder', 'Symmetric palindromic list will appear here...')}
            className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none cursor-default shadow-inner"
          />

          {/* Symmetry Mode & Output Joiner Options Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('symmetriclist.symmetry_settings', 'Symmetry Algorithm & Output Delimiter')}
            </h4>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                {t('symmetriclist.symmetry_type', 'List Symmetry Type')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSymmetryType('mirrored');
                    setActivePresetId(null);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    symmetryType === 'mirrored'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{t('symmetriclist.type_mirrored', 'Mirrored Symmetry')}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">a, b, c → a, b, c, c, b, a</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSymmetryType('centered');
                    setActivePresetId(null);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    symmetryType === 'centered'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{t('symmetriclist.type_centered', 'Centered Symmetry')}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">a, b, c → a, b, c, b, a</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSymmetryType('minimal');
                    setActivePresetId(null);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    symmetryType === 'minimal'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold">{t('symmetriclist.type_minimal', 'Minimal Symmetry')}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">a, b, c, b → a, b, c, b, a</div>
                </button>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label htmlFor="join-separator-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                {t('symmetriclist.join_separator', 'Output Joining Delimiter')}
              </label>
              <input
                id="join-separator-input"
                type="text"
                value={joinSeparator}
                onChange={(e) => {
                  setJoinSeparator(e.target.value);
                  setActivePresetId(null);
                }}
                placeholder=", "
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
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
              {t('symmetriclist.stat_original_count', 'Original Items')}
            </span>
            <span className="text-xl font-black font-mono text-slate-800 dark:text-slate-100">{parsedItems.length}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('symmetriclist.stat_symmetric_count', 'Symmetric Total')}
            </span>
            <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{symmetricItems.length}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('symmetriclist.stat_added_count', 'Added Symmetrical Items')}
            </span>
            <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">+{addedItemsCount}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('symmetriclist.stat_status', 'Original Symmetry')}
            </span>
            <span className={`text-sm font-black font-mono flex items-center gap-1.5 mt-1 ${isAlreadySymmetric ? 'text-emerald-500' : 'text-slate-500'}`}>
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              {isAlreadySymmetric ? t('symmetriclist.status_already', 'Already Palindrome') : t('symmetriclist.status_asymmetric', 'Asymmetric')}
            </span>
          </div>
        </div>
      )}

      {/* About / Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('symmetriclist.about_title', 'About Symmetric List Creator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('symmetriclist.about_text', 'Inspired by onlinetools.com, the Symmetric List Creator transforms any list into a palindromic sequence that reads identically forward and backward. Supports three distinct symmetry models: Mirrored (full duplicate in reverse), Centered (pivoting on the final item), and Minimal (adding only the fewest items required to establish palindromic symmetry).')}
          </p>
        </div>
      </div>
    </div>
  );
}
