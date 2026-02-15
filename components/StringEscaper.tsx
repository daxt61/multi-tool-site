import React, { useState, useCallback } from 'react';
import { Type, Copy, Check, Trash2, ArrowRightLeft } from 'lucide-react';

export function StringEscaper() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'escape' | 'unescape'>('escape');
  const [format, setFormat] = useState<'json' | 'html' | 'xml' | 'js'>('json');
  const [copied, setCopied] = useState(false);

  const escapeString = useCallback((str: string, fmt: typeof format) => {
    switch (fmt) {
      case 'json':
        return JSON.stringify(str).slice(1, -1);
      case 'html':
      case 'xml': {
        const mapping: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, (m) => mapping[m] || m);
      }
      case 'js':
        return str.replace(/[\\'"]/g, '\\$&').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
      default:
        return str;
    }
  }, []);

  const unescapeString = useCallback((str: string, fmt: typeof format) => {
    switch (fmt) {
      case 'json':
        try {
          return JSON.parse(`"${str}"`);
        } catch {
          return 'Erreur de décodage JSON';
        }
      case 'html':
      case 'xml':
        const doc = new DOMParser().parseFromString(str, 'text/html');
        return doc.documentElement.textContent || '';
      case 'js':
        try {
          // Dangerous to use eval, so we use a safer approach for basic escapes
          const mapping: Record<string, string> = {
            'n': '\n',
            'r': '\r',
            't': '\t',
            '\\': '\\',
            "'": "'",
            '"': '"'
          };
          return str.replace(/\\(n|r|t|\\|'|")/g, (_, m) => mapping[m] || m);
        } catch {
          return 'Erreur de décodage JS';
        }
      default:
        return str;
    }
  }, []);

  const handleProcess = useCallback(() => {
    if (mode === 'escape') {
      setOutput(escapeString(input, format));
    } else {
      setOutput(unescapeString(input, format));
    }
  }, [input, mode, format, escapeString, unescapeString]);

  // Process on input change
  React.useEffect(() => {
    handleProcess();
  }, [handleProcess]);

  const copyToClipboard = () => {
    navigator.clipboard?.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setInput('');
    setOutput('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="flex gap-2">
          {(['escape', 'unescape'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                mode === m ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {m === 'escape' ? 'Échapper' : 'Déséchapper'}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(['json', 'html', 'xml', 'js'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                format === f ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={clear}
          className="p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-2xl transition-all"
          title="Effacer"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Type className="w-4 h-4 text-indigo-500" />
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Entrée</label>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm resize-none dark:text-slate-300"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Résultat</label>
            </div>
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                copied ? 'bg-emerald-500 text-white' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            className="w-full h-80 p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm resize-none text-indigo-600 dark:text-indigo-400"
          />
        </div>
      </div>
    </div>
  );
}
