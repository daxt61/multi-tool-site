import { useState, useMemo, useDeferredValue } from 'react';
import { Copy, Check, Trash2, CaseSensitive } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function CaseConverter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState('');

  // ⚡ Bolt Optimization: useDeferredValue for responsiveness
  const deferredText = useDeferredValue(text);

  const conversions = useMemo(() => ({
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
  }), []);

  const copyToClipboard = (converted: string, type: string) => {
    navigator.clipboard.writeText(converted);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="case-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte source</label>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 disabled:opacity-0 transition-all flex items-center gap-1"
            disabled={!text}
            aria-label="Effacer le texte"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="case-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre texte ici pour changer sa casse..."
          className="w-full h-48 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xl leading-relaxed dark:text-slate-300 shadow-inner"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(conversions).map(([name, converter]) => {
          const converted = deferredText ? converter(deferredText) : '';
          return (
            <div key={name} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl hover:border-indigo-500/30 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CaseSensitive className="w-4 h-4 text-indigo-500" />
                  <span className="font-black text-xs uppercase tracking-wider text-slate-400">{name}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(converted, name)}
                  disabled={!text}
                  className={`p-2 rounded-xl transition-all ${copied === name ? 'bg-emerald-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'} disabled:opacity-30`}
                  title="Copier"
                >
                  {copied === name ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl font-mono text-sm min-h-[4rem] break-all border border-slate-100 dark:border-slate-800/50 leading-relaxed text-slate-700 dark:text-slate-300">
                {converted || <span className="text-slate-300 dark:text-slate-700 italic">Le résultat apparaîtra ici...</span>}
              </div>
            </div>
          );
        })}
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
