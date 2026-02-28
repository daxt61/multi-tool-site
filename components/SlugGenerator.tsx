import { useState, useMemo } from 'react';
import { Link as LinkIcon, Copy, Check, Info, Settings, Trash2 } from 'lucide-react';

export function SlugGenerator() {
  const [text, setText] = useState('');
  const [lowercase, setLowercase] = useState(true);
  const [removeAccents, setRemoveAccents] = useState(true);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    if (!text) return '';

    let result = text;

    if (removeAccents) {
      result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    if (lowercase) {
      result = result.toLowerCase();
    }

    // Replace spaces and special characters with hyphens
    result = result
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')     // Remove consecutive hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens

    return result;
  }, [text, lowercase, removeAccents]);

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
    setCopied(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Display Area */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="flex-1 w-full text-center md:text-left">
            <div className="text-xs font-black uppercase tracking-widest text-white/30 mb-4 px-1">Résultat du Slug</div>
            <div className={`text-2xl md:text-4xl font-mono text-white outline-none tracking-tight break-all selection:bg-indigo-500/30 ${!slug ? 'opacity-20 italic' : 'opacity-100'}`}>
              {slug || "votre-slug-apparaitra-ici"}
            </div>
          </div>
          <div className="flex gap-3">
             <button
              onClick={handleClear}
              className="p-4 bg-white/10 hover:bg-rose-500/20 text-white hover:text-rose-400 rounded-2xl transition-all active:scale-95 border border-transparent hover:border-rose-500/20"
              title="Tout effacer"
            >
              <Trash2 className="w-6 h-6" />
            </button>
            <button
              onClick={handleCopy}
              disabled={!slug}
              className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg disabled:opacity-50 disabled:scale-100 ${
                copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input area */}
        <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <LinkIcon className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Source</h3>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-48 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-medium dark:text-slate-300"
            placeholder="Saisissez un titre ou un texte à transformer en URL..."
          />
        </section>

        {/* Settings & Info */}
        <div className="space-y-6">
          <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Options de conversion</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Tout en minuscules', state: lowercase, set: setLowercase },
                { label: 'Supprimer les accents', state: removeAccents, set: setRemoveAccents },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => opt.set(!opt.state)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    opt.state
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <span className="font-bold text-sm">{opt.label}</span>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    opt.state ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {opt.state && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Info className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Qu'est-ce qu'un Slug ?</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-1">
              Un slug est la partie d'une URL qui identifie une page de manière lisible pour les humains et optimisée pour les moteurs de recherche (SEO). Il est généralement composé de mots séparés par des traits d'union.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
