import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Maximize2, Copy, Check, RotateCcw, Download, Info, AlertCircle, Sparkles, Settings2, Hash, ArrowRight, ArrowLeft } from 'lucide-react';
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
  targetLength: number;
  fillItems: string;
  changePosition: 'end' | 'start';
  joinSymbol: string;
  deleteEmpty: boolean;
  trimItems: boolean;
}

const PRESETS: Preset[] = [
  {
    id: 'goods_inventory',
    name: 'Goods Inventory Labels (Extend to 12)',
    input: `Bed\nLamp\nArmchair\nCupboard\nTable\nCurbstone\nDresser\nNightstand\nChair`,
    delimiterMode: 'char',
    delimiterValue: '\\n',
    targetLength: 12,
    fillItems: 'Unknown product',
    changePosition: 'end',
    joinSymbol: '\\n',
    deleteEmpty: true,
    trimItems: true,
  },
  {
    id: 'playlist_shorten',
    name: 'Holiday Playlist Truncation (Shorten to 6)',
    input: 'White Christmas; The Christmas Song; Frosty the Snowman; Sleigh Ride; Jingle Bells; Merry Christmas, Baby; Feliz Navidad; This Christmas; Christmas Wrapping; Last Christmas; Deck the Halls',
    delimiterMode: 'regex',
    delimiterValue: '[;,]\\s*',
    targetLength: 6,
    fillItems: '',
    changePosition: 'end',
    joinSymbol: ', ',
    deleteEmpty: true,
    trimItems: true,
  },
  {
    id: 'phone_number_pool',
    name: 'Cycle Phone Numbers (Extend to 15 from Start)',
    input: `(808)-780-8093\n(292) 991-2438\n1-555-760-0385\n(761) 619-7513\n(619)-862-4369\n(763) 424-6568\n1-312-556-4860\n(500) 345-7914`,
    delimiterMode: 'char',
    delimiterValue: '\\n',
    targetLength: 15,
    fillItems: `(111)-111-1111\n(222) 222-2222\n3-333-333-3333`,
    changePosition: 'start',
    joinSymbol: '\\n',
    deleteEmpty: true,
    trimItems: true,
  },
  {
    id: 'hex_bytes_buffer',
    name: '8-Byte Buffer Pad (Size 8)',
    input: '0xDE, 0xAD, 0xBE, 0xEF',
    delimiterMode: 'char',
    delimiterValue: ',',
    targetLength: 8,
    fillItems: '0x00',
    changePosition: 'end',
    joinSymbol: ', ',
    deleteEmpty: true,
    trimItems: true,
  },
];

