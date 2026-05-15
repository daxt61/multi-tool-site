import { useState, useEffect } from 'react';
import { FileCode, Copy, Check, Trash2, Download, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function HTMLFormatter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input]);

  const formatHTML = (html: string) => {
    let formatted = '';
    let indent = '';
    const tab = '  ';
    // Improved regex to handle tags more robustly while ignoring content inside strings
    const nodes = html.replace(/>\s+</g, '><').split(/(?=<)|(?<=>)/);

    nodes.forEach((node) => {
      if (node.startsWith('</')) {
        // Closing tag
        indent = indent.substring(tab.length);
        formatted += indent + node + '\n';
      } else if (node.startsWith('<') && !node.endsWith('/>') && !node.startsWith('<!') && !node.startsWith('<?') && !['br', 'hr', 'img', 'input', 'link', 'meta'].some(t => node.toLowerCase().startsWith('<' + t))) {
        // Opening tag
        formatted += indent + node + '\n';
        indent += tab;
      } else {
        // Content or self-closing/void tag
        formatted += indent + node + '\n';
      }
    });

    return formatted.trim();
  };

  const handleBeautify = () => {
    if (!input.trim()) return;
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    try {
      setOutput(formatHTML(input.trim()));
    } catch (e) {
      setError('Error formatting HTML');
    }
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    const minified = input
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ')
      .replace(/(\r\n|\n|\r)/gm, '')
      .trim();
    setOutput(minified);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `formatted-${Date.now()}.html`;
    link.click();
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
            <label htmlFor="html-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('common.input')}</label>
            <button
              onClick={() => {setInput(''); setOutput(''); setError(null);}}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="html-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="<div class='test'><h1>Hello</h1></div>"
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none shadow-sm"
          />
          <div className="flex gap-4">
            <button
              onClick={handleBeautify}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95"
            >
              Beautify
            </button>
            <button
              onClick={handleMinify}
              className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-lg hover:opacity-90 transition-all active:scale-95"
            >
              Minify
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="Formatted HTML will appear here..."
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm dark:text-slate-300 resize-none shadow-inner"
          />
        </div>
      </div>
    </div>
  );
}
