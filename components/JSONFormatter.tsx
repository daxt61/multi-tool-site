import { useState } from 'react';
import { Copy, Check, FileCode, Braces, Minimize2, Maximize2, AlertCircle } from 'lucide-react';

export function JSONFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const formatJSON = (spaces: number) => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, spaces));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setOutput('');
    }
  };

  const minifyJSON = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setOutput('');
    }
  };

  const validateJSON = () => {
    try {
      if (!input.trim()) return;
      JSON.parse(input);
      setError(null);
      setOutput('JSON Valide ✓');
    } catch (err: any) {
      setError(err.message);
      setOutput('');
    }
  };

  const copyToClipboard = () => {
    if (!output || output === 'JSON Valide ✓') return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" /> Entrée JSON
            </h3>
            <button
              onClick={() => setInput('')}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors"
            >
              Effacer
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Braces className="w-4 h-4 text-indigo-500" /> Résultat
            </h3>
            {output && output !== 'JSON Valide ✓' && (
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-500 hover:text-white'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            )}
          </div>
          <div className="relative group">
            <textarea
              value={output}
              readOnly
              placeholder="Le résultat s'affichera ici..."
              className={`w-full h-96 p-6 border rounded-[2rem] font-mono text-sm outline-none transition-all resize-none ${error ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-600' : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 dark:text-slate-300'}`}
            />
            {error && (
              <div className="absolute inset-x-0 bottom-0 p-6 bg-rose-500 text-white rounded-b-[2rem] flex items-start gap-3 animate-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-xs font-bold leading-relaxed">
                  <div className="uppercase tracking-widest opacity-70 mb-1 text-[10px]">Erreur de parsing</div>
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-4 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => formatJSON(2)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
        >
          <Maximize2 className="w-4 h-4" /> Formater (2 spaces)
        </button>
        <button
          onClick={() => formatJSON(4)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
        >
          <Maximize2 className="w-4 h-4" /> Formater (4 spaces)
        </button>
        <button
          onClick={minifyJSON}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-[0.98]"
        >
          <Minimize2 className="w-4 h-4" /> Minifier
        </button>
        <button
          onClick={validateJSON}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
        >
          <Check className="w-4 h-4" /> Valider
        </button>
      </div>
    </div>
  );
}
