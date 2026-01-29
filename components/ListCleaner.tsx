import { useState } from 'react';
import { Copy, Check, Trash2, SortAsc, SortDesc, Filter, Scissors, AlignLeft } from 'lucide-react';

export function ListCleaner() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processLines = (fn: (lines: string[]) => string[]) => {
    const lines = text.split('\n');
    const processed = fn(lines);
    setText(processed.join('\n'));
  };

  const sortAlphabetical = () => processLines(lines => [...lines].sort((a, b) => a.localeCompare(b)));
  const sortReverse = () => processLines(lines => [...lines].sort((a, b) => b.localeCompare(a)));
  const sortByLength = () => processLines(lines => [...lines].sort((a, b) => a.length - b.length));
  const removeDuplicates = () => processLines(lines => Array.from(new Set(lines)));
  const trimLines = () => processLines(lines => lines.map(line => line.trim()));
  const removeEmptyLines = () => processLines(lines => lines.filter(line => line.trim() !== ''));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Actions</label>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={sortAlphabetical} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              <SortAsc className="w-4 h-4 text-indigo-500" /> Tri A-Z
            </button>
            <button onClick={sortReverse} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              <SortDesc className="w-4 h-4 text-indigo-500" /> Tri Z-A
            </button>
            <button onClick={sortByLength} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              <AlignLeft className="w-4 h-4 text-indigo-500" /> Tri Longueur
            </button>
            <button onClick={removeDuplicates} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              <Filter className="w-4 h-4 text-emerald-500" /> Uniques
            </button>
            <button onClick={trimLines} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              <Scissors className="w-4 h-4 text-amber-500" /> Nettoyer espaces
            </button>
            <button onClick={removeEmptyLines} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
              <Trash2 className="w-4 h-4 text-rose-500" /> Retirer vides
            </button>
          </div>
        </div>

        {/* Input/Output */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Liste (une ligne par élément)</label>
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
            placeholder="Élément 1&#10;Élément 2&#10;Élément 3..."
            className="w-full h-[500px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono"
          />
          <div className="flex justify-end px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            {text === '' ? 0 : text.split('\n').length} éléments
          </div>
        </div>
      </div>
    </div>
  );
}
