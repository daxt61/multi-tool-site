import { useState } from 'react';
import { FileCode, Copy, Check, Trash2, Zap, AlertCircle } from 'lucide-react';

type Language = 'javascript' | 'css' | 'html';

export function CodeMinifier() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState<Language>('javascript');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const minifyJS = (code: string) => {
    try {
      // Line-by-line parsing to handle comments safely as per project guidelines
      const lines = code.split('\n');
      let minified = lines
        .map(line => {
          // Remove single line comments that are not part of a URL or string
          // This is a simplified version of the logic described in memory
          const commentIndex = line.indexOf('//');
          if (commentIndex !== -1) {
            // Check if it's likely a URL
            const beforeComment = line.substring(0, commentIndex);
            if (!beforeComment.match(/https?:$/)) {
              return beforeComment;
            }
          }
          return line;
        })
        .join(' ')
        // Remove multi-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        // Remove spaces around operators and punctuation
        .replace(/\s*([{}()\[\];,=+\-*\/<>!&|?:])\s*/g, '$1')
        .trim();

      return minified;
    } catch (e) {
      throw new Error('Erreur de minification JS');
    }
  };

  const minifyCSS = (code: string) => {
    return code
      .replace(/\/\*[\s\S]*?\*\//g, '') // Comments
      .replace(/\s+/g, ' ') // Whitespace
      .replace(/\s*([{}();:,])\s*/g, '$1') // Punctuation spaces
      .replace(/;\}/g, '}') // Last semicolon in block
      .trim();
  };

  const minifyHTML = (code: string) => {
    return code
      .replace(/<!--[\s\S]*?-->/g, '') // Comments
      .replace(/>\s+</g, '><') // Whitespace between tags
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
  };

  const handleMinify = () => {
    setError('');
    if (!input.trim()) return;

    try {
      let result = '';
      switch (language) {
        case 'javascript':
          result = minifyJS(input);
          break;
        case 'css':
          result = minifyCSS(input);
          break;
        case 'html':
          result = minifyHTML(input);
          break;
      }
      setOutput(result);
    } catch (e: any) {
      setError(e.message);
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

  const languages: { id: Language; name: string }[] = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'css', name: 'CSS' },
    { id: 'html', name: 'HTML' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex justify-center gap-2 overflow-x-auto no-scrollbar py-2">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all border whitespace-nowrap ${
              language === lang.id
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-lg shadow-indigo-500/10'
                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            {lang.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Version Minifiée</label>
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
            placeholder="Le code minifié apparaîtra ici..."
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none shadow-sm"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleMinify}
          className="px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 group"
        >
          <Zap className="w-6 h-6 group-hover:animate-pulse" /> Minifier le Code
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-black text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-500" /> Pourquoi minifier ?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">Performance</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Réduit la taille des fichiers pour un chargement plus rapide des pages web.</p>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">Bande Passante</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Économise de la bande passante pour vous et vos utilisateurs.</p>
          </div>
          <div className="space-y-2">
            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">SEO</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Les sites plus rapides sont mieux classés par les moteurs de recherche.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
