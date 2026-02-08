import { useState, useMemo } from 'react';
import { Copy, Check, Trash2, Link as LinkIcon, Info } from 'lucide-react';

const FRENCH_STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l', 'au', 'aux', 'ce', 'cet', 'cette', 'ces',
  'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses', 'notre', 'votre', 'leur', 'nos', 'vos', 'leurs',
  'qui', 'que', 'quoi', 'dont', 'où', 'quel', 'quels', 'quelle', 'quelles', 'on', 'tout', 'tous', 'toute', 'toutes',
  'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or', 'soit', 'puis', 'ensuite',
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'moi', 'toi', 'lui', 'soi', 'eux',
  'me', 'te', 'se', 'nous', 'vous', 'le', 'la', 'les', 'lui', 'leur', 'y', 'en',
  'ne', 'pas', 'plus', 'moins', 'peu', 'très', 'si', 'tel', 'telle', 'tels', 'telles',
  'dans', 'en', 'sur', 'sous', 'chez', 'vers', 'avec', 'sans', 'pour', 'par', 'entre', 'derrière', 'devant', 'avant', 'après'
]);

export function SlugGenerator() {
  const [text, setText] = useState('');
  const [separator, setSeparator] = useState('-');
  const [removeStopWords, setRemoveStopWords] = useState(false);
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    if (!text) return '';

    let result = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, ' ') // Remove non-alphanumeric chars
      .trim();

    if (removeStopWords) {
      result = result
        .split(/\s+/)
        .filter(word => !FRENCH_STOP_WORDS.has(word))
        .join(' ');
    }

    return result
      .replace(/\s+/g, separator)
      .replace(new RegExp(`\\${separator}+`, 'g'), separator);
  }, [text, separator, removeStopWords]);

  const handleCopy = () => {
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte source</label>
          <button onClick={() => setText('')} className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors">
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre titre ou texte ici..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Séparateur</label>
          <div className="flex gap-2">
            {['-', '_', '.'].map(s => (
              <button
                key={s}
                onClick={() => setSeparator(s)}
                className={`flex-1 py-3 rounded-xl border font-bold transition-all ${separator === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
              >
                {s === '-' ? 'Tiret (-)' : s === '_' ? 'Underscore (_)' : 'Point (.)'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Options</label>
          <button
            onClick={() => setRemoveStopWords(!removeStopWords)}
            className={`w-full py-3 px-4 rounded-xl border font-bold transition-all flex items-center justify-between ${removeStopWords ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
          >
            <span className="text-sm">Retirer les mots de liaison (FR)</span>
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${removeStopWords ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
              {removeStopWords && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 dark:bg-black p-8 rounded-[2rem] shadow-xl shadow-indigo-500/5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-slate-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
            <LinkIcon className="w-4 h-4" /> Slug Généré
          </div>
          <button
            onClick={handleCopy}
            disabled={!slug}
            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'} disabled:opacity-50 active:scale-95`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <div className="text-xl md:text-2xl font-mono text-indigo-400 break-all bg-white/5 p-6 rounded-2xl min-h-[4rem] flex items-center">
          {slug || <span className="text-white/20 italic">Le slug apparaîtra ici...</span>}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-[2rem] flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-800 dark:text-indigo-400 font-medium leading-relaxed">
          Un <strong>slug</strong> est la partie d'une URL qui identifie une page particulière dans un format lisible. Ce générateur nettoie le texte en supprimant les accents, les caractères spéciaux et en gérant la casse pour garantir une URL valide et optimisée pour le SEO.
        </p>
      </div>
    </div>
  );
}
