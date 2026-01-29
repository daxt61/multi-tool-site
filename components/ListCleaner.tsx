import { useState } from 'react';
import { Copy, Check, Trash2, SortAsc, SortDesc, ListFilter, Scissors, Type } from 'lucide-react';

export function ListCleaner() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeDuplicates = () => {
    const lines = text.split('\n');
    const uniqueLines = Array.from(new Set(lines.map(line => line.trim()))).filter(line => line.length > 0);
    setText(uniqueLines.join('\n'));
  };

  const sortAZ = () => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    setText(lines.sort((a, b) => a.localeCompare(b)).join('\n'));
  };

  const sortZA = () => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    setText(lines.sort((a, b) => b.localeCompare(a)).join('\n'));
  };

  const sortByLength = () => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    setText(lines.sort((a, b) => a.length - b.length).join('\n'));
  };

  const cleanWhitespace = () => {
    const lines = text.split('\n');
    const cleanedLines = lines.map(line => line.trim()).filter(line => line.length > 0);
    setText(cleanedLines.join('\n'));
  };

  const stats = {
    lines: text === '' ? 0 : text.split('\n').filter(l => l.trim().length > 0).length,
    characters: text.length
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Liste</label>
          <div className="flex gap-2">
            <button onClick={handleCopy} className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
            </button>
            <button onClick={() => setText('')} className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Collez votre liste ici (une ligne par élément)..."
          className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={removeDuplicates} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
          <ListFilter className="w-4 h-4 text-indigo-500" /> Supprimer les doublons
        </button>
        <button onClick={sortAZ} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
          <SortAsc className="w-4 h-4 text-indigo-500" /> Trier A-Z
        </button>
        <button onClick={sortZA} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
          <SortDesc className="w-4 h-4 text-indigo-500" /> Trier Z-A
        </button>
        <button onClick={sortByLength} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
          <Scissors className="w-4 h-4 text-indigo-500" /> Trier par longueur
        </button>
        <button onClick={cleanWhitespace} className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
          <Type className="w-4 h-4 text-indigo-500" /> Nettoyer les espaces
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
          <div className="text-2xl font-black font-mono tracking-tight dark:text-white">{stats.lines}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lignes</div>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
          <div className="text-2xl font-black font-mono tracking-tight dark:text-white">{stats.characters}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Caractères</div>
        </div>
      </div>
    </div>
  );
}
