import { useState } from 'react';
import { Copy, Check, Trash2, SortAsc, SortDesc, ListChecks, Type, FileDown, Scissors, Plus, Search, Shuffle, RefreshCw } from 'lucide-react';

export function ListCleaner() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');

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

  const addPrefixSuffix = () => {
    processList(lines => lines.map(line => `${prefix}${line}${suffix}`));
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
    processList(lines => lines.map(line => line.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")));
  };

  const searchReplace = () => {
    if (!searchValue) return;
    processList(lines => lines.map(line => line.split(searchValue).join(replaceValue)));
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Nettoyage */}
        <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <Scissors className="w-4 h-4" />
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Nettoyage</h3>
          </div>
          <div className="space-y-1.5">
            <button onClick={removeDuplicates} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
              <span className="font-bold text-xs">Doublons</span>
              <ListChecks className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button onClick={removeEmptyLines} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
              <span className="font-bold text-xs">Lignes vides</span>
              <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button onClick={trimLines} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
              <span className="font-bold text-xs">Espaces</span>
              <Scissors className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button onClick={removePunctuation} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
              <span className="font-bold text-xs">Ponctuation</span>
              <Type className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
            </button>
          </div>
        </div>

        {/* Tri */}
        <div className="p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <SortAsc className="w-4 h-4" />
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Tri & Ordre</h3>
          </div>
          <div className="space-y-1.5">
            <button onClick={sortAZ} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
              <span className="font-bold text-xs">A-Z</span>
              <SortAsc className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button onClick={reverseList} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
              <span className="font-bold text-xs">Inverser</span>
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button onClick={shuffleList} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
              <span className="font-bold text-xs">Aléatoire</span>
              <Shuffle className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button onClick={sortLength} className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
              <span className="font-bold text-xs">Longueur</span>
              <SortAsc className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
            </button>
          </div>
        </div>

        {/* Préfixe / Suffixe */}
        <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <Plus className="w-4 h-4" />
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Ajouter</h3>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Préfixe"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <input
              type="text"
              placeholder="Suffixe"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <button
              onClick={addPrefixSuffix}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10"
            >
              Appliquer
            </button>
          </div>
        </div>

        {/* Rechercher / Remplacer */}
        <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <Search className="w-4 h-4" />
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Remplacer</h3>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Rechercher"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <input
              type="text"
              placeholder="Remplacer par"
              value={replaceValue}
              onChange={(e) => setReplaceValue(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <button
              onClick={searchReplace}
              className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs hover:opacity-90 transition-all"
            >
              Remplacer tout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
