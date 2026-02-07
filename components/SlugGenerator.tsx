import { useState, useMemo } from 'react';
import { Copy, Check, Trash2, Link as LinkIcon, Hash, Settings2, Info } from 'lucide-react';

export function SlugGenerator() {
  const [text, setText] = useState('');
  const [separator, setSeparator] = useState('-');
  const [lowercase, setLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    if (!text) return '';

    let result = text
      .normalize('NFD') // Normalize to decompose combined characters (like accents)
      .replace(/[\u0300-\u036f]/g, ''); // Remove decomposed accents

    if (lowercase) {
      result = result.toLowerCase();
    }

    result = result
      .replace(/[^a-z0-9\s-]/gi, '') // Remove non-alphanumeric except spaces and dashes
      .trim()
      .replace(/\s+/g, separator) // Replace spaces with separator
      .replace(/-+/g, separator); // Replace multiple separators with single one

    // If separator is underscore, replace any remaining dashes if needed,
    // but the regex above already handled spaces.
    // Let's make it robust:
    if (separator === '_') {
      result = result.replace(/-/g, '_');
    } else if (separator === '-') {
      result = result.replace(/_/g, '-');
    }

    return result;
  }, [text, separator, lowercase]);

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Result Area */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="flex-1 w-full overflow-hidden">
            <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Slug généré</div>
            <div className="text-2xl md:text-4xl font-mono text-white outline-none tracking-tight break-all">
              {slug || <span className="text-slate-700">votre-slug-ici</span>}
            </div>
          </div>
          <button
            onClick={handleCopy}
            disabled={!slug}
            className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg shrink-0 ${
              copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Texte source
            </label>
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
            placeholder="Entrez le titre ou le texte à convertir..."
            className="w-full h-32 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
          />
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex items-center gap-3 text-indigo-500 mb-2">
            <Settings2 className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Configuration</h3>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Séparateur</label>
              <div className="flex gap-2">
                {[
                  { id: '-', label: 'Tiret (-)', icon: <Hash className="w-4 h-4" /> },
                  { id: '_', label: 'Underscore (_)', icon: <Hash className="w-4 h-4" /> },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSeparator(opt.id)}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-sm transition-all ${
                      separator === opt.id
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setLowercase(!lowercase)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                lowercase
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <span className="font-bold text-sm">Convertir en minuscules</span>
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                lowercase ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
              }`}>
                {lowercase && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] flex items-start gap-4">
         <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Info className="w-6 h-6" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">Pourquoi utiliser un slug ?</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Un slug est la partie d'une URL qui identifie une page de manière lisible pour les humains et les moteurs de recherche. Il est essentiel pour le SEO (référencement) et permet de créer des liens propres et compréhensibles.
            </p>
         </div>
      </div>
    </div>
  );
}
