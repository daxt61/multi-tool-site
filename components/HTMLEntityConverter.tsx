import { useState } from 'react';
import { Copy, Check, Code, ArrowLeftRight, Trash2, Info } from 'lucide-react';

export function HTMLEntityConverter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [copied, setCopied] = useState(false);

  const encodeHTML = (str: string) => {
    return str.replace(/[\u00A0-\u9999<>&]/g, (i) => {
      return '&#' + i.charCodeAt(0) + ';';
    });
  };

  const decodeHTML = (str: string) => {
    try {
      const doc = new DOMParser().parseFromString(str, 'text/html');
      return doc.documentElement.textContent || '';
    } catch (err) {
      console.error('Decoding error:', err);
      return str;
    }
  };

  const handleConvert = () => {
    if (mode === 'encode') {
      setOutput(encodeHTML(input));
    } else {
      setOutput(decodeHTML(input));
    }
  };

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Mode Selector */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode('encode')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${mode === 'encode' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
          >
            Encoder
          </button>
          <button
            onClick={() => setMode('decode')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all ${mode === 'decode' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
          >
            Décoder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-500" /> Texte source
            </h3>
            <button
              onClick={() => setInput('')}
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              title="Effacer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? 'Ex: <h1>Hello & Welcome!</h1>' : 'Ex: &lt;h1&gt;Hello &amp; Welcome!&lt;/h1&gt;'}
            className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-slate-300"
          />
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={handleConvert}
            className="group flex items-center gap-3 px-12 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-xl shadow-indigo-500/20"
          >
            <ArrowLeftRight className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
            {mode === 'encode' ? 'Encoder en Entités' : 'Décoder en Texte'}
          </button>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-500" /> Résultat
            </h3>
            {output && (
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-500 hover:text-white'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier le résultat'}
              </button>
            )}
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Le résultat s'affichera ici..."
            className="w-full h-48 p-6 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] font-mono text-sm outline-none dark:text-slate-300"
          />
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
          <Info className="w-4 h-4" /> À quoi ça sert ?
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {mode === 'encode'
            ? "L'encodage HTML convertit les caractères spéciaux (comme <, >, &) en leurs entités correspondantes. C'est essentiel pour afficher du code sur une page web sans qu'il soit interprété par le navigateur."
            : "Le décodage HTML transforme les entités (comme &amp;lt;) en leurs caractères originaux (<). Utile pour lire du contenu HTML échappé."}
        </p>
      </div>
    </div>
  );
}
