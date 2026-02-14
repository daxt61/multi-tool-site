import { useState, useMemo } from 'react';
import { Copy, Check, RefreshCw, Link as LinkIcon, Info } from 'lucide-react';

export function SlugGenerator() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [removeStopWords, setRemoveStopWords] = useState(true);

  const stopWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l',
    'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or',
    'a', 'au', 'aux', 'à', 'en', 'dans', 'par', 'pour', 'vers', 'avec', 'sans', 'sous', 'sur', 'chez',
    'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
    'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se'
  ];

  const slug = useMemo(() => {
    if (!text) return '';

    let result = text
      .normalize('NFD') // Normalize to decompose diacritics
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .trim();

    // Replace non-alphanumeric characters with spaces
    result = result.replace(/[^a-z0-9]/g, ' ');

    if (removeStopWords) {
      const words = result.split(/\s+/);
      result = words
        .filter(word => !stopWords.includes(word))
        .join(' ');
    }

    // Replace spaces with hyphens and remove multiple hyphens
    return result
      .split(/\s+/)
      .filter(Boolean)
      .join('-');
  }, [text, removeStopWords]);

  const copyToClipboard = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte source</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre titre ou texte ici..."
          className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="flex items-center gap-4 px-1">
        <button
          onClick={() => setRemoveStopWords(!removeStopWords)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm transition-all active:scale-95 ${
            removeStopWords
              ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400'
              : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
          }`}
        >
          <div className={`w-4 h-4 rounded border flex items-center justify-center ${removeStopWords ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
            {removeStopWords && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          Retirer les mots de liaison
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Slug généré</label>
          {slug && (
            <button
              onClick={copyToClipboard}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
            </button>
          )}
        </div>
        <div className="p-6 bg-slate-900 dark:bg-black rounded-3xl border border-slate-800 flex items-center gap-4 group min-h-[80px]">
          <LinkIcon className="w-5 h-5 text-slate-600 flex-shrink-0" />
          <div className="flex-1 font-mono text-lg text-indigo-400 break-all select-all">
            {slug || <span className="text-slate-700 italic">En attente de texte...</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Pourquoi utiliser un slug ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Un slug est la partie d'une URL qui identifie une page particulière dans un format lisible. Utiliser des mots-clés clairs séparés par des tirets améliore à la fois le SEO et l'expérience utilisateur.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-indigo-500" /> Nettoyage automatique
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cet outil retire automatiquement les accents (é → e), les caractères spéciaux, et optionnellement les mots de liaison français pour créer des URLs courtes et efficaces.
          </p>
        </div>
      </div>
    </div>
  );
}
