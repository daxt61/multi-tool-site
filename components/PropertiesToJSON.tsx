import { useState, useEffect, useCallback, useRef } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Info, Download, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function PropertiesToJSON({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '# Example configuration\nserver.port=8080\nserver.host=localhost\ndatabase.url=jdbc:mysql://localhost:3306/db\ntags.0=production\ntags.1=web');
  const [unflatten, setUnflatten] = useState(initialData?.unflatten ?? true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, unflatten });
  }, [input, unflatten]);

  const parseProperties = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }

    try {
      const lines = input.split(/\r?\n/);
      const flatObj: Record<string, string> = Object.create(null);

      lines.forEach((line: string) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) return;

        const separatorIndex = trimmed.search(/[=:]/);
        if (separatorIndex === -1) return;

        const key = trimmed.substring(0, separatorIndex).trim();
        const value = trimmed.substring(separatorIndex + 1).trim();

        // Basic unescaping for properties
        const cleanValue = value
          .replace(/\\(.)/g, '$1')
          .replace(/\\u([0-9a-fA-F]{4})/g, (_: string, hex: string) => String.fromCharCode(parseInt(hex, 16)));

        flatObj[key] = cleanValue;
      });

      if (!unflatten) {
        setOutput(JSON.stringify(flatObj, null, 2));
        setError(null);
        return;
      }

      // Unflattening logic with Prototype Pollution protection
      const result: any = Object.create(null);

      Object.entries(flatObj).forEach(([key, value]) => {
        const parts = key.split('.');
        let current = result;

        for (let i = 0; i < parts.length; i++) {
          let part = parts[i];
          const lowerPart = part.toLowerCase();

          // Sentinel: Sanitize dangerous keys to prevent Prototype Pollution
          if (lowerPart === '__proto__' || lowerPart === 'constructor' || lowerPart === 'prototype') {
            part = `_${part}`;
          }

          if (i === parts.length - 1) {
            current[part] = value;
          } else {
            if (!(part in current) || typeof current[part] !== 'object') {
              current[part] = Object.create(null);
            }
            current = current[part];
          }
        }
      });

      setOutput(JSON.stringify(result, null, 2));
      setError(null);
    } catch (e: any) {
      setError('Parsing error: ' + e.message);
      setOutput('');
    }
  }, [input, unflatten, t]);

  useEffect(() => {
    const timeout = setTimeout(parseProperties, 300);
    return () => clearTimeout(timeout);
  }, [parseProperties]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
    textareaRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'config.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="prop-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-3 h-3" /> .properties Input
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="prop-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="key=value&#10;nested.key=value"
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex gap-4 items-center">
               <label htmlFor="json-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                JSON Output
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={unflatten}
                  onChange={(e) => setUnflatten(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">{t('properties_json.unflatten')}</span>
              </label>
            </div>
            <div className="flex gap-2">
               <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200'
                    : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="json-output"
            readOnly
            value={output}
            placeholder="JSON result will appear here..."
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-inner"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('properties_json.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('properties_json.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
