import React, { useState, useMemo } from 'react';
import { Link as LinkIcon, Copy, Check, RefreshCw, Settings2 } from 'lucide-react';

export function SlugGenerator() {
  const [text, setText] = useState('Voici un titre à transformer en slug !');
  const [separator, setSeparator] = useState('-');
  const [lowercase, setLowercase] = useState(true);
  const [removeStopWords, setRemoveStopWords] = useState(false);
  const [copied, setCopied] = useState(false);

  const stopWords = ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'au', 'aux', 'ce', 'cette', 'ces', 'sur', 'pour', 'dans'];

  const slug = useMemo(() => {
    if (!text) return '';

    let result = text
      .normalize('NFD') // Normalize to decompose characters (e.g., é -> e + ´)
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

    if (lowercase) {
      result = result.toLowerCase();
    }

    // Replace non-alphanumeric characters with space
    result = result.replace(/[^a-z0-9]/gi, ' ');

    if (removeStopWords) {
       const words = result.split(/\s+/);
       result = words.filter(w => !stopWords.includes(w.toLowerCase())).join(' ');
    }

    return result
      .trim()
      .split(/\s+/)
      .join(separator);
  }, [text, separator, lowercase, removeStopWords]);

  const handleCopy = () => {
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte d'entrée</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-32 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-bold text-xl dark:text-white"
            placeholder="Entrez votre texte ici..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Séparateur</label>
            <div className="flex gap-2">
              {['-', '_', '.', ''].map(s => (
                <button
                  key={s}
                  onClick={() => setSeparator(s)}
                  className={`flex-1 h-12 rounded-xl font-bold transition-all border ${
                    separator === s
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {s === '' ? 'Aucun' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={() => setLowercase(!lowercase)}
              className={`h-12 px-4 rounded-xl font-bold text-sm transition-all border flex items-center justify-between ${
                lowercase
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-400'
              }`}
            >
              Minuscules {lowercase && <Check className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-col justify-end">
             <button
              onClick={() => setRemoveStopWords(!removeStopWords)}
              className={`h-12 px-4 rounded-xl font-bold text-sm transition-all border flex items-center justify-between ${
                removeStopWords
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-400'
              }`}
            >
              Filtrer mots courts {removeStopWords && <Check className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={() => setText('')}
              className="h-12 px-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 transition-all"
            >
              Effacer tout
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 min-w-0 w-full">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Slug Généré</div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl font-mono text-xl md:text-3xl text-white break-all min-h-[5rem] flex items-center">
              {slug || 'votre-slug-apparaitra-ici'}
            </div>
          </div>

          <button
            onClick={handleCopy}
            disabled={!slug}
            className={`shrink-0 w-full md:w-auto h-20 md:h-32 px-10 rounded-[2rem] font-black text-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
              copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
            }`}
          >
            {copied ? <Check className="w-8 h-8" /> : <Copy className="w-8 h-8" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      </div>
    </div>
  );
}
