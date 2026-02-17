import { useState } from 'react';
import { Scissors, Copy, Check, RotateCcw, ArrowLeftRight } from 'lucide-react';

export function StringEscaper() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'escape' | 'unescape'>('escape');
  const [format, setFormat] = useState<'json' | 'html' | 'xml' | 'js'>('json');
  const [copied, setCopied] = useState(false);

  const escapeString = (str: string, fmt: typeof format) => {
    switch (fmt) {
      case 'json':
        return JSON.stringify(str).slice(1, -1);
      case 'html':
      case 'xml':
        return str.replace(/[&<>"']/g, (m) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[m] || m));
      case 'js':
        return str.replace(/[\\'"\n\r\t]/g, (m) => ({
          '\\': '\\\\',
          "'": "\\'",
          '"': '\\"',
          '\n': '\\n',
          '\r': '\\r',
          '\t': '\\t'
        }[m] || m));
      default:
        return str;
    }
  };

  const unescapeString = (str: string, fmt: typeof format) => {
    switch (fmt) {
      case 'json':
        try {
          return JSON.parse('"' + str + '"');
        } catch {
          return 'Erreur de décodage JSON';
        }
      case 'html':
      case 'xml':
        const doc = new DOMParser().parseFromString(str, 'text/html');
        return doc.documentElement.textContent || str;
      case 'js':
        const map: Record<string, string> = {
          '\\\\': '\\',
          "\\'": "'",
          '\\"': '"',
          '\\n': '\n',
          '\\r': '\r',
          '\\t': '\t'
        };
        return str.replace(/\\(\\|'|"|n|r|t)/g, (m) => map[m] || m);
      default:
        return str;
    }
  };

  const result = mode === 'escape' ? escapeString(input, format) : unescapeString(input, format);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setMode('escape')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'escape' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Échapper
          </button>
          <button
            onClick={() => setMode('unescape')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'unescape' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Déséchapper
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {(['json', 'html', 'xml', 'js'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormat(fmt)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                format === fmt
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="input" className="text-xs font-black uppercase tracking-widest text-slate-400">Entrée</label>
            <button onClick={() => setInput('')} className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
          <textarea
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none dark:text-slate-300"
            placeholder="Collez votre texte ici..."
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Résultat</label>
            <button
              onClick={handleCopy}
              className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <div className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-sm overflow-auto break-all dark:text-slate-300">
            {result}
          </div>
        </div>
      </div>
    </div>
  );
}
