import { useState } from 'react';
import { Copy, Check, Trash2, SortAsc, SortDesc, ListChecks, Type, FileDown, Scissors, Plus, Replace, Hash } from 'lucide-react';

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

  const handleReplace = () => {
    if (!searchValue) return;
    processList(lines => lines.map(line => line.split(searchValue).join(replaceValue)));
  };

  const removePunctuation = () => {
    processList(lines => lines.map(line => line.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")));
  };

  const reverseList = () => {
    processList(lines => [...lines].reverse());
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Liste</label>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={handleDownload}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1"
              >
                <FileDown className="w-3 h-3" /> Télécharger
              </button>
              <button
                onClick={() => setText('')}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Entrez vos éléments ici, un par ligne..."
            className="w-full h-[500px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono"
          />
          <div className="flex justify-end text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
            {text.split('\n').filter(l => l.length > 0).length} éléments
          </div>
        </div>

        {/* Tools Sidebar */}
        <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
          {/* Add Prefix/Suffix */}
          <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-500">
              <Plus className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Ajouter Préfixe / Suffixe</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="Préfixe"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all dark:text-white"
              />
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="Suffixe"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all dark:text-white"
              />
            </div>
            <button
              onClick={addPrefixSuffix}
              className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
            >
              Appliquer à toute la liste
            </button>
          </div>

          {/* Search & Replace */}
          <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <div className="flex items-center gap-3 text-indigo-500">
              <Replace className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Rechercher & Remplacer</h3>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Rechercher..."
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all dark:text-white"
              />
              <input
                type="text"
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                placeholder="Remplacer par..."
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500 transition-all dark:text-white"
              />
            </div>
            <button
              onClick={handleReplace}
              className="w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
            >
              Remplacer tout
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-3 text-indigo-500">
                <Scissors className="w-4 h-4" />
                <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Nettoyage Rapide</h3>
              </div>
              <div className="grid gap-2">
                <button onClick={removeDuplicates} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
                  <span className="font-bold text-[11px]">Doublons</span>
                  <ListChecks className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                </button>
                <button onClick={removeEmptyLines} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
                  <span className="font-bold text-[11px]">Lignes vides</span>
                  <Trash2 className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                </button>
                <button onClick={removePunctuation} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
                  <span className="font-bold text-[11px]">Ponctuation</span>
                  <Hash className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center gap-3 text-indigo-500">
                <SortAsc className="w-4 h-4" />
                <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Organisation</h3>
              </div>
              <div className="grid gap-2">
                <button onClick={sortAZ} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
                  <span className="font-bold text-[11px]">A-Z</span>
                  <SortAsc className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                </button>
                <button onClick={reverseList} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
                  <span className="font-bold text-[11px]">Inverser</span>
                  <SortDesc className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                </button>
                <button onClick={() => processList(lines => lines.map(l => l.toUpperCase()))} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all group">
                  <span className="font-bold text-[11px]">MAJUSCULES</span>
                  <Type className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
