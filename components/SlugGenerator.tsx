import { useState, useMemo } from 'react';
import { Copy, Check, Trash2, Settings2, Info, Link as LinkIcon } from 'lucide-react';

const FRENCH_STOP_WORDS = new Set([
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'à', 'en', 'par', 'pour', 'sur', 'dans', 'avec', 'ce', 'cette', 'ces',
  'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
  'ne', 'pas', 'que', 'qui', 'quoi', 'dont', 'où', 'si', 'y', 'au', 'aux', 'se'
]);

export function SlugGenerator() {
  const [text, setText] = useState('');
  const [separator, setSeparator] = useState('-');
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    if (!text) return '';

    // Validate separator to prevent ReDoS or invalid RegExp
    const safeSeparator = separator || '-';

    let result = text
      .normalize('NFD') // Normalize diacritics
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

    if (lowercase) {
      result = result.toLowerCase();
    }

    // Split by non-alphanumeric characters
    let words = result.split(/[^a-z0-9]+/i).filter(Boolean);

    if (removeStopWords) {
      words = words.filter(word => !FRENCH_STOP_WORDS.has(word.toLowerCase()));
    }

    return words.join(safeSeparator);
  }, [text, separator, removeStopWords, lowercase]);

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte source</label>
              <button
                onClick={() => setText('')}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Entrez votre titre ou texte ici..."
              className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white resize-none"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="separator" className="text-sm font-bold text-slate-600 dark:text-slate-400">Séparateur</label>
                <input
                  id="separator"
                  type="text"
                  maxLength={1}
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-center outline-none focus:border-indigo-500 transition-all dark:text-white"
                />
              </div>

              <div className="flex flex-col justify-end space-y-3">
                <button
                  onClick={() => setRemoveStopWords(!removeStopWords)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    removeStopWords ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold">Retirer stop words</span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${removeStopWords ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                    {removeStopWords && <Check className="w-3 h-3" />}
                  </div>
                </button>
                <button
                  onClick={() => setLowercase(!lowercase)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    lowercase ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold">Minuscules</span>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${lowercase ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                    {lowercase && <Check className="w-3 h-3" />}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex-grow bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-6 shadow-xl shadow-indigo-500/10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50"></div>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Slug Généré</div>

            <div className="w-full break-all text-2xl md:text-3xl font-black text-white font-mono tracking-tight leading-relaxed">
              {slug || 'votre-slug-ici'}
            </div>

            <button
              onClick={handleCopy}
              disabled={!slug}
              className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 ${
                copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copié !' : 'Copier le slug'}
            </button>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-[2rem] flex items-start gap-4">
            <div className="p-2 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl shadow-sm">
              <Info className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-indigo-900 dark:text-indigo-300 font-bold">Optimisation SEO</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed font-medium">
                Un slug propre et court favorise le référencement naturel. En retirant les mots de liaison (stop words), vous rendez vos URLs plus lisibles pour les moteurs de recherche.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
