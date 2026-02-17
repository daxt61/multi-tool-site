import { useState, useMemo } from 'react';
import { Link, Copy, Check, Trash2, Info, Settings } from 'lucide-react';

const STOP_WORDS_FR = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd\'', 'l\'',
  'au', 'aux', 'ce', 'cet', 'cette', 'ces', 'mon', 'ton', 'son',
  'notre', 'votre', 'leur', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
  'nos', 'vos', 'leurs', 'je', 'tu', 'il', 'elle', 'on', 'nous',
  'vous', 'ils', 'elles', 'me', 'te', 'se', 'en', 'y', 'ne', 'pas',
  'et', 'ou', 'mais', 'donc', 'car', 'ni', 'soit', 'pour', 'par',
  'dans', 'sur', 'sous', 'vers', 'avec', 'chez', 'sans', 'entre'
]);

export function SlugGenerator() {
  const [text, setText] = useState('Comment créer un site web moderne en 2024 ?');
  const [lowercase, setLowercase] = useState(true);
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    if (!text) return '';

    let result = text
      .normalize('NFD') // Normalize diacritics
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

    if (lowercase) {
      result = result.toLowerCase();
    }

    // Replace special characters and spaces with hyphens
    result = result.replace(/[^a-z0-9\s-]/gi, ' ');

    let words = result.trim().split(/\s+/);

    if (removeStopWords) {
      words = words.filter(word => !STOP_WORDS_FR.has(word.toLowerCase()));
    }

    return words.join('-').replace(/-+/g, '-');
  }, [text, lowercase, removeStopWords]);

  const handleCopy = () => {
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Input Area */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Source</label>
          <button onClick={() => setText('')} className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors">
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre titre ou texte ici..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xl font-bold dark:text-white"
        />
      </div>

      {/* Result Area */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Slug Généré</label>
            <div className="text-2xl md:text-3xl font-mono text-indigo-400 break-all leading-tight">
              {slug || 'votre-slug-apparaitra-ici'}
            </div>
          </div>
          <button
            onClick={handleCopy}
            disabled={!slug}
            className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg shrink-0 ${
              copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-20'
            }`}
          >
            {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Options
          </h4>
          <div className="space-y-3">
            {[
              { label: 'Tout en minuscules', state: lowercase, setState: setLowercase },
              { label: 'Retirer les mots de liaison (FR)', state: removeStopWords, setState: setRemoveStopWords },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => opt.setState(!opt.state)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  opt.state
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <span className="font-bold text-sm">{opt.label}</span>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                  opt.state ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {opt.state && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden flex flex-col justify-center">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
           <Link className="w-12 h-12 mb-6 opacity-50" />
           <h3 className="text-2xl font-black mb-4">Optimisé pour le SEO</h3>
           <p className="text-indigo-100 font-medium leading-relaxed">
             Générez des URLs propres, lisibles et optimisées pour les moteurs de recherche. La normalisation NFD assure une compatibilité maximale en convertissant les caractères accentués.
           </p>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Qu'est-ce qu'un slug ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Un slug est la partie d'une URL qui identifie une page particulière dans un format lisible par l'homme (ex: /titre-de-l-article).
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-500" /> Stop Words
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les "mots vides" sont des mots courants (le, la, et...) qui sont souvent ignorés par les moteurs de recherche pour raccourcir les URLs.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> Normalisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Nous utilisons la normalisation NFD pour décomposer les caractères accentués (comme 'é' en 'e' + '´') afin de les nettoyer proprement.
          </p>
        </div>
      </div>
    </div>
  );
}
