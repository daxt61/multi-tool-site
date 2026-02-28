import { useState, useMemo } from 'react';
import { Copy, Check, Trash2, Link as LinkIcon, Settings2, Sparkles } from 'lucide-react';

const FRENCH_STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'l', 'd', 'm', 's', 't', 'n', 'j',
  'au', 'aux', 'en', 'pour', 'dans', 'sur', 'par', 'avec', 'sous', 'chez',
  'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or',
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
  'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
  'ce', 'cet', 'cette', 'ces', 'que', 'qui', 'quoi', 'dont', 'où'
]);

export function SlugGenerator() {
  const [text, setText] = useState('');
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    if (!text) return '';

    // 1. Normalize NFD to separate diacritics from base characters
    // 2. Remove diacritics (U+0300 to U+036F)
    let processed = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    // Replace non-alphanumeric characters with spaces to facilitate word splitting
    processed = processed.replace(/[^a-z0-9]+/g, ' ').trim();

    let words = processed.split(/\s+/);

    if (removeStopWords) {
      words = words.filter(word => !FRENCH_STOP_WORDS.has(word));
    }

    return words.join('-').replace(/-+/g, '-');
  }, [text, removeStopWords]);

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte source</label>
          </div>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre titre ou texte ici pour générer un slug..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      {/* Options & Result */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-slate-400">
            <Settings2 className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs">Options</h3>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={removeStopWords}
                onChange={(e) => setRemoveStopWords(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:bg-indigo-500 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4"></div>
            </div>
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              Retirer les stop words
            </span>
          </label>

          <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
            Supprime les articles (le, la, des...), pronoms et prépositions pour des URLs plus courtes et optimisées SEO.
          </p>
        </div>

        {/* Result */}
        <div className="lg:col-span-2 p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 text-indigo-500">
              <LinkIcon className="w-5 h-5" />
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Slug généré</h3>
            </div>
            <button
              onClick={handleCopy}
              disabled={!slug}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 ${
                copied
                  ? "bg-emerald-500 text-white"
                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 disabled:opacity-50"
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl min-h-[5rem] flex items-center break-all font-mono text-sm text-indigo-600 dark:text-indigo-400 leading-relaxed border border-indigo-100/50 dark:border-indigo-900/30">
            {slug || <span className="text-slate-400 italic">Le slug apparaîtra ici...</span>}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Pourquoi optimiser vos slugs ?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-sm font-bold text-indigo-800 dark:text-indigo-400">🚀 SEO Friendly</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-500 leading-relaxed">
              Des URLs propres et contenant uniquement les mots-clés essentiels aident les moteurs de recherche à comprendre le contenu de votre page.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-indigo-800 dark:text-indigo-400">📱 Meilleure lisibilité</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-500 leading-relaxed">
              Les utilisateurs préfèrent les liens courts et explicites. Ils sont plus faciles à lire, à mémoriser et à partager sur les réseaux sociaux.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
