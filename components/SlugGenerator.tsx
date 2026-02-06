import { useState, useMemo } from 'react';
import { Link, Copy, Check, Trash2, Settings, Info, BookOpen, Hash } from 'lucide-react';

export function SlugGenerator() {
  const [input, setInput] = useState('');
  const [separator, setSeparator] = useState<'-' | '_'>('-');
  const [lowercase, setLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    if (!input) return '';

    let result = input
      .normalize('NFD') // Normalize to decompose combined characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, separator); // Replace spaces with separator

    if (lowercase) {
      result = result.toLowerCase();
    }

    return result;
  }, [input, separator, lowercase]);

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
       {/* Input Section */}
       <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-indigo-500">
              <Hash className="w-4 h-4" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte source</label>
            </div>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Mon Super Article de Blog"
            className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl font-bold dark:text-white"
          />
        </div>

        {/* Slug Output */}
        <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="flex-1 w-full overflow-hidden">
               <div className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Slug généré</div>
               <div className="text-2xl md:text-4xl font-mono text-white outline-none tracking-tight break-all">
                 {slug || 'mon-super-slug'}
               </div>
            </div>
            <button
              onClick={handleCopy}
              disabled={!slug}
              className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg ${
                copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50'
              }`}
            >
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings className="w-4 h-4" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Options</label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-500 px-1">Séparateur</div>
                  <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setSeparator('-')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${separator === '-' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm' : 'text-slate-500'}`}
                    >
                      Tiret (-)
                    </button>
                    <button
                      onClick={() => setSeparator('_')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${separator === '_' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm' : 'text-slate-500'}`}
                    >
                      Underscore (_)
                    </button>
                  </div>
               </div>

               <button
                  onClick={() => setLowercase(!lowercase)}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all mt-7 ${
                    lowercase
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="font-bold text-sm">Minuscules</span>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    lowercase ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {lowercase && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                <Info className="w-5 h-5" />
             </div>
             <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">Pourquoi utiliser des slugs ?</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Les slugs sont des versions URL-friendly des titres. Ils améliorent le SEO et rendent les liens plus lisibles pour les utilisateurs et les moteurs de recherche.
                </p>
             </div>
          </div>
        </div>

        {/* Educational Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black">Standard SEO</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Google recommande d'utiliser des tirets (-) plutôt que des underscores (_) dans les URLs, car il traite le tiret comme un séparateur de mots.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
              <Link className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black">Nettoyage automatique</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              L'outil supprime automatiquement les accents (é &rarr; e), les caractères spéciaux et les espaces multiples pour garantir une URL valide.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black">Bonnes pratiques</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Gardez vos slugs courts, descriptifs et évitez les "stop words" (le, la, de, etc.) pour une meilleure efficacité SEO.
            </p>
          </div>
        </div>
    </div>
  );
}
