import { useState, useCallback } from 'react';
import { Copy, Check, Trash2, Type, FileText } from 'lucide-react';

export function CaseConverter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState('');

  const conversions = {
    'camelCase': (t: string) => {
      const words = t.toLowerCase().split(/[\s_-]+/);
      return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'PascalCase': (t: string) => {
      const words = t.toLowerCase().split(/[\s_-]+/);
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'snake_case': (t: string) => t.toLowerCase().replace(/[\s-]+/g, '_'),
    'SCREAMING_SNAKE_CASE': (t: string) => t.toUpperCase().replace(/[\s-]+/g, '_'),
    'kebab-case': (t: string) => t.toLowerCase().replace(/[\s_]+/g, '-'),
    'SCREAMING-KEBAB-CASE': (t: string) => t.toUpperCase().replace(/[\s_]+/g, '-'),
    'Title Case': (t: string) => t.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    'Sentence case': (t: string) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(),
    'UPPERCASE': (t: string) => t.toUpperCase(),
    'lowercase': (t: string) => t.toLowerCase(),
    'aLtErNaTiNg CaSe': (t: string) => t.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''),
    'iNVERSE cASE': (t: string) => t.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('')
  };

  const copyToClipboard = useCallback((converted: string, type: string) => {
    navigator.clipboard.writeText(converted);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="case-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Type className="w-4 h-4" /> Votre Texte
          </label>
          <button
            onClick={() => setText('')}
            disabled={!text}
            className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" /> Effacer
          </button>
        </div>
        <textarea
          id="case-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre texte ici..."
          className="w-full h-48 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 shadow-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(conversions).map(([name, converter]) => {
          const converted = text ? converter(text) : '';
          return (
            <div key={name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 space-y-4 shadow-sm group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{name}</span>
                <button
                  onClick={() => copyToClipboard(converted, name)}
                  disabled={!text}
                  className={`p-2 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    copied === name
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                  aria-label={`Copier ${name}`}
                >
                  {copied === name ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl font-mono text-sm min-h-[4rem] flex items-center break-all dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                {converted || <span className="text-slate-300 dark:text-slate-700 italic">Résultat...</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 border border-indigo-100 dark:border-indigo-900/30">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-500 flex-shrink-0 shadow-sm">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-black text-indigo-900 dark:text-indigo-400 mb-2">Guide des formats</h4>
            <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed">
              Le camelCase est couramment utilisé en JavaScript, le snake_case en Python et SQL, tandis que le kebab-case est privilégié pour les URLs et les sélecteurs CSS. Choisissez le format qui correspond le mieux à vos besoins de programmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
