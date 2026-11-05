import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Layers, Copy, Check, RotateCcw, Download, Info, AlertCircle, Sparkles, Settings2, Hash, ArrowRight } from 'lucide-react';
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
  groupSize: number;
  itemSeparator: string;
  groupSeparator: string;
  leftWrap: string;
  rightWrap: string;
  deleteEmpty: boolean;
  trimItems: boolean;
  padGroups: boolean;
  paddingSymbol: string;
}

const PRESETS: Preset[] = [
  {
    id: 'trigram_letters',
    name: 'Alphabet Trigrams (Size 3 + Pad)',
    input: 'a;b;c;d;e;f;g;h;i;j;k;l;m;n;o;p;q;r;s;t;u;v;w;x;y;z',
    delimiterMode: 'char',
    delimiterValue: ';',
    groupSize: 3,
    itemSeparator: ', ',
    groupSeparator: '\n',
    leftWrap: '[',
    rightWrap: ']',
    deleteEmpty: false,
    trimItems: true,
    padGroups: true,
    paddingSymbol: '_',
  },
  {
    id: 'vector_pairs',
    name: 'Hexagon Coordinates (Pairs)',
    input: '2.5 9.33 0 5 2.5 0.66 7.5 0.66 10 5 7.5 9.33',
    delimiterMode: 'char',
    delimiterValue: ' ',
    groupSize: 2,
    itemSeparator: ', ',
    groupSeparator: '; ',
    leftWrap: '(',
    rightWrap: ')',
    deleteEmpty: true,
    trimItems: true,
    padGroups: false,
    paddingSymbol: '0',
  },
  {
    id: 'tsv_columns',
    name: 'Food Menu 3-Column TSV',
    input: 'beef buns cake corn crab dill fish kiwi kale lime meat mint milk pear plum pate pork rice soup tuna tart',
    delimiterMode: 'regex',
    delimiterValue: '\\s+',
    groupSize: 3,
    itemSeparator: '\t',
    groupSeparator: '\n',
    leftWrap: '',
    rightWrap: '',
    deleteEmpty: true,
    trimItems: true,
    padGroups: false,
    paddingSymbol: 'N/A',
  },
  {
    id: 'synonym_quartets',
    name: 'Synonyms in Quartets with Padding',
    input: 'Story; Tale; Yarn; ; Narrative; Put; Place; Assign; Keep; Run; Race; Sprint; Dash; Idea; ; Thought; Concept; Notion; ; ; Love; Like',
    delimiterMode: 'char',
    delimiterValue: ';',
    groupSize: 4,
    itemSeparator: ' - ',
    groupSeparator: '\n',
    leftWrap: '[',
    rightWrap: ']',
    deleteEmpty: true,
    trimItems: true,
    padGroups: true,
    paddingSymbol: '…',
  },
  {
    id: 'brace_singletons',
    name: 'Single Digit Enclosures',
    input: '0123456789',
    delimiterMode: 'regex',
    delimiterValue: '',
    groupSize: 1,
    itemSeparator: '',
    groupSeparator: '',
    leftWrap: '{',
    rightWrap: '}',
    deleteEmpty: false,
    trimItems: false,
    padGroups: false,
    paddingSymbol: '',
  },
];