export function ListLengthChanger({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input ?? PRESETS[0].input);
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId ?? PRESETS[0].id);

  const [delimiterMode, setDelimiterMode] = useState<'char' | 'regex'>(initialData?.delimiterMode ?? PRESETS[0].delimiterMode);
  const [delimiterValue, setDelimiterValue] = useState<string>(initialData?.delimiterValue ?? PRESETS[0].delimiterValue);

  const [targetLength, setTargetLength] = useState<number>(initialData?.targetLength ?? PRESETS[0].targetLength);
  const [fillItems, setFillItems] = useState<string>(initialData?.fillItems ?? PRESETS[0].fillItems);
  const [changePosition, setChangePosition] = useState<'end' | 'start'>(initialData?.changePosition ?? PRESETS[0].changePosition);
  const [joinSymbol, setJoinSymbol] = useState<string>(initialData?.joinSymbol ?? PRESETS[0].joinSymbol);

  const [deleteEmpty, setDeleteEmpty] = useState<boolean>(initialData?.deleteEmpty ?? PRESETS[0].deleteEmpty);
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
        targetLength,
        fillItems,
        changePosition,
        joinSymbol,
        deleteEmpty,
        trimItems,
      });
    }
  }, [input, activePresetId, delimiterMode, delimiterValue, targetLength, fillItems, changePosition, joinSymbol, deleteEmpty, trimItems, onStateChange]);

  const handleInputChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      toast.error(t('listlengthchanger.error_max_length', `Input exceeds maximum length of ${MAX_LENGTH} characters`));
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
    setTargetLength(preset.targetLength);
    setFillItems(preset.fillItems);
    setChangePosition(preset.changePosition);
    setJoinSymbol(preset.joinSymbol);
    setDeleteEmpty(preset.deleteEmpty);
    setTrimItems(preset.trimItems);
    toast.success(t('listlengthchanger.toast_preset_loaded', `Loaded preset: ${preset.name}`));

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleReset = () => {
    setInput('');
    setActivePresetId(null);
    setParseError(null);
    toast.success(t('listlengthchanger.toast_cleared', 'Inputs cleared'));
    inputRef.current?.focus();
  };

  const unescapeString = (str: string) => {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  };

  const { parsedItems, processedItems, resultString, totalInputItems, itemsDelta, operationType } = useMemo(() => {
    if (!input) {
      return {
        parsedItems: [],
        processedItems: [],
        resultString: '',
        totalInputItems: 0,
        itemsDelta: 0,
        operationType: 'none' as 'none' | 'padded' | 'truncated' | 'unchanged',
      };
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

      const count = items.length;
      const target = Math.max(0, Math.floor(targetLength) || 0);

      let finalItems: string[] = [];
      let delta = target - count;
      let op: 'none' | 'padded' | 'truncated' | 'unchanged' = 'unchanged';

      if (count === target) {
        finalItems = [...items];
        op = 'unchanged';
      } else if (count > target) {
        // Truncate list
        op = 'truncated';
        if (changePosition === 'end') {
          finalItems = items.slice(0, target);
        } else {
          finalItems = items.slice(count - target);
        }
      } else {
        // Pad list
        op = 'padded';
        const needed = target - count;

        // Parse filling items (split by newline or treat as single string)
        let fillers: string[] = [];
        if (fillItems) {
          fillers = fillItems.split('\n').map((f) => (trimItems ? f.trim() : f));
          if (deleteEmpty) {
            fillers = fillers.filter((f) => f.length > 0);
          }
        }
        if (fillers.length === 0) {
          fillers = [''];
        }

        const addedTokens: string[] = [];
        for (let i = 0; i < needed; i++) {
          addedTokens.push(fillers[i % fillers.length]);
        }

        if (changePosition === 'end') {
          finalItems = [...items, ...addedTokens];
        } else {
          finalItems = [...addedTokens, ...items];
        }
      }

      const effectiveJoin = unescapeString(joinSymbol);
      const outputText = finalItems.join(effectiveJoin);

      return {
        parsedItems: items,
        processedItems: finalItems,
        resultString: outputText,
        totalInputItems: count,
        itemsDelta: delta,
        operationType: op,
      };
    } catch (err: any) {
      setParseError(err?.message || 'Invalid regular expression');
      return {
        parsedItems: [],
        processedItems: [],
        resultString: '',
        totalInputItems: 0,
        itemsDelta: 0,
        operationType: 'none',
      };
    }
  }, [input, delimiterMode, delimiterValue, targetLength, fillItems, changePosition, joinSymbol, deleteEmpty, trimItems]);

  const handleCopy = useCallback(() => {
    if (!resultString) return;
    navigator.clipboard.writeText(resultString);
    setCopied(true);
    toast.success(t('listlengthchanger.toast_copied', 'List copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [resultString, t]);

  const handleDownload = (format: 'txt' | 'json' | 'csv') => {
    if (!resultString) return;
    let content = resultString;
    let mimeType = 'text/plain';
    let filename = `length-changed-list.${format}`;

    if (format === 'json') {
      content = JSON.stringify(processedItems, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      content = processedItems.map((val) => `"${val.replace(/"/g, '""')}"`).join(',');
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('listlengthchanger.toast_downloaded', `Exported ${format.toUpperCase()} file!`));
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
          <span>{t('listlengthchanger.presets_title', 'Quick Presets')}</span>
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
            <label htmlFor="list-length-changer-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listlengthchanger.input_label', 'Input List')}
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
            id="list-length-changer-input"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t('listlengthchanger.placeholder_input', 'Enter or paste list items here...')}
            className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200 resize-none shadow-inner"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Delimiter Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listlengthchanger.delimiter_settings', 'Input Splitting Options')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listlengthchanger.split_mode', 'Item Separator Mode')}
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
                    {t('listlengthchanger.by_character', 'Character')}
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
                    {t('listlengthchanger.by_regex', 'Regexp')}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="length-changer-delim-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {delimiterMode === 'char' ? t('listlengthchanger.char_delimiter', 'Character (e.g. , or \\n)') : t('listlengthchanger.regex_delimiter', 'Regexp (e.g. \\s+ or /[,;]/)')}
                </label>
                <input
                  id="length-changer-delim-input"
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
                <span>{t('listlengthchanger.delete_empty', 'Delete Empty Items')}</span>
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
                <span>{t('listlengthchanger.trim_items', 'Trim Whitespace')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Output & Length Configurations */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="list-length-changer-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              {t('common.result', 'Result')}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-[11px] font-bold">
                <button
                  onClick={() => handleDownload('txt')}
                  disabled={!resultString}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export TXT"
                >
                  TXT
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  disabled={!resultString}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export JSON"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={!resultString}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export CSV"
                >
                  CSV
                </button>
              </div>

              <button
                onClick={handleCopy}
                disabled={!resultString}
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
            id="list-length-changer-output"
            value={resultString}
            readOnly
            placeholder={t('listlengthchanger.output_placeholder', 'Adjusted list will appear here...')}
            className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none cursor-default shadow-inner"
          />

          {/* Length & Padding Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listlengthchanger.length_settings', 'Target Length & Filler Options')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="target-length-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listlengthchanger.target_length', 'New Target Length (N)')}
                </label>
                <input
                  id="target-length-input"
                  type="number"
                  min="0"
                  max="100000"
                  value={targetLength}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setTargetLength(isNaN(parsed) || parsed < 0 ? 0 : parsed);
                    setActivePresetId(null);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listlengthchanger.position', 'Change Position')}
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setChangePosition('end');
                      setActivePresetId(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                      changePosition === 'end'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <span>{t('listlengthchanger.from_end', 'From End')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChangePosition('start');
                      setActivePresetId(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                      changePosition === 'start'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <span>{t('listlengthchanger.from_start', 'From Start')}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="length-changer-join-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listlengthchanger.join_symbol', 'Output Join Symbol')}
                </label>
                <input
                  id="length-changer-join-input"
                  type="text"
                  value={joinSymbol}
                  onChange={(e) => {
                    setJoinSymbol(e.target.value);
                    setActivePresetId(null);
                  }}
                  placeholder=", "
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label htmlFor="fill-items-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                {t('listlengthchanger.fill_items', 'Filling Items (Cycled when expanding, separate lines for multiple)')}
              </label>
              <textarea
                id="fill-items-input"
                rows={2}
                value={fillItems}
                onChange={(e) => {
                  setFillItems(e.target.value);
                  setActivePresetId(null);
                }}
                placeholder="e.g. Unknown product or multiple items on newlines"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
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
              {t('listlengthchanger.stat_initial_count', 'Initial Items')}
            </span>
            <span className="text-xl font-black font-mono text-slate-800 dark:text-slate-100">{totalInputItems}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listlengthchanger.stat_target_length', 'Target Length')}
            </span>
            <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{targetLength}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listlengthchanger.stat_delta', 'Adjustment')}
            </span>
            <span
              className={`text-xl font-black font-mono ${
                itemsDelta > 0 ? 'text-emerald-600 dark:text-emerald-400' : itemsDelta < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {itemsDelta > 0 ? `+${itemsDelta} (padded)` : itemsDelta < 0 ? `${itemsDelta} (truncated)` : '0 (unchanged)'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listlengthchanger.stat_position', 'Pad / Cut Side')}
            </span>
            <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400 truncate block">
              {changePosition === 'end' ? t('listlengthchanger.from_end', 'From End') : t('listlengthchanger.from_start', 'From Start')}
            </span>
          </div>
        </div>
      )}

      {/* About / Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('listlengthchanger.about_title', 'About List Length Changer')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listlengthchanger.about_text', 'Inspired by onlinetools.com, the List Length Changer expands or shrinks a list to an exact target count N. When increasing length, it pads the list from the end or start by cycling through custom fill items. When decreasing length, it truncates excess items cleanly.')}
          </p>
        </div>
      </div>
    </div>
  );
}
