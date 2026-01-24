import { useState } from 'react';
import { Check, AlertCircle, Trash2, Copy, FileJson, Zap } from 'lucide-react';

export function JSONFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const formatJSON = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError('JSON invalide : ' + (e as Error).message);
      setOutput('');
    }
  };

  const minifyJSON = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
    } catch (e) {
      setError('JSON invalide : ' + (e as Error).message);
      setOutput('');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 px-2">
            <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <FileJson className="w-4 h-4" /> Entrée JSON
            </label>
            <button
              onClick={clearAll}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Tout effacer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <div className="relative group flex-grow">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-[500px] p-6 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-indigo-500 rounded-[2rem] resize-none font-mono text-sm dark:text-gray-300 outline-none transition-all shadow-inner"
              placeholder='{"nom": "Outil", "version": 4}'
            />
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 px-2">
            <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4" /> Résultat
            </label>
            {output && (
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full transition-all ${
                  copied ? 'bg-green-500 text-white' : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            )}
          </div>
          <div className="relative flex-grow">
            <textarea
              value={output}
              readOnly
              className="w-full h-[500px] p-6 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-[2rem] resize-none font-mono text-sm text-indigo-600 dark:text-indigo-400 outline-none shadow-sm"
              placeholder="Le JSON formaté apparaîtra ici..."
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border-2 border-red-100 dark:border-red-500/20 rounded-[1.5rem] p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-xl">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h4 className="font-bold text-red-900 dark:text-red-200 mb-1">Erreur de syntaxe</h4>
            <p className="text-red-700 dark:text-red-300/80 font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={formatJSON}
          disabled={!input}
          className="flex-1 py-5 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          <Zap className="w-5 h-5" /> Formatter (Pretty)
        </button>
        <button
          onClick={minifyJSON}
          disabled={!input}
          className="flex-1 py-5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-2 border-gray-100 dark:border-gray-700 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          Minifier (Compact)
        </button>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-500/10">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-4 flex items-center gap-2 text-lg">
          <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Astuces JSON
        </h4>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-indigo-700 dark:text-indigo-300/80 font-medium">
          <li className="flex items-center gap-2">• Utilisez des guillemets doubles (") pour les clés</li>
          <li className="flex items-center gap-2">• Pas de virgule après le dernier élément</li>
          <li className="flex items-center gap-2">• Les booléens sont en minuscules : true / false</li>
          <li className="flex items-center gap-2">• Les chaînes de caractères supportent l'Unicode</li>
        </ul>
      </div>
    </div>
  );
}
