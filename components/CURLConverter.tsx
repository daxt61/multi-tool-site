import React, { useState, useEffect, useCallback } from 'react';
import { Terminal, Copy, Check, Trash2, AlertCircle, Code, Download, Info } from 'lucide-react';

const MAX_LENGTH = 100000; // 100KB

export function CURLConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [input, setInput] = useState(initialData?.input || '');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const parseCURL = useCallback((curl: string) => {
    if (!curl.trim()) {
      setOutput('');
      setError(null);
      return;
    }

    try {
      // Basic parser for demonstration
      const urlMatch = curl.match(/curl\s+.*?['"]?(https?:\/\/[^\s'"]+)['"]?/);
      if (!urlMatch) {
        throw new Error("Commande cURL invalide ou URL non trouvée.");
      }

      const url = urlMatch[1];
      const methodMatch = curl.match(/-X\s+(\w+)/);
      const method = methodMatch ? methodMatch[1].toUpperCase() : 'GET';

      const headers: Record<string, string> = {};
      const headerMatches = curl.matchAll(/-H\s+['"]([^'"]+)['"]/g);
      for (const match of headerMatches) {
        const [key, ...valueParts] = match[1].split(':');
        headers[key.trim()] = valueParts.join(':').trim();
      }

      const dataMatch = curl.match(/(?:-d|--data|--data-raw)\s+['"]?([\s\S]+?)['"]?(?:\s+-[A-Z]|$)/);
      const data = dataMatch ? dataMatch[1] : null;

      let fetchCode = `fetch("${url}", {\n`;
      fetchCode += `  method: "${method}",\n`;

      if (Object.keys(headers).length > 0) {
        fetchCode += `  headers: {\n`;
        Object.entries(headers).forEach(([k, v]) => {
          fetchCode += `    "${k}": "${v}",\n`;
        });
        fetchCode += `  },\n`;
      }

      if (data) {
        fetchCode += `  body: JSON.stringify(${data}),\n`;
      }

      fetchCode += `})\n.then(response => response.json())\n.then(data => console.log(data))\n.catch(error => console.error('Erreur:', error));`;

      setOutput(fetchCode);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Erreur lors de la conversion.");
      setOutput('');
    }
  }, []);

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(`L'entrée est trop longue. Limite de ${MAX_LENGTH.toLocaleString()} caractères.`);
      setOutput('');
    } else {
      parseCURL(input);
    }
  }, [input, parseCURL]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fetch-request.js';
    link.click();
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
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="curl-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" /> Commande cURL
            </label>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            id="curl-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='curl https://api.example.com/v1/data -H "Authorization: Bearer token"'
            className={`w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-[2rem] outline-none focus:ring-2 ${error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none`}
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="fetch-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-500" /> Fetch JavaScript
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3 h-3" /> Télécharger
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-transparent hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="fetch-output"
            value={output}
            readOnly
            placeholder="Le code fetch apparaîtra ici..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
         <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Info className="w-6 h-6" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">Comment ça marche ?</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Collez votre commande cURL dans le champ de gauche. L'outil extraira l'URL, la méthode HTTP, les en-têtes et le corps de la requête pour générer un snippet JavaScript utilisant l'API <code>fetch</code>.
            </p>
         </div>
      </div>
    </div>
  );
}
