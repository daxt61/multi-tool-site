import { useState, useMemo } from 'react';
import { Copy, Check, Link as LinkIcon } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

const FRENCH_STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', "d", "l", 'au', 'aux',
  'ce', 'cet', 'cette', 'ces', 'mon', 'ton', 'son', 'notre', 'votre', 'leur',
  'mes', 'tes', 'ses', 'nos', 'vos', 'leurs', 'qui', 'que', 'quoi', 'dont',
  'où', 'lequel', 'auquel', 'duquel', 'je', 'tu', 'il', 'elle', 'on', 'nous',
  'vous', 'ils', 'elles', 'me', 'te', 'se', 'lui', 'y', 'en', 'dans', 'par',
  'pour', 'avec', 'sans', 'sous', 'sur', 'vers', 'chez', 'mais', 'ou', 'et',
  'donc', 'or', 'ni', 'car', 'm', 's', 't', 'n', 'j'
]);

export function SlugGenerator() {
  const [text, setText] = useState('');
  const [options, setOptions] = useState({
    lowercase: true,
    removeStopWords: true,
    separator: '-',
  });
  const [copied, setCopied] = useState(false);

  const slug = useMemo(() => {
    if (!text) return '';

    // Normalize diacritics
    let result = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (options.lowercase) {
      result = result.toLowerCase();
    }

    // Replace non-alphanumeric with space for easier splitting
    result = result.replace(/[^a-z0-9]/gi, ' ');

    let words = result.trim().split(/\s+/);

    if (options.removeStopWords) {
      words = words.filter(word => !FRENCH_STOP_WORDS.has(word.toLowerCase()));
    }

    return words.join(options.separator);
  }, [text, options]);

  const copyToClipboard = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="space-y-4">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte source</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre titre ou texte ici..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Options */}
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
          <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Options</h3>
          <div className="space-y-3">
            <button
              onClick={() => setOptions({ ...options, lowercase: !options.lowercase })}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${options.lowercase ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400'}`}
            >
              <span className="font-bold text-sm">Minuscules</span>
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${options.lowercase ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {options.lowercase && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
            <button
              onClick={() => setOptions({ ...options, removeStopWords: !options.removeStopWords })}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${options.removeStopWords ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400'}`}
            >
              <span className="font-bold text-sm">Retirer mots de liaison (FR)</span>
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${options.removeStopWords ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                {options.removeStopWords && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </button>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Séparateur</label>
              <div className="flex gap-2">
                {['-', '_', ''].map(sep => (
                  <button
                    key={sep}
                    onClick={() => setOptions({ ...options, separator: sep })}
                    className={`flex-1 py-2 rounded-xl font-bold transition-all border ${options.separator === sep ? 'bg-white dark:bg-slate-700 border-indigo-500 text-indigo-600 shadow-sm' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    {sep === '' ? 'Aucun' : sep}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
              <LinkIcon className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Slug généré</span>
            </div>
            <div className="text-2xl font-mono text-white break-all leading-relaxed">
              {slug || <span className="text-white/20">votre-slug-ici</span>}
            </div>
          </div>
          <button
            onClick={copyToClipboard}
            disabled={!slug}
            className={`mt-8 w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'}`}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copié !' : 'Copier le slug'}
          </button>
        </div>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
