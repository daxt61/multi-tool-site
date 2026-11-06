import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { RotateCw, Copy, Check, RotateCcw, Download, Info, AlertCircle, Sparkles, Settings2, Hash, ArrowLeftRight, ArrowRight, ArrowLeft } from 'lucide-react';
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
  direction: 'forward' | 'backward';
  step: number;
  joinSymbol: string;
  deleteEmpty: boolean;
  trimItems: boolean;
}

const PRESETS: Preset[] = [
  {
    id: 'hungarian_alphabet',
    name: 'Hungarian Alphabet Half-Shift (Right by 22)',
    input: 'A, Á, B, C, Cs, D, Dz, Dzs, E, É, F, G, Gy, H, I, Í, J, K, L, Ly, M, N, Ny, O, Ó, Ö, Ő, P, Q, R, S, Sz, T, Ty, U, Ú, Ü, Ű, V, W, X, Y, Z, Zs',
    delimiterMode: 'char',
    delimiterValue: ',',
    direction: 'forward',
    step: 22,
    joinSymbol: ', ',
    deleteEmpty: true,
    trimItems: true,
  },
  {
    id: 'tree_species',
    name: 'Tree Species Cyclic Shift (Left by 4)',
    input: 'Beech Sycamore Spruce Basswood Maple Hornbeam Birch Chestnut Pine Arborvitae Larch Oak',
    delimiterMode: 'regex',
    delimiterValue: '\\s+',
    direction: 'backward',
    step: 4,
    joinSymbol: ' | ',
    deleteEmpty: true,
    trimItems: true,
  },
  {
    id: 'alt_codes',
    name: 'Alt Codes Keyboard Shift (Up by 5)',
    input: `☺ — Alt+1\n☻ — Alt+2\n♥ — Alt+3\n♦ — Alt+4\n♣ — Alt+5\n♠ — Alt+6\n• — Alt+7\n◘ — Alt+8\n○ — Alt+9\n◙ — Alt+10\n♂ — Alt+11\n♀ — Alt+12\n♪ — Alt+13\n♫ — Alt+14\n☼ — Alt+15\n► — Alt+16\n◄ — Alt+17\n↕ — Alt+18`,
    delimiterMode: 'char',
    delimiterValue: '\\n',
    direction: 'backward',
    step: 5,
    joinSymbol: '\\n',
    deleteEmpty: true,
    trimItems: true,
  },
  {
    id: 'days_of_week',
    name: 'Days of the Week Shift (Right by 3)',
    input: 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
    delimiterMode: 'char',
    delimiterValue: ',',
    direction: 'forward',
    step: 3,
    joinSymbol: ', ',
    deleteEmpty: true,
    trimItems: true,
  },
];

