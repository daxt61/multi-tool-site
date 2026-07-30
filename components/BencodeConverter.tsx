import { useState, useEffect, useCallback, useRef } from 'react';
import { FileJson, Binary, Trash2, Copy, Check, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function BencodeConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [bencodeText, setBencodeText] = useState(initialData?.bencodeText || '');
  const [jsonText, setJsonText] = useState(initialData?.jsonText || '');
  const [copied, setCopied] = useState<'bencode' | 'json' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bencodeInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ bencodeText, jsonText });
  }, [bencodeText, jsonText, onStateChange]);

  // Safe Bencode parser
  const parseBencode = useCallback((input: string) => {
    let index = 0;
    const len = input.length;

    const parseValue = (depth: number): any => {
      if (depth > MAX_DEPTH) {
        throw new Error('Nesting depth limit exceeded');
      }
      if (index >= len) {
        throw new Error('Unexpected end of bencoded stream');
      }

      const char = input[index];

      // Integer: i<integer>e
      if (char === 'i') {
        index++; // skip 'i'
        const endIdx = input.indexOf('e', index);
        if (endIdx === -1) {
          throw new Error('Unterminated integer');
        }
        const numStr = input.slice(index, endIdx);
        if (!/^-?[0-9]+$/.test(numStr)) {
          throw new Error(`Invalid integer format: ${numStr}`);
        }
        index = endIdx + 1; // skip integer digits and 'e'
        return parseInt(numStr, 10);
      }

      // List: l<elements>e
      if (char === 'l') {
        index++; // skip 'l'
        const list: any[] = [];
        while (index < len && input[index] !== 'e') {
          list.push(parseValue(depth + 1));
        }
        if (index >= len || input[index] !== 'e') {
          throw new Error('Unterminated list');
        }
        index++; // skip 'e'
        return list;
      }

      // Dictionary: d<key><value>e
      if (char === 'd') {
        index++; // skip 'd'
        const dict = Object.create(null);
        while (index < len && input[index] !== 'e') {
          const rawKey = parseValue(depth + 1);
          if (typeof rawKey !== 'string') {
            throw new Error('Dictionary keys must be strings');
          }
          // Prototype pollution defense
          const cleanKey = (rawKey === '__proto__' || rawKey === 'constructor' || rawKey === 'prototype')
            ? `_${rawKey}`
            : rawKey;

          const val = parseValue(depth + 1);
          dict[cleanKey] = val;
        }
        if (index >= len || input[index] !== 'e') {
          throw new Error('Unterminated dictionary');
        }
        index++; // skip 'e'
        return dict;
      }

      // String: <length>:<contents>
      if (char >= '0' && char <= '9') {
        const colonIdx = input.indexOf(':', index);
        if (colonIdx === -1) {
          throw new Error('Invalid string format: missing colon');
        }
        const lengthStr = input.slice(index, colonIdx);
        const length = parseInt(lengthStr, 10);
        if (isNaN(length) || length < 0) {
          throw new Error(`Invalid string length: ${lengthStr}`);
        }
        index = colonIdx + 1; // skip length and ':'
        if (index + length > len) {
          throw new Error('String length exceeds stream size');
        }
        const strVal = input.slice(index, index + length);
        index += length;
        return strVal;
      }

      throw new Error(`Unknown token at index ${index}: "${char}"`);
    };

    try {
      const result = parseValue(0);
      if (index < len) {
        throw new Error('Extra data after valid bencoded value');
      }
      return result;
    } catch (e: any) {
      throw new Error(`Bencode Parse Error: ${e.message}`);
    }
  }, []);

  // Safe Bencode encoder
  const encodeBencode = useCallback((value: any, depth: number): string => {
    if (depth > MAX_DEPTH) {
      throw new Error('Nesting depth limit exceeded');
    }

    if (typeof value === 'number') {
      if (!Number.isInteger(value)) {
        throw new Error('Bencode only supports integer numbers');
      }
      return `i${value}e`;
    }

    if (typeof value === 'string') {
      return `${value.length}:${value}`;
    }

    if (Array.isArray(value)) {
      const elements = value.map(item => encodeBencode(item, depth + 1)).join('');
      return `l${elements}e`;
    }

    if (typeof value === 'object' && value !== null) {
      // Prototype pollution sanitization and alphabetical sorting for keys
      const keys = Object.keys(value)
        .filter(k => k !== '__proto__' && k !== 'constructor' && k !== 'prototype')
        .sort();

      const inner = keys.map(key => {
        const encodedKey = `${key.length}:${key}`;
        const encodedVal = encodeBencode(value[key], depth + 1);
        return encodedKey + encodedVal;
      }).join('');

      return `d${inner}e`;
    }

    if (typeof value === 'boolean') {
      // Bencode doesn't natively support booleans. Convert to integer 1/0
      return `i${value ? 1 : 0}e`;
    }

    throw new Error(`Unsupported type: ${typeof value}`);
  }, []);

  const handleBencodeChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setBencodeText(val);
      setJsonText('');
      return;
    }
    setError(null);
    setBencodeText(val);
    if (!val.trim()) {
      setJsonText('');
      return;
    }

    try {
      const parsedObj = parseBencode(val);
      setJsonText(JSON.stringify(parsedObj, null, 2));
    } catch (e: any) {
      setJsonText('');
    }
  };

  const handleJSONChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setJsonText(val);
      setBencodeText('');
      return;
    }
    setError(null);
    setJsonText(val);
    if (!val.trim()) {
      setBencodeText('');
      return;
    }

    try {
      const parsed = JSON.parse(val);
      const encoded = encodeBencode(parsed, 0);
      setBencodeText(encoded);
    } catch (e: any) {
      setBencodeText('');
    }
  };

  const handleClear = useCallback(() => {
    setBencodeText('');
    setJsonText('');
    setError(null);
    bencodeInputRef.current?.focus();
    toast.success(t('recent.cleared') || 'Cleared');
  }, [t]);

  const copyToClipboard = useCallback((val: string, type: 'bencode' | 'json') => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(type);
    toast.success(t('tool.link_copied') || 'Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  }, [t]);

  const handlersRef = useRef({
    handleClear,
    copyToClipboard,
    bencodeText,
    jsonText
  });

  useEffect(() => {
    handlersRef.current = { handleClear, copyToClipboard, bencodeText, jsonText };
  }, [handleClear, copyToClipboard, bencodeText, jsonText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (handlersRef.current.bencodeText) {
          handlersRef.current.copyToClipboard(handlersRef.current.bencodeText, 'bencode');
        } else if (handlersRef.current.jsonText) {
          handlersRef.current.copyToClipboard(handlersRef.current.jsonText, 'json');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Configurations & Reset Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500">
          {t('bencode.offline_desc') || '100% Client-side Bencode parser & encoder.'}
        </span>
        <div className="flex items-center gap-3">
          <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
          <button
            onClick={handleClear}
            className="text-xs font-bold px-4 py-2.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1.5 border border-transparent focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-4 h-4" /> {t('common.clear') || 'Clear'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Bencode Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-indigo-500" />
              <label htmlFor="bencode-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('bencode.input_label') || 'Bencode Input'}
              </label>
            </div>
            <button
              onClick={() => copyToClipboard(bencodeText, 'bencode')}
              disabled={!bencodeText}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                copied === 'bencode'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
              } disabled:opacity-50`}
            >
              {copied === 'bencode' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'bencode' ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <textarea
            id="bencode-input"
            ref={bencodeInputRef}
            value={bencodeText}
            onChange={(e) => handleBencodeChange(e.target.value)}
            placeholder="d3:bar4:spam3:fooi42ee"
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* JSON Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('jsontosql.json_input') || 'JSON Output'}
              </label>
            </div>
            <button
              onClick={() => copyToClipboard(jsonText, 'json')}
              disabled={!jsonText}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${
                copied === 'json'
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 shadow-sm'
              } disabled:opacity-50`}
            >
              {copied === 'json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'json' ? t('common.copied') : t('common.copy')}
              {copied !== 'json' && <Kbd modifier={null} className="ml-1 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-slate-700">C</Kbd>}
            </button>
          </div>
          <textarea
            id="json-output"
            value={jsonText}
            onChange={(e) => handleJSONChange(e.target.value)}
            placeholder='{\n  "bar": "spam",\n  "foo": 42\n}'
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {/* Description / Information */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="font-bold text-slate-900 dark:text-white">{t('bencode.about_title') || 'About Bencode'}</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('bencode.about_text') || 'Bencode is the encoding protocol used by the BitTorrent network for storing and transmitting loosely structured data in torrent files. It supports four primitive types: byte strings, integers, lists, and dictionaries. This bidirectional tool converts raw Bencode streams to readable JSON representation, and re-encodes JSON structures securely with safe bounds and sorted keys.'}
        </p>
      </div>
    </div>
  );
}
