import { useState } from 'react';
import { Copy, Check, Type, Trash2 } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

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
    'Sentence case': (t: string) => t.length > 0 ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '',
    'UPPERCASE': (t: string) => t.toUpperCase(),
    'lowercase': (t: string) => t.toLowerCase(),
    'aLtErNaTiNg CaSe': (t: string) => t.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''),
    'iNVERSE cASE': (t: string) => t.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('')
  };

  const copyToClipboard = (converted: string, type: string) => {
    navigator.clipboard.writeText(converted);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const clearAll = () => setText('');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-2" />

      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="case-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Source</label>
          {text && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg"
              aria-label="Effacer le texte"
            >
              <Trash2 className="w-3.5 h-3.5" /> Effacer
            </button>
          )}
        </div>
        <textarea
          id="case-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre texte ici pour le convertir..."
          className="w-full h-40 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white text-lg leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(conversions).map(([name, converter]) => {
          const converted = text ? converter(text) : '';
          return (
            <div key={name} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm group hover:border-indigo-500/50 transition-all flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{name}</span>
                <button
                  onClick={() => copyToClipboard(converted, name)}
                  disabled={!text}
                  className={`p-2 rounded-xl transition-all ${
                    copied === name
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30'
                  }`}
                  aria-label={`Copier en ${name}`}
                >
                  {copied === name ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl font-mono text-sm min-h-[4.5rem] break-all dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800/50">
                {converted || <span className="text-slate-300 dark:text-slate-700 italic">Résultat...</span>}
              </div>
            </div>
          );
        })}
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
