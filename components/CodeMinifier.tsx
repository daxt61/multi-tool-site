import React, { useState, useMemo } from 'react';
import { Copy, Check, Trash2, Zap, FileCode, Scissors } from 'lucide-react';

export function CodeMinifier() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'js' | 'css' | 'html'>('js');
  const [copied, setCopied] = useState(false);

  const minify = (code: string, type: 'js' | 'css' | 'html') => {
    if (!code) return '';

    try {
      if (type === 'js') {
        const preserved: string[] = [];
        const masked = code
          .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '') // Remove comments
          .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[\s\S]*?`)/g, (match) => {
            preserved.push(match);
            return `__JS_STR_${preserved.length - 1}__`;
          });

        const minified = masked
          .replace(/\s+/g, ' ')
          .replace(/\s*([\{\}\(\)\[\]\=\+\-\*\/\%\&\|\!\?\:\;\,\.])\s*/g, '$1')
          .trim();

        return minified.replace(/__JS_STR_(\d+)__/g, (_, id) => preserved[parseInt(id)]);
      } else if (type === 'css') {
        const preserved: string[] = [];
        const masked = code
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, (match) => {
            preserved.push(match);
            return `__CSS_STR_${preserved.length - 1}__`;
          });

        const minified = masked
          .replace(/\s+/g, ' ')
          .replace(/\s*([\{\}\:\;\,\>])\s*/g, '$1')
          .replace(/\;\}/g, '}')
          .trim();

        return minified.replace(/__CSS_STR_(\d+)__/g, (_, id) => preserved[parseInt(id)]);
      } else if (type === 'html') {
        const preserved: string[] = [];
        const masked = code.replace(/<(pre|code)[\s\S]*?>[\s\S]*?<\/\1>/gi, (match) => {
          preserved.push(match);
          return `__HTML_PRE_${preserved.length - 1}__`;
        });

        const minified = masked
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/\s+/g, ' ')
          .replace(/>\s+</g, '><')
          .replace(/>\s+(__HTML_PRE_\d+__)/g, '>$1')
          .replace(/(__HTML_PRE_\d+__)\s+</g, '$1<')
          .trim();

        return minified.replace(/__HTML_PRE_(\d+)__/g, (_, id) => preserved[parseInt(id)]);
      }
    } catch (e) {
      return code;
    }
    return code;
  };

  const output = useMemo(() => minify(input, mode), [input, mode]);

  const stats = useMemo(() => {
    if (!input) return { original: 0, minified: 0, reduction: 0 };
    const original = input.length;
    const minified = output.length;
    const reduction = ((original - minified) / original) * 100;
    return { original, minified, reduction: Math.max(0, reduction) };
  }, [input, output]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Mode Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          {[
            { id: 'js', name: 'JavaScript', icon: FileCode },
            { id: 'css', name: 'CSS', icon: Zap },
            { id: 'html', name: 'HTML', icon: Scissors },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as any)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                mode === item.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code Original</label>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Collez votre code ${mode.toUpperCase()} ici...`}
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Version Minifiée</label>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <div className="relative group">
            <textarea
              value={output}
              readOnly
              placeholder="Le code minifié apparaîtra ici..."
              className="w-full h-[450px] p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-3xl font-mono text-sm leading-relaxed resize-none outline-none"
            />
            {stats.original > 0 && (
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 flex justify-around text-center">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Réduction</div>
                  <div className="text-xl font-black text-emerald-400">{stats.reduction.toFixed(1)}%</div>
                </div>
                <div className="w-px bg-white/10"></div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Avant</div>
                  <div className="text-xl font-black text-slate-300">{stats.original} B</div>
                </div>
                <div className="w-px bg-white/10"></div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Après</div>
                  <div className="text-xl font-black text-white">{stats.minified} B</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
