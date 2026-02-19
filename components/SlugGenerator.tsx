import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, Copy, Check, Trash2, Settings2, Sparkles } from 'lucide-react';

const FRENCH_STOP_WORDS = [
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'en', 'et', 'au', 'aux',
  'ce', 'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
  'notre', 'votre', 'leur', 'nos', 'vos', 'leurs', 'dans', 'sur', 'sous', 'chez',
  'avec', 'pour', 'par', 'plus', 'moins', 'mais', 'ou', 'donc', 'or', 'ni', 'car',
  'est', 'sont', 'une', 'qui', 'que', 'quoi', 'dont', 'où',
  'l', 'd', 'm', 's', 't', 'n', 'j'
];

export function SlugGenerator() {
  const [input, setInput] = useState('');
  const [slug, setSlug] = useState('');
  const [separator, setSeparator] = useState('-');
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setSlug('');
      return;
    }

    let result = input
      .normalize('NFD') // NFD normalization for diacritics
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

    if (lowercase) {
      result = result.toLowerCase();
    }

    // Replace non-alphanumeric with separator
    result = result.replace(/[^a-z0-9]+/gi, separator);

    if (removeStopWords) {
      const parts = result.split(separator);
      result = parts
        .filter(part => !FRENCH_STOP_WORDS.includes(part.toLowerCase()))
        .join(separator);
    }

    // Clean up multiple separators and leading/trailing separators
    const escapedSeparator = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const multiRegex = new RegExp(`${escapedSeparator}+`, 'g');
    const edgeRegex = new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, 'g');

    result = result.replace(multiRegex, separator).replace(edgeRegex, '');

    setSlug(result);
    setCopied(false);
  }, [input, separator, removeStopWords, lowercase]);

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Result Display */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group border-b-4 border-indigo-500/20">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="flex-1 w-full overflow-hidden">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Slug Généré</div>
            <div className="text-2xl md:text-4xl font-mono text-white outline-none tracking-tight truncate py-2 selection:bg-indigo-500/30">
              {slug || 'votre-slug-ici'}
            </div>
          </div>
          <button
            onClick={handleCopy}
            disabled={!slug}
            className={`w-full md:w-auto px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 font-black text-lg disabled:opacity-50 ${
              copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
            }`}
          >
            {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>

        <div className="absolute top-0 right-0 p-4 opacity-10">
          <LinkIcon className="w-32 h-32 text-white -rotate-12 translate-x-8 -translate-y-8" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="slug-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Source</label>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            id="slug-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Entrez un titre ou une phrase pour générer un slug..."
            className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Options */}
        <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-2">
            <Settings2 className="w-4 h-4" /> Paramètres
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold">Séparateur</span>
              <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {['-', '_', '.'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSeparator(s)}
                    className={`w-8 h-8 rounded-lg text-sm font-black transition-all ${separator === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {[
              { label: 'Retirer les mots vides (fr)', state: removeStopWords, setState: setRemoveStopWords },
              { label: 'Tout en minuscules', state: lowercase, setState: setLowercase },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => opt.setState(!opt.state)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  opt.state
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
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

          <div className="pt-4 flex items-center gap-3 text-xs text-slate-400 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <p>Le retrait des mots vides (le, la, de, etc.) permet d'avoir des URLs plus courtes et plus propres pour le SEO.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
