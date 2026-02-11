import { useState, useMemo } from 'react';
import { Copy, Check, Link as LinkIcon, Trash2, Info, Settings2 } from 'lucide-react';

const STOP_WORDS_FR = ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'au', 'aux', 'pour', 'dans', 'sur', 'ce', 'cette', 'ces', 'ma', 'mon', 'mes', 'ta', 'ton', 'tes', 'sa', 'son', 'ses'];

export function SlugGenerator() {
  const [text, setText] = useState('');
  const [separator, setSeparator] = useState('-');
  const [removeStopWords, setRemoveStopWords] = useState(false);
  const [lowercase, setLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    if (!text) return '';

    let result = text
      .normalize('NFD') // Normalize to decompose diacritics
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

    if (lowercase) {
      result = result.toLowerCase();
    }

    if (removeStopWords) {
      const words = result.split(/\s+/);
      result = words.filter(word => !STOP_WORDS_FR.includes(word.toLowerCase())).join(' ');
    }

    // Replace non-alphanumeric characters with the separator
    const safeSeparator = separator || '';
    if (!safeSeparator) {
      result = result.replace(/[^a-z0-9]+/gi, '');
    } else {
      // Safety check for separator to prevent invalid regex
      const escapedSeparator = safeSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`[^a-z0-9${escapedSeparator}]+`, 'gi');

      result = result
        .replace(regex, safeSeparator)
        .replace(new RegExp(`${escapedSeparator}+`, 'g'), safeSeparator)
        .replace(new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, 'g'), '');
    }

    return result;
  }, [text, separator, removeStopWords, lowercase]);

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte source</label>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez le titre ou le texte à transformer en slug..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg dark:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Configuration</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="separator" className="text-xs font-bold text-slate-500 px-1">Séparateur</label>
              <select
                id="separator"
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="-">Tiret (-)</option>
                <option value="_">Underscore (_)</option>
                <option value=".">Point (.)</option>
                <option value="">Aucun</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setRemoveStopWords(!removeStopWords)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  removeStopWords
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <span className="font-bold text-sm">Retirer les "stop words" (FR)</span>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  removeStopWords ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {removeStopWords && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              <button
                onClick={() => setLowercase(!lowercase)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  lowercase
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <span className="font-bold text-sm">Tout en minuscules</span>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  lowercase ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {lowercase && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] flex flex-col justify-center items-center text-center space-y-6 shadow-xl shadow-indigo-500/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-50"></div>

          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
            <LinkIcon className="w-3 h-3" /> Slug généré
          </div>

          <div className="w-full">
            <div className="text-2xl md:text-3xl font-black text-white font-mono break-all leading-tight min-h-[4rem] flex items-center justify-center px-4">
              {slug || <span className="opacity-20">votre-slug-ici</span>}
            </div>
          </div>

          <button
            onClick={handleCopy}
            disabled={!slug}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-white'
                : 'bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50'
            }`}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copié !' : 'Copier le slug'}
          </button>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="p-2 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-300">À quoi ça sert ?</h4>
          <p className="text-sm text-indigo-800 dark:text-indigo-400 leading-relaxed">
            Un slug est la partie d'une URL qui identifie une page particulière dans un format lisible par l'homme et optimisé pour les moteurs de recherche (SEO). Cet outil nettoie votre texte, retire les accents et les caractères spéciaux pour créer une URL propre.
          </p>
        </div>
      </div>
    </div>
  );
}
