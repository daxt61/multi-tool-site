import { useState, useMemo, useEffect } from 'react';
import { Copy, Check, Trash2, Settings2, Link2, Info, RefreshCw } from 'lucide-react';

export function SlugGenerator() {
  const [text, setText] = useState('Comment générer un super slug pour votre site ?');
  const [separator, setSeparator] = useState('-');
  const [lowercase, setLowercase] = useState(true);
  const [removeStopWords, setRemoveStopWords] = useState(false);
  const [copied, setCopied] = useState(false);

  const stopWords = ['le', 'la', 'les', 'de', 'des', 'un', 'une', 'et', 'ou', 'en', 'à', 'du', 'pour', 'dans', 'sur', 'avec'];

  const slug = useMemo(() => {
    let result = text
      .normalize('NFD') // Normalize Unicode (handles diacritics)
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

    if (lowercase) {
      result = result.toLowerCase();
    }

    // Remove non-alphanumeric characters (except spaces which will be separators)
    result = result.replace(/[^a-z0-9\s]/gi, ' ');

    let words = result.trim().split(/\s+/);

    if (removeStopWords) {
      words = words.filter(word => !stopWords.includes(word.toLowerCase()));
    }

    return words.join(separator);
  }, [text, separator, lowercase, removeStopWords]);

  const handleCopy = () => {
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte d'origine</label>
          <button onClick={() => setText('')} className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre titre ici..."
          className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl font-bold dark:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Settings2 className="w-3 h-3 text-indigo-500" /> Séparateur
          </label>
          <div className="flex gap-2">
            {['-', '_', '.', ''].map(s => (
              <button
                key={s}
                onClick={() => setSeparator(s)}
                className={`w-10 h-10 rounded-xl font-bold transition-all border ${
                  separator === s
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                {s || 'None'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Settings2 className="w-3 h-3 text-indigo-500" /> Options
          </label>
          <div className="space-y-3">
            <button
              onClick={() => setLowercase(!lowercase)}
              className="flex items-center gap-3 w-full text-sm font-bold"
            >
              <div className={`w-10 h-6 rounded-full transition-colors relative ${lowercase ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${lowercase ? 'left-5' : 'left-1'}`} />
              </div>
              Minuscules
            </button>
            <button
              onClick={() => setRemoveStopWords(!removeStopWords)}
              className="flex items-center gap-3 w-full text-sm font-bold"
            >
              <div className={`w-10 h-6 rounded-full transition-colors relative ${removeStopWords ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${removeStopWords ? 'left-5' : 'left-1'}`} />
              </div>
              Retirer stop-words
            </button>
          </div>
        </div>

        <div className="p-6 bg-indigo-500 rounded-3xl flex flex-col justify-between group transition-all hover:shadow-xl hover:shadow-indigo-500/20">
          <div className="flex justify-between items-start">
            <Link2 className="text-white/50 w-6 h-6" />
            <button
              onClick={handleCopy}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div>
            <div className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Slug généré</div>
            <div className="text-white font-mono font-bold break-all line-clamp-2">
              {slug || '...'}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Qu'est-ce qu'un slug ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Un slug est la partie d'une URL qui identifie une page particulière dans un format lisible par l'homme. Il est essentiel pour le SEO et l'expérience utilisateur.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-indigo-500" /> Normalisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Notre outil utilise la normalisation NFD pour transformer les caractères accentués (é, à, ç, etc.) en leurs équivalents ASCII de base pour assurer une compatibilité maximale des URLs.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" /> Stop Words
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'option "Retirer stop-words" permet d'alléger vos slugs en supprimant les mots de liaison communs (le, la, de, etc.) qui n'apportent pas de valeur SEO.
          </p>
        </div>
      </div>
    </div>
  );
}