export function ListItemGrouper({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input ?? PRESETS[0].input);
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId ?? PRESETS[0].id);

  const [delimiterMode, setDelimiterMode] = useState<'char' | 'regex'>(initialData?.delimiterMode ?? PRESETS[0].delimiterMode);
  const [delimiterValue, setDelimiterValue] = useState<string>(initialData?.delimiterValue ?? PRESETS[0].delimiterValue);

  const [groupSize, setGroupSize] = useState<number>(initialData?.groupSize ?? PRESETS[0].groupSize);
  const [itemSeparator, setItemSeparator] = useState<string>(initialData?.itemSeparator ?? PRESETS[0].itemSeparator);
  const [groupSeparator, setGroupSeparator] = useState<string>(initialData?.groupSeparator ?? PRESETS[0].groupSeparator);
  const [leftWrap, setLeftWrap] = useState<string>(initialData?.leftWrap ?? PRESETS[0].leftWrap);
  const [rightWrap, setRightWrap] = useState<string>(initialData?.rightWrap ?? PRESETS[0].rightWrap);

  const [deleteEmpty, setDeleteEmpty] = useState<boolean>(initialData?.deleteEmpty ?? PRESETS[0].deleteEmpty);
  const [trimItems, setTrimItems] = useState<boolean>(initialData?.trimItems ?? PRESETS[0].trimItems);
  const [padGroups, setPadGroups] = useState<boolean>(initialData?.padGroups ?? PRESETS[0].padGroups);
  const [paddingSymbol, setPaddingSymbol] = useState<string>(initialData?.paddingSymbol ?? PRESETS[0].paddingSymbol);

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
        groupSize,
        itemSeparator,
        groupSeparator,
        leftWrap,
        rightWrap,
        deleteEmpty,
        trimItems,
        padGroups,
        paddingSymbol,
      });
    }
  }, [input, activePresetId, delimiterMode, delimiterValue, groupSize, itemSeparator, groupSeparator, leftWrap, rightWrap, deleteEmpty, trimItems, padGroups, paddingSymbol, onStateChange]);

  const handleInputChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      toast.error(t('listgrouper.error_max_length', `Input exceeds maximum length of ${MAX_LENGTH} characters`));
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
    setGroupSize(preset.groupSize);
    setItemSeparator(preset.itemSeparator);
    setGroupSeparator(preset.groupSeparator);
    setLeftWrap(preset.leftWrap);
    setRightWrap(preset.rightWrap);
    setDeleteEmpty(preset.deleteEmpty);
    setTrimItems(preset.trimItems);
    setPadGroups(preset.padGroups);
    setPaddingSymbol(preset.paddingSymbol);
    toast.success(t('listgrouper.toast_preset_loaded', `Loaded preset: ${preset.name}`));

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleReset = () => {
    setInput('');
    setActivePresetId(null);
    setParseError(null);
    toast.success(t('listgrouper.toast_cleared', 'Inputs cleared'));
    inputRef.current?.focus();
  };

  // Convert unescaped escape sequences like \n, \t into actual control chars if needed
  const unescapeString = (str: string) => {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  };

  const { parsedItems, groupedResult, totalItems, totalGroups, paddingItemsCount } = useMemo(() => {
    if (!input) {
      return { parsedItems: [], groupedResult: '', totalItems: 0, totalGroups: 0, paddingItemsCount: 0 };
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
          // Remove wrapping /.../ if present
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

      const effectiveGroupSize = Math.max(1, Math.floor(groupSize) || 1);
      const groups: string[][] = [];
      let currentPadCount = 0;

      for (let i = 0; i < items.length; i += effectiveGroupSize) {
        const chunk = items.slice(i, i + effectiveGroupSize);
        if (padGroups && chunk.length < effectiveGroupSize) {
          const needed = effectiveGroupSize - chunk.length;
          currentPadCount += needed;
          for (let p = 0; p < needed; p++) {
            chunk.push(paddingSymbol);
          }
        }
        groups.push(chunk);
      }

      const effectiveItemSep = unescapeString(itemSeparator);
      const effectiveGroupSep = unescapeString(groupSeparator);

      const formattedGroups = groups.map((g) => `${leftWrap}${g.join(effectiveItemSep)}${rightWrap}`);
      const outputText = formattedGroups.join(effectiveGroupSep);

      return {
        parsedItems: items,
        groupedResult: outputText,
        totalItems: items.length,
        totalGroups: groups.length,
        paddingItemsCount: currentPadCount,
      };
    } catch (err: any) {
      setParseError(err?.message || 'Invalid regular expression');
      return { parsedItems: [], groupedResult: '', totalItems: 0, totalGroups: 0, paddingItemsCount: 0 };
    }
  }, [input, delimiterMode, delimiterValue, groupSize, itemSeparator, groupSeparator, leftWrap, rightWrap, deleteEmpty, trimItems, padGroups, paddingSymbol]);

  const handleCopy = useCallback(() => {
    if (!groupedResult) return;
    navigator.clipboard.writeText(groupedResult);
    setCopied(true);
    toast.success(t('listgrouper.toast_copied', 'Grouped list copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [groupedResult, t]);

  const handleDownload = (format: 'txt' | 'json' | 'csv') => {
    if (!groupedResult) return;
    let content = groupedResult;
    let mimeType = 'text/plain';
    let filename = `grouped-list.${format}`;

    if (format === 'json') {
      const effectiveGroupSize = Math.max(1, Math.floor(groupSize) || 1);
      const groups: string[][] = [];
      for (let i = 0; i < parsedItems.length; i += effectiveGroupSize) {
        const chunk = parsedItems.slice(i, i + effectiveGroupSize);
        if (padGroups && chunk.length < effectiveGroupSize) {
          const needed = effectiveGroupSize - chunk.length;
          for (let p = 0; p < needed; p++) chunk.push(paddingSymbol);
        }
        groups.push(chunk);
      }
      content = JSON.stringify(groups, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      const effectiveGroupSize = Math.max(1, Math.floor(groupSize) || 1);
      const rows: string[] = [];
      for (let i = 0; i < parsedItems.length; i += effectiveGroupSize) {
        const chunk = parsedItems.slice(i, i + effectiveGroupSize);
        if (padGroups && chunk.length < effectiveGroupSize) {
          const needed = effectiveGroupSize - chunk.length;
          for (let p = 0; p < needed; p++) chunk.push(paddingSymbol);
        }
        rows.push(chunk.map((val) => `"${val.replace(/"/g, '""')}"`).join(','));
      }
      content = rows.join('\n');
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('listgrouper.toast_downloaded', `Exported ${format.toUpperCase()} file!`));
  };

  // Keyboard shortcut listener isolated to container
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
          <span>{t('listgrouper.presets_title', 'Quick Presets')}</span>
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
        {/* Left Column: Input and Input Separators */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="list-grouper-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listgrouper.input_label', 'Input List')}
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
            id="list-grouper-input"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t('listgrouper.placeholder_input', 'Enter or paste list items here...')}
            className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200 resize-none shadow-inner"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Delimiter Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listgrouper.delimiter_settings', 'Input Separator Options')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listgrouper.split_mode', 'Item Separator Mode')}
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
                    {t('listgrouper.by_character', 'Character')}
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
                    {t('listgrouper.by_regex', 'Regexp')}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="delimiter-value-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {delimiterMode === 'char' ? t('listgrouper.char_delimiter', 'Character (e.g. , or \\n)') : t('listgrouper.regex_delimiter', 'Regexp (e.g. \\s+ or /[,;]/)')}
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
                  checked={deleteEmpty}
                  onChange={(e) => {
                    setDeleteEmpty(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500/20"
                />
                <span>{t('listgrouper.delete_empty', 'Delete Empty Items')}</span>
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
                <span>{t('listgrouper.trim_items', 'Trim Spaces Around Items')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Output & Grouping Configurations */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="list-grouper-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              {t('common.result', 'Result')}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-[11px] font-bold">
                <button
                  onClick={() => handleDownload('txt')}
                  disabled={!groupedResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export TXT"
                >
                  TXT
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  disabled={!groupedResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export JSON"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={!groupedResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export CSV"
                >
                  CSV
                </button>
              </div>

              <button
                onClick={handleCopy}
                disabled={!groupedResult}
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
            id="list-grouper-output"
            value={groupedResult}
            readOnly
            placeholder={t('listgrouper.output_placeholder', 'Grouped list items will appear here...')}
            className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none cursor-default shadow-inner"
          />

          {/* Group Formatting Controls Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listgrouper.group_formatting', 'Group Size & Delimiters')}
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="group-size-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listgrouper.group_size', 'Group Size (N)')}
                </label>
                <input
                  id="group-size-input"
                  type="number"
                  min="1"
                  max="1000"
                  value={groupSize}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setGroupSize(isNaN(parsed) || parsed < 1 ? 1 : parsed);
                    setActivePresetId(null);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="item-separator-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listgrouper.item_separator', 'Item Symbol')}
                </label>
                <input
                  id="item-separator-input"
                  type="text"
                  value={itemSeparator}
                  onChange={(e) => {
                    setItemSeparator(e.target.value);
                    setActivePresetId(null);
                  }}
                  placeholder=", "
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="group-separator-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listgrouper.group_separator', 'Group Separator')}
                </label>
                <input
                  id="group-separator-input"
                  type="text"
                  value={groupSeparator}
                  onChange={(e) => {
                    setGroupSeparator(e.target.value);
                    setActivePresetId(null);
                  }}
                  placeholder="\n"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="left-wrap-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listgrouper.left_wrap', 'Left Wrap Symbol')}
                </label>
                <input
                  id="left-wrap-input"
                  type="text"
                  value={leftWrap}
                  onChange={(e) => {
                    setLeftWrap(e.target.value);
                    setActivePresetId(null);
                  }}
                  placeholder="["
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="right-wrap-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listgrouper.right_wrap', 'Right Wrap Symbol')}
                </label>
                <input
                  id="right-wrap-input"
                  type="text"
                  value={rightWrap}
                  onChange={(e) => {
                    setRightWrap(e.target.value);
                    setActivePresetId(null);
                  }}
                  placeholder="]"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="padding-symbol-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listgrouper.padding_symbol', 'Padding Symbol')}
                </label>
                <input
                  id="padding-symbol-input"
                  type="text"
                  disabled={!padGroups}
                  value={paddingSymbol}
                  onChange={(e) => {
                    setPaddingSymbol(e.target.value);
                    setActivePresetId(null);
                  }}
                  placeholder="_"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-40"
                />
              </div>
            </div>

            <div className="pt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={padGroups}
                  onChange={(e) => {
                    setPadGroups(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500/20"
                />
                <span>{t('listgrouper.pad_groups', 'Pad Incomplete Groups with Symbol')}</span>
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
              {t('listgrouper.stat_total_items', 'Total Input Items')}
            </span>
            <span className="text-xl font-black font-mono text-slate-800 dark:text-slate-100">{totalItems}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listgrouper.stat_group_size', 'Group Size (N)')}
            </span>
            <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{groupSize}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listgrouper.stat_total_groups', 'Created Groups')}
            </span>
            <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{totalGroups}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listgrouper.stat_padding_count', 'Padded Items')}
            </span>
            <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
              {paddingItemsCount > 0 ? `${paddingItemsCount} items` : 'None'}
            </span>
          </div>
        </div>
      )}

      {/* About / Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('listgrouper.about_title', 'About List Item Grouper')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listgrouper.about_text', 'Inspired by onlinetools.com, the List Item Grouper splits and bundles elements of any list into groups of N items. You can customize the separating symbol between groups and within groups, wrap each group with brackets or quotes, remove empty items, and optionally pad incomplete chunks with custom fill values.')}
          </p>
        </div>
      </div>
    </div>
  );
}
