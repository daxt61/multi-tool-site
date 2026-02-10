import { useState, useMemo } from 'react';
import { Copy, Check, RefreshCw, Link as LinkIcon, Trash2, Info } from 'lucide-react';

export function SlugGenerator() {
  const [input, setInput] = useState('');
  const [separator, setSeparator] = useState('-');
  const [lowercase, setLowercase] = useState(true);
  const [removeStopWords, setRemoveStopWords] = useState(false);
  const [copied, setCopied] = useState(false);

  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l', 'au', 'aux',
    'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or', 'soit', 'si', 'que',
    'sur', 'sous', 'dans', 'par', 'pour', 'avec', 'sans', 'ce', 'cet', 'cette', 'ces'
  ];

  const slug = useMemo(() => {
    if (!input) return '';

    let text = input
      .normalize('NFD') // Normalize diacritics
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

    if (lowercase) {
      text = text.toLowerCase();
    }

    // Replace non-alphanumeric characters with the separator
    let result = text
      .replace(/[^a-z0-9]/gi, ' ')
      .trim()
      .split(/\s+/);

    if (removeStopWords) {
      result = result.filter(word => !stopWords.includes(word.toLowerCase()));
    }

    return result.join(separator);
  }, [input, separator, lowercase, removeStopWords]);

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="slug-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
            Texte source
          </label>
          <button
            onClick={handleClear}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="slug-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Entrez votre titre ou texte ici..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg font-medium dark:text-slate-200"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="separator" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            Séparateur
          </label>
          <select
            id="separator"
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
            className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white cursor-pointer"
          >
            <option value="-">Trait d'union (-)</option>
            <option value="_">Tiret bas (_)</option>
            <option value=".">Point (.)</option>
            <option value="">Aucun</option>
          </select>
        </div>

        <button
          onClick={() => setLowercase(!lowercase)}
          className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
            lowercase
              ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
          }`}
        >
          <span className="font-bold text-sm">Tout en minuscules</span>
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
            lowercase ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
          }`}>
            {lowercase && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </button>

        <button
          onClick={() => setRemoveStopWords(!removeStopWords)}
          className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
            removeStopWords
              ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
          }`}
        >
          <span className="font-bold text-sm">Retirer mots outils (FR)</span>
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
            removeStopWords ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
          }`}>
            {removeStopWords && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </button>
      </div>

      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Slug généré</label>
              <div className="text-2xl md:text-3xl font-black font-mono break-all text-slate-900 dark:text-white">
                {slug || <span className="text-slate-300 dark:text-slate-700">votre-slug-ici</span>}
              </div>
            </div>
            <button
              onClick={handleCopy}
              disabled={!slug}
              className={`w-full md:w-auto px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-indigo-500" /> Qu'est-ce qu'un slug ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Un slug est la partie d'une URL qui identifie une page particulière dans un format lisible. Par exemple, pour un article intitulé "Comment créer un site web", le slug serait "comment-creer-un-site-web".
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Bonnes pratiques
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les slugs doivent être courts, descriptifs et ne contenir que des lettres minuscules, des chiffres et des traits d'union. Évitez les caractères spéciaux et les accents pour une compatibilité maximale.
          </p>
        </div>
      </div>
    </div>
  );
}
