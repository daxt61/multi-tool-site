import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  ListOrdered,
  Copy,
  Check,
  RotateCw,
  Download,
  Settings2,
  Info,
  Hash,
  Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_COUNT = 10000;
const MAX_OUTPUT_LENGTH = 100000;

type DelimiterType = 'newline' | 'comma' | 'comma_space' | 'tab' | 'space' | 'custom';
type NumberBase = 'decimal' | 'hex' | 'binary' | 'octal' | 'roman';
type ThousandsSeparator = 'none' | 'comma' | 'dot' | 'space' | 'underscore';

// Roman Numeral Helper
function toRoman(num: number): string {
  if (num <= 0 || num > 3999) return num.toString();
  const lookup: Record<string, number> = {
    M: 1000, CM: 900, D: 500, CD: 400,
    C: 100, XC: 90, L: 50, XL: 40,
    X: 10, IX: 9, V: 5, IV: 4, I: 1,
  };
  let roman = '';
  let n = num;
  for (const i in lookup) {
    while (n >= lookup[i]) {
      roman += i;
      n -= lookup[i];
    }
  }
  return roman;
}

// Format thousands separator
function formatThousands(numStr: string, sep: ThousandsSeparator): string {
  if (sep === 'none') return numStr;
  const sepChar = sep === 'comma' ? ',' : sep === 'dot' ? '.' : sep === 'space' ? ' ' : '_';
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, sepChar);
}

