import { useState, useCallback } from 'react';
import { Copy, Check, Trash2, SortAsc, SortDesc, ListChecks, Type, FileDown, Scissors } from 'lucide-react';

export function ListCleaner() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const handleDownload = useCallback(() => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'liste_nettoyee.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [text]);

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

  const itemCount = text.split('\n').filter(l => l.trim().length > 0).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="list-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Liste</label>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!text}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={copied ? "Copié" : "Copier la liste"}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
            </button>
            <button
              onClick={handleDownload}
              disabled={!text}
              className="text-xs font-bold px-3 py-1.5 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Télécharger la liste"
            >
              <FileDown className="w-3 h-3" /> Télécharger
            </button>
            <button
              onClick={() => setText('')}
              disabled={!text}
              className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Effacer tout"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        </div>
        <textarea
          id="list-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez vos éléments ici, un par ligne..."
          className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono"
        />
        <div className="flex justify-end text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
          {itemCount} {itemCount > 1 ? 'éléments' : 'élément'}
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
            {[
              { label: 'Supprimer les doublons', icon: ListChecks, action: removeDuplicates },
              { label: 'Supprimer les lignes vides', icon: Trash2, action: removeEmptyLines },
              { label: 'Tronquer les espaces', icon: Scissors, action: trimLines },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                disabled={!text}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-bold text-sm">{btn.label}</span>
                <btn.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Tri */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <SortAsc className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Tri</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Alphabétique (A-Z)', icon: SortAsc, action: sortAZ },
              { label: 'Alphabétique (Z-A)', icon: SortDesc, action: sortZA },
              { label: 'Par longueur', icon: SortAsc, action: sortLength },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                disabled={!text}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-bold text-sm">{btn.label}</span>
                <btn.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Transformation */}
        <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <Type className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Casse</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'MAJUSCULES', action: () => processList(lines => lines.map(l => l.toUpperCase())) },
              { label: 'minuscules', action: () => processList(lines => lines.map(l => l.toLowerCase())) },
              { label: 'Capitaliser', action: () => processList(lines => lines.map(l => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase())) },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                disabled={!text}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-bold text-sm">{btn.label}</span>
                <Type className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
