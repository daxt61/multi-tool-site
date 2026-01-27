import { useState } from 'react';
import { FileCode, Copy, Check, Trash2, AlertCircle, Terminal } from 'lucide-react';

export function JSONToTS() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const convertJSONToTS = (json: any, indent: string = ''): string => {
    if (json === null) return 'any';
    if (typeof json !== 'object') return typeof json;

    if (Array.isArray(json)) {
      if (json.length === 0) return 'any[]';
      // Use the first item to infer the type of the array
      const itemType = convertJSONToTS(json[0], indent);
      return `${itemType}[]`;
    }

    let result = '{\n';
    const nextIndent = indent + '  ';
    for (const key in json) {
      const value = json[key];
      const type = convertJSONToTS(value, nextIndent);
      result += `${nextIndent}${key}: ${type};\n`;
    }
    result += `${indent}}`;
    return result;
  };

  const handleConvert = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      let result = convertJSONToTS(parsed);

      // Wrap the root object in an interface
      if (result.startsWith('{')) {
        result = `interface RootObject ${result}`;
      } else {
        result = `type RootObject = ${result};`;
      }

      setOutput(result);
      setError('');
    } catch (e: any) {
      setError('JSON invalide : ' + e.message);
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
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
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Entrée JSON</label>
            </div>
            <button
              onClick={handleClear}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"id": 1, "name": "John Doe", "active": true}'
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Interfaces TypeScript</label>
            </div>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 disabled:opacity-50'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Les interfaces TypeScript apparaîtront ici..."
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleConvert}
          className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <Terminal className="w-5 h-5" /> Générer les interfaces
        </button>
      </div>
    </div>
  );
}
