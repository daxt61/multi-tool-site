import { useState } from 'react';
import { Minimize2, Copy, Check, Trash2, FileCode, AlertCircle, Sparkles } from 'lucide-react';

type Language = 'javascript' | 'css' | 'html';

export function CodeMinifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState<Language>('javascript');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const minifyJS = (code: string) => {
    return code
      .replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  };

  const minifyCSS = (code: string) => {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*([\{\}\:\;\,])\s*/g, '$1') // Remove spaces around delimiters
      .trim();
  };

  const minifyHTML = (code: string) => {
    return code
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/>\s+</g, '><') // Remove space between tags
      .trim();
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    setIsProcessing(true);

    // Simulate slight delay for UX
    setTimeout(() => {
      let result = '';
      switch (language) {
        case 'javascript': result = minifyJS(input); break;
        case 'css': result = minifyCSS(input); break;
        case 'html': result = minifyHTML(input); break;
      }
      setOutput(result);
      setIsProcessing(false);
    }, 300);
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
  };

  const reduction = input.length > 0 && output.length > 0
    ? Math.round((1 - output.length / input.length) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mx-auto mb-8">
        {(['javascript', 'css', 'html'] as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              language === lang
                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code Source</label>
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
            placeholder={`Collez votre code ${language} ici...`}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code Minifié</label>
            </div>
            <div className="flex gap-2">
              {reduction > 0 && (
                <div className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-md flex items-center">
                  -{reduction}%
                </div>
              )}
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 disabled:opacity-50'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Le résultat minifié apparaîtra ici..."
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={handleMinify}
          disabled={!input.trim() || isProcessing}
          className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
        >
          {isProcessing ? <Minimize2 className="w-6 h-6 animate-spin" /> : <Minimize2 className="w-6 h-6" />}
          {isProcessing ? 'Minification...' : 'Minifier le code'}
        </button>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-6">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">Pourquoi minifier votre code ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La minification supprime les caractères inutiles (commentaires, espaces, retours à la ligne) sans changer la fonctionnalité du code.
            Cela réduit la taille des fichiers, accélère le téléchargement pour vos utilisateurs et améliore les performances globales de votre site web.
          </p>
        </div>
      </div>
    </div>
  );
}