export function ListRotator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input ?? PRESETS[0].input);
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId ?? PRESETS[0].id);

  const [delimiterMode, setDelimiterMode] = useState<'char' | 'regex'>(initialData?.delimiterMode ?? PRESETS[0].delimiterMode);
  const [delimiterValue, setDelimiterValue] = useState<string>(initialData?.delimiterValue ?? PRESETS[0].delimiterValue);

  const [direction, setDirection] = useState<'forward' | 'backward'>(initialData?.direction ?? PRESETS[0].direction);
  const [step, setStep] = useState<number>(initialData?.step ?? PRESETS[0].step);
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
        direction,
        step,
        joinSymbol,
        deleteEmpty,
        trimItems,
      });
    }
  }, [input, activePresetId, delimiterMode, delimiterValue, direction, step, joinSymbol, deleteEmpty, trimItems, onStateChange]);

  const handleInputChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      toast.error(t('listrotator.error_max_length', `Input exceeds maximum length of ${MAX_LENGTH} characters`));
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
    setDirection(preset.direction);
    setStep(preset.step);
    setJoinSymbol(preset.joinSymbol);
    setDeleteEmpty(preset.deleteEmpty);
    setTrimItems(preset.trimItems);
    toast.success(t('listrotator.toast_preset_loaded', `Loaded preset: ${preset.name}`));

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleReset = () => {
    setInput('');
    setActivePresetId(null);
    setParseError(null);
    toast.success(t('listrotator.toast_cleared', 'Inputs cleared'));
    inputRef.current?.focus();
  };

  const unescapeString = (str: string) => {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  };

  const { parsedItems, rotatedItems, rotatedResult, totalItems, effectiveShift } = useMemo(() => {
    if (!input) {
      return { parsedItems: [], rotatedItems: [], rotatedResult: '', totalItems: 0, effectiveShift: 0 };
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

      const n = items.length;
      if (n === 0) {
        return { parsedItems: [], rotatedItems: [], rotatedResult: '', totalItems: 0, effectiveShift: 0 };
      }

      const validStep = Math.max(0, Math.floor(step) || 0);
      const modStep = validStep % n;

      let shifted: string[] = [];
      let actualShiftOffset = 0;

      if (direction === 'forward') {
        // Rotate forward (to the right / down): last `modStep` items move to the beginning
        actualShiftOffset = modStep;
        if (modStep === 0) {
          shifted = [...items];
        } else {
          shifted = [...items.slice(n - modStep), ...items.slice(0, n - modStep)];
        }
      } else {
        // Rotate backward (to the left / up): first `modStep` items move to the end
        actualShiftOffset = (n - modStep) % n;
        if (modStep === 0) {
          shifted = [...items];
        } else {
          shifted = [...items.slice(modStep), ...items.slice(0, modStep)];
        }
      }

      const effectiveJoin = unescapeString(joinSymbol);
      const outputText = shifted.join(effectiveJoin);

      return {
        parsedItems: items,
        rotatedItems: shifted,
        rotatedResult: outputText,
        totalItems: n,
        effectiveShift: actualShiftOffset,
      };
    } catch (err: any) {
      setParseError(err?.message || 'Invalid regular expression');
      return { parsedItems: [], rotatedItems: [], rotatedResult: '', totalItems: 0, effectiveShift: 0 };
    }
  }, [input, delimiterMode, delimiterValue, direction, step, joinSymbol, deleteEmpty, trimItems]);

  const handleCopy = useCallback(() => {
    if (!rotatedResult) return;
    navigator.clipboard.writeText(rotatedResult);
    setCopied(true);
    toast.success(t('listrotator.toast_copied', 'Rotated list copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [rotatedResult, t]);

  const handleDownload = (format: 'txt' | 'json' | 'csv') => {
    if (!rotatedResult) return;
    let content = rotatedResult;
    let mimeType = 'text/plain';
    let filename = `rotated-list.${format}`;

    if (format === 'json') {
      content = JSON.stringify(rotatedItems, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      content = rotatedItems.map((val) => `"${val.replace(/"/g, '""')}"`).join(',');
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('listrotator.toast_downloaded', `Exported ${format.toUpperCase()} file!`));
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
          <span>{t('listrotator.presets_title', 'Quick Presets')}</span>
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
            <label htmlFor="list-rotator-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listrotator.input_label', 'Input List')}
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
            id="list-rotator-input"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t('listrotator.placeholder_input', 'Enter or paste list items to rotate...')}
            className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200 resize-none shadow-inner"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Delimiter Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listrotator.delimiter_settings', 'Input Splitting Options')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listrotator.split_mode', 'Item Separator Mode')}
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
                    {t('listrotator.by_character', 'Character')}
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
                    {t('listrotator.by_regex', 'Regexp')}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="rotator-delimiter-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {delimiterMode === 'char' ? t('listrotator.char_delimiter', 'Character (e.g. , or \\n)') : t('listrotator.regex_delimiter', 'Regexp (e.g. \\s+ or /[,;]/)')}
                </label>
                <input
                  id="rotator-delimiter-input"
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
                <span>{t('listrotator.delete_empty', 'Delete Empty Items')}</span>
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
                <span>{t('listrotator.trim_items', 'Trim Whitespace')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Output & Rotation Controls */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="list-rotator-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              {t('common.result', 'Result')}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-[11px] font-bold">
                <button
                  onClick={() => handleDownload('txt')}
                  disabled={!rotatedResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export TXT"
                >
                  TXT
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  disabled={!rotatedResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export JSON"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={!rotatedResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export CSV"
                >
                  CSV
                </button>
              </div>

              <button
                onClick={handleCopy}
                disabled={!rotatedResult}
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
            id="list-rotator-output"
            value={rotatedResult}
            readOnly
            placeholder={t('listrotator.output_placeholder', 'Rotated list will appear here...')}
            className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none cursor-default shadow-inner"
          />

          {/* Rotation Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listrotator.rotation_settings', 'Rotation Direction & Output Delimiter')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listrotator.direction', 'Rotation Direction')}
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setDirection('forward');
                      setActivePresetId(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                      direction === 'forward'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t('listrotator.forward', 'Right / Down')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDirection('backward');
                      setActivePresetId(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 ${
                      direction === 'backward'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t('listrotator.backward', 'Left / Up')}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="rotation-step-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listrotator.step_count', 'Rotation Step (Positions)')}
                </label>
                <input
                  id="rotation-step-input"
                  type="number"
                  min="0"
                  max="100000"
                  value={step}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    setStep(isNaN(parsed) || parsed < 0 ? 0 : parsed);
                    setActivePresetId(null);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rotator-join-symbol-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listrotator.join_symbol', 'Output Join Symbol')}
                </label>
                <input
                  id="rotator-join-symbol-input"
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
              {t('listrotator.stat_total_items', 'Total Items')}
            </span>
            <span className="text-xl font-black font-mono text-slate-800 dark:text-slate-100">{totalItems}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listrotator.stat_rotation_step', 'Requested Step')}
            </span>
            <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{step}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listrotator.stat_effective_shift', 'Effective Shift (mod N)')}
            </span>
            <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {direction === 'forward' ? `+${step % totalItems}` : `-${step % totalItems}`}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listrotator.stat_new_head', 'New First Item')}
            </span>
            <span className="text-sm font-black font-mono text-amber-600 dark:text-amber-400 truncate block">
              {rotatedItems[0] || '—'}
            </span>
          </div>
        </div>
      )}

      {/* About / Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('listrotator.about_title', 'About List Rotator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('listrotator.about_text', 'Inspired by onlinetools.com, the List Rotator cyclically shifts elements in any list forward (right / down) or backward (left / up). It wraps elements circularly around the list boundaries without losing or duplicating items. You can customize character or regex delimiters, choose a distinct output join delimiter, trim whitespace, and export results.')}
          </p>
        </div>
      </div>
    </div>
  );
}
