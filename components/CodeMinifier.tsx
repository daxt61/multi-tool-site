import { useState } from 'react';
import { Copy, Check, Trash2, Box, FileCode, Maximize2, Minimize2 } from 'lucide-react';

export function CodeMinifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'html' | 'css' | 'js'>('html');
  const [copied, setCopied] = useState(false);

  const minifyHTML = (html: string) => {
    return html
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
      .trim();
  };

  const minifyCSS = (css: string) => {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
      .replace(/\s*([{}|:;,])\s*/g, '$1') // Remove spaces around characters
      .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
      .trim();
  };

  const minifyJS = (js: string) => {
    // Basic JS minifier that avoids common pitfalls like URLs
    return js
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .split('\n')
      .map(line => {
        // Only remove single-line comments if they are not part of a URL or string
        // This is still basic but safer than before
        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1) {
          const beforeComment = line.substring(0, commentIndex);
          // Check if // is preceded by : (URL) or is inside a quote
          if (!beforeComment.match(/[:"']\s*$/)) {
            return beforeComment;
          }
        }
        return line;
      })
      .join(' ')
      .replace(/\s+/g, ' ') // Collapse spaces
      .replace(/\s*([{}|:;,])\s*/g, '$1') // Remove spaces around characters
      .trim();
  };

  const handleMinify = () => {
    if (!input.trim()) return;
    let result = '';
    switch (mode) {
      case 'html': result = minifyHTML(input); break;
      case 'css': result = minifyCSS(input); break;
      case 'js': result = minifyJS(input); break;
    }
    setOutput(result);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit mx-auto">
        {(['html', 'css', 'js'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-8 py-3 rounded-xl text-sm font-bold transition-all uppercase ${
              mode === m
                ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code Source</label>
            </div>
            <button
              onClick={() => {setInput(''); setOutput('');}}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Collez votre code ${mode.toUpperCase()} ici...`}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Minimize2 className="w-4 h-4 text-emerald-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code Minifié</label>
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
            placeholder="Le résultat minifié apparaîtra ici..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleMinify}
          className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <Box className="w-5 h-5" /> Minifier le code
        </button>
      </div>
    </div>
  );
}
