import { useState } from 'react';
import { Copy, Check, Trash2 } from 'lucide-react';
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
    'Sentence case': (t: string) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(),
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-2" />

      <div className="flex justify-between items-center px-1">
        <label htmlFor="case-converter-input" className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 cursor-pointer">Texte Source</label>
        <button
          onClick={() => setText('')}
          disabled={!text}
          className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Effacer le texte"
        >
          <Trash2 className="w-3.5 h-3.5" /> Effacer
        </button>
      </div>

      <textarea
        id="case-converter-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Entrez votre texte ici..."
        className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(conversions).map(([name, converter]) => {
          const converted = text ? converter(text) : '';
          return (
            <div key={name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400">{name}</span>
                <button
                  onClick={() => copyToClipboard(converted, name)}
                  disabled={!text}
                  className={`p-2 rounded-xl transition-all ${copied === name ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'} disabled:opacity-50`}
                  title="Copier"
                  aria-label={`Copier le résultat en ${name}`}
                >
                  {copied === name ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl font-mono text-sm min-h-[4rem] break-all dark:text-slate-300 flex items-center">
                {converted || <span className="text-slate-400 dark:text-slate-600">Résultat...</span>}
              </div>
            </div>
          );
        })}
      </div>

      <AdPlaceholder size="medium" className="mt-8 opacity-50" />
    </div>
  );
}
