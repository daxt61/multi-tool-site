import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Binary,
  Copy,
  Check,
  RotateCcw,
  Download,
  Settings2,
  Sparkles,
  ArrowRightLeft,
  FileCode,
  Info,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export type ConverterMode = 'encode' | 'decode';
export type NetstringFormat = 'length-prefixed' | 'hex-bytes';

export interface NetstringPreset {
  id: string;
  nameKey: string;
  mode: ConverterMode;
  input: string;
  format: NetstringFormat;
  encodeWordsSeparately: boolean;
  multiLine: boolean;
  doubleProtection: boolean;
  skipRepeatedSpaces: boolean;
  beautifyNewlines: boolean;
  beautifySpaces: boolean;
  beautifyTabs: boolean;
  separateWordsWithSpaces: boolean;
}

// Convert a byte array or string to a netstring (length:data,)
function encodeSingleNetstring(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return `${bytes.length}:${str},`;
}

// Convert a single netstring string into its hex byte sequence inside angle brackets: <39 3a 62 75 74 74 65 72 66 6c 79 2c>
function toHexByteString(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  const hexParts = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'));
  return `<${hexParts.join(' ')}>`;
}

// Decode angle-bracket hex string <39 3a ...> back into UTF-8 string
function decodeHexByteString(hexStr: string): string {
  const clean = hexStr.replace(/[<>]/g, '').trim();
  if (!clean) return '';
  const hexTokens = clean.split(/\s+/).filter(Boolean);
  const bytes = new Uint8Array(hexTokens.length);
  for (let i = 0; i < hexTokens.length; i++) {
    const val = parseInt(hexTokens[i], 16);
    if (isNaN(val)) throw new Error(`Invalid hex byte: ${hexTokens[i]}`);
    bytes[i] = val;
  }
  const decoder = new TextDecoder('utf-8', { fatal: true });
  return decoder.decode(bytes);
}

// Parse netstrings from a string: e.g. "5:hello,6:world,"
function parseNetstrings(input: string): string[] {
  const results: string[] = [];
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const allBytes = encoder.encode(input);
  let pos = 0;

  while (pos < allBytes.length) {
    // Skip any whitespace between netstrings if present
    while (pos < allBytes.length && (allBytes[pos] === 32 || allBytes[pos] === 10 || allBytes[pos] === 13 || allBytes[pos] === 9)) {
      pos++;
    }
    if (pos >= allBytes.length) break;

    // Read ASCII digits until colon (ASCII 58 is ':')
    let colonPos = -1;
    for (let i = pos; i < allBytes.length; i++) {
      if (allBytes[i] === 58) {
        colonPos = i;
        break;
      }
    }

    if (colonPos === -1) {
      throw new Error(`Invalid netstring format: Missing colon after index ${pos}`);
    }

    const lengthStr = decoder.decode(allBytes.slice(pos, colonPos));
    if (!/^\d+$/.test(lengthStr)) {
      throw new Error(`Invalid netstring length "${lengthStr}" at position ${pos}`);
    }

    const byteLen = parseInt(lengthStr, 10);
    const dataStart = colonPos + 1;
    const dataEnd = dataStart + byteLen;

    if (dataEnd > allBytes.length) {
      throw new Error(`Netstring declared length ${byteLen} exceeds available data (length starts at ${dataStart})`);
    }

    if (allBytes[dataEnd] !== 44) { // ASCII 44 is ','
      throw new Error(`Invalid netstring: Missing trailing comma after payload at byte index ${dataEnd}`);
    }

    const payloadBytes = allBytes.slice(dataStart, dataEnd);
    results.push(decoder.decode(payloadBytes));
    pos = dataEnd + 1;
  }

  return results;
}

