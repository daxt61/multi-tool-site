import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, ArrowLeftRight, Copy, Check, Trash2, Download, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function JsonIniConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const jsonRef = useRef<HTMLTextAreaElement>(null);
  const iniRef = useRef<HTMLTextAreaElement>(null);

  const [jsonInput, setJsonInput] = useState(initialData?.json || '');
  const [iniInput, setIniInput] = useState(initialData?.ini || '');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'json' | 'ini' | null>(null);

  useEffect(() => {
    onStateChange?.({ json: jsonInput, ini: iniInput });
  }, [jsonInput, iniInput, onStateChange]);

  const parseIni = (data: string) => {
    const result: any = Object.create(null);
    let currentSection = result;
    const lines = data.split(/\r?\n/);

    const sanitizeKey = (key: string) => {
      const lower = key.toLowerCase();
      if (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') {
        return `_${key}`;
      }
      return key;
    };

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) return;

      const sectionMatch = trimmed.match(/^\[(.*)\]$/);
      if (sectionMatch) {
        const sectionName = sanitizeKey(sectionMatch[1].trim());
        if (!result[sectionName]) {
          result[sectionName] = Object.create(null);
        }
        currentSection = result[sectionName];
      } else {
        const index = trimmed.indexOf('=');
        if (index > 0) {
          const key = sanitizeKey(trimmed.substring(0, index).trim());
          const value = trimmed.substring(index + 1).trim();

          let parsedValue: any = value;
          if (value.toLowerCase() === 'true') parsedValue = true;
          else if (value.toLowerCase() === 'false') parsedValue = false;
          else if (!isNaN(Number(value)) && value !== '') parsedValue = Number(value);
          else if (value.startsWith('"') && value.endsWith('"')) parsedValue = value.substring(1, value.length - 1);

          currentSection[key] = parsedValue;
        }
      }
    });
    return result;
  };

  const stringifyIni = (obj: any) => {
    let ini = '';
    const sections: string[] = [];
    const rootProps: string[] = [];

    const formatValue = (val: any) => {
      if (typeof val === 'string' && (val.includes(' ') || val.includes('=') || val.includes(';') || val.includes('#'))) {
        return `"${val}"`;
      }
      return String(val);
    };

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          sections.push(key);
        } else {
          rootProps.push(`${key}=${formatValue(val)}`);
        }
      }
    }

    ini += rootProps.join('\n');
    if (rootProps.length > 0 && sections.length > 0) ini += '\n\n';

    sections.forEach((section, i) => {
      ini += `[${section}]\n`;
      const props = obj[section];
      if (typeof props === 'object' && props !== null) {
        for (const key in props) {
          if (Object.prototype.hasOwnProperty.call(props, key)) {
            ini += `${key}=${formatValue(props[key])}\n`;
          }
        }
      }
      if (i < sections.length - 1) ini += '\n';
    });

    return ini.trim();
  };

  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    try {
      if (!val.trim()) {
        setIniInput('');
        return;
      }
      const parsed = JSON.parse(val);
      setIniInput(stringifyIni(parsed));
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
    }
  };

  const handleIniChange = (val: string) => {
    setIniInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    try {
      if (!val.trim()) {
        setJsonInput('');
        return;
      }
      const parsed = parseIni(val);
      setJsonInput(JSON.stringify(parsed, null, 2));
    } catch (e: any) {
      setError('INI ' + t('error.invalid_json').toLowerCase() + ': ' + e.message);
    }
  };

  const handleClear = useCallback(() => {
    setJsonInput('');
    setIniInput('');
    setError(null);
    jsonRef.current?.focus();
  }, []);

  const handleCopy = useCallback((text: string, type: 'json' | 'ini') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(null), 2000);
  }, [t]);

  const handlersRef = useRef({ handleClear, handleCopyJson: () => handleCopy(jsonInput, 'json'), handleCopyIni: () => handleCopy(iniInput, 'ini') });
  useEffect(() => {
    handlersRef.current = { handleClear, handleCopyJson: () => handleCopy(jsonInput, 'json'), handleCopyIni: () => handleCopy(iniInput, 'ini') };
  }, [handleClear, handleCopy, jsonInput, iniInput]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (jsonInput) handlersRef.current.handleCopyJson();
        else if (iniInput) handlersRef.current.handleCopyIni();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jsonInput, iniInput]);

  const handleDownload = (content: string, filename: string) => {
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>

        {/* JSON Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">JSON</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(jsonInput, 'data.json')}
                disabled={!jsonInput}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={() => handleCopy(jsonInput, 'json')}
                disabled={!jsonInput}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === 'json'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
                title={`${t('common.copy')} (C)`}
              >
                {copied === 'json' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'json' ? t('common.copied') : t('common.copy')}
                {(!copied && jsonInput) && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="json-input"
            ref={jsonRef}
            value={jsonInput}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='{ "section": { "key": "value" } }'
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* INI Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="ini-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">INI</label>
            </div>
            <div className="flex gap-2">
               <button
                onClick={handleClear}
                disabled={!jsonInput && !iniInput}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
              <button
                onClick={() => handleDownload(iniInput, 'config.ini')}
                disabled={!iniInput}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={() => handleCopy(iniInput, 'ini')}
                disabled={!iniInput}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === 'ini'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
                title={`${t('common.copy')} (C)`}
              >
                {copied === 'ini' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'ini' ? t('common.copied') : t('common.copy')}
                {(!copied && !jsonInput && iniInput) && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="ini-input"
            ref={iniRef}
            value={iniInput}
            onChange={(e) => handleIniChange(e.target.value)}
            placeholder='[section]\nkey=value'
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsonini.about_title', 'About JSON <> INI Converter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsonini.about_text', 'This tool allows you to convert between JSON and INI configuration formats. INI files are simple text files with a basic structure composed of sections, properties, and values. JSON is a more complex, hierarchical format. This converter automatically maps JSON nested objects to INI sections.')}
          </p>
        </div>
      </div>
    </div>
  );
}
