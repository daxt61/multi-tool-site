import { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Copy, Check, Trash2, FileCode, AlertCircle, Info, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function JSONToLaTeX({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [json, setJson] = useState(initialData?.json || '[\n  { "ID": 1, "Name": "Alice", "Score": 95 },\n  { "ID": 2, "Name": "Bob", "Score": 88 }\n]');
  const [includeHlines, setIncludeHlines] = useState(initialData?.includeHlines ?? true);
  const [vlines, setVlines] = useState(initialData?.vlines ?? true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ json, includeHlines, vlines });
  }, [json, includeHlines, vlines]);

  const escapeLaTeX = (str: string) => {
    const map: Record<string, string> = {
      '&': '\\&',
      '%': '\\%',
      '$': '\\$',
      '#': '\\#',
      '_': '\\_',
      '{': '\\{',
      '}': '\\}',
      '~': '\\textasciitilde{}',
      '^': '\\textasciicircum{}',
      '\\': '\\textbackslash{}'
    };
    return str.replace(/[&%$#_{}~^\\]/g, (m) => map[m] || m);
  };

  const generateLaTeX = useCallback(() => {
    if (!json.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    if (json.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(json);
      const data = Array.isArray(parsed) ? parsed : [parsed];

      if (data.length === 0) {
        setOutput('');
        setError(null);
        return;
      }

      const keys = Array.from(new Set(data.flatMap(obj => typeof obj === 'object' && obj !== null ? Object.keys(obj) : [])));
      const colFormat = vlines ? `|${keys.map(() => 'l').join('|')}|` : keys.map(() => 'l').join(' ');

      let latex = `\\begin{tabular}{${colFormat}}\n`;

      if (includeHlines) latex += '  \\hline\n';

      // Headers
      if (keys.length > 0) {
        latex += `  ${keys.map(k => `\\textbf{${escapeLaTeX(String(k))}}`).join(' & ')} \\\\\n`;
        if (includeHlines) latex += '  \\hline\n';
      }

      // Rows
      data.forEach(row => {
        if (typeof row === 'object' && row !== null) {
          latex += `  ${keys.map(k => escapeLaTeX(String((Object.prototype.hasOwnProperty.call(row, k) ? row[k] : null) ?? ''))).join(' & ')} \\\\\n`;
        } else {
          latex += `  \\multicolumn{${keys.length || 1}}{l}{${escapeLaTeX(String(row))}} \\\\\n`;
        }
        if (includeHlines) latex += '  \\hline\n';
      });

      latex += '\\end{tabular}';
      setOutput(latex);
      setError(null);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
      setOutput('');
    }
  }, [json, includeHlines, vlines, t]);

  useEffect(() => {
    const timeout = setTimeout(generateLaTeX, 300);
    return () => clearTimeout(timeout);
  }, [generateLaTeX]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setJson('');
    setOutput('');
    setError(null);
    textareaRef.current?.focus();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="latex-json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-3 h-3" /> {t('common.input')} JSON
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="latex-json-input"
            ref={textareaRef}
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='[{"ID": 1, "Name": "Alice"}]'
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex gap-4 items-center">
               <label htmlFor="latex-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                LaTeX tabular
              </label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={includeHlines}
                    onChange={(e) => setIncludeHlines(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">{t('json_latex.hlines')}</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={vlines}
                    onChange={(e) => setVlines(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">{t('json_latex.vlines')}</span>
                </label>
              </div>
            </div>
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
          <textarea
            id="latex-output"
            readOnly
            value={output}
            placeholder="LaTeX code will appear here..."
            className="w-full h-[400px] p-6 bg-slate-900 text-indigo-300 rounded-3xl outline-none font-mono text-sm leading-relaxed resize-none border border-slate-800 shadow-inner"
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
          <h4 className="font-bold dark:text-white">{t('json_latex.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('json_latex.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
