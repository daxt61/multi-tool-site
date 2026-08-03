import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Binary, Copy, Check, Trash2, ArrowLeftRight, Info, AlertCircle, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const Z85_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#';
const Z85_CHAR_MAP = (() => {
  const map: Record<string, number> = Object.create(null);
  for (let i = 0; i < Z85_ALPHABET.length; i++) {
    map[Z85_ALPHABET[i]] = i;
  }
  return map;
})();

type Variant = 'ascii85' | 'z85';
type Direction = 'encode' | 'decode';

export function Base85Converter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState(initialData?.input ?? 'Hello, world!');
  const [output, setOutput] = useState('');
  const [variant, setVariant] = useState<Variant>(initialData?.variant ?? 'ascii85');
  const [direction, setDirection] = useState<Direction>(initialData?.direction ?? 'encode');
  const [ascii85Wrap, setAscii85Wrap] = useState<boolean>(initialData?.ascii85Wrap ?? true);
  const [ascii85SpaceCompression, setAscii85SpaceCompression] = useState<boolean>(initialData?.ascii85SpaceCompression ?? false);
  const [z85Padding, setZ85Padding] = useState<'strict' | 'pad'>(initialData?.z85Padding ?? 'pad');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, variant, direction, ascii85Wrap, ascii85SpaceCompression, z85Padding });
  }, [input, variant, direction, ascii85Wrap, ascii85SpaceCompression, z85Padding, onStateChange]);

  const encodeAscii85 = useCallback((bytes: Uint8Array): string => {
    let result = '';
    let i = 0;
    const len = bytes.length;

    while (i < len) {
      const chunkLen = Math.min(4, len - i);
      let val = 0;

      if (chunkLen === 4) {
        val = (bytes[i] * 16777216) + (bytes[i + 1] * 65536) + (bytes[i + 2] * 256) + bytes[i + 3];
        if (val === 0) {
          result += 'z';
        } else if (val === 0x20202020 && ascii85SpaceCompression) {
          result += 'y';
        } else {
          let rems = [];
          for (let k = 0; k < 5; k++) {
            rems.push(val % 85);
            val = Math.floor(val / 85);
          }
          rems.reverse();
          for (let k = 0; k < 5; k++) {
            result += String.fromCharCode(33 + rems[k]);
          }
        }
      } else {
        // Partial chunk
        const padded = new Uint8Array(4);
        padded.set(bytes.subarray(i, i + chunkLen));
        val = (padded[0] * 16777216) + (padded[1] * 65536) + (padded[2] * 256) + padded[3];

        let rems = [];
        for (let k = 0; k < 5; k++) {
          rems.push(val % 85);
          val = Math.floor(val / 85);
        }
        rems.reverse();
        for (let k = 0; k < chunkLen + 1; k++) {
          result += String.fromCharCode(33 + rems[k]);
        }
      }
      i += 4;
    }

    if (ascii85Wrap) {
      result = '<~' + result + '~>';
    }
    return result;
  }, [ascii85Wrap, ascii85SpaceCompression]);

  const decodeAscii85 = useCallback((str: string): Uint8Array => {
    let cleaned = str.trim();
    if (cleaned.startsWith('<~')) {
      cleaned = cleaned.slice(2);
    }
    if (cleaned.endsWith('~>')) {
      cleaned = cleaned.slice(0, -2);
    }
    // Remove all whitespace
    cleaned = cleaned.replace(/\s/g, '');

    const bytes: number[] = [];
    let i = 0;
    const len = cleaned.length;
    let block: number[] = [];

    while (i < len) {
      const char = cleaned[i];
      if (char === 'z') {
        if (block.length > 0) {
          throw new Error(t('base85.error_z_inside_block', 'Zero folding character "z" cannot appear inside an incomplete block'));
        }
        bytes.push(0, 0, 0, 0);
      } else if (char === 'y') {
        if (!ascii85SpaceCompression) {
          throw new Error(t('base85.error_y_disabled', 'Space folding character "y" encountered but space compression is disabled'));
        }
        if (block.length > 0) {
          throw new Error(t('base85.error_y_inside_block', 'Space folding character "y" cannot appear inside an incomplete block'));
        }
        bytes.push(32, 32, 32, 32);
      } else {
        const code = char.charCodeAt(0);
        if (code < 33 || code > 117) {
          throw new Error(t('base85.error_invalid_char', 'Invalid character "{{char}}" in Ascii85 string', { char }));
        }
        block.push(code - 33);

        if (block.length === 5) {
          let val = block[0] * 52200625 + block[1] * 614125 + block[2] * 7225 + block[3] * 85 + block[4];
          if (val > 4294967295) {
            throw new Error(t('base85.error_overflow', 'Ascii85 block value overflow (exceeds 32-bit limit)'));
          }
          bytes.push(
            (val >>> 24) & 255,
            (val >>> 16) & 255,
            (val >>> 8) & 255,
            val & 255
          );
          block = [];
        }
      }
      i++;
    }

    if (block.length > 0) {
      if (block.length === 1) {
        throw new Error(t('base85.error_incomplete_single', 'Incomplete Ascii85 block: single trailing character is invalid'));
      }
      const missing = 5 - block.length;
      for (let k = 0; k < missing; k++) {
        block.push(84); // Pad with 'u' (index 84)
      }
      let val = block[0] * 52200625 + block[1] * 614125 + block[2] * 7225 + block[3] * 85 + block[4];
      if (val > 4294967295) {
        throw new Error(t('base85.error_overflow', 'Ascii85 block value overflow (exceeds 32-bit limit)'));
      }
      const fullBytes = [
        (val >>> 24) & 255,
        (val >>> 16) & 255,
        (val >>> 8) & 255,
        val & 255
      ];
      bytes.push(...fullBytes.slice(0, 4 - missing));
    }

    return new Uint8Array(bytes);
  }, [t, ascii85SpaceCompression]);

  const encodeZ85 = useCallback((bytes: Uint8Array): string => {
    let len = bytes.length;
    let data = bytes;

    if (len % 4 !== 0) {
      if (z85Padding === 'strict') {
        throw new Error(t('base85.error_z85_strict_len', 'Z85 requires input length to be a multiple of 4 bytes in strict mode'));
      }
      const padLen = 4 - (len % 4);
      const padded = new Uint8Array(len + padLen);
      padded.set(bytes);
      data = padded;
      len = padded.length;
    }

    let result = '';
    for (let i = 0; i < len; i += 4) {
      let val = (data[i] * 16777216) + (data[i + 1] * 65536) + (data[i + 2] * 256) + data[i + 3];
      let rems = [];
      for (let k = 0; k < 5; k++) {
        rems.push(val % 85);
        val = Math.floor(val / 85);
      }
      rems.reverse();
      for (let k = 0; k < 5; k++) {
        result += Z85_ALPHABET[rems[k]];
      }
    }
    return result;
  }, [z85Padding, t]);

  const decodeZ85 = useCallback((str: string): Uint8Array => {
    const cleaned = str.replace(/\s/g, '');
    const len = cleaned.length;

    if (len % 5 !== 0) {
      if (z85Padding === 'strict') {
        throw new Error(t('base85.error_z85_strict_char_len', 'Z85 input length must be a multiple of 5 characters in strict mode'));
      }
    }

    const bytes: number[] = [];
    let i = 0;

    while (i < len) {
      const chunkLen = Math.min(5, len - i);
      let blockChars = cleaned.slice(i, i + chunkLen);

      if (blockChars.length < 5) {
        // Pad the 5-char block with '0' for decoding in non-strict mode
        blockChars = blockChars.padEnd(5, '0');
      }

      let val = 0;
      for (let k = 0; k < 5; k++) {
        const char = blockChars[k];
        const idx = Z85_CHAR_MAP[char];
        if (idx === undefined) {
          throw new Error(t('base85.error_invalid_z85_char', 'Invalid Z85 character "{{char}}"', { char }));
        }
        val = val * 85 + idx;
      }

      bytes.push(
        (val >>> 24) & 255,
        (val >>> 16) & 255,
        (val >>> 8) & 255,
        val & 255
      );

      i += 5;
    }

    return new Uint8Array(bytes);
  }, [z85Padding, t]);

  const handleConvert = useCallback(() => {
    setError(null);
    if (!input) {
      setOutput('');
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }

    try {
      if (direction === 'encode') {
        // Encode Text -> Base85
        const bytes = new TextEncoder().encode(input);
        const encoded = variant === 'ascii85' ? encodeAscii85(bytes) : encodeZ85(bytes);
        setOutput(encoded);
      } else {
        // Decode Base85 -> Text
        const decodedBytes = variant === 'ascii85' ? decodeAscii85(input) : decodeZ85(input);
        const decodedText = new TextDecoder().decode(decodedBytes);
        setOutput(decodedText);
      }
    } catch (e: any) {
      setError(e.message);
      setOutput('');
    }
  }, [input, variant, direction, ascii85Wrap, ascii85SpaceCompression, z85Padding, encodeAscii85, decodeAscii85, encodeZ85, decodeZ85, t]);

  useEffect(() => {
    handleConvert();
  }, [input, variant, direction, ascii85Wrap, ascii85SpaceCompression, z85Padding, handleConvert]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    inputRef.current?.focus();
    toast.success(t('common.reset'));
  }, [t]);

  const handleSwap = useCallback(() => {
    const nextDirection = direction === 'encode' ? 'decode' : 'encode';
    setDirection(nextDirection);
    setInput(output || '');
    setOutput('');
    setError(null);
  }, [direction, output]);

  const handlersRef = useRef({ handleClear, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isInputFocused && e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
        return;
      }
      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `base85-output-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Direction & Variant Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDirection('encode')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              direction === 'encode'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            {t('base85.encode', 'Encode')}
          </button>
          <button
            onClick={() => setDirection('decode')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              direction === 'decode'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            {t('base85.decode', 'Decode')}
          </button>
        </div>

        <button
          onClick={handleSwap}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-sm"
          title={t('common.swap', 'Swap')}
        >
          <ArrowLeftRight className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setVariant('ascii85')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              variant === 'ascii85'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            Ascii85 (Adobe)
          </button>
          <button
            onClick={() => setVariant('z85')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              variant === 'z85'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            Z85 (ZeroMQ)
          </button>
        </div>
      </div>

      {/* Inputs Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Text Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="base85-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <Binary className="w-4 h-4 text-indigo-500" />
              {direction === 'encode' ? t('common.input', 'Input Text') : t('common.output', 'Base85 String')}
            </label>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="base85-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={direction === 'encode' ? 'Type or paste content here...' : '<~9jqo^BlbRF~>'}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none font-mono shadow-inner"
          />
        </div>

        {/* Output Text Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="base85-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <Binary className="w-4 h-4 text-emerald-500" />
              {direction === 'encode' ? t('common.output', 'Base85 String') : t('common.input', 'Decoded Text')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-transparent hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="base85-output"
            ref={outputRef}
            value={output}
            readOnly
            placeholder="Converted results will appear here..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none font-mono text-lg leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
          />
        </div>
      </div>

      {/* Advanced Options depending on the variant */}
      {variant === 'ascii85' ? (
        <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Ascii85 (Adobe) Options</h4>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={ascii85Wrap}
                onChange={(e) => setAscii85Wrap(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              Wrap with &lt;~ and ~&gt; delimiters
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={ascii85SpaceCompression}
                onChange={(e) => setAscii85SpaceCompression(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
              />
              Enable Space Compression ('y' folding for 4 spaces)
            </label>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Z85 (ZeroMQ) Options</h4>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Padding Mode:</span>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setZ85Padding('strict')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  z85Padding === 'strict'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Strict (Multiple of 4 bytes / 5 chars)
              </button>
              <button
                onClick={() => setZ85Padding('pad')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  z85Padding === 'pad'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Pad with Null Bytes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-500">
            <Info className="w-4 h-4" /> About Base85 / Ascii85
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Base85 (also called Ascii85) is a binary-to-text encoding form developed by Paul E. Rutter. By using five characters to represent four bytes of binary data, it has a 25% overhead (compared to 33.3% overhead in Base64), making it significantly more compact and efficient.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-emerald-500">
            <Binary className="w-4 h-4" /> Adobe vs ZeroMQ (Z85) Variants
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong>Adobe Ascii85</strong> uses character range <code className="font-mono">!</code> to <code className="font-mono">u</code> and supports optional <code className="font-mono">&lt;~</code> and <code className="font-mono">~&gt;</code> wrapping delimiters, as well as space and zero folding. <strong>Z85</strong> uses an alternate, safe-for-source-code alphabet, and does not require escaping inside strings of C, C++, JSON, or Python.
          </p>
        </div>
      </div>
    </div>
  );
}
