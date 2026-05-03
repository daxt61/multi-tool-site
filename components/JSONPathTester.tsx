import { useState, useEffect } from 'react';
import { FileCode, Search, Copy, Check, Trash2, AlertCircle, Terminal, Download, Info } from 'lucide-react';
import { JSONPath } from 'jsonpath-plus';

const MAX_LENGTH = 100000;

export function JSONPathTester({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [jsonInput, setJsonInput] = useState(initialData?.jsonInput || '');
  const [pathInput, setPathInput] = useState(initialData?.pathInput || '$');
  const [output, setOutput] = useState(initialData?.output || '');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ jsonInput, pathInput, output });
  }, [jsonInput, pathInput, output]);

  const handleTest = () => {
    try {
      setError('');
      if (!jsonInput.trim()) return;
      if (jsonInput.length > MAX_LENGTH) {
        setError(`L'entrée est trop longue. Limite de ${MAX_LENGTH.toLocaleString()} caractères.`);
        return;
      }

      const parsed = JSON.parse(jsonInput);
      const result = JSONPath({
        path: pathInput,
        json: parsed,
        wrap: false
      });

      setOutput(JSON.stringify(result, null, 2));
    } catch (e: any) {
      setError('Erreur : ' + e.message);
      setOutput('');
    }
  };

  useEffect(() => {
    if (jsonInput.trim() && pathInput.trim()) {
      handleTest();
    }
  }, [jsonInput, pathInput]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setJsonInput('');
    setPathInput('$');
    setOutput('');
    setError('');
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'result.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label htmlFor="json-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Données JSON</label>
            </div>
            <button
              onClick={handleClear}
              disabled={!jsonInput && output === ''}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            id="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"store": {"book": [{"title": "Sayings of the Century", "price": 8.95}]}}'
            className="w-full h-[350px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />

          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Search className="w-4 h-4 text-indigo-500" />
              <label htmlFor="path-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Expression JSONPath</label>
            </div>
            <input
              id="path-input"
              type="text"
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              placeholder="$.store.book[*].author"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <label htmlFor="result-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Résultat</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="result-output"
            value={output}
            readOnly
            placeholder="Le résultat de l'expression apparaîtra ici..."
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
            <Info className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">Guide Rapide JSONPath</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300">Opérateurs de base</h5>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <li><code className="text-indigo-500 font-bold">$</code> : L'objet racine</li>
              <li><code className="text-indigo-500 font-bold">@</code> : L'objet courant</li>
              <li><code className="text-indigo-500 font-bold">.</code> ou <code className="text-indigo-500 font-bold">[]</code> : Enfant</li>
              <li><code className="text-indigo-500 font-bold">..</code> : Descente profonde (récursif)</li>
              <li><code className="text-indigo-500 font-bold">*</code> : Joker (tous les éléments)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300">Exemples</h5>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <li><code className="text-indigo-500 font-bold">$.store.book[*].author</code> : Auteurs de tous les livres</li>
              <li><code className="text-indigo-500 font-bold">$..author</code> : Tous les auteurs dans le document</li>
              <li><code className="text-indigo-500 font-bold">$.store..price</code> : Tous les prix dans le magasin</li>
              <li><code className="text-indigo-500 font-bold">$..book[?(@.price &lt; 10)]</code> : Livres à moins de 10€</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
