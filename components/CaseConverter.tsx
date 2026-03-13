import { useState, useMemo, useDeferredValue } from 'react';
import { Copy, Check, Trash2, Type, CaseSensitive } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function CaseConverter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState('');

  const deferredText = useDeferredValue(text);

  const conversions = useMemo(() => ({
    'camelCase': (t: string) => {
      if (!t) return '';
      const words = t.toLowerCase().split(/[\s_-]+/).filter(Boolean);
      if (words.length === 0) return '';
      return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'PascalCase': (t: string) => {
      if (!t) return '';
      const words = t.toLowerCase().split(/[\s_-]+/).filter(Boolean);
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'snake_case': (t: string) => t.toLowerCase().trim().replace(/[\s-]+/g, '_'),
    'SCREAMING_SNAKE_CASE': (t: string) => t.toUpperCase().trim().replace(/[\s-]+/g, '_'),
    'kebab-case': (t: string) => t.toLowerCase().trim().replace(/[\s_]+/g, '-'),
    'SCREAMING-KEBAB-CASE': (t: string) => t.toUpperCase().trim().replace(/[\s_]+/g, '-'),
    'Title Case': (t: string) => t.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    'Sentence case': (t: string) => t.length > 0 ? t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() : '',
    'UPPERCASE': (t: string) => t.toUpperCase(),
    'lowercase': (t: string) => t.toLowerCase(),
    'aLtErNaTiNg CaSe': (t: string) => t.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''),
    'iNVERSE cASE': (t: string) => t.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('')
  }), []);

  const results = useMemo(() => {
    const res: Record<string, string> = {};
    Object.entries(conversions).forEach(([name, converter]) => {
      res[name] = deferredText ? converter(deferredText) : '';
    });
    return res;
  }, [deferredText, conversions]);

  const copyToClipboard = (converted: string, type: string) => {
    if (!converted) return;
    navigator.clipboard.writeText(converted);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="case-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Type className="w-3 h-3" /> Votre texte
          </label>
          <button
            onClick={handleClear}
            disabled={!text}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 disabled:opacity-0 disabled:pointer-events-none flex items-center gap-1 transition-all"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="case-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez ou collez votre texte ici..."
          className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(results).map(([name, converted]) => (
          <div key={name} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:border-indigo-500/30 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <CaseSensitive className="w-3 h-3" /> {name}
              </span>
              <button
                onClick={() => copyToClipboard(converted, name)}
                disabled={!converted}
                className={`p-2 rounded-xl transition-all ${
                  copied === name
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 opacity-0 group-hover:opacity-100 disabled:opacity-0'
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
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl font-mono text-sm min-h-[4rem] break-all flex items-center dark:text-slate-300 border border-transparent group-hover:border-indigo-500/10 transition-colors">
              {converted || <span className="text-slate-400 italic">En attente de texte...</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <AdPlaceholder size="medium" />
      </div>
    </div>
  );
}
