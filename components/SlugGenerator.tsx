import { useState, useMemo } from 'react';
import { Copy, Check, Trash2, Link, Settings2, Sparkles } from 'lucide-react';

export function SlugGenerator() {
  const [text, setText] = useState('');
  const [separator, setSeparator] = useState('-');
  const [removeStopWords, setRemoveStopWords] = useState(false);
  const [lowercase, setLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l', 'au', 'aux',
    'ce', 'cet', 'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
    'notre', 'votre', 'leur', 'nos', 'vos', 'leurs', 'dans', 'sur', 'sous', 'vers', 'par',
    'pour', 'avec', 'sans', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or'
  ];

  const slug = useMemo(() => {
    if (!text.trim()) return '';

    let processed = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

    if (lowercase) {
      processed = processed.toLowerCase();
    }

    // Remove stop words if enabled
    if (removeStopWords) {
      const words = processed.split(/\W+/);
      processed = words
        .filter(word => !stopWords.includes(word.toLowerCase()))
        .join(' ');
    }

    return processed
      .replace(/[^a-z0-9\s-]/gi, '') // Remove non-alphanumeric except spaces and hyphens
      .trim()
      .replace(/\s+/g, separator)   // Replace spaces with separator
      .replace(new RegExp(`${separator}+`, 'g'), separator); // Remove multiple separators
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
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte source</label>
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
          placeholder="Entrez le titre ou le texte à convertir en slug..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg font-medium dark:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <Settings2 className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Paramètres</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Séparateur</label>
              <div className="flex gap-2">
                {['-', '_', '.'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeparator(s)}
                    className={`flex-1 py-2 rounded-xl font-mono font-bold border transition-all ${
                      separator === s
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    "{s}"
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => setRemoveStopWords(!removeStopWords)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  removeStopWords
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <span className="font-bold text-sm">Retirer stop-words (FR)</span>
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
        <div className="flex flex-col gap-4">
          <div className="flex-grow bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] flex flex-col justify-center relative overflow-hidden group min-h-[200px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-4">Slug généré</div>
            <div className="text-xl md:text-2xl font-mono font-bold text-indigo-400 break-all leading-relaxed">
              {slug || 'votre-slug-apparaitra-ici'}
            </div>
            <button
              onClick={handleCopy}
              disabled={!slug}
              className={`mt-8 w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copié !' : 'Copier le slug'}
            </button>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                <Link className="w-5 h-5" />
             </div>
             <div>
                <h4 className="font-bold text-sm mb-1 dark:text-white">Pourquoi utiliser des slugs ?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Les slugs sont essentiels pour le SEO et l'UX. Ils rendent vos URLs lisibles par les humains et les moteurs de recherche.
                </p>
             </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" /> Exemples de conversion
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-400 mb-1">Entrée :</div>
            <div className="text-sm font-medium mb-3">L'Été à Paris : Un guide complet !</div>
            <div className="text-[10px] font-bold text-slate-400 mb-1">Sortie :</div>
            <div className="text-sm font-mono text-indigo-500">l-ete-a-paris-un-guide-complet</div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <div className="text-[10px] font-bold text-slate-400 mb-1">Entrée :</div>
            <div className="text-sm font-medium mb-3">Comment cuisiner des œufs ?</div>
            <div className="text-[10px] font-bold text-slate-400 mb-1">Sortie (avec stop-words retirés) :</div>
            <div className="text-sm font-mono text-indigo-500">comment-cuisiner-oeufs</div>
          </div>
        </div>
      </div>
    </div>
  );
}
