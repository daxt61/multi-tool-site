import React, { useState, useMemo } from 'react';
import { Link, Copy, Check, Settings, Trash2, Info, ChevronRight, Zap } from 'lucide-react';

export function SlugGenerator() {
  const [text, setText] = useState('Comment créer un super slug ?');
  const [separator, setSeparator] = useState('-');
  const [removeStopWords, setRemoveStopWords] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [copied, setCopied] = useState(false);

  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l', 'au', 'aux',
    'ce', 'cet', 'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
    'en', 'dans', 'par', 'pour', 'vers', 'avec', 'sans', 'sous', 'sur',
    'et', 'ou', 'mais', 'donc', 'or', 'ni', 'car', 'que', 'qui', 'dont', 'où'
  ];

  const slug = useMemo(() => {
    if (!text) return '';

    // 1. Normalize and remove diacritics
    let result = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (lowercase) {
      result = result.toLowerCase();
    }

    // 2. Remove stop words if enabled
    if (removeStopWords) {
      const words = result.split(/\s+/);
      result = words
        .filter(word => !stopWords.includes(word.toLowerCase()))
        .join(' ');
    }

    // 3. Replace non-alphanumeric with separator
    // Sentinel: Validate separator to avoid invalid RegExp
    const safeSeparator = separator || '-';
    // Escape special regex characters in separator
    const escapedSeparator = safeSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    result = result
      .replace(/[^a-z0-9]+/gi, safeSeparator)
      .replace(new RegExp(`${escapedSeparator}+`, 'g'), safeSeparator) // Remove duplicate separators
      .replace(new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, 'g'), ''); // Trim separators

    return result;
  }, [text, separator, removeStopWords, lowercase]);

  const handleCopy = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Source</label>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre titre ou texte..."
          className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-xl font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
        />
      </div>

      <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 text-center space-y-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

        <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Slug Généré</div>
        <div className="text-3xl md:text-5xl font-black text-white break-all font-mono tracking-tight selection:bg-indigo-500/30">
          {slug || <span className="opacity-20">votre-slug-ici</span>}
        </div>

        <button
          onClick={handleCopy}
          disabled={!slug}
          className={`px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center gap-2 mx-auto ${
            copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100 disabled:opacity-50'
          }`}
        >
          {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
          {copied ? 'Copié' : 'Copier le slug'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Configuration</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="font-bold text-sm">Séparateur</span>
              <input
                type="text"
                maxLength={1}
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                className="w-10 h-10 text-center bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-mono font-bold outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={() => setRemoveStopWords(!removeStopWords)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                removeStopWords ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <span className="font-bold text-sm">Retirer les mots vides (fr)</span>
              <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${removeStopWords ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                {removeStopWords && <Check className="w-4 h-4" />}
              </div>
            </button>

            <button
              onClick={() => setLowercase(!lowercase)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                lowercase ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <span className="font-bold text-sm">Tout en minuscules</span>
              <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${lowercase ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                {lowercase && <Check className="w-4 h-4" />}
              </div>
            </button>
          </div>
        </div>

        {/* SEO Info */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 flex flex-col justify-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <div className="flex items-center gap-4">
            <Zap className="w-10 h-10 text-indigo-200" />
            <h3 className="text-2xl font-black">Boost SEO</h3>
          </div>
          <p className="text-indigo-100 font-medium leading-relaxed">
            Un slug propre et descriptif améliore le référencement naturel et la lisibilité de vos URLs. En retirant les "stop words", vous concentrez le poids SEO sur vos mots-clés principaux.
          </p>
          <div className="space-y-3 pt-4">
            {['URLs sémantiques', 'Meilleur taux de clic', 'Nettoyage automatique'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-bold">
                <ChevronRight className="w-4 h-4 text-indigo-300" /> {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
