import { useState } from 'react';
import { Copy, Check, Trash2, SortAsc, SortDesc, ListChecks, Type, FileDown, Scissors, Plus, Search, Replace, Shuffle, RotateCcw } from 'lucide-react';

export function ListCleaner() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'list_cleaned.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const processList = (fn: (lines: string[]) => string[]) => {
    const lines = text.split('\n');
    const processed = fn(lines);
    setText(processed.join('\n'));
  };

  const removeDuplicates = () => {
    processList(lines => [...new Set(lines)]);
  };

  const removeEmptyLines = () => {
    processList(lines => lines.filter(line => line.trim() !== ''));
  };

  const trimLines = () => {
    processList(lines => lines.map(line => line.trim()));
  };

  const sortAZ = () => {
    processList(lines => [...lines].sort((a, b) => a.localeCompare(b)));
  };

  const sortZA = () => {
    processList(lines => [...lines].sort((a, b) => b.localeCompare(a)));
  };

  const sortLength = () => {
    processList(lines => [...lines].sort((a, b) => a.length - b.length));
  };

  const reverseList = () => {
    processList(lines => [...lines].reverse());
  };

  const shuffleList = () => {
    processList(lines => {
      const shuffled = [...lines];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  };

  const removePunctuation = () => {
    processList(lines => lines.map(l => l.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")));
  };

  const addPrefixSuffix = () => {
    processList(lines => lines.map(l => `${prefix}${l}${suffix}`));
    setPrefix('');
    setSuffix('');
  };

  const handleSearchReplace = () => {
    if (!searchQuery) return;
    processList(lines => lines.map(l => l.split(searchQuery).join(replaceQuery)));
    setSearchQuery('');
    setReplaceQuery('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Liste</label>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              aria-label="Copier la liste"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
            </button>
            <button
              onClick={handleDownload}
              className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1"
              aria-label="Télécharger la liste"
            >
              <FileDown className="w-3 h-3" /> Télécharger
            </button>
            <button
              onClick={() => setText('')}
              className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              aria-label="Effacer tout"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez vos éléments ici, un par ligne..."
          className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono"
        />
        <div className="flex justify-end text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
          {text.split('\n').filter(l => l.length > 0).length} éléments
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Nettoyage */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-500">
            <Scissors className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Nettoyage</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={removeDuplicates}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">Supprimer les doublons</span>
              <ListChecks className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button
              onClick={removeEmptyLines}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">Supprimer les lignes vides</span>
              <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button
              onClick={trimLines}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">Tronquer les espaces</span>
              <Scissors className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button
              onClick={removePunctuation}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">Retirer la ponctuation</span>
              <Type className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
          </div>
        </div>

        {/* Tri & Ordre */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-500">
            <SortAsc className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Tri & Ordre</h3>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={sortAZ}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
              >
                <SortAsc className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 mb-2" />
                <span className="font-bold text-[10px] uppercase">A-Z</span>
              </button>
              <button
                onClick={sortZA}
                className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
              >
                <SortDesc className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 mb-2" />
                <span className="font-bold text-[10px] uppercase">Z-A</span>
              </button>
            </div>
            <button
              onClick={sortLength}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">Par longueur</span>
              <SortAsc className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button
              onClick={reverseList}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">Inverser l'ordre</span>
              <RotateCcw className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button
              onClick={shuffleList}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">Mélanger (Aléatoire)</span>
              <Shuffle className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
          </div>
        </div>

        {/* Préfixe & Suffixe */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-500">
            <Plus className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Ajout Auto</h3>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="Préfixe..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="Suffixe..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <button
              onClick={addPrefixSuffix}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Appliquer à chaque ligne
            </button>
          </div>
        </div>

        {/* Chercher & Remplacer */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 text-indigo-500">
            <Search className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Chercher & Remplacer</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Texte à trouver</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: ancien_nom"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Remplacer par</label>
              <input
                type="text"
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                placeholder="Ex: nouveau_nom"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          <button
            onClick={handleSearchReplace}
            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Replace className="w-4 h-4" /> Tout remplacer dans la liste
          </button>
        </div>

        {/* Casse (Condensed) */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6 shadow-sm">
          <div className="flex items-center gap-3 text-indigo-500">
            <Type className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Casse</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => processList(lines => lines.map(l => l.toUpperCase()))}
              className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group"
            >
              <span className="font-bold text-xs uppercase">MAJUSCULES</span>
            </button>
            <button
              onClick={() => processList(lines => lines.map(l => l.toLowerCase()))}
              className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group"
            >
              <span className="font-bold text-xs">minuscules</span>
            </button>
            <button
              onClick={() => processList(lines => lines.map(l => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase()))}
              className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group"
            >
              <span className="font-bold text-xs">Première lettre en majuscule</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
