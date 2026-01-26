import { useState } from 'react';
import { Code, Copy, Check, Trash2 } from 'lucide-react';

export function HTMLEntityConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const encode = () => {
    const div = document.createElement('div');
    div.textContent = input;
    setOutput(div.innerHTML);
  };

  const decode = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    setOutput(doc.documentElement.textContent || '');
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setInput('');
    setOutput('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Entrée</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Texte ou entités HTML..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Sortie</label>
          <div className="relative group">
            <textarea
              value={output}
              readOnly
              className="w-full h-64 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
            />
            {output && (
              <button
                onClick={handleCopy}
                className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 shadow-sm'}`}
                aria-label="Copier le résultat"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={encode}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          <Code className="w-6 h-6" /> Encoder
        </button>
        <button
          onClick={decode}
          className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg hover:border-indigo-500 transition-all flex items-center gap-2 active:scale-95"
        >
          Décoder
        </button>
        <button
          onClick={clear}
          className="px-8 py-4 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-2xl font-black text-lg hover:bg-rose-100 transition-all flex items-center gap-2 active:scale-95"
        >
          <Trash2 className="w-6 h-6" /> Effacer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800">
           <h4 className="font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Pourquoi encoder ?</h4>
           <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
             L'encodage des entités HTML convertit les caractères spéciaux (comme &lt;, &gt;, &amp;) en leurs équivalents sécurisés pour éviter les erreurs d'interprétation par le navigateur et prévenir les attaques XSS.
           </p>
        </div>
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800">
           <h4 className="font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Pourquoi décoder ?</h4>
           <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
             Le décodage permet de retrouver le texte original à partir de sa forme encodée. Notre outil utilise <code>DOMParser</code> pour garantir un décodage fidèle aux standards du web.
           </p>
        </div>
      </div>
    </div>
  );
}
