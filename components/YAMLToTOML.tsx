import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, ArrowLeftRight, Download, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import yaml from 'js-yaml';
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function YAMLToTOML({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const yamlRef = useRef<HTMLTextAreaElement>(null);
  const tomlRef = useRef<HTMLTextAreaElement>(null);

  const [yamlInput, setYamlInput] = useState(initialData?.yamlInput || 'title: "Project Configuration"\nversion: 1.0.0\nenabled: true\n\ndatabase:\n  host: "localhost"\n  port: 5432\n  tags:\n    - "production"\n    - "read-only"');
  const [tomlInput, setTomlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'yaml' | 'toml' | null>(null);

  const convertYamlToToml = useCallback((input: string) => {
    try {
      if (!input.trim()) {
        setTomlInput('');
        setError(null);
        return;
      }
      const parsed = yaml.load(input);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error(t('jsontotoml.error_object', 'Root of TOML must be an object (table)'));
      }
      const result = stringifyToml(parsed as any);
      setTomlInput(result);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [t]);

  const convertTomlToYaml = useCallback((input: string) => {
    try {
      if (!input.trim()) {
        setYamlInput('');
        setError(null);
        return;
      }
      const parsed = parseToml(input);
      const result = yaml.dump(parsed, { indent: 2, noRefs: true });
      setYamlInput(result);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    convertYamlToToml(yamlInput);
  }, []);

  useEffect(() => {
    onStateChange?.({ yamlInput });
  }, [yamlInput, onStateChange]);

  const handleYamlChange = (val: string) => {
    setYamlInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    convertYamlToToml(val);
  };

  const handleTomlChange = (val: string) => {
    setTomlInput(val);
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    convertTomlToYaml(val);
  };

  const handleClear = useCallback(() => {
    setYamlInput('');
    setTomlInput('');
    setError(null);
    yamlRef.current?.focus();
  }, []);

  const handleCopy = useCallback((type: 'yaml' | 'toml') => {
    const text = type === 'yaml' ? yamlInput : tomlInput;
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(null), 2000);
  }, [yamlInput, tomlInput, t]);

  const handleDownload = (type: 'yaml' | 'toml') => {
    const text = type === 'yaml' ? yamlInput : tomlInput;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `config.${type}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key === 'Escape') {
        e.preventDefault();
        handleClear();
        return;
      }
      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* YAML Side */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="yaml-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <FileCode className="w-4 h-4 text-indigo-500" /> YAML
            </label>
            <div className="flex gap-2 items-center">
               <button
                onClick={() => handleDownload('yaml')}
                disabled={!yamlInput}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleCopy('yaml')}
                disabled={!yamlInput}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied === 'yaml'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                } disabled:opacity-50`}
              >
                {copied === 'yaml' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <textarea
            id="yaml-input"
            ref={yamlRef}
            value={yamlInput}
            onChange={(e) => handleYamlChange(e.target.value)}
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            placeholder="key: value"
          />
        </div>

        {/* TOML Side */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="toml-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <FileCode className="w-4 h-4 text-emerald-500" /> TOML
            </label>
            <div className="flex gap-2 items-center">
               <button
                onClick={() => handleDownload('toml')}
                disabled={!tomlInput}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleCopy('toml')}
                disabled={!tomlInput}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied === 'toml'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                } disabled:opacity-50`}
              >
                {copied === 'toml' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <textarea
            id="toml-input"
            ref={tomlRef}
            value={tomlInput}
            onChange={(e) => handleTomlChange(e.target.value)}
            className="w-full h-[500px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            placeholder='key = "value"'
          />
        </div>
      </div>

      <div className="flex justify-center items-center gap-4">
         <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
         <button
            onClick={handleClear}
            className="px-6 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full font-bold text-sm border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 transition-all flex items-center gap-2 group"
          >
            <Trash2 className="w-4 h-4" /> {t('common.clear')}
            <Kbd modifier={null} className="bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
         </button>
         <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">YAML &lt;&gt; TOML</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('yaml_toml.about_text', 'Convert between YAML and TOML formats instantly. Both formats are popular for configuration files. Note that TOML requires a root object (table), so arrays or primitive values at the root of a YAML file cannot be converted to TOML.')}
          </p>
        </div>
      </div>
    </div>
  );
}
