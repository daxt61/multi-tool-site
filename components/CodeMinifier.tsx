import { useState } from 'react';
import { Zap, Copy, Check, Trash2, Code, FileCode, AlignLeft } from 'lucide-react';

type Language = 'javascript' | 'css' | 'html';

export function CodeMinifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState<Language>('javascript');
  const [copied, setCopied] = useState(false);

  const minifyJS = (code: string) => {
    return code
      .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1') // Remove comments
      .replace(/\s+/g, ' ') // Replace multiple spaces with one
      .replace(/\s*([{};,])\s*/g, '$1') // Remove spaces around delimiters
      .trim();
  };

  const minifyCSS = (code: string) => {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Replace multiple spaces with one
      .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around delimiters
      .trim();
  };

  const minifyHTML = (code: string) => {
    return code
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Replace multiple spaces with one
      .replace(/>\s+</g, '><') // Remove spaces between tags
      .trim();
  };

  const handleMinify = () => {
    let minified = '';
    switch (language) {
      case 'javascript': minified = minifyJS(input); break;
      case 'css': minified = minifyCSS(input); break;
      case 'html': minified = minifyHTML(input); break;
    }
    setOutput(minified);
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

  const stats = {
    inputSize: input.length,
    outputSize: output.length,
    reduction: input.length > 0 ? ((input.length - output.length) / input.length * 100).toFixed(1) : 0
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit mx-auto">
        {[
          { id: 'javascript', name: 'JavaScript', icon: FileCode },
          { id: 'css', name: 'CSS', icon: AlignLeft },
          { id: 'html', name: 'HTML', icon: Code },
        ].map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id as Language)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${language === lang.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            <lang.icon className="w-4 h-4" /> {lang.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code Source</label>
            <button onClick={handleClear} className="text-xs font-bold text-rose-500 hover:underline flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed resize-none"
            placeholder={`Collez votre code ${language} ici...`}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code Minifié</label>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:underline disabled:opacity-50'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
            placeholder="Le résultat minifié apparaîtra ici..."
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <button
          onClick={handleMinify}
          className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3"
        >
          <Zap className="w-6 h-6 fill-current" /> Minifier
        </button>

        {output && (
          <div className="flex gap-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
              <div className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">Original</div>
              <div className="text-xl font-black text-indigo-900 dark:text-indigo-100">{stats.inputSize} <span className="text-xs">B</span></div>
            </div>
            <div className="w-px bg-indigo-200 dark:bg-indigo-800"></div>
            <div className="text-center">
              <div className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">Minifié</div>
              <div className="text-xl font-black text-indigo-900 dark:text-indigo-100">{stats.outputSize} <span className="text-xs">B</span></div>
            </div>
            <div className="w-px bg-indigo-200 dark:bg-indigo-800"></div>
            <div className="text-center">
              <div className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-1">Réduction</div>
              <div className="text-xl font-black text-emerald-600">-{stats.reduction}%</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
