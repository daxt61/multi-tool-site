import { useState, useMemo } from 'react';
import { Code, Copy, Check, Trash2, Info, ArrowLeftRight } from 'lucide-react';

export function StringEscaper() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const escaped = useMemo(() => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }, [input]);

  const handleCopy = () => {
    if (!escaped) return;
    navigator.clipboard.writeText(escaped);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setCopied(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Area */}
        <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 flex flex-col">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Source</h3>
            </div>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Saisissez du code HTML ou du texte à échapper..."
            className="w-full h-64 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-mono text-sm dark:text-slate-300"
          />
        </section>

        {/* Output Area */}
        <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 flex flex-col">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Échappé</h3>
            </div>
            <button
              onClick={handleCopy}
              disabled={!escaped}
              className={`text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-30 ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            value={escaped}
            readOnly
            placeholder="Le résultat apparaîtra ici..."
            className="w-full h-64 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-mono text-sm dark:text-slate-300"
          />
        </section>
      </div>

      {/* Info Section */}
      <section className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Info className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Pourquoi échapper les caractères ?</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-1">
          L'échappement de chaîne convertit les caractères spéciaux (comme &lt;, &gt;, &amp;) en leurs entités HTML correspondantes. C'est indispensable pour afficher du code sur une page web sans qu'il soit interprété par le navigateur comme du contenu HTML réel, prévenant ainsi les failles XSS.
        </p>
      </section>
    </div>
  );
}
