import React, { useState, useMemo } from 'react';
import { Copy, Check, Trash2, Code, FileText, Braces } from 'lucide-react';

type Mode = 'json' | 'html' | 'xml' | 'js';

export function StringEscaper() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('json');
  const [copied, setCopied] = useState(false);

  const escape = (str: string, mode: Mode) => {
    if (!str) return '';
    switch (mode) {
      case 'json':
        return JSON.stringify(str).slice(1, -1);
      case 'html':
        return str.replace(/[&<>"']/g, (m) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        }[m] || m));
      case 'xml':
        return str.replace(/[<>&"']/g, (m) => ({
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&apos;'
        }[m] || m));
      case 'js':
        return str.replace(/[\\'"]/g, "\\$&")
          .replace(/\n/g, "\\n")
          .replace(/\r/g, "\\r")
          .replace(/\t/g, "\\t");
      default:
        return str;
    }
  };

  const unescape = (str: string, mode: Mode) => {
    if (!str) return '';
    try {
      switch (mode) {
        case 'json':
          return JSON.parse('"' + str.replace(/"/g, '\\"') + '"');
        case 'html': {
          const doc = new DOMParser().parseFromString(str, 'text/html');
          return doc.documentElement.textContent || '';
        }
        case 'xml': {
          const doc = new DOMParser().parseFromString(`<root>${str}</root>`, 'text/xml');
          return doc.documentElement.textContent || '';
        }
        case 'js':
          return str.replace(/\\n/g, "\n")
            .replace(/\\r/g, "\r")
            .replace(/\\t/g, "\t")
            .replace(/\\(.)/g, "$1");
        default:
          return str;
      }
    } catch (e) {
      return 'Erreur de décodage';
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Mode Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'json', name: 'JSON', icon: Braces },
            { id: 'js', name: 'JavaScript', icon: Code },
            { id: 'html', name: 'HTML', icon: FileText },
            { id: 'xml', name: 'XML', icon: Code },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as Mode)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === item.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Brut</label>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setInput(escape(input, mode))}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
            >
              Échapper (Escape)
            </button>
            <button
              onClick={() => setInput(unescape(input, mode))}
              className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all"
            >
              Déchapper (Unescape)
            </button>
          </div>
        </div>

        {/* Result */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Résultat</label>
            <button
              onClick={() => handleCopy(input)}
              className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <div className="w-full h-[400px] p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2rem] font-mono text-sm leading-relaxed overflow-auto whitespace-pre-wrap break-all">
            {input || <span className="text-slate-600 italic">Le résultat apparaîtra ici...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
