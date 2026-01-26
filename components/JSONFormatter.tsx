import { useState } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Maximize2, Minimize2 } from 'lucide-react';

export function JSONFormatter() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const formatJSON = (indent: number = 2) => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed, null, indent));
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const minifyJSON = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCopy = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setInput('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => formatJSON(2)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Maximize2 className="w-4 h-4" /> Formater (2 spaces)
          </button>
          <button
            onClick={() => formatJSON(4)}
            className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-all"
          >
            Formater (4 spaces)
          </button>
          <button
            onClick={minifyJSON}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <Minimize2 className="w-4 h-4" /> Minifier
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={!input}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
          <button
            onClick={clear}
            className="px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-xl font-bold text-sm hover:bg-rose-100 transition-all flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Effacer
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest opacity-60 mb-1">Erreur de syntaxe</div>
            <div className="font-mono text-sm">{error}</div>
          </div>
        </div>
      )}

      <div className="relative group">
        <div className="absolute top-4 left-4 pointer-events-none text-slate-300 dark:text-slate-700 group-focus-within:text-indigo-500/50 transition-colors">
          <FileCode className="w-8 h-8" />
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='{"name": "test", "data": [1, 2, 3]}'
          className="w-full h-[500px] p-8 pl-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-inner"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl border border-indigo-100 dark:border-indigo-500/10">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">Prettify</h4>
          <p className="text-sm text-indigo-700/70 dark:text-indigo-400/60 leading-relaxed">
            Organisez votre JSON pour le rendre lisible avec une indentation propre et des retours à la ligne.
          </p>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-900 dark:text-slate-300 mb-2">Minify</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Supprimez tous les espaces et retours à la ligne pour réduire la taille de votre fichier JSON.
          </p>
        </div>
      </div>
    </div>
  );
}
