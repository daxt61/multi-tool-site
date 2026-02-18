import React, { useState, useCallback } from 'react';
import { Copy, Check, Trash2, Link, Info } from 'lucide-react';

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l',
  'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or', 'si',
  'a', 'au', 'aux', 'sur', 'sous', 'dans', 'par', 'pour', 'avec', 'chez',
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles',
  'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses', 'notre', 'votre', 'leur'
]);

export function SlugGenerator() {
  const [input, setInput] = useState('');
  const [slug, setSlug] = useState('');
  const [copied, setCopied] = useState(false);
  const [removeStopWords, setRemoveStopWords] = useState(true);

  const generateSlug = useCallback((text: string, filterStopWords: boolean) => {
    if (!text) return '';

    // Normalization NFD to separate diacritics from letters
    let result = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase();

    // Replace non-alphanumeric characters with hyphens
    result = result.replace(/[^a-z0-9]/g, '-');

    // Split into parts to handle stop words
    let parts = result.split('-').filter(Boolean);

    if (filterStopWords) {
      parts = parts.filter(part => !STOP_WORDS.has(part));
    }

    // Join with single hyphen
    return parts.join('-');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    setSlug(generateSlug(val, removeStopWords));
  };

  const handleToggleStopWords = () => {
    const newState = !removeStopWords;
    setRemoveStopWords(newState);
    setSlug(generateSlug(input, newState));
  };

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard?.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setSlug('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="input-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte source</label>
          <button
            onClick={handleClear}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="input-text"
          value={input}
          onChange={handleInputChange}
          placeholder="Entrez votre titre ou texte ici..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none text-lg"
        />
      </div>

      <div className="flex items-center gap-4 px-1">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={removeStopWords}
              onChange={handleToggleStopWords}
              className="sr-only"
            />
            <div className={`w-10 h-5 rounded-full transition-colors ${removeStopWords ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
            <div className={`absolute top-1 left-1 w-3 h-3 rounded-full bg-white transition-transform ${removeStopWords ? 'translate-x-5' : ''}`}></div>
          </div>
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
            Retirer les mots de liaison (SEO)
          </span>
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Slug généré</label>
          <button
            onClick={handleCopy}
            disabled={!slug}
            className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'} disabled:opacity-50`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl min-h-[4rem] flex items-center break-all">
          <span className="text-xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {slug || <span className="text-slate-400 font-normal italic">Le slug apparaîtra ici...</span>}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Link className="w-4 h-4 text-indigo-500" /> Pourquoi utiliser un slug ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Un slug est la partie d'une URL qui identifie une page particulière dans un format lisible. Utiliser des mots-clés dans vos slugs améliore votre référencement (SEO).
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Optimisation SEO
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le retrait des "stop words" (le, la, et, pour...) permet de garder vos URLs courtes et focalisées sur les mots-clés importants, ce qui est recommandé par les moteurs de recherche.
          </p>
        </div>
      </div>
    </div>
  );
}
