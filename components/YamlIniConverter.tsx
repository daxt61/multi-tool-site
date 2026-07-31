import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, ArrowLeftRight, Copy, Check, Trash2, Download, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import yaml from 'js-yaml';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;
const MAX_DEPTH = 20;

export function YamlIniConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const yamlRef = useRef<HTMLTextAreaElement>(null);
  const iniRef = useRef<HTMLTextAreaElement>(null);

  const [yamlInput, setYamlInput] = useState(
    initialData?.yaml ||
      'title: "Configuration Example"\nversion: 1.2.3\nenabled: true\n\ndatabase:\n  connection:\n    host: "localhost"\n    port: 5432\n  options:\n    timeout: 30\n    pool_size: 10'
  );
  const [iniInput, setIniInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'yaml' | 'ini' | null>(null);

  useEffect(() => {
    onStateChange?.({ yaml: yamlInput, ini: iniInput });
  }, [yamlInput, iniInput, onStateChange]);

  const sanitizeKey = (key: string): string => {
    const lower = key.toLowerCase();
    if (lower === '__proto__' || lower === 'constructor' || lower === 'prototype') {
      return `_${key}`;
    }
    return key;
  };

  const flattenObject = (obj: any, prefix = '', res: Record<string, any> = Object.create(null), depth = 0): Record<string, any> => {
    if (depth > MAX_DEPTH) return res;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          flattenObject(val, newKey, res, depth + 1);
        } else {
          res[newKey] = val;
        }
      }
    }
    return res;
  };

  const stringifyIni = (obj: any): string => {
    if (typeof obj !== 'object' || obj === null) return '';

    let ini = '';
    const sections: string[] = [];
    const rootProps: string[] = [];

    const sanitizedObj: any = Object.create(null);
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitizedObj[sanitizeKey(key)] = obj[key];
      }
    }

    const formatValue = (val: any) => {
      if (
        typeof val === 'string' &&
        (val.includes(' ') || val.includes('=') || val.includes(';') || val.includes('#') || val.includes('"'))
      ) {
        const escaped = val.replace(/"/g, '\\"');
        return `"${escaped}"`;
      }
      return String(val);
    };

    for (const key in sanitizedObj) {
      if (Object.prototype.hasOwnProperty.call(sanitizedObj, key)) {
        const val = sanitizedObj[key];
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          sections.push(key);
        } else if (Array.isArray(val)) {
          rootProps.push(`${key}=${val.map(formatValue).join(', ')}`);
        } else {
          rootProps.push(`${key}=${formatValue(val)}`);
        }
      }
    }

    ini += rootProps.join('\n');
    if (rootProps.length > 0 && sections.length > 0) ini += '\n\n';

    sections.forEach((section, idx) => {
      ini += `[${section}]\n`;
      const sectionVal = sanitizedObj[section];
      if (typeof sectionVal === 'object' && sectionVal !== null) {
        const flattened = Object.create(null);
        flattenObject(sectionVal, '', flattened, 0);
        for (const key in flattened) {
          if (Object.prototype.hasOwnProperty.call(flattened, key)) {
            const sSubKey = sanitizeKey(key);
            const val = flattened[key];
            if (Array.isArray(val)) {
              ini += `${sSubKey}=${val.map(formatValue).join(', ')}\n`;
            } else {
              ini += `${sSubKey}=${formatValue(val)}\n`;
            }
          }
        }
      }
      if (idx < sections.length - 1) ini += '\n';
    });

    return ini.trim();
  };

  const parseIni = (data: string): any => {
    const result: any = Object.create(null);
    let currentSection: any = null;

    const lines = data.split(/\r?\n/);

    const setNestedProp = (target: any, path: string[], value: any) => {
      let current = target;
      for (let i = 0; i < path.length; i++) {
        const k = sanitizeKey(path[i]);
        if (i === path.length - 1) {
          current[k] = value;
        } else {
          if (!current[k] || typeof current[k] !== 'object') {
            current[k] = Object.create(null);
          }
          current = current[k];
        }
      }
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
          const key = trimmed.substring(0, index).trim();
          const value = trimmed.substring(index + 1).trim();

          let parsedValue: any = value;
          if (value.toLowerCase() === 'true') parsedValue = true;
          else if (value.toLowerCase() === 'false') parsedValue = false;
          else if (!isNaN(Number(value)) && value !== '') parsedValue = Number(value);
          else if (value.startsWith('"') && value.endsWith('"')) {
            parsedValue = value.substring(1, value.length - 1).replace(/\\"/g, '"');
          }

          const path = key.split('.');
          if (currentSection) {
            setNestedProp(currentSection, path, parsedValue);
          } else {
            setNestedProp(result, path, parsedValue);
          }
        }
      }
    });

    return result;
  };

  const handleYamlChange = (val: string) => {
    setYamlInput(val);
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
      const parsed = yaml.load(val);
      setIniInput(stringifyIni(parsed));
    } catch (e: any) {
      setError('YAML error: ' + e.message);
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
        setYamlInput('');
        return;
      }
      const parsed = parseIni(val);
      setYamlInput(yaml.dump(parsed, { indent: 2, noRefs: true }));
    } catch (e: any) {
      setError('INI error: ' + e.message);
    }
  };

  useEffect(() => {
    handleYamlChange(yamlInput);
  }, []);

  const handleClear = useCallback(() => {
    setYamlInput('');
    setIniInput('');
    setError(null);
    yamlRef.current?.focus();
    toast.success(t('yamlini.toast_cleared', 'Inputs cleared successfully!'));
  }, [t]);

  const handleCopy = useCallback(
    (text: string, type: 'yaml' | 'ini') => {
      if (!text) return;
      navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(t('common.copied', 'Copied to clipboard!'));
      setTimeout(() => setCopied(null), 2000);
    },
    [t]
  );

  const handlersRef = useRef({
    handleClear,
    handleCopyYaml: () => handleCopy(yamlInput, 'yaml'),
    handleCopyIni: () => handleCopy(iniInput, 'ini'),
  });

  useEffect(() => {
    handlersRef.current = {
      handleClear,
      handleCopyYaml: () => handleCopy(yamlInput, 'yaml'),
      handleCopyIni: () => handleCopy(iniInput, 'ini'),
    };
  }, [handleClear, handleCopy, yamlInput, iniInput]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (yamlInput) {
          handlersRef.current.handleCopyYaml();
        } else if (iniInput) {
          handlersRef.current.handleCopyIni();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [yamlInput, iniInput]);

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
          <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
          <span className="truncate">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>

        {/* YAML Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="yaml-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                YAML
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownload(yamlInput, 'config.yaml')}
                disabled={!yamlInput}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download', 'Download')}
              </button>
              <button
                onClick={() => handleCopy(yamlInput, 'yaml')}
                disabled={!yamlInput}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border border-transparent focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === 'yaml'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
                title={`${t('common.copy', 'Copy')} (C)`}
              >
                {copied === 'yaml' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'yaml' ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
                {!copied && yamlInput && (
                  <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">
                    C
                  </Kbd>
                )}
              </button>
            </div>
          </div>
          <textarea
            id="yaml-input"
            ref={yamlRef}
            value={yamlInput}
            onChange={(e) => handleYamlChange(e.target.value)}
            placeholder="key: value"
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* INI Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="ini-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                INI
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                disabled={!yamlInput && !iniInput}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear', 'Clear')}
              </button>
              <button
                onClick={() => handleDownload(iniInput, 'config.ini')}
                disabled={!iniInput}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download', 'Download')}
              </button>
              <button
                onClick={() => handleCopy(iniInput, 'ini')}
                disabled={!iniInput}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border border-transparent focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied === 'ini'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                } disabled:opacity-50`}
                title={`${t('common.copy', 'Copy')} (C)`}
              >
                {copied === 'ini' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'ini' ? t('common.copied', 'Copied') : t('common.copy', 'Copy')}
                {!copied && !yamlInput && iniInput && (
                  <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/50 dark:bg-black/20 ml-1">
                    C
                  </Kbd>
                )}
              </button>
            </div>
          </div>
          <textarea
            id="ini-input"
            ref={iniRef}
            value={iniInput}
            onChange={(e) => handleIniChange(e.target.value)}
            placeholder="[section]&#10;key=value"
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('yamlini.about_title', 'About YAML <> INI')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'yamlini.about_text',
              'Convert between YAML and INI configuration formats. INI files are structured into sections and keys, whereas YAML supports nested hierarchy. Our converter flattens nested YAML properties using dots (.) in INI keys, and un-flattens dot notation back to nested structures when converting INI to YAML.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
