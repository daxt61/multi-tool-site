import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Binary, Copy, Check, Trash2, Download,
  ArrowRightLeft, AlertCircle, RefreshCw, Settings2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

type ByteFormat = 'hex' | 'decimal' | 'binary' | 'octal';
type DelimiterType = 'space' | 'comma' | 'semicolon' | 'colon' | 'none' | 'custom';
type ConversionDirection = 'text-to-bytes' | 'bytes-to-text';

export function UTF8ToBytes({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [direction, setDirection] = useState<ConversionDirection>(initialData?.direction || 'text-to-bytes');
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [format, setFormat] = useState<ByteFormat>(initialData?.format || 'hex');
  const [delimiter, setDelimiter] = useState<DelimiterType>(initialData?.delimiter || 'space');
  const [customDelimiter, setCustomDelimiter] = useState(initialData?.customDelimiter || ' ');
  const [prefix, setPrefix] = useState<string>(initialData?.prefix || 'none');
  const [uppercase, setUppercase] = useState<boolean>(initialData?.uppercase ?? false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state to parent for shareable URL
  useEffect(() => {
    onStateChange?.({
      direction,
      input,
      output,
      format,
      delimiter,
      customDelimiter,
      prefix,
      uppercase
    });
  }, [direction, input, output, format, delimiter, customDelimiter, prefix, uppercase, onStateChange]);

  const getDelimiterString = useCallback(() => {
    switch (delimiter) {
      case 'space': return ' ';
      case 'comma': return ',';
      case 'semicolon': return ';';
      case 'colon': return ':';
      case 'none': return '';
      case 'custom': return customDelimiter;
      default: return ' ';
    }
  }, [delimiter, customDelimiter]);

  const getDelimiterRegex = useCallback(() => {
    switch (delimiter) {
      case 'space': return /\s+/;
      case 'comma': return /[\s,]+/;
      case 'semicolon': return /[\s;]+/;
      case 'colon': return /[\s:]+/;
      case 'none': return //;
      case 'custom':
        if (!customDelimiter) return /\s+/;
        // Escape regex special chars
        const escaped = customDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`[\\s${escaped}]+`);
      default: return /\s+/;
    }
  }, [delimiter, customDelimiter]);

  // Conversion: Text -> Bytes
  const handleTextToBytes = useCallback((textInput: string) => {
    if (!textInput) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      const encoder = new TextEncoder();
      const bytes = encoder.encode(textInput);
      const delim = getDelimiterString();

      const formattedBytes = Array.from(bytes).map((byte) => {
        let baseStr = '';
        let pref = '';

        if (format === 'hex') {
          baseStr = byte.toString(16);
          if (baseStr.length === 1) baseStr = '0' + baseStr;
          if (uppercase) baseStr = baseStr.toUpperCase();
          if (prefix === '0x') pref = '0x';
          if (prefix === '\\x') pref = '\\x';
        } else if (format === 'decimal') {
          baseStr = byte.toString(10);
        } else if (format === 'binary') {
          baseStr = byte.toString(2).padStart(8, '0');
          if (prefix === '0b') pref = '0b';
        } else if (format === 'octal') {
          baseStr = byte.toString(8).padStart(3, '0');
          if (prefix === '0') pref = '0';
          if (prefix === '\\') pref = '\\';
        }

        return pref + baseStr;
      });

      setOutput(formattedBytes.join(delim));
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Error converting text to bytes');
    }
  }, [format, delimiter, customDelimiter, prefix, uppercase, getDelimiterString]);

  // Conversion: Bytes -> Text
  const handleBytesToText = useCallback((bytesInput: string) => {
    if (!bytesInput.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      let rawItems: string[] = [];
      const delim = delimiter;

      if (delim === 'none') {
        // If no delimiter, we have to parse chunks depending on format size
        const cleanInput = bytesInput.replace(/\s/g, '');
        let chunkSize = 2; // Hex standard is 2 characters
        if (format === 'binary') chunkSize = 8;
        if (format === 'octal') chunkSize = 3;
        if (format === 'decimal') {
          // Decimal without delimiters is ambiguous (e.g. 195169 is 195 169 or 19 51 69?)
          // We will fallback to splitting by characters of size 3, or throw an error.
          chunkSize = 3;
        }

        // Clean prefixes if present before chunking
        let temp = cleanInput;
        const prefixesToRemove = ['0x', '\\x', '0b', '\\'];
        prefixesToRemove.forEach(p => {
          if (temp.startsWith(p)) {
            // Remove all occurrences
            const regex = new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            temp = temp.replace(regex, '');
          }
        });

        for (let i = 0; i < temp.length; i += chunkSize) {
          rawItems.push(temp.substring(i, i + chunkSize));
        }
      } else {
        const regex = getDelimiterRegex();
        if (regex) {
          rawItems = bytesInput.split(regex).filter(item => item.trim() !== '');
        } else {
          rawItems = [bytesInput];
        }
      }

      const byteValues: number[] = [];

      for (let item of rawItems) {
        let cleanItem = item.trim();
        if (!cleanItem) continue;

        // Strip prefix if any
        const prefixesToRemove = ['0x', '\\x', '0b', '\\'];
        prefixesToRemove.forEach(p => {
          if (cleanItem.startsWith(p)) {
            cleanItem = cleanItem.substring(p.length);
          }
        });
        // Special case: octal starting with '0'
        if (format === 'octal' && cleanItem.startsWith('0') && cleanItem.length > 1) {
          cleanItem = cleanItem.substring(1);
        }

        let val = NaN;
        if (format === 'hex') {
          val = parseInt(cleanItem, 16);
        } else if (format === 'decimal') {
          val = parseInt(cleanItem, 10);
        } else if (format === 'binary') {
          val = parseInt(cleanItem, 2);
        } else if (format === 'octal') {
          val = parseInt(cleanItem, 8);
        }

        if (isNaN(val) || val < 0 || val > 255) {
          throw new Error(`Invalid byte value: "${item}"`);
        }
        byteValues.push(val);
      }

      if (byteValues.length === 0) {
        setOutput('');
        setError(null);
        return;
      }

      const uint8Array = new Uint8Array(byteValues);
      const decoder = new TextDecoder('utf-8', { fatal: true });
      const decodedText = decoder.decode(uint8Array);

      setOutput(decodedText);
      setError(null);
    } catch (e: any) {
      // Fallback with non-fatal decoder if the user wants partial output,
      // but show warning.
      try {
        let rawItems: string[] = [];
        const regex = getDelimiterRegex();
        if (regex && delimiter !== 'none') {
          rawItems = bytesInput.split(regex).filter(item => item.trim() !== '');
        } else {
          // simple split
          rawItems = bytesInput.split(/\s+/).filter(item => item.trim() !== '');
        }

        const byteValues: number[] = [];
        for (let item of rawItems) {
          let cleanItem = item.trim();
          prefixesToRemove.forEach(p => {
            if (cleanItem.startsWith(p)) cleanItem = cleanItem.substring(p.length);
          });
          let val = parseInt(cleanItem, format === 'hex' ? 16 : format === 'binary' ? 2 : format === 'octal' ? 8 : 10);
          if (!isNaN(val) && val >= 0 && val <= 255) {
            byteValues.push(val);
          }
        }
        const uint8Array = new Uint8Array(byteValues);
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const decodedText = decoder.decode(uint8Array);
        setOutput(decodedText);
      } catch {}
      setError(e.message || 'Error decoding bytes to UTF-8');
    }
  }, [format, delimiter, getDelimiterRegex]);

  const prefixesToRemove = ['0x', '\\x', '0b', '\\'];

  // Handle run conversion
  useEffect(() => {
    if (direction === 'text-to-bytes') {
      handleTextToBytes(input);
    } else {
      handleBytesToText(input);
    }
  }, [input, direction, format, delimiter, customDelimiter, prefix, uppercase, handleTextToBytes, handleBytesToText]);

  const handleSwap = () => {
    setDirection(prev => prev === 'text-to-bytes' ? 'bytes-to-text' : 'text-to-bytes');
    setInput(output);
    setOutput(input);
    setError(null);
  };

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    toast.success(t('common.clear'));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `utf8-bytes-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [output]);

  // Safe global key handler
  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      const { handleClear, handleCopy } = handlersRef.current;

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Direction & Options Bar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => {
                if (direction !== 'text-to-bytes') handleSwap();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${direction === 'text-to-bytes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t('utf8bytes.direction_encode', 'Text to Bytes')}
            </button>
            <button
              onClick={() => {
                if (direction !== 'bytes-to-text') handleSwap();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${direction === 'bytes-to-text' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t('utf8bytes.direction_decode', 'Bytes to Text')}
            </button>
          </div>

          <button
            onClick={handleSwap}
            className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            title={t('common.swap')}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span className="text-xs font-bold sm:hidden">{t('common.swap')}</span>
          </button>
        </div>

        {/* Configurations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow lg:flex-grow-0 lg:max-w-xl">
          {/* Format Select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="format-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t('utf8bytes.format', 'Byte Format')}
            </label>
            <select
              id="format-select"
              value={format}
              onChange={(e) => {
                setFormat(e.target.value as ByteFormat);
                setPrefix('none'); // Reset prefix to match format options
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="hex">Hexadecimal (Base 16)</option>
              <option value="decimal">Decimal (Base 10)</option>
              <option value="binary">Binary (Base 2)</option>
              <option value="octal">Octal (Base 8)</option>
            </select>
          </div>

          {/* Delimiter Select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="delimiter-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t('textcolumnsaligner.delimiter_type', 'Delimiter')}
            </label>
            <select
              id="delimiter-select"
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value as DelimiterType)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="space">{t('texthex.space', 'Space')}</option>
              <option value="comma">{t('texthex.comma', 'Comma')}</option>
              <option value="semicolon">Semicolon (;)</option>
              <option value="colon">Colon (:)</option>
              <option value="none">{t('common.na', 'None')}</option>
              <option value="custom">{t('listseparatorchanger.separator_custom', 'Custom')}</option>
            </select>
          </div>

          {/* Prefix Selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prefix-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t('texthex.prefix', 'Prefix')}
            </label>
            <select
              id="prefix-select"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="none">{t('common.na', 'None')}</option>
              {format === 'hex' && (
                <>
                  <option value="0x">0x</option>
                  <option value="\x">\x</option>
                </>
              )}
              {format === 'binary' && <option value="0b">0b</option>}
              {format === 'octal' && (
                <>
                  <option value="0">0</option>
                  <option value="\">\</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Conditional settings fields */}
      {(delimiter === 'custom' || format === 'hex') && (
        <div className="flex flex-wrap gap-6 p-6 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-slate-800/80">
          {delimiter === 'custom' && (
            <div className="flex items-center gap-3">
              <label htmlFor="custom-delim-input" className="text-xs font-bold text-slate-500">
                {t('textcolumnsaligner.custom_delim', 'Custom Delimiter')}:
              </label>
              <input
                id="custom-delim-input"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={customDelimiter}
                onChange={(e) => setCustomDelimiter(e.target.value)}
                className="w-24 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
              />
            </div>
          )}

          {format === 'hex' && (
            <div className="flex items-center gap-3">
              <input
                id="uppercase-checkbox"
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/20 border-slate-300 dark:border-slate-700"
              />
              <label htmlFor="uppercase-checkbox" className="text-xs font-bold text-slate-500 cursor-pointer select-none">
                {t('hexdump.uppercase', 'Uppercase Hex')}
              </label>
            </div>
          )}
        </div>
      )}

      {/* Main Conversion Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Field */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <label htmlFor="utf8-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {direction === 'text-to-bytes'
                  ? t('base64.clear_text', 'UTF-8 Text')
                  : t('common.input', 'Byte Sequence')}
              </label>
            </div>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold px-3 py-1.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              title={`${t('common.clear')} (Esc)`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('common.clear')}</span>
              <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
            </button>
          </div>
          <textarea
            id="utf8-input"
            ref={inputRef}
            autoComplete="off"
            spellCheck={false}
            value={input}
            onChange={(e) => {
              if (e.target.value.length <= MAX_LENGTH) {
                setInput(e.target.value);
                setError(null);
              } else {
                setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
              }
            }}
            placeholder={
              direction === 'text-to-bytes'
                ? t('caseconverter.placeholder', 'Type or paste your text here...')
                : t('hexdump.placeholder', 'Enter byte sequence to decode...')
            }
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        {/* Output Field */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-emerald-500" />
              <label htmlFor="utf8-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {direction === 'text-to-bytes'
                  ? t('common.output', 'Byte Sequence')
                  : t('base64.clear_text', 'UTF-8 Text')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('common.download')}</span>
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50'
                }`}
                title={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t('common.copied') : t('common.copy')}</span>
                {!copied && <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-slate-300 dark:border-slate-600 bg-slate-200/50">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="utf8-output"
            value={output}
            readOnly
            placeholder={t('caseconverter.result_placeholder', 'The result will appear here...')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
          />
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Binary className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('utf8bytes.about_title', 'About UTF-8 to Bytes Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('utf8bytes.about_text', 'UTF-8 is a variable-width character encoding used for electronic communication. It can represent every character in the Unicode character set, including emojis and international characters. This tool lets you convert any UTF-8 string into its raw byte representation in Hexadecimal, Decimal, Binary, or Octal format, or perform the reverse transformation. No data is sent to any server; all conversions are completed completely in your browser.')}
          </p>
        </div>
      </div>
    </div>
  );
}
