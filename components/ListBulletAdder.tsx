import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { List, Copy, Check, RotateCcw, Download, Info, AlertCircle, Sparkles, Settings2, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export type BulletGlyph =
  | '•' // Disc
  | '‣' // Triangular
  | '◦' // White circle
  | '✓' // Check mark
  | '★' // Star
  | '◆' // Black diamond
  | '-' // Dash / hyphen
  | '➢' // Arrow
  | '👉' // Pointing finger
  | 'custom';

interface Preset {
  id: string;
  name: string;
  input: string;
  delimiterMode: 'char' | 'regex';
  delimiterValue: string;
  joinSeparator: string;
  bulletGlyph: BulletGlyph;
  customBullet: string;
  skipEmpty: boolean;
  trimItems: boolean;
}

const PRESETS: Preset[] = [
  {
    id: 'workshop_agenda',
    name: 'Workshop Checklist (• Bullet)',
    input: 'Establish goals\nPut together a budget\nSelect a date\nChoose the event format\nResearch speakers\nResearch locations\nResearch vendors\nStart sponsor search\nFinalize speakers\nOrganize financials',
    delimiterMode: 'char',
    delimiterValue: '\\n',
    joinSeparator: '\\n',
    bulletGlyph: '•',
    customBullet: '•',
    skipEmpty: true,
    trimItems: true,
  },
  {
    id: 'arrow_words',
    name: 'Top Lighted Arrow (➢)',
    input: 'Cow Egg Bag Fox Nut Box Bee Ice Jug Cat Jam Jar Owl Bun Mug',
    delimiterMode: 'regex',
    delimiterValue: '\\s+',
    joinSeparator: '\\t',
    bulletGlyph: '➢',
    customBullet: '➢',
    skipEmpty: true,
    trimItems: true,
  },
  {
    id: 'music_notes',
    name: 'Music Genres (Custom ♫)',
    input: 'disco, blues , electro, rapcore, , pop rock, reggae, rock, rap, , jazz, lounge, pop-punk',
    delimiterMode: 'regex',
    delimiterValue: '\\s*,\\s*',
    joinSeparator: '\\n',
    bulletGlyph: 'custom',
    customBullet: '♫',
    skipEmpty: true,
    trimItems: true,
  },
  {
    id: 'checkmarks_tasks',
    name: 'Completed Sprints (✓ Check)',
    input: 'Database schema migration\nOAuth2 Authentication endpoints\nStripe webhook listener\nRole-based access middleware\nAutomated E2E smoke tests',
    delimiterMode: 'char',
    delimiterValue: '\\n',
    joinSeparator: '\\n',
    bulletGlyph: '✓',
    customBullet: '✓',
    skipEmpty: true,
    trimItems: true,
  },
  {
    id: 'diamond_features',
    name: 'Product Highlights (◆ Diamond)',
    input: 'End-to-End Encryption | Realtime Sync | 99.99% SLA Uptime | Automated Backups | Zero Third-party Trackers',
    delimiterMode: 'char',
    delimiterValue: ' | ',
    joinSeparator: '\\n',
    bulletGlyph: '◆',
    customBullet: '◆',
    skipEmpty: true,
    trimItems: true,
  },
];

function unescapeString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

export function ListBulletAdder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input ?? PRESETS[0].input);
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId ?? PRESETS[0].id);

  const [delimiterMode, setDelimiterMode] = useState<'char' | 'regex'>(initialData?.delimiterMode ?? PRESETS[0].delimiterMode);
  const [delimiterValue, setDelimiterValue] = useState<string>(initialData?.delimiterValue ?? PRESETS[0].delimiterValue);
  const [joinSeparator, setJoinSeparator] = useState<string>(initialData?.joinSeparator ?? PRESETS[0].joinSeparator);

  const [bulletGlyph, setBulletGlyph] = useState<BulletGlyph>(initialData?.bulletGlyph ?? PRESETS[0].bulletGlyph);
  const [customBullet, setCustomBullet] = useState<string>(initialData?.customBullet ?? PRESETS[0].customBullet);

  const [skipEmpty, setSkipEmpty] = useState<boolean>(initialData?.skipEmpty ?? PRESETS[0].skipEmpty);
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
        bulletGlyph,
        customBullet,
        skipEmpty,
        trimItems,
      });
    }
  }, [
    input,
    activePresetId,
    delimiterMode,
    delimiterValue,
    joinSeparator,
    bulletGlyph,
    customBullet,
    skipEmpty,
    trimItems,
    onStateChange,
  ]);

  const handleInputChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      toast.error(t('listbullet.error_max_length', `Input exceeds maximum length of ${MAX_LENGTH} characters`));
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
    setBulletGlyph(preset.bulletGlyph);
    setCustomBullet(preset.customBullet);
    setSkipEmpty(preset.skipEmpty);
    setTrimItems(preset.trimItems);
    toast.success(t('listbullet.toast_preset_loaded', `Loaded preset: ${preset.name}`));

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleReset = () => {
    setInput('');
    setActivePresetId(null);
    setParseError(null);
    toast.success(t('listbullet.toast_cleared', 'Inputs cleared'));
    inputRef.current?.focus();
  };

  const effectiveBulletSymbol = useMemo(() => {
    if (bulletGlyph === 'custom') {
      return customBullet;
    }
    return bulletGlyph;
  }, [bulletGlyph, customBullet]);

  const { parsedItems, bulletedResult, totalItems } = useMemo(() => {
    if (!input) {
      return { parsedItems: [], bulletedResult: '', totalItems: 0 };
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

      const symbol = effectiveBulletSymbol ? `${effectiveBulletSymbol} ` : '';
      const bulleted = items.map((item) => `${symbol}${item}`);
      const effectiveJoin = unescapeString(joinSeparator);
      const outputText = bulleted.join(effectiveJoin);

      return {
        parsedItems: items,
        bulletedResult: outputText,
        totalItems: items.length,
      };
    } catch (err: any) {
      setParseError(err?.message || 'Invalid regular expression');
      return { parsedItems: [], bulletedResult: '', totalItems: 0 };
    }
  }, [input, delimiterMode, delimiterValue, joinSeparator, effectiveBulletSymbol, skipEmpty, trimItems]);

  const handleCopy = useCallback(() => {
    if (!bulletedResult) return;
    navigator.clipboard.writeText(bulletedResult);
    setCopied(true);
    toast.success(t('listbullet.toast_copied', 'Bulleted list copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [bulletedResult, t]);

  const handleDownload = (format: 'txt' | 'json' | 'csv') => {
    if (!bulletedResult) return;
    let content = bulletedResult;
    let mimeType = 'text/plain';
    const filename = `bulleted-list.${format}`;

    if (format === 'json') {
      const rows = bulletedResult.split(unescapeString(joinSeparator));
      content = JSON.stringify(rows, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      const rows = bulletedResult.split(unescapeString(joinSeparator));
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
    toast.success(t('listbullet.toast_downloaded', `Exported ${format.toUpperCase()} file!`));
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
          <span>{t('listbullet.presets_title', 'Quick Presets')}</span>
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
            <label htmlFor="list-bullet-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <List className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listbullet.input_label', 'Input List')}
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
            id="list-bullet-input"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={t('listbullet.placeholder_input', 'Enter or paste list items here...')}
            className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500/20 dark:text-slate-200 resize-none shadow-inner"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Delimiter Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listbullet.delimiter_settings', 'Input Separator Options')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listbullet.split_mode', 'Item Separator Mode')}
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
                    {t('listbullet.by_character', 'Character')}
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
                    {t('listbullet.by_regex', 'Regexp')}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="delimiter-value-input-bullet" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {delimiterMode === 'char'
                    ? t('listbullet.char_delimiter', 'Input Separator (\\n, comma, etc.)')
                    : t('listbullet.regex_delimiter', 'Regexp (e.g. \\s+ or /[,;]/)')}
                </label>
                <input
                  id="delimiter-value-input-bullet"
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
                <span>{t('listbullet.skip_empty', 'Skip Empty Items')}</span>
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
                <span>{t('listbullet.trim_items', 'Trim Spaces Around Items')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Output & Bullet Options */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="list-bullet-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              {t('common.result', 'Result')}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-[11px] font-bold">
                <button
                  onClick={() => handleDownload('txt')}
                  disabled={!bulletedResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export TXT"
                >
                  TXT
                </button>
                <button
                  onClick={() => handleDownload('json')}
                  disabled={!bulletedResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export JSON"
                >
                  JSON
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={!bulletedResult}
                  className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition-all"
                  title="Export CSV"
                >
                  CSV
                </button>
              </div>

              <button
                onClick={handleCopy}
                disabled={!bulletedResult}
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
            id="list-bullet-output"
            value={bulletedResult}
            readOnly
            placeholder={t('listbullet.output_placeholder', 'Bulleted list will appear here...')}
            className="w-full h-56 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-xs sm:text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none cursor-default shadow-inner"
          />

          {/* Bullet Formatting Controls Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('listbullet.bullet_settings', 'Bullet Glyph & Formatting')}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="bullet-glyph-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listbullet.glyph_label', 'Bullet Style')}
                </label>
                <select
                  id="bullet-glyph-select"
                  value={bulletGlyph}
                  onChange={(e) => {
                    setBulletGlyph(e.target.value as BulletGlyph);
                    setActivePresetId(null);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="•">• Round Bullet (Disc)</option>
                  <option value="‣">‣ Triangular Bullet</option>
                  <option value="◦">◦ White Circle Bullet</option>
                  <option value="✓">✓ Check Mark Bullet</option>
                  <option value="★">★ Star Bullet</option>
                  <option value="◆">◆ Diamond Bullet</option>
                  <option value="-">- Hyphen / Dash</option>
                  <option value="➢">➢ Top Lighted Arrow</option>
                  <option value="👉">👉 Pointing Emoji</option>
                  <option value="custom">{t('listbullet.custom_bullet', 'Custom Symbol / Emoji')}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="join-separator-input-bullet" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listbullet.join_separator', 'Join Character')}
                </label>
                <input
                  id="join-separator-input-bullet"
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

            {bulletGlyph === 'custom' && (
              <div className="space-y-1 pt-1">
                <label htmlFor="custom-bullet-input" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('listbullet.custom_bullet_label', 'Custom Bullet Symbol or Emoji (e.g. ♫, 🚀, ▪, ✦)')}
                </label>
                <input
                  id="custom-bullet-input"
                  type="text"
                  value={customBullet}
                  onChange={(e) => {
                    setCustomBullet(e.target.value);
                    setActivePresetId(null);
                  }}
                  placeholder="•"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            )}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listbullet.stat_total_items', 'Total Items')}
            </span>
            <span className="text-xl font-black font-mono text-slate-800 dark:text-slate-100">{totalItems}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listbullet.stat_bullet_glyph', 'Active Bullet')}
            </span>
            <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
              {effectiveBulletSymbol || '(None)'}
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
              {t('listbullet.stat_delimiter', 'Input Separator')}
            </span>
            <span className="text-sm font-black uppercase font-mono text-emerald-600 dark:text-emerald-400">
              {delimiterMode === 'char' ? `Char (${delimiterValue || 'empty'})` : `Regexp (${delimiterValue})`}
            </span>
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('listbullet.about_title', 'About List Bullet Adder')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'listbullet.about_text',
              'Inspired by onlinetools.com, the List Bullet Adder prepends customizable bullet markers to any list of items. Choose from classic round discs, triangular arrows, checkmarks, stars, or custom emojis. Control delimiters, ignore empty lines, and export cleanly.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
