import React, { useState, useEffect } from 'react';
import { Type, Copy, Check, Settings, Sparkles } from 'lucide-react';

export function SlugGenerator() {
  const [text, setText] = useState('');
  const [slug, setSlug] = useState('');
  const [separator, setSeparator] = useState('-');
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  // Expanded list of French stop words
  const STOP_WORDS = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l',
    'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or', 'a', 'au', 'aux',
    'sur', 'dans', 'par', 'pour', 'en', 'avec', 'sans', 'sous', 'chez',
    'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
    'ce', 'cet', 'cette', 'ces', 'qui', 'que', 'quoi', 'dont', 'où'
  ]);

  useEffect(() => {
    if (!text) {
      setSlug('');
      return;
    }

    // 1. Normalize to NFD to separate diacritics from base characters
    let processed = text.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // 2. Remove diacritics

    if (lowercase) {
      processed = processed.toLowerCase();
    }

    // 3. Handle stop words
    let words = processed.split(/[^a-z0-9]+/i).filter(Boolean);

    if (removeStopWords) {
      words = words.filter(word => !STOP_WORDS.has(word.toLowerCase()));
    }

    // 4. Join with separator
    setSlug(words.join(separator));
  }, [text, separator, removeStopWords, lowercase]);

  const copyToClipboard = () => {
    navigator.clipboard?.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Settings className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Options du Slug</h3>
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">Séparateur</label>
            <div className="flex gap-2">
              {['-', '_', '.', ''].map(s => (
                <button
                  key={s}
                  onClick={() => setSeparator(s)}
                  className={`w-10 h-10 rounded-xl font-bold border transition-all ${
                    separator === s ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  {s === '' ? 'ø' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block px-1">Filtres</label>
            <div className="flex gap-2">
              <button
                onClick={() => setRemoveStopWords(!removeStopWords)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  removeStopWords ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                Retirer mots vides
              </button>
              <button
                onClick={() => setLowercase(!lowercase)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  lowercase ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400'
                }`}
              >
                Minuscules
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Type className="w-4 h-4 text-indigo-500" />
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte source</label>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre titre ou texte ici..."
          className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg font-medium resize-none dark:text-white"
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Slug généré</label>
          </div>
          {slug && (
            <button
              onClick={copyToClipboard}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                copied ? 'bg-emerald-500 text-white' : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          )}
        </div>
        <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl min-h-[80px] flex items-center break-all font-mono text-xl text-indigo-600 dark:text-indigo-400">
          {slug || <span className="text-slate-300 dark:text-slate-700 italic text-base">Le slug apparaîtra ici...</span>}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-950/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
        <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2">Qu'est-ce qu'un Slug ?</h4>
        <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed">
          Un slug est la partie d'une URL qui identifie une page de manière lisible.
          Il remplace les caractères spéciaux et les espaces par des séparateurs (souvent des tirets)
          pour être optimisé pour le SEO et les utilisateurs.
        </p>
      </div>
    </div>
  );
}
