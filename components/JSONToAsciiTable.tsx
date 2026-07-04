import { useState, useEffect, useCallback } from 'react';
import { FileCode, Table, Copy, Check, Trash2, Download, AlertCircle, Info, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 50000;

type TableStyle = 'basic' | 'bordered' | 'unicode' | 'markdown';

export function JSONToAsciiTable({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || JSON.stringify([
    { id: 1, name: "John Doe", role: "Developer" },
    { id: 2, name: "Jane Smith", role: "Designer" },
    { id: 3, name: "Bob Johnson", role: "Manager" }
  ], null, 2));
  const [style, setStyle] = useState<TableStyle>(initialData?.style || 'bordered');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, style });
    generateTable();
  }, [input, style, onStateChange]);

  const generateTable = useCallback(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError(null);
        return;
      }
      if (input.length > MAX_LENGTH) {
        setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
        return;
      }

      const data = JSON.parse(input);
      if (!Array.isArray(data) || data.length === 0) {
        setError(t('jsontoascii.error_array'));
        return;
      }

      const keys = Object.keys(data[0]);
      // Sentinel: Helper for safe property access to prevent prototype leakage
      const getVal = (row: any, key: string) => Object.prototype.hasOwnProperty.call(row, key) ? row[key] : '';

      const columnWidths = keys.map(key => {
        return Math.max(
          key.length,
          ...data.map(row => String(getVal(row, key) ?? '').length)
        );
      });

      let result = '';

      const pad = (str: string, length: number) => str + ' '.repeat(Math.max(0, length - str.length));

      if (style === 'basic') {
        result += keys.map((key, i) => pad(key, columnWidths[i])).join('  ') + '\n';
        result += columnWidths.map(w => '-'.repeat(w)).join('  ') + '\n';
        data.forEach(row => {
          result += keys.map((key, i) => pad(String(getVal(row, key) ?? ''), columnWidths[i])).join('  ') + '\n';
        });
      } else if (style === 'bordered') {
        const line = '+' + columnWidths.map(w => '-'.repeat(w + 2)).join('+') + '+';
        result += line + '\n';
        result += '| ' + keys.map((key, i) => pad(key, columnWidths[i])).join(' | ') + ' |\n';
        result += line + '\n';
        data.forEach(row => {
          result += '| ' + keys.map((key, i) => pad(String(getVal(row, key) ?? ''), columnWidths[i])).join(' | ') + ' |\n';
        });
        result += line;
      } else if (style === 'unicode') {
        const top = '┌' + columnWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐';
        const mid = '├' + columnWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤';
        const bot = '└' + columnWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘';

        result += top + '\n';
        result += '│ ' + keys.map((key, i) => pad(key, columnWidths[i])).join(' │ ') + ' │\n';
        result += mid + '\n';
        data.forEach((row, idx) => {
          result += '│ ' + keys.map((key, i) => pad(String(getVal(row, key) ?? ''), columnWidths[i])).join(' │ ') + ' │\n';
        });
        result += bot;
      } else if (style === 'markdown') {
        const escape = (s: string) => s.replace(/\|/g, '\\|');
        result += '| ' + keys.map(escape).join(' | ') + ' |\n';
        result += '| ' + columnWidths.map(w => '-'.repeat(Math.max(3, w))).join(' | ') + ' |\n';
        data.forEach(row => {
          result += '| ' + keys.map(key => escape(String(getVal(row, key) ?? ''))).join(' | ') + ' |\n';
        });
      }

      setOutput(result);
      setError(null);
    } catch (e: any) {
      setError(t('error.invalid_json') + ': ' + e.message);
      setOutput('');
    }
  }, [input, style, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `table-ascii-${Date.now()}.txt`;
    a.click();
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('jsontoascii.json_input')}</label>
            </div>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
            >
              {t('common.clear')}
            </button>
          </div>
          <textarea
            id="json-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            placeholder='[{"col1": "val1", "col2": "val2"}]'
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('jsontoascii.ascii_output')}</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${copied ? 'bg-emerald-500 text-white' : 'text-slate-600 bg-slate-100 dark:bg-slate-800 border border-transparent'}`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <div className="w-full h-[400px] p-6 bg-slate-900 dark:bg-black border border-slate-800 rounded-3xl overflow-auto font-mono text-xs md:text-sm leading-none text-indigo-400 selection:bg-indigo-500/30 whitespace-pre">
            {output || <span className="text-slate-600 italic">{t('jsontoascii.placeholder')}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center items-center">
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Settings className="w-4 h-4 text-slate-400 ml-2" />
          <div className="flex gap-1">
            {(['bordered', 'unicode', 'basic', 'markdown'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${style === s ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {t(`jsontoascii.style_${s}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
        <Info className="w-6 h-6 text-indigo-600 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('jsontoascii.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('jsontoascii.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