export function NetstringConverter({
  initialData,
  onStateChange,
}: {
  initialData?: any;
  onStateChange?: (state: any) => void;
}) {
  const { t } = useTranslation();

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [mode, setMode] = useState<ConverterMode>(initialData?.mode || 'encode');
  const [input, setInput] = useState<string>(initialData?.input ?? 'every moment matters');
  const [format, setFormat] = useState<NetstringFormat>(initialData?.format || 'length-prefixed');
  const [encodeWordsSeparately, setEncodeWordsSeparately] = useState<boolean>(
    initialData?.encodeWordsSeparately ?? true
  );
  const [multiLine, setMultiLine] = useState<boolean>(initialData?.multiLine ?? false);
  const [doubleProtection, setDoubleProtection] = useState<boolean>(
    initialData?.doubleProtection ?? false
  );
  const [skipRepeatedSpaces, setSkipRepeatedSpaces] = useState<boolean>(
    initialData?.skipRepeatedSpaces ?? false
  );
  const [beautifyNewlines, setBeautifyNewlines] = useState<boolean>(
    initialData?.beautifyNewlines ?? false
  );
  const [beautifySpaces, setBeautifySpaces] = useState<boolean>(
    initialData?.beautifySpaces ?? false
  );
  const [beautifyTabs, setBeautifyTabs] = useState<boolean>(
    initialData?.beautifyTabs ?? false
  );
  const [separateWordsWithSpaces, setSeparateWordsWithSpaces] = useState<boolean>(
    initialData?.separateWordsWithSpaces ?? true
  );
  const [activePresetId, setActivePresetId] = useState<string | null>('preset_words');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({
      mode,
      input,
      format,
      encodeWordsSeparately,
      multiLine,
      doubleProtection,
      skipRepeatedSpaces,
      beautifyNewlines,
      beautifySpaces,
      beautifyTabs,
      separateWordsWithSpaces,
      activePresetId,
    });
  }, [
    mode,
    input,
    format,
    encodeWordsSeparately,
    multiLine,
    doubleProtection,
    skipRepeatedSpaces,
    beautifyNewlines,
    beautifySpaces,
    beautifyTabs,
    separateWordsWithSpaces,
    activePresetId,
    onStateChange,
  ]);

  // Presets inspired directly by onlinetools.com
  const presets: NetstringPreset[] = useMemo(
    () => [
      {
        id: 'preset_words',
        nameKey: 'netstring.preset_encode_words',
        mode: 'encode',
        input: 'every moment matters',
        format: 'length-prefixed',
        encodeWordsSeparately: true,
        multiLine: false,
        doubleProtection: false,
        skipRepeatedSpaces: false,
        beautifyNewlines: false,
        beautifySpaces: false,
        beautifyTabs: false,
        separateWordsWithSpaces: true,
      },
      {
        id: 'preset_recursive',
        nameKey: 'netstring.preset_recursive',
        mode: 'encode',
        input: 'This suspense is terrible. I hope it will last.',
        format: 'length-prefixed',
        encodeWordsSeparately: true,
        multiLine: false,
        doubleProtection: true,
        skipRepeatedSpaces: false,
        beautifyNewlines: false,
        beautifySpaces: false,
        beautifyTabs: false,
        separateWordsWithSpaces: true,
      },
      {
        id: 'preset_hex_genres',
        nameKey: 'netstring.preset_hex_genres',
        mode: 'encode',
        input: 'Rock\nElectronic\nFunk\nCountry\nLatin\nReggae\nHip hop\nHouse',
        format: 'hex-bytes',
        encodeWordsSeparately: false,
        multiLine: true,
        doubleProtection: false,
        skipRepeatedSpaces: false,
        beautifyNewlines: false,
        beautifySpaces: false,
        beautifyTabs: false,
        separateWordsWithSpaces: true,
      },
      {
        id: 'preset_whitespace',
        nameKey: 'netstring.preset_whitespace_beautified',
        mode: 'encode',
        input: 'passport\t✓\nsun cream\t✗\nswimming suit\t✓\nmoney\t\t✓',
        format: 'length-prefixed',
        encodeWordsSeparately: false,
        multiLine: false,
        doubleProtection: false,
        skipRepeatedSpaces: false,
        beautifyNewlines: true,
        beautifySpaces: true,
        beautifyTabs: true,
        separateWordsWithSpaces: true,
      },
      {
        id: 'preset_decode_quote',
        nameKey: 'netstring.preset_decode_quote',
        mode: 'decode',
        input: '3:All,3:you,4:need,2:is,5:love.,',
        format: 'length-prefixed',
        encodeWordsSeparately: true,
        multiLine: false,
        doubleProtection: false,
        skipRepeatedSpaces: false,
        beautifyNewlines: false,
        beautifySpaces: false,
        beautifyTabs: false,
        separateWordsWithSpaces: true,
      },
    ],
    []
  );

  const applyPreset = useCallback((preset: NetstringPreset) => {
    setActivePresetId(preset.id);
    setMode(preset.mode);
    setInput(preset.input);
    setFormat(preset.format);
    setEncodeWordsSeparately(preset.encodeWordsSeparately);
    setMultiLine(preset.multiLine);
    setDoubleProtection(preset.doubleProtection);
    setSkipRepeatedSpaces(preset.skipRepeatedSpaces);
    setBeautifyNewlines(preset.beautifyNewlines);
    setBeautifySpaces(preset.beautifySpaces);
    setBeautifyTabs(preset.beautifyTabs);
    setSeparateWordsWithSpaces(preset.separateWordsWithSpaces);

    toast.success(t('netstring.toast_preset_loaded', 'Preset applied successfully!'));
    inputRef.current?.focus();
  }, [t]);

  // Main Conversion Logic
  const { output, error, totalNetstrings, totalBytes } = useMemo(() => {
    if (!input) {
      return { output: '', error: null, totalNetstrings: 0, totalBytes: 0 };
    }

    if (input.length > MAX_LENGTH) {
      return {
        output: '',
        error: t('netstring.err_max_length', 'Input exceeds maximum allowed length of 100,000 characters.'),
        totalNetstrings: 0,
        totalBytes: 0,
      };
    }

    try {
      if (mode === 'encode') {
        let textToProcess = input;

        // Skip repeated spaces if selected
        if (skipRepeatedSpaces) {
          textToProcess = textToProcess.replace(/[ ]{2,}/g, ' ');
        }

        // Whitespace beautification
        if (beautifySpaces) {
          textToProcess = textToProcess.replace(/ /g, '⎵');
        }
        if (beautifyTabs) {
          textToProcess = textToProcess.replace(/\t/g, '⇥');
        }
        if (beautifyNewlines && !multiLine) {
          textToProcess = textToProcess.replace(/\r?\n/g, '↵');
        }

        const encodeSingleText = (rawText: string): string => {
          if (encodeWordsSeparately) {
            // Split into words by spaces while preserving tokens
            const words = rawText.split(/\s+/).filter(w => w.length > 0);
            if (words.length === 0) {
              let encoded = encodeSingleNetstring('');
              if (doubleProtection) {
                encoded = encodeSingleNetstring(encoded);
              }
              return format === 'hex-bytes' ? toHexByteString(encoded) : encoded;
            }
            const encodedWords = words.map(w => encodeSingleNetstring(w));
            let joined = encodedWords.join('');
            if (doubleProtection) {
              joined = encodeSingleNetstring(joined);
            }
            if (format === 'hex-bytes') {
              return toHexByteString(joined);
            }
            return joined;
          } else {
            let net = encodeSingleNetstring(rawText);
            if (doubleProtection) {
              net = encodeSingleNetstring(net);
            }
            return format === 'hex-bytes' ? toHexByteString(net) : net;
          }
        };

        let result = '';
        if (multiLine) {
          const lines = textToProcess.split(/\r?\n/);
          result = lines.map(line => encodeSingleText(line)).join('\n');
        } else {
          result = encodeSingleText(textToProcess);
        }

        const encoder = new TextEncoder();
        const bytesCount = encoder.encode(result).length;
        // Count approximate netstrings
        const netstringMatches = result.match(/:\s*[^,]+,/g);
        const count = netstringMatches ? netstringMatches.length : (result ? 1 : 0);

        return {
          output: result,
          error: null,
          totalNetstrings: count,
          totalBytes: bytesCount,
        };
      } else {
        // Decode Mode
        let rawInput = input.trim();

        const decodeSingleBlock = (blockStr: string): string => {
          let strToParse = blockStr.trim();
          if (!strToParse) return '';

          // If hex notation: <39 3a ...>
          if (strToParse.startsWith('<') && strToParse.endsWith('>')) {
            // Could contain multiple angle bracket sequences: <...> <...>
            const hexBlocks = strToParse.match(/<[^>]+>/g) || [strToParse];
            const decodedChunks = hexBlocks.map(hb => decodeHexByteString(hb));
            strToParse = decodedChunks.join('');
          }

          // First pass of netstring parsing
          let parsedItems = parseNetstrings(strToParse);

          // Double Decode if enabled
          if (doubleProtection) {
            const secondPass: string[] = [];
            for (const item of parsedItems) {
              try {
                const subItems = parseNetstrings(item);
                secondPass.push(...subItems);
              } catch {
                secondPass.push(item);
              }
            }
            parsedItems = secondPass;
          }

          // Join items
          let decodedResult = separateWordsWithSpaces
            ? parsedItems.join(' ')
            : parsedItems.join('');

          // Unbeautify whitespace
          if (beautifySpaces) {
            decodedResult = decodedResult.replace(/⎵/g, ' ');
          }
          if (beautifyTabs) {
            decodedResult = decodedResult.replace(/⇥/g, '\t');
          }
          if (beautifyNewlines) {
            decodedResult = decodedResult.replace(/↵/g, '\n');
          }

          return decodedResult;
        };

        let finalOutput = '';
        if (multiLine) {
          const lines = rawInput.split(/\r?\n/).filter(l => l.trim().length > 0);
          finalOutput = lines.map(line => decodeSingleBlock(line)).join('\n');
        } else {
          finalOutput = decodeSingleBlock(rawInput);
        }

        const encoder = new TextEncoder();
        const bytesCount = encoder.encode(finalOutput).length;

        return {
          output: finalOutput,
          error: null,
          totalNetstrings: 1,
          totalBytes: bytesCount,
        };
      }
    } catch (err: any) {
      return {
        output: '',
        error: err?.message || t('netstring.err_conversion', 'Failed to convert netstring.'),
        totalNetstrings: 0,
        totalBytes: 0,
      };
    }
  }, [
    input,
    mode,
    format,
    encodeWordsSeparately,
    multiLine,
    doubleProtection,
    skipRepeatedSpaces,
    beautifyNewlines,
    beautifySpaces,
    beautifyTabs,
    separateWordsWithSpaces,
    t,
  ]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('netstring.toast_copied', 'Copied output to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const filename = mode === 'encode' ? 'netstring-output.txt' : 'decoded-string.txt';
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(t('netstring.toast_downloaded', 'Output downloaded successfully!'));
  }, [output, mode, t]);

  const handleReset = useCallback(() => {
    setInput('');
    setActivePresetId(null);
    inputRef.current?.focus();
    toast.info(t('netstring.toast_cleared', 'Inputs cleared.'));
  }, [t]);

  const handleSwapMode = useCallback(() => {
    setActivePresetId(null);
    setMode(prev => (prev === 'encode' ? 'decode' : 'encode'));
    if (output) {
      setInput(output);
    }
    inputRef.current?.focus();
  }, [output]);

  // Keyboard shortcut listener isolated with handlersRef
  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.isContentEditable;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey && !e.altKey && !isInput) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    const container = containerRef.current;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6">
      {/* Header and Quick Presets */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileCode className="w-5 h-5 text-indigo-500" />
              {t('tool.netstring-converter.name', 'Netstring Converter')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t(
                'tool.netstring-converter.description',
                'Encode and decode strings into Dan J. Bernstein netstring streams'
              )}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setMode('encode');
                setActivePresetId(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mode === 'encode'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('netstring.mode_encode', 'String to Netstring')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('decode');
                setActivePresetId(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mode === 'decode'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('netstring.mode_decode', 'Netstring to String')}
            </button>
          </div>
        </div>

        {/* Presets List */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {t('netstring.presets_title', 'Interactive Presets')}
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => applyPreset(preset)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all border ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 font-bold shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                  }`}
                >
                  {t(preset.nameKey, preset.id)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Options Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Settings2 className="w-4 h-4 text-indigo-500" />
          {t('netstring.options_title', 'Encoding & Formatting Options')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Format Radio */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('netstring.format_label', 'Netstring Format')}
            </label>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="radio"
                  name="netstring-format"
                  checked={format === 'length-prefixed'}
                  onChange={() => {
                    setFormat('length-prefixed');
                    setActivePresetId(null);
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>{t('netstring.format_prefixed', 'Length-prefixed (9:butterfly,)')}</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="radio"
                  name="netstring-format"
                  checked={format === 'hex-bytes'}
                  onChange={() => {
                    setFormat('hex-bytes');
                    setActivePresetId(null);
                  }}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span>{t('netstring.format_hex', 'Hex-byte (<39 3a ...>)')}</span>
              </label>
            </div>
          </div>

          {/* Granularity & Recursion */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('netstring.granularity_label', 'Tokenization & Protection')}
            </label>
            <div className="flex flex-col gap-1.5">
              {mode === 'encode' && (
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={encodeWordsSeparately}
                    onChange={e => {
                      setEncodeWordsSeparately(e.target.checked);
                      setActivePresetId(null);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t('netstring.opt_encode_words', 'Encode Words Separately')}</span>
                </label>
              )}
              {mode === 'decode' && (
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={separateWordsWithSpaces}
                    onChange={e => {
                      setSeparateWordsWithSpaces(e.target.checked);
                      setActivePresetId(null);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t('netstring.opt_separate_spaces', 'Separate Words with Spaces')}</span>
                </label>
              )}
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={multiLine}
                  onChange={e => {
                    setMultiLine(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>{t('netstring.opt_multiline', 'Multi-line Mode')}</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={doubleProtection}
                  onChange={e => {
                    setDoubleProtection(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  {mode === 'encode'
                    ? t('netstring.opt_double_protect', 'Double Protection (Recursive)')
                    : t('netstring.opt_double_decode', 'Double Decode (Recursive)')}
                </span>
              </label>
            </div>
          </div>

          {/* Whitespace Processing */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('netstring.whitespace_label', 'Whitespace & Beautification')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {mode === 'encode' && (
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipRepeatedSpaces}
                    onChange={e => {
                      setSkipRepeatedSpaces(e.target.checked);
                      setActivePresetId(null);
                    }}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{t('netstring.opt_skip_spaces', 'Skip Repeated Spaces')}</span>
                </label>
              )}
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={beautifySpaces}
                  onChange={e => {
                    setBeautifySpaces(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  {mode === 'encode'
                    ? t('netstring.opt_beautify_spaces', 'Visualize Spaces as ⎵')
                    : t('netstring.opt_unbeautify_spaces', 'Unbeautify ⎵ into Space')}
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={beautifyTabs}
                  onChange={e => {
                    setBeautifyTabs(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  {mode === 'encode'
                    ? t('netstring.opt_beautify_tabs', 'Visualize Tabs as ⇥')
                    : t('netstring.opt_unbeautify_tabs', 'Unbeautify ⇥ into Tab')}
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={beautifyNewlines}
                  onChange={e => {
                    setBeautifyNewlines(e.target.checked);
                    setActivePresetId(null);
                  }}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  {mode === 'encode'
                    ? t('netstring.opt_beautify_newlines', 'Visualize Newlines as ↵')
                    : t('netstring.opt_unbeautify_newlines', 'Unbeautify ↵ into Newline')}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Conversion Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* Swap Button for Desktop */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <button
            type="button"
            onClick={handleSwapMode}
            title={t('netstring.swap_mode_hint', 'Swap encode/decode direction')}
            className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 text-indigo-600 hover:text-indigo-500 hover:scale-110 active:scale-95 transition-all"
          >
            <ArrowRightLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Input Panel */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label
              htmlFor="netstring-input"
              className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              {mode === 'encode'
                ? t('netstring.input_string_label', 'Input Plain Text')
                : t('netstring.input_netstring_label', 'Input Netstring')}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                {input.length} chars
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-2 py-1 rounded-lg transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                {t('common.clear', 'Clear')}
                <Kbd modifier={null} className="ml-1 text-[10px]">
                  Esc
                </Kbd>
              </button>
            </div>
          </div>

          <textarea
            ref={inputRef}
            id="netstring-input"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              setActivePresetId(null);
            }}
            placeholder={
              mode === 'encode'
                ? t('netstring.input_placeholder_encode', 'Enter text to encode into netstrings...')
                : t('netstring.input_placeholder_decode', 'Enter netstring (e.g. 5:hello,) to decode...')
            }
            rows={12}
            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed dark:text-slate-200 resize-y"
          />
        </div>

        {/* Output Panel */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label
              htmlFor="netstring-output"
              className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              {mode === 'encode'
                ? t('netstring.output_netstring_label', 'Generated Netstring')
                : t('netstring.output_string_label', 'Decoded String')}
            </label>
            <div className="flex items-center gap-2">
              {totalBytes > 0 && (
                <span className="text-xs text-slate-400 font-mono">
                  {totalBytes} {t('netstring.bytes', 'bytes')}
                </span>
              )}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
                <Kbd modifier={null} className="ml-1 text-[10px]">
                  C
                </Kbd>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5" />
                {t('common.download', 'Download')}
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              id="netstring-output"
              value={output}
              readOnly
              placeholder={
                error
                  ? error
                  : t('netstring.output_placeholder', 'The conversion result will appear here...')
              }
              rows={12}
              className={`w-full p-4 bg-slate-50 dark:bg-slate-900 border rounded-3xl outline-none font-mono text-sm leading-relaxed resize-y ${
                error
                  ? 'border-rose-300 dark:border-rose-900 text-rose-500 bg-rose-50/20'
                  : 'border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400'
              }`}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-3 rounded-2xl border border-rose-200 dark:border-rose-900/40">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Informational About Card */}
      <div className="bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-6 space-y-3">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" />
          {t('netstring.about_title', 'About Netstrings (DJB Specification)')}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {t(
            'netstring.about_text',
            'A netstring is a stream-safe framing and serialization format invented by Daniel J. Bernstein (DJB). Each payload starts with ASCII digits indicating the exact UTF-8 byte count, followed by a colon delimiter (:), the exact raw data bytes, and ends with a comma (,). For example, "butterfly" becomes "9:butterfly,". Because length is declared upfront, parsers avoid delimiter collision attacks and can safely process arbitrary binary or multi-byte strings.'
          )}
        </p>
      </div>
    </div>
  );
}
