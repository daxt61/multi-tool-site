import React, { useState, useMemo } from 'react';
import { Link2, Copy, Check, Trash2, Settings2 } from 'lucide-react';

export function SlugGenerator() {
  const [input, setInput] = useState('');
  const [separator, setSeparator] = useState('-');
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [lowerCase, setLowerCase] = useState(true);
  const [copied, setCopied] = useState(false);

  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd\'', 'l\'',
    'et', 'ou', 'mais', 'donc', 'car', 'ni', 'soit',
    'ce', 'cet', 'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa',
    'mes', 'tes', 'ses', 'notre', 'votre', 'leur', 'nos', 'vos', 'leurs',
    'chez', 'sous', 'dans', 'pour', 'par', 'avec', 'sans', 'sur'
  ];

  const slug = useMemo(() => {
    if (!input.trim()) return '';

    let text = input.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

    if (lowerCase) {
      text = text.toLowerCase();
    }

    // Replace non-alphanumeric with spaces
    text = text.replace(/[^a-z0-9]/gi, ' ');

    let words = text.split(/\s+/).filter(Boolean);

    if (removeStopWords) {
      words = words.filter(word => !stopWords.includes(word.toLowerCase()));
    }

    return words.join(separator);
  }, [input, separator, removeStopWords, lowerCase]);

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Titre ou Texte</label>
              <button
                onClick={() => setInput('')}
                className="text-rose-500 hover:text-rose-600 transition-colors"
                aria-label="Effacer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: Pourquoi le ciel est-il bleu ?"
              className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg font-medium dark:text-white resize-none"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Slug Généré</label>
            <div className="relative group">
              <div className="w-full p-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-[2rem] min-h-[5rem] flex items-center pr-16 break-all">
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {slug || <span className="text-indigo-300 dark:text-indigo-800">votre-slug-apparaitra-ici</span>}
                </span>
              </div>
              <button
                onClick={handleCopy}
                disabled={!slug}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-4 rounded-2xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 shadow-sm border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 active:scale-95'}`}
                aria-label="Copier le slug"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Options</h4>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Séparateur</label>
                <select
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm font-bold px-3 py-1 outline-none dark:text-white"
                >
                  <option value="-">Tiret (-)</option>
                  <option value="_">Underscore (_)</option>
                  <option value=".">Point (.)</option>
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={removeStopWords}
                  onChange={(e) => setRemoveStopWords(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Retirer mots vides (FR)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={lowerCase}
                  onChange={(e) => setLowerCase(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Tout en minuscules</span>
              </label>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/30 rounded-[2rem] border border-slate-100 dark:border-slate-800/50">
            <div className="flex items-center gap-2 mb-2 text-indigo-500">
              <Link2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Usage SEO</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
              Un slug propre améliore le référencement (SEO) et la lisibilité des URLs pour vos utilisateurs et les moteurs de recherche.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
