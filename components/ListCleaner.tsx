import { useState } from 'react';
import { Copy, Check, Trash2, SortAsc, SortDesc, Layers, Type, Filter } from 'lucide-react';

export function ListCleaner() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const getLines = () => text.split('\n');

  const updateText = (lines: string[]) => {
    setText(lines.join('\n'));
  };

  const sortLines = (direction: 'asc' | 'desc') => {
    const lines = getLines().filter(l => l.trim() !== '');
    const emptyLines = getLines().filter(l => l.trim() === '');

    lines.sort((a, b) => {
      const comparison = a.localeCompare(b, undefined, { sensitivity: 'base' });
      return direction === 'asc' ? comparison : -comparison;
    });

    updateText([...lines, ...emptyLines]);
  };

  const sortLinesLength = () => {
    const lines = getLines().filter(l => l.trim() !== '');
    const emptyLines = getLines().filter(l => l.trim() === '');

    lines.sort((a, b) => a.length - b.length);
    updateText([...lines, ...emptyLines]);
  };

  const removeDuplicates = () => {
    const lines = getLines();
    const uniqueLines = Array.from(new Set(lines));
    updateText(uniqueLines);
  };

  const removeEmptyLines = () => {
    const lines = getLines().filter(l => l.trim() !== '');
    updateText(lines);
  };

  const trimLines = () => {
    const lines = getLines().map(l => l.trim());
    updateText(lines);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = {
    total: text === '' ? 0 : getLines().length,
    unique: text === '' ? 0 : new Set(getLines()).size,
    empty: getLines().filter(l => l.trim() === '').length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Lignes', value: stats.total, icon: <Type className="w-4 h-4" /> },
          { label: 'Lignes Uniques', value: stats.unique, icon: <Layers className="w-4 h-4" /> },
          { label: 'Lignes Vides', value: stats.empty, icon: <Filter className="w-4 h-4" /> },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="text-indigo-500">{stat.icon}</div>
            <div>
              <div className="text-sm font-black font-mono dark:text-white">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Liste</label>
            <div className="flex gap-2">
              <button onClick={handleCopy} className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copié' : 'Copier'}
              </button>
              <button onClick={() => setText('')} className="text-xs font-bold px-4 py-2 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Élément 1\nÉlément 2\nÉlément 1..."
            className="w-full h-[500px] p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 shadow-sm resize-none"
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Actions de Tri</h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => sortLines('asc')}
                className="w-full p-4 text-left bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200 rounded-2xl transition-all font-bold text-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3"
              >
                <SortAsc className="w-4 h-4 text-indigo-500" /> Tri Croissant (A-Z)
              </button>
              <button
                onClick={() => sortLines('desc')}
                className="w-full p-4 text-left bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200 rounded-2xl transition-all font-bold text-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3"
              >
                <SortDesc className="w-4 h-4 text-indigo-500" /> Tri Décroissant (Z-A)
              </button>
              <button
                onClick={sortLinesLength}
                className="w-full p-4 text-left bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200 rounded-2xl transition-all font-bold text-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3"
              >
                <SortAsc className="w-4 h-4 text-indigo-500" /> Trier par Longueur
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nettoyage</h4>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={removeDuplicates}
                className="w-full p-4 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-700 dark:text-slate-200 rounded-2xl transition-all font-bold text-sm border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30 flex items-center gap-3"
              >
                <Layers className="w-4 h-4 text-rose-500" /> Supprimer les Doublons
              </button>
              <button
                onClick={removeEmptyLines}
                className="w-full p-4 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-700 dark:text-slate-200 rounded-2xl transition-all font-bold text-sm border border-transparent hover:border-amber-200 dark:hover:border-amber-900/30 flex items-center gap-3"
              >
                <Filter className="w-4 h-4 text-amber-500" /> Supprimer Lignes Vides
              </button>
              <button
                onClick={trimLines}
                className="w-full p-4 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-200 rounded-2xl transition-all font-bold text-sm border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/30 flex items-center gap-3"
              >
                <Type className="w-4 h-4 text-indigo-500" /> Trim (Espaces début/fin)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
