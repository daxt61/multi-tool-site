import { useState, useEffect } from 'react';
import { Type, Copy, Check, Trash2, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type EscapeFormat = 'json' | 'html' | 'sql';

export function StringEscaper({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState(initialData?.output || '');
  const [format, setFormat] = useState<EscapeFormat>(initialData?.format || 'json');
  const [isEscaping, setIsEscaping] = useState(initialData?.isEscaping ?? true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, output, format, isEscaping });
  }, [input, output, format, isEscaping]);

  const escapeString = (str: string, fmt: EscapeFormat): string => {
    switch (fmt) {
      case 'json':
        return JSON.stringify(str).slice(1, -1);
      case 'html':
        return str.replace(/[&<>"']/g, (m) => {
          switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return m;
          }
        });
      case 'sql':
        return str.replace(/'/g, "''");
      default:
        return str;
    }
  };

  const unescapeString = (str: string, fmt: EscapeFormat): string => {
    switch (fmt) {
      case 'json':
        try {
          return JSON.parse('"' + str.replace(/"/g, '\\"') + '"');
        } catch {
          // Fallback for cases where simple wrapping doesn't work
          return str.replace(/\\(.)/g, (m, p1) => {
            switch (p1) {
              case 'n': return '\n';
              case 'r': return '\r';
              case 't': return '\t';
              case 'b': return '\b';
              case 'f': return '\f';
              case '\\': return '\\';
              case '"': return '"';
              case "'": return "'";
              default: return p1;
            }
          });
        }
      case 'html':
        const doc = new DOMParser().parseFromString(str, 'text/html');
        return doc.documentElement.textContent || str;
      case 'sql':
        return str.replace(/''/g, "'");
      default:
        return str;
    }
  };

  const handleProcess = () => {
    if (isEscaping) {
      setOutput(escapeString(input, format));
    } else {
      setOutput(unescapeString(input, format));
    }
  };

  useEffect(() => {
    handleProcess();
  }, [input, format, isEscaping]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setIsEscaping(true)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${isEscaping ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t('stringescaper.escape')}
          </button>
          <button
            onClick={() => setIsEscaping(false)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${!isEscaping ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t('stringescaper.unescape')}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <label htmlFor="format-select" className="text-sm font-bold text-slate-500">
            {t('stringescaper.format')}
          </label>
          <select
            id="format-select"
            value={format}
            onChange={(e) => setFormat(e.target.value as EscapeFormat)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="json">JSON / JavaScript</option>
            <option value="html">HTML Entities</option>
            <option value="sql">SQL (Single Quotes)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label htmlFor="string-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('common.input')}
              </label>
            </div>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="string-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('stringescaper.placeholder_input')}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
              <label htmlFor="string-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('common.output')}
              </label>
            </div>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <textarea
            id="string-output"
            value={output}
            readOnly
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>
    </div>
  );
}
