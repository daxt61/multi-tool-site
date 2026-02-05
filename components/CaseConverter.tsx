import { useState, useMemo } from 'react';
import { Copy, Check, Trash2, Type } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function CaseConverter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState('');

  const conversions = useMemo(() => ({
    'camelCase': (t: string) => {
      const words = t.trim().toLowerCase().split(/[\s_-]+/);
      if (words.length === 0 || words[0] === '') return '';
      return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'PascalCase': (t: string) => {
      const words = t.trim().toLowerCase().split(/[\s_-]+/);
      if (words.length === 0 || words[0] === '') return '';
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'snake_case': (t: string) => t.trim().toLowerCase().replace(/[\s-]+/g, '_'),
    'SCREAMING_SNAKE_CASE': (t: string) => t.trim().toUpperCase().replace(/[\s-]+/g, '_'),
    'kebab-case': (t: string) => t.trim().toLowerCase().replace(/[\s_]+/g, '-'),
    'SCREAMING-KEBAB-CASE': (t: string) => t.trim().toUpperCase().replace(/[\s_]+/g, '-'),
    'Title Case': (t: string) => t.trim().toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    'Sentence case': (t: string) => {
      const trimmed = t.trim();
      if (!trimmed) return '';
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    },
    'UPPERCASE': (t: string) => t.toUpperCase(),
    'lowercase': (t: string) => t.toLowerCase(),
    'tOGGLE cASE': (t: string) => t.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''),
    'aLtErNaTiNg CaSe': (t: string) => t.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''),
    'iNVERSE cASE': (t: string) => t.split('').reverse().join('')
  }), []);

  const copyToClipboard = (converted: string, type: string) => {
    navigator.clipboard.writeText(converted);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Input Area */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2 text-indigo-500">
            <Type className="w-4 h-4" />
            <label htmlFor="input-text" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Texte à convertir</label>
          </div>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="input-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez ou collez votre texte ici..."
          className="w-full h-48 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-lg outline-none focus:border-indigo-500 transition-all dark:text-white resize-none shadow-inner"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(conversions).map(([name, converter]) => {
          const converted = text ? converter(text) : '';
          return (
            <div key={name} className="group p-5 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all flex flex-col h-full shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{name}</span>
                <button
                  onClick={() => copyToClipboard(converted, name)}
                  disabled={!text}
                  className={`p-2 rounded-xl transition-all ${
                    copied === name
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 disabled:opacity-30'
                  }`}
                  title="Copier"
                >
                  {copied === name ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex-grow bg-slate-50/50 dark:bg-slate-800/50 p-4 rounded-2xl font-mono text-sm break-all leading-relaxed dark:text-slate-300 min-h-[4rem]">
                {converted || <span className="text-slate-300 dark:text-slate-600 italic text-xs">En attente de texte...</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-8">
        <AdPlaceholder size="banner" className="opacity-50" />
      </div>
    </div>
  );
}