export function EnumerateIntegers({
  initialData,
  onStateChange,
}: {
  initialData?: any;
  onStateChange?: (state: any) => void;
}) {
  const { t } = useTranslation();

  const primaryInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [start, setStart] = useState<number>(initialData?.start ?? 1);
  const [count, setCount] = useState<number>(initialData?.count ?? 20);
  const [step, setStep] = useState<number>(initialData?.step ?? 1);
  const [padWidth, setPadWidth] = useState<number>(initialData?.padWidth ?? 0);
  const [prefix, setPrefix] = useState<string>(initialData?.prefix || '');
  const [suffix, setSuffix] = useState<string>(initialData?.suffix || '');
  const [delimiterType, setDelimiterType] = useState<DelimiterType>(initialData?.delimiterType || 'newline');
  const [customDelimiter, setCustomDelimiter] = useState<string>(initialData?.customDelimiter || ', ');
  const [base, setBase] = useState<NumberBase>(initialData?.base || 'decimal');
  const [thousandsSep, setThousandsSep] = useState<ThousandsSeparator>(initialData?.thousandsSep || 'none');

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({
      start,
      count,
      step,
      padWidth,
      prefix,
      suffix,
      delimiterType,
      customDelimiter,
      base,
      thousandsSep,
    });
  }, [
    start,
    count,
    step,
    padWidth,
    prefix,
    suffix,
    delimiterType,
    customDelimiter,
    base,
    thousandsSep,
    onStateChange,
  ]);

  // Actual delimiter character
  const actualDelimiter = useMemo(() => {
    switch (delimiterType) {
      case 'newline': return '\n';
      case 'comma': return ',';
      case 'comma_space': return ', ';
      case 'tab': return '\t';
      case 'space': return ' ';
      case 'custom': return customDelimiter;
      default: return '\n';
    }
  }, [delimiterType, customDelimiter]);

  // Generated integers & formatted output string
  const { output, totalItems } = useMemo(() => {
    const validCount = Math.min(Math.max(1, count), MAX_COUNT);
    const items: string[] = [];

    let currentVal = start;
    for (let i = 0; i < validCount; i++) {
      let formattedVal = '';

      if (base === 'hex') {
        const hexStr = Math.abs(currentVal).toString(16).toUpperCase();
        const paddedHex = padWidth > 0 ? hexStr.padStart(padWidth, '0') : hexStr;
        formattedVal = (currentVal < 0 ? '-0x' : '0x') + paddedHex;
      } else if (base === 'binary') {
        const binStr = Math.abs(currentVal).toString(2);
        const paddedBin = padWidth > 0 ? binStr.padStart(padWidth, '0') : binStr;
        formattedVal = (currentVal < 0 ? '-0b' : '0b') + paddedBin;
      } else if (base === 'octal') {
        const octStr = Math.abs(currentVal).toString(8);
        const paddedOct = padWidth > 0 ? octStr.padStart(padWidth, '0') : octStr;
        formattedVal = (currentVal < 0 ? '-0o' : '0o') + paddedOct;
      } else if (base === 'roman') {
        formattedVal = toRoman(currentVal);
      } else {
        // Decimal
        const absValStr = Math.abs(currentVal).toString();
        const paddedVal = padWidth > 0 ? absValStr.padStart(padWidth, '0') : absValStr;
        const withThousands = formatThousands(paddedVal, thousandsSep);
        formattedVal = (currentVal < 0 ? '-' : '') + withThousands;
      }

      items.push(`${prefix}${formattedVal}${suffix}`);
      currentVal += step;
    }

    const fullStr = items.join(actualDelimiter);
    const truncatedStr = fullStr.length > MAX_OUTPUT_LENGTH ? fullStr.slice(0, MAX_OUTPUT_LENGTH) : fullStr;

    return {
      output: truncatedStr,
      totalItems: items.length,
    };
  }, [start, count, step, padWidth, prefix, suffix, base, thousandsSep, actualDelimiter]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('enumerateintegers.copied_toast', 'Numbered list copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integers-${start}-to-${start + (count - 1) * step}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('enumerateintegers.downloaded_toast', 'Exported integers file!'));
  }, [output, start, count, step, t]);

  const handleReset = useCallback(() => {
    setStart(1);
    setCount(20);
    setStep(1);
    setPadWidth(0);
    setPrefix('');
    setSuffix('');
    setDelimiterType('newline');
    setCustomDelimiter(', ');
    setBase('decimal');
    setThousandsSep('none');
    toast.success(t('common.reset'));
    primaryInputRef.current?.focus();
  }, [t]);

  // Handlers ref pattern for keydown listeners
  const handlersRef = useRef({
    handleCopy,
    handleReset,
  });

  useEffect(() => {
    handlersRef.current = {
      handleCopy,
      handleReset,
    };
  }, [handleCopy, handleReset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;

      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c' && !isInput) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Presets
  const applyPreset = (presetKey: string) => {
    if (presetKey === 'sequential_ids') {
      setStart(1);
      setCount(50);
      setStep(1);
      setPadWidth(0);
      setPrefix('id_');
      setSuffix('');
      setDelimiterType('newline');
      setBase('decimal');
      setThousandsSep('none');
      toast.success(t('enumerateintegers.preset_applied', 'Preset "Sequential IDs" applied'));
    } else if (presetKey === 'padded_items') {
      setStart(1);
      setCount(100);
      setStep(1);
      setPadWidth(3);
      setPrefix('item_');
      setSuffix('');
      setDelimiterType('comma_space');
      setBase('decimal');
      setThousandsSep('none');
      toast.success(t('enumerateintegers.preset_applied', 'Preset "Zero-Padded Items" applied'));
    } else if (presetKey === 'hex_addresses') {
      setStart(0);
      setCount(32);
      setStep(4);
      setPadWidth(4);
      setPrefix('');
      setSuffix('');
      setDelimiterType('newline');
      setBase('hex');
      setThousandsSep('none');
      toast.success(t('enumerateintegers.preset_applied', 'Preset "Hexadecimal Addresses" applied'));
    } else if (presetKey === 'roman_chapters') {
      setStart(1);
      setCount(20);
      setStep(1);
      setPadWidth(0);
      setPrefix('Chapter ');
      setSuffix('');
      setDelimiterType('newline');
      setBase('roman');
      setThousandsSep('none');
      toast.success(t('enumerateintegers.preset_applied', 'Preset "Roman Numeral Chapters" applied'));
    } else if (presetKey === 'countdown') {
      setStart(10);
      setCount(10);
      setStep(-1);
      setPadWidth(0);
      setPrefix('');
      setSuffix('...');
      setDelimiterType('space');
      setBase('decimal');
      setThousandsSep('none');
      toast.success(t('enumerateintegers.preset_applied', 'Preset "Countdown List" applied'));
    }
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            {t('enumerateintegers.presets_title', 'Quick Start Presets')}
          </div>
          <div className="flex items-center gap-2">
            <Kbd modifier="ctrl">C</Kbd>
            <span className="text-xs text-slate-400">{t('common.copy')}</span>
            <Kbd modifier={null}>Esc</Kbd>
            <span className="text-xs text-slate-400">{t('common.reset')}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'sequential_ids', label: t('enumerateintegers.preset_sequential_ids', 'Sequential IDs (id_1 to id_50)') },
            { id: 'padded_items', label: t('enumerateintegers.preset_padded_items', 'Zero-Padded Items (item_001 to item_100)') },
            { id: 'hex_addresses', label: t('enumerateintegers.preset_hex_addresses', 'Hex Addresses (0x0000, 0x0004...)') },
            { id: 'roman_chapters', label: t('enumerateintegers.preset_roman_chapters', 'Roman Chapters (Chapter I to XX)') },
            { id: 'countdown', label: t('enumerateintegers.preset_countdown', 'Countdown (10 9 8... 1)') },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-500">
                <Settings2 className="w-4 h-4" />
                <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">
                  {t('enumerateintegers.config_title', 'Generator Settings')}
                </h3>
              </div>
              <button
                onClick={handleReset}
                className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                title={t('common.reset')}
              >
                <RotateCw className="w-3.5 h-3.5" />
                {t('common.reset')}
              </button>
            </div>

            {/* Range Parameters */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="enum-start" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t('enumerateintegers.start', 'Start')}
                </label>
                <input
                  id="enum-start"
                  ref={primaryInputRef}
                  type="number"
                  value={start}
                  onChange={(e) => setStart(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="enum-count" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t('enumerateintegers.count', 'Count')}
                </label>
                <input
                  id="enum-count"
                  type="number"
                  min="1"
                  max={MAX_COUNT}
                  value={count}
                  onChange={(e) => setCount(Math.min(MAX_COUNT, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="enum-step" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t('enumerateintegers.step', 'Step')}
                </label>
                <input
                  id="enum-step"
                  type="number"
                  value={step}
                  onChange={(e) => setStep(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Base & Formatting */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="enum-base" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t('enumerateintegers.base', 'Number Base')}
                </label>
                <select
                  id="enum-base"
                  value={base}
                  onChange={(e) => setBase(e.target.value as NumberBase)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="decimal">Decimal (1, 2, 3)</option>
                  <option value="hex">Hexadecimal (0x01)</option>
                  <option value="binary">Binary (0b0001)</option>
                  <option value="octal">Octal (0o01)</option>
                  <option value="roman">Roman (I, II, III)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="enum-pad" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t('enumerateintegers.pad_width', 'Zero Padding Width')}
                </label>
                <input
                  id="enum-pad"
                  type="number"
                  min="0"
                  max="20"
                  value={padWidth}
                  onChange={(e) => setPadWidth(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0 (None)"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Prefix & Suffix */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="enum-prefix" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t('enumerateintegers.prefix', 'Item Prefix')}
                </label>
                <input
                  id="enum-prefix"
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="Ex: id_"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="enum-suffix" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t('enumerateintegers.suffix', 'Item Suffix')}
                </label>
                <input
                  id="enum-suffix"
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="Ex: .png"
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Delimiter & Thousands Separator */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="enum-delimiter" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {t('enumerateintegers.delimiter', 'Item Separator')}
                </label>
                <select
                  id="enum-delimiter"
                  value={delimiterType}
                  onChange={(e) => setDelimiterType(e.target.value as DelimiterType)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="newline">Newlines (\n)</option>
                  <option value="comma_space">Comma & Space (, )</option>
                  <option value="comma">Comma (,)</option>
                  <option value="space">Space ( )</option>
                  <option value="tab">Tab (\t)</option>
                  <option value="custom">Custom String</option>
                </select>
              </div>

              {delimiterType === 'custom' ? (
                <div className="space-y-1.5">
                  <label htmlFor="enum-custom-delimiter" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t('enumerateintegers.custom_delimiter', 'Custom Delimiter')}
                  </label>
                  <input
                    id="enum-custom-delimiter"
                    type="text"
                    value={customDelimiter}
                    onChange={(e) => setCustomDelimiter(e.target.value)}
                    placeholder="Ex: | "
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label htmlFor="enum-thousands" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t('enumerateintegers.thousands', 'Thousands Separator')}
                  </label>
                  <select
                    id="enum-thousands"
                    value={thousandsSep}
                    disabled={base !== 'decimal'}
                    onChange={(e) => setThousandsSep(e.target.value as ThousandsSeparator)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  >
                    <option value="none">None (1000)</option>
                    <option value="comma">Comma (1,000)</option>
                    <option value="dot">Dot (1.000)</option>
                    <option value="space">Space (1 000)</option>
                    <option value="underscore">Underscore (1_000)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Hash className="w-4 h-4 text-indigo-500" />
              {t('common.output', 'Output')}
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full ml-1">
                {totalItems} {t('enumerateintegers.items', 'items')}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                title={t('common.download')}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('common.download')}</span>
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="enum-output" className="sr-only">
              {t('enumerateintegers.output_label', 'Generated integer list')}
            </label>
            <textarea
              id="enum-output"
              value={output}
              readOnly
              placeholder={t('enumerateintegers.output_placeholder', 'Generated sequence will appear here...')}
              className="w-full h-[460px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none font-mono text-sm leading-relaxed dark:text-slate-200 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <ListOrdered className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">
            {t('enumerateintegers.about_title', 'About Enumerate Integers')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'enumerateintegers.about_text',
              'Quickly generate ordered integer series and custom numbered lists inspired by onlinetools.com. Configure start, count, step intervals, zero-padding width, prefixes, suffixes, delimiters, base representations (Hex, Binary, Octal, Roman), and thousands separators.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
