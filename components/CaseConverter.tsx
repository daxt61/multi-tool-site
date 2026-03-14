import { useState, useMemo, useDeferredValue } from 'react';
import { Copy, Check, Trash2 } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function CaseConverter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState('');
  const deferredText = useDeferredValue(text);

  const conversions = useMemo(() => ({
    'camelCase': (t: string) => {
      const words = t.toLowerCase().split(/[\s_-]+/);
      if (words.length === 0 || words[0] === '') return '';
      return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'PascalCase': (t: string) => {
      const words = t.toLowerCase().split(/[\s_-]+/);
      if (words.length === 0 || words[0] === '') return '';
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
  }), []);

  const convertedResults = useMemo(() => {
    if (!deferredText) return {};
    const results: Record<string, string> = {};
    Object.entries(conversions).forEach(([name, converter]) => {
      results[name] = converter(deferredText);
    });
    return results;
  }, [deferredText, conversions]);

  const copyToClipboard = (converted: string, type: string) => {
    navigator.clipboard.writeText(converted);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6 opacity-50" />

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="case-input" className="text-xs font-black uppercase tracking-widest text-slate-600">Votre Texte</label>
          <button
            onClick={() => setText('')}
            className={`text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 ${!text ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="case-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre texte ici..."
          className="w-full h-40 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(conversions).map(([name]) => {
          const converted = convertedResults[name] || '';
          return (
            <div key={name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 transition-all hover:border-indigo-500/30 group">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-sm text-slate-600 dark:text-slate-600">{name}</span>
                <button
                  onClick={() => copyToClipboard(converted, name)}
                  disabled={!text}
                  className={`p-2 rounded-xl transition-all ${copied === name ? 'bg-emerald-500 text-white' : 'text-slate-600 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700'} disabled:opacity-30`}
                  title="Copier"
                >
                  {copied === name ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl font-mono text-sm min-h-[4rem] break-all flex items-center dark:text-slate-300">
                {converted || <span className="text-slate-600 dark:text-slate-600">Résultat...</span>}
              </div>
            </div>
          );
        })}
      </div>

      <AdPlaceholder size="medium" className="mt-12 opacity-50 mx-auto" />
    </div>
  );
}
