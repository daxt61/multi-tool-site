import { useState } from 'react';
import { Copy, Check, Trash2, SortAsc, SortDesc, ListChecks, Type, FileDown, Scissors } from 'lucide-react';

export function ListCleaner() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

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
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
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
          </div>
        </div>

        {/* Tri */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <SortAsc className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Tri</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={sortAZ}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">Alphabétique (A-Z)</span>
              <SortAsc className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button
              onClick={sortZA}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">Alphabétique (Z-A)</span>
              <SortDesc className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button
              onClick={sortLength}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">Par longueur</span>
              <SortAsc className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
          </div>
        </div>

        {/* Transformation */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <Type className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Casse</h3>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => processList(lines => lines.map(l => l.toUpperCase()))}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">MAJUSCULES</span>
              <Type className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button
              onClick={() => processList(lines => lines.map(l => l.toLowerCase()))}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">minuscules</span>
              <Type className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
            <button
              onClick={() => processList(lines => lines.map(l => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase()))}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
            >
              <span className="font-bold text-sm">Capitaliser</span>
              <Type className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
