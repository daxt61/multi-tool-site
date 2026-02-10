import React, { useState, useMemo } from 'react';
import { Copy, Check, RefreshCw, Trash2, Link } from 'lucide-react';

const STOP_WORDS_FR = [
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'au', 'aux',
  'ce', 'cette', 'ces', 'dans', 'pour', 'sur', 'par', 'avec', 'sans', 'sous',
  'mon', 'ton', 'son', 'notre', 'votre', 'leur', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses'
];

export function SlugGenerator() {
  const [text, setText] = useState('');
  const [separator, setSeparator] = useState('-');
  const [removeStopWords, setRemoveStopWords] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    if (!text) return '';

    // Normalize: remove accents
    let result = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    // Remove non-alphanumeric characters (except spaces)
    result = result.replace(/[^a-z0-9\s-]/g, '');

    // Handle stop words
    if (removeStopWords) {
      result = result.split(/\s+/)
        .filter(word => !STOP_WORDS_FR.includes(word))
        .join(' ');
    }

    // Replace spaces and existing separators with chosen separator
    result = result.replace(/[\s-]+/g, separator || ' ');

    if (separator) {
      result = result.replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
    } else {
      result = result.trim();
    }

    return result;
  }, [text, separator, removeStopWords]);

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard?.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte source</label>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre titre ou texte ici..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl font-medium"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Séparateur</label>
            <div className="flex gap-2">
              {['-', '_', '.', ''].map((s) => (
                <button
                  key={s || 'none'}
                  onClick={() => setSeparator(s)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all border ${
                    separator === s
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-lg'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {s === '' ? 'Aucun' : s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setRemoveStopWords(!removeStopWords)}
            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
              removeStopWords
                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
          >
            <span className="font-bold text-sm">Retirer les "stop words" (FR)</span>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
              removeStopWords ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
            }`}>
              {removeStopWords && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>
        </div>

        <div className="bg-slate-900 dark:bg-black p-8 rounded-3xl shadow-xl shadow-indigo-500/5 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Link className="w-24 h-24 text-white rotate-12" />
          </div>

          <div className="space-y-4 relative z-10">
            <label className="text-xs font-black uppercase tracking-widest text-white/40">Slug généré</label>
            <div className="text-2xl font-mono text-white break-all leading-relaxed">
              {slug || <span className="text-white/20">votre-slug-ici</span>}
            </div>
          </div>

          <button
            onClick={handleCopy}
            disabled={!slug}
            className={`mt-8 w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
              copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
            {copied ? 'Copié !' : 'Copier le slug'}
          </button>
        </div>
      </div>
    </div>
  );
}
