import { useState } from 'react';
import { Zap, Copy, Check, Trash2, FileCode } from 'lucide-react';

export function CodeMinifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'js' | 'css' | 'html'>('js');
  const [copied, setCopied] = useState(false);

  const minifyJS = (code: string) => {
    // Basic line-by-line minification to avoid some common pitfalls
    return code
      .split('\n')
      .map(line => {
        // Very basic: remove single line comments that are not in strings
        // This is still naive but slightly better than global regex
        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1) {
          // Check if // is preceded by http: or https:
          const pre = line.substring(0, commentIndex);
          if (!pre.match(/https?:$/)) {
            return pre;
          }
        }
        return line;
      })
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/^\s+|\s+$/gm, '') // Trim each line
      .replace(/\n/g, '') // Remove newlines
      .replace(/\s+/g, ' ') // Collapse multiple spaces to one (still risky for strings)
      .trim();
  };

  const minifyCSS = (code: string) => {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around delimiters
      .replace(/;}/g, '}') // Remove trailing semicolon
      .trim();
  };

  const minifyHTML = (code: string) => {
    return code
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/>\s+</g, '><') // Remove spaces between tags
      .trim();
  };

  const handleMinify = () => {
    if (mode === 'js') setOutput(minifyJS(input));
    else if (mode === 'css') setOutput(minifyCSS(input));
    else if (mode === 'html') setOutput(minifyHTML(input));
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['js', 'css', 'html'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-6 py-2 rounded-lg text-sm font-bold uppercase transition-all ${
                mode === m ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m === 'js' ? 'JavaScript' : m.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          onClick={() => {setInput(''); setOutput('');}}
          className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors px-2"
        >
          <Trash2 className="w-3 h-3" /> Effacer tout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Code Source</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Collez votre code ${mode.toUpperCase()} ici...`}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
          <button
            onClick={handleMinify}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Zap className="w-5 h-5 fill-current" /> Minifier le code
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code Minifié</label>
            <button
              onClick={handleCopy}
              className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Le résultat apparaîtra ici..."
            className="w-full h-[456px] p-6 bg-slate-900 dark:bg-black border border-slate-800 rounded-3xl outline-none font-mono text-sm text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-6 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-white dark:bg-slate-800 text-amber-600 rounded-xl shadow-sm">
          <FileCode className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-amber-900 dark:text-amber-300 font-bold">Note sur la minification</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Cette minification est effectuée localement dans votre navigateur. Elle supprime les commentaires et les espaces superflus pour réduire la taille du fichier. Pour une utilisation en production critique, utilisez des outils plus avancés comme Terser ou CSSNano.
          </p>
        </div>
      </div>
    </div>
  );
}
