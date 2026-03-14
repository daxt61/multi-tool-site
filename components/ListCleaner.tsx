import { useState } from 'react';
import { Copy, Check, Trash2, SortAsc, SortDesc, ListChecks, Type, FileDown, Scissors, Plus } from 'lucide-react';

export function ListCleaner() {
  const [text, setText] = useState('');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
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

  const applyPrefixSuffix = () => {
    processList(lines => lines.map(line => {
      if (line.trim() === '') return line;
      return `${prefix}${line}${suffix}`;
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="list-cleaner-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Liste</label>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 shadow-sm'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
            </button>
            <button
              onClick={handleDownload}
              className="text-xs font-bold px-4 py-2 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-2 shadow-sm"
            >
              <FileDown className="w-3 h-3" /> Télécharger
            </button>
            <button
              onClick={() => setText('')}
              className="text-xs font-bold px-4 py-2 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-2 shadow-sm"
              aria-label="Effacer tout"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        </div>
        <textarea
          id="list-cleaner-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez vos éléments ici, un par ligne..."
          className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono shadow-inner"
        />
        <div className="flex justify-end text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
          {text.split('\n').filter(l => l.length > 0).length} éléments
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Nettoyage */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <Scissors className="w-4 h-4" />
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Nettoyage</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Doublons', icon: <ListChecks className="w-4 h-4" />, action: removeDuplicates },
              { label: 'Lignes vides', icon: <Trash2 className="w-4 h-4" />, action: removeEmptyLines },
              { label: 'Espaces (trim)', icon: <Scissors className="w-4 h-4" />, action: trimLines },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
              >
                <span className="font-bold text-sm">{item.label}</span>
                <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">{item.icon}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tri */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <SortAsc className="w-4 h-4" />
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Tri</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Alphabétique (A-Z)', icon: <SortAsc className="w-4 h-4" />, action: sortAZ },
              { label: 'Alphabétique (Z-A)', icon: <SortDesc className="w-4 h-4" />, action: sortZA },
              { label: 'Longueur', icon: <SortAsc className="w-4 h-4" />, action: sortLength },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
              >
                <span className="font-bold text-sm">{item.label}</span>
                <div className="text-slate-400 group-hover:text-indigo-500 transition-colors">{item.icon}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Casse */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <Type className="w-4 h-4" />
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Casse</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'MAJUSCULES', action: () => processList(lines => lines.map(l => l.toUpperCase())) },
              { label: 'minuscules', action: () => processList(lines => lines.map(l => l.toLowerCase())) },
              { label: 'Capitaliser', action: () => processList(lines => lines.map(l => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase())) },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group"
              >
                <span className="font-bold text-sm">{item.label}</span>
                <Type className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Ajouts */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <Plus className="w-4 h-4" />
            <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">Ajouts</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Préfixe</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="Ex: - "
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Suffixe</label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="Ex: ;"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <button
              onClick={applyPrefixSuffix}
              disabled={!prefix && !suffix}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
            >
              Appliquer aux lignes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
