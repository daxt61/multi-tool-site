import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { UnfoldHorizontal, Copy, Check, RotateCcw, Download, Info, AlertCircle, Sparkles, Settings2, Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_RECURSION_DEPTH = 50;

interface Preset {
  id: string;
  name: string;
  input: string;
  delimiterMode: 'char' | 'regex';
  delimiterValue: string;
  leftUnwrap: string;
  rightUnwrap: string;
  joinSeparator: string;
  multilevel: boolean;
  trimItems: boolean;
  skipEmpty: boolean;
}

const PRESETS: Preset[] = [
  {
    id: 'ordinal_numbers',
    name: 'Ordinal Numbers (Strip the + number)',
    input: 'the first number\nthe second number\nthe third number\nthe fourth number\nthe fifth number\nthe sixth number\nthe seventh number\nthe eighth number\nthe ninth number\nthe tenth number\nthe eleventh number\nthe twelfth number',
    delimiterMode: 'char',
    delimiterValue: '\\n',
    leftUnwrap: 'the ',
    rightUnwrap: ' number',
    joinSeparator: '\\n',
    multilevel: false,
    trimItems: true,
    skipEmpty: false,
  },
  {
    id: 'cake_flavors',
    name: 'Cake Flavors (Strip Suffix Cake)',
    input: 'Coffee Cake\tBanana Cake\tFunfetti Cake\tLemon Cake\tBlack Forest Cake\tVanilla Cake\tRed Velvet Cake\tChocolate Cake',
    delimiterMode: 'regex',
    delimiterValue: '[\\t\\n]+',
    leftUnwrap: '',
    rightUnwrap: ' Cake',
    joinSeparator: '. ',
    multilevel: false,
    trimItems: true,
    skipEmpty: true,
  },
  {
    id: 'atmosphere_bullets',
    name: 'Atmosphere Layers (Multilevel Bullets ▪)',
    input: '▪ troposphere\n▪ stratosphere\n▪ ▪ mesosphere\n▪ thermosphere\n▪ ▪ exosphere',
    delimiterMode: 'char',
    delimiterValue: '\\n',
    leftUnwrap: '▪ ',
    rightUnwrap: '',
    joinSeparator: '\\n',
    multilevel: true,
    trimItems: false,
    skipEmpty: true,
  },
  {
    id: 'wedding_titles',
    name: 'Wedding Guests (Multi-Prefix Mr/Mrs/Miss/Ms)',
    input: 'Mr Lewis\nMrs Lane\nMiss Lopez\nMs Strait\nMr William\nMr Elijah\nMiss Esme\nMs Sophia\nMrs Evie\nMs Millie\nMr Lucas',
    delimiterMode: 'char',
    delimiterValue: '\\n',
    leftUnwrap: 'Mr \nMrs \nMiss \nMs ',
    rightUnwrap: '',
    joinSeparator: ', ',
    multilevel: false,
    trimItems: true,
    skipEmpty: false,
  },
  {
    id: 'time_periods',
    name: 'Time Periods (Multi-Suffix a.m./p.m.)',
    input: '02:42:30 a.m.\n17:57:56 p.m.\n23:56:19 p.m.\n12:44:15 p.m.\n17:44:08 p.m.\n01:06:24 a.m.\n10:40:31 a.m.\n04:25:01 a.m.\n22:38:56 p.m.\n09:05:36 a.m.',
    delimiterMode: 'char',
    delimiterValue: '\\n',
    leftUnwrap: '',
    rightUnwrap: ' a.m.\n p.m.',
    joinSeparator: '\\n',
    multilevel: false,
    trimItems: false,
    skipEmpty: true,
  },
];

export function ListItemUnwrapper({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input ?? PRESETS[0].input);
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData ? null : PRESETS[0].id);
  const [delimiterMode, setDelimiterMode] = useState<'char' | 'regex'>(initialData?.delimiterMode ?? PRESETS[0].delimiterMode);
  const [delimiterValue, setDelimiterValue] = useState<string>(initialData?.delimiterValue ?? PRESETS[0].delimiterValue);
  const [leftUnwrap, setLeftUnwrap] = useState<string>(initialData?.leftUnwrap ?? PRESETS[0].leftUnwrap);
  const [rightUnwrap, setRightUnwrap] = useState<string>(initialData?.rightUnwrap ?? PRESETS[0].rightUnwrap);
  const [joinSeparator, setJoinSeparator] = useState<string>(initialData?.joinSeparator ?? PRESETS[0].joinSeparator);
  const [multilevel, setMultilevel] = useState<boolean>(initialData?.multilevel ?? PRESETS[0].multilevel);
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? PRESETS[0].trimItems);
  const [skipEmpty, setSkipEmpty] = useState<boolean>(initialData?.skipEmpty ?? PRESETS[0].skipEmpty);

  const [copied, setCopied] = useState<boolean>(false);

  // Sync state upward for link sharing
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        input,
        delimiterMode,
        delimiterValue,
        leftUnwrap,
        rightUnwrap,
        joinSeparator,
        multilevel,
        trimItems,
        skipEmpty,
      });
    }
  }, [input, delimiterMode, delimiterValue, leftUnwrap, rightUnwrap, joinSeparator, multilevel, trimItems, skipEmpty, onStateChange]);

  const unescapeSeparator = useCallback((val: string): string => {
    return val
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r');
  }, []);

  const { output, parsedCount, error } = useMemo(() => {
    if (!input) {
      return { output: '', parsedCount: 0, error: null };
    }

    if (input.length > MAX_LENGTH) {
      return {
        output: '',
        parsedCount: 0,
        error: t('listunwrapper.error_max_length', { max: MAX_LENGTH }),
      };
    }

    try {
      let rawItems: string[] = [];

      if (delimiterMode === 'char') {
        const sep = unescapeSeparator(delimiterValue);
        if (sep === '') {
          rawItems = Array.from(input);
        } else {
          rawItems = input.split(sep);
        }
      } else {
        // regex mode
        let cleanRegex = delimiterValue.trim();
        let flags = '';
        if (cleanRegex.startsWith('/') && cleanRegex.lastIndexOf('/') > 0) {
          const lastSlash = cleanRegex.lastIndexOf('/');
          flags = cleanRegex.slice(lastSlash + 1);
          cleanRegex = cleanRegex.slice(1, lastSlash);
        }
        const re = new RegExp(cleanRegex || '\\n', flags);
        rawItems = input.split(re);
      }

      // Candidate prefixes & suffixes: can be multiline
      const leftCandidates = leftUnwrap
        .split('\n')
        .map(unescapeSeparator)
        .filter((s) => s.length > 0);

      const rightCandidates = rightUnwrap
        .split('\n')
        .map(unescapeSeparator)
        .filter((s) => s.length > 0);

      const unwrapItem = (itemText: string): string => {
        let current = itemText;
        let changed = true;
        let depth = 0;

        while (changed && depth < MAX_RECURSION_DEPTH) {
          changed = false;
          depth++;

          // Try stripping left prefixes
          for (const prefix of leftCandidates) {
            if (current.startsWith(prefix)) {
              current = current.slice(prefix.length);
              changed = true;
              break;
            }
          }

          // Try stripping right suffixes
          for (const suffix of rightCandidates) {
            if (current.endsWith(suffix)) {
              current = current.slice(0, current.length - suffix.length);
              changed = true;
              break;
            }
          }

          // If not multilevel, stop after single pass
          if (!multilevel) {
            break;
          }
        }

        return current;
      };

      const processedItems: string[] = [];
      for (const item of rawItems) {
        let val = unwrapItem(item);
        if (trimItems) {
          val = val.trim();
        }
        if (skipEmpty && val === '') {
          continue;
        }
        processedItems.push(val);
      }

      const joinStr = unescapeSeparator(joinSeparator);
      const joined = processedItems.join(joinStr);

      return {
        output: joined,
        parsedCount: processedItems.length,
        error: null,
      };
    } catch (err: any) {
      return {
        output: '',
        parsedCount: 0,
        error: err?.message || 'Error processing list unwrapping',
      };
    }
  }, [input, delimiterMode, delimiterValue, leftUnwrap, rightUnwrap, joinSeparator, multilevel, trimItems, skipEmpty, unescapeSeparator, t]);

  const handleApplyPreset = (preset: Preset) => {
    setActivePresetId(preset.id);
    setInput(preset.input);
    setDelimiterMode(preset.delimiterMode);
    setDelimiterValue(preset.delimiterValue);
    setLeftUnwrap(preset.leftUnwrap);
    setRightUnwrap(preset.rightUnwrap);
    setJoinSeparator(preset.joinSeparator);
    setMultilevel(preset.multilevel);
    setTrimItems(preset.trimItems);
    setSkipEmpty(preset.skipEmpty);
    toast.success(t('listunwrapper.toast_preset_loaded', { name: preset.name }));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClear = () => {
    setInput('');
    setActivePresetId(null);
    toast.info(t('listunwrapper.toast_cleared'));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('listunwrapper.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'txt' | 'json' | 'csv') => {
    if (!output) return;
    let fileContent = output;
    let mimeType = 'text/plain';
    let filename = `unwrapped-list.${format}`;

    if (format === 'json') {
      const items = output.split(unescapeSeparator(joinSeparator));
      fileContent = JSON.stringify(items, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      const items = output.split(unescapeSeparator(joinSeparator));
      fileContent = items.map(item => `"${item.replace(/"/g, '""')}"`).join('\n');
      mimeType = 'text/csv';
    }

    const blob = new Blob([fileContent], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('listunwrapper.toast_downloaded', { format: format.toUpperCase() }));
  };

  // Keyboard shortcut handlers with ref pattern
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) {
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (
        (e.key === 'c' || e.key === 'C') &&
        !['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Preset quick actions */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>{t('listunwrapper.presets_title')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isActive}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main dual workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="list-unwrapper-input" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <UnfoldHorizontal className="w-4 h-4 text-indigo-500" />
              <span>{t('listunwrapper.input_label')}</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Reset or clear list input"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('common.clear')}</span>
                <Kbd>Esc</Kbd>
              </button>
            </div>
          </div>

          <textarea
            id="list-unwrapper-input"
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={t('listunwrapper.placeholder_input')}
            rows={12}
            className="w-full font-mono text-sm p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y shadow-inner"
          />

          {/* Delimiter split options */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <span>{t('listunwrapper.delimiter_settings')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {t('listunwrapper.split_mode')}
                </label>
                <div className="flex rounded-xl bg-slate-200 dark:bg-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setDelimiterMode('char');
                      setActivePresetId(null);
                    }}
                    className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all ${
                      delimiterMode === 'char'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {t('listunwrapper.by_character')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDelimiterMode('regex');
                      setActivePresetId(null);
                    }}
                    className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all ${
                      delimiterMode === 'regex'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {t('listunwrapper.by_regex')}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="unwrapper-delimiter-input" className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {delimiterMode === 'char' ? t('listunwrapper.char_delimiter') : t('listunwrapper.regex_delimiter')}
                </label>
                <input
                  id="unwrapper-delimiter-input"
                  type="text"
                  value={delimiterValue}
                  onChange={(e) => {
                    setDelimiterValue(e.target.value);
                    setActivePresetId(null);
                  }}
                  className="w-full font-mono text-sm px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={multilevel}
                  onChange={(e) => {
                    setMultilevel(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">{t('listunwrapper.multilevel')}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={trimItems}
                  onChange={(e) => {
                    setTrimItems(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>{t('listunwrapper.trim_items')}</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={skipEmpty}
                  onChange={(e) => {
                    setSkipEmpty(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>{t('listunwrapper.skip_empty')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right column: Output & Unwrapping Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="list-unwrapper-output" className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>{t('listunwrapper.output_label')}</span>
              {parsedCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  {parsedCount} {t('listunwrapper.items_badge')}
                </span>
              )}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={!output}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 disabled:opacity-50 transition-all shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('common.copied') : t('common.copy')}</span>
                <Kbd>C</Kbd>
              </button>

              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5">
                <button
                  onClick={() => handleDownload('txt')}
                  disabled={!output}
                  className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
                  title="Download TXT"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  disabled={!output}
                  className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
                  title="Download JSON"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={!output}
                  className="px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50"
                  title="Download CSV"
                >
                  CSV
                </button>
              </div>
            </div>
          </div>

          <textarea
            id="list-unwrapper-output"
            readOnly
            value={output}
            placeholder={t('listunwrapper.output_placeholder')}
            rows={12}
            className="w-full font-mono text-sm p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y shadow-inner"
          />

          {error && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-900/30">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Unwrap Configuration Details */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>{t('listunwrapper.unwrapping_options')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="left-unwrap-input" className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {t('listunwrapper.left_unwrap')}
                </label>
                <textarea
                  id="left-unwrap-input"
                  rows={2}
                  value={leftUnwrap}
                  onChange={(e) => {
                    setLeftUnwrap(e.target.value);
                    setActivePresetId(null);
                  }}
                  placeholder={t('listunwrapper.left_unwrap_placeholder')}
                  className="w-full font-mono text-sm px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>

              <div>
                <label htmlFor="right-unwrap-input" className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {t('listunwrapper.right_unwrap')}
                </label>
                <textarea
                  id="right-unwrap-input"
                  rows={2}
                  value={rightUnwrap}
                  onChange={(e) => {
                    setRightUnwrap(e.target.value);
                    setActivePresetId(null);
                  }}
                  placeholder={t('listunwrapper.right_unwrap_placeholder')}
                  className="w-full font-mono text-sm px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                />
              </div>
            </div>

            <div>
              <label htmlFor="unwrapper-join-separator-input" className="block text-xs font-semibold text-slate-500 mb-1.5">
                {t('listunwrapper.join_separator')}
              </label>
              <input
                id="unwrapper-join-separator-input"
                type="text"
                value={joinSeparator}
                onChange={(e) => {
                  setJoinSeparator(e.target.value);
                  setActivePresetId(null);
                }}
                className="w-full font-mono text-sm px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Information / Explainer Section */}
      <div className="bg-slate-50 dark:bg-slate-900/30 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/60 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
          <Info className="w-4 h-4 text-indigo-500" />
          <span>{t('listunwrapper.about_title')}</span>
        </div>
        <p className="leading-relaxed">
          {t('listunwrapper.about_text')}
        </p>
      </div>
    </div>
  );
}
