import { useState } from 'react';
import { Copy, Check, Trash2, CaseSensitive } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function CaseConverter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState('');

  const conversions = {
    'camelCase': (t: string) => {
      const words = t.toLowerCase().split(/[\s_-]+/);
      if (words.length === 0 || (words.length === 1 && words[0] === '')) return '';
      return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'PascalCase': (t: string) => {
      const words = t.toLowerCase().split(/[\s_-]+/);
      if (words.length === 0 || (words.length === 1 && words[0] === '')) return '';
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'snake_case': (t: string) => t.toLowerCase().replace(/[\s-]+/g, '_'),
    'SCREAMING_SNAKE': (t: string) => t.toUpperCase().replace(/[\s-]+/g, '_'),
    'kebab-case': (t: string) => t.toLowerCase().replace(/[\s_]+/g, '-'),
    'SCREAMING-KEBAB': (t: string) => t.toUpperCase().replace(/[\s_]+/g, '-'),
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <CaseSensitive className="w-4 h-4 text-indigo-500" />
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Texte</label>
          </div>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
            aria-label="Effacer le texte"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre texte ici..."
          className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg font-medium dark:text-white resize-none shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(conversions).map(([name, converter]) => {
          const converted = text ? converter(text) : '';
          return (
            <div key={name} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:border-indigo-500/30 transition-all group shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{name}</span>
                <button
                  onClick={() => copyToClipboard(converted, name)}
                  disabled={!text}
                  className={`p-2 rounded-xl transition-all ${copied === name ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 opacity-0 group-hover:opacity-100 active:scale-95 disabled:opacity-0'}`}
                  title="Copier"
                  aria-label={`Copier en ${name}`}
                >
                  {copied === name ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className={`font-mono text-sm break-all leading-relaxed ${text ? 'text-slate-900 dark:text-slate-100' : 'text-slate-300 dark:text-slate-700'}`}>
                {converted || 'Résultat...'}
              </div>
            </div>
          );
        })}
      </div>

      <AdPlaceholder size="banner" />

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">À propos de la conversion de casse</h4>
        <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
          La conversion de casse est essentielle en programmation et en rédaction technique. Que ce soit pour des variables (camelCase, snake_case) ou pour des titres (Title Case), cet outil vous permet de transformer instantanément vos textes sans erreur manuelle.
        </p>
      </div>
    </div>
  );
}
