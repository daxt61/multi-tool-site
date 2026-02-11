import { useState, useCallback } from 'react';
import { Copy, Check, Trash2, Type, ArrowRight, Info } from 'lucide-react';

export function CaseConverter() {
  const [text, setText] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const conversions = {
    'camelCase': (t: string) => {
      const words = t.toLowerCase().trim().split(/[\s_-]+/);
      if (words.length === 0 || words[0] === '') return '';
      return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'PascalCase': (t: string) => {
      const words = t.toLowerCase().trim().split(/[\s_-]+/);
      if (words.length === 0 || words[0] === '') return '';
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'snake_case': (t: string) => t.toLowerCase().trim().replace(/[\s-]+/g, '_'),
    'CONSTANT_CASE': (t: string) => t.toUpperCase().trim().replace(/[\s-]+/g, '_'),
    'kebab-case': (t: string) => t.toLowerCase().trim().replace(/[\s_]+/g, '-'),
    'COBOL-CASE': (t: string) => t.toUpperCase().trim().replace(/[\s_]+/g, '-'),
    'Title Case': (t: string) => t.toLowerCase().trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    'Sentence case': (t: string) => {
        const trimmed = t.trim().toLowerCase();
        if (trimmed === '') return '';
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    },
    'UPPERCASE': (t: string) => t.toUpperCase(),
    'lowercase': (t: string) => t.toLowerCase(),
    'iNVERSE cASE': (t: string) => t.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''),
    'Reverse': (t: string) => t.split('').reverse().join('')
  };

  const copyToClipboard = useCallback((converted: string, type: string) => {
    if (!converted) return;
    navigator.clipboard.writeText(converted);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  }, []);

  const handleClear = () => {
    setText('');
    setCopiedType(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Input Area */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="case-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à convertir</label>
          <button
            onClick={handleClear}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="case-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tapez ou collez votre texte ici..."
          className="w-full h-40 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl leading-relaxed dark:text-slate-300 shadow-inner"
        />
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(conversions).map(([name, converter]) => {
          const converted = text ? converter(text) : '';
          const isCopied = copiedType === name;

          return (
            <div
              key={name}
              className="group bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Type className="w-3 h-3 text-indigo-500" /> {name}
                </span>
                <button
                  onClick={() => copyToClipboard(converted, name)}
                  disabled={!text}
                  className={`p-2 rounded-xl transition-all ${
                    isCopied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 disabled:opacity-30'
                  }`}
                  title="Copier"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="font-mono text-sm dark:text-slate-300 break-all line-clamp-3 min-h-[3rem] bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                {converted || <span className="text-slate-300 dark:text-slate-700 italic">En attente...</span>}
              </div>
              <div className="mt-4 flex justify-end">
                 <button
                  onClick={() => copyToClipboard(converted, name)}
                  disabled={!text}
                  className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1"
                 >
                   Copier <ArrowRight className="w-3 h-3" />
                 </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest text-xs">À propos des conversions</h4>
          <p className="text-sm text-indigo-800 dark:text-indigo-400 leading-relaxed font-medium">
            Ce convertisseur de casse traite votre texte localement. Il gère les espaces, les tirets et les underscores pour transformer vos phrases en formats compatibles avec la programmation (camelCase, snake_case) ou pour la mise en forme de titres.
          </p>
        </div>
      </div>
    </div>
  );
}
