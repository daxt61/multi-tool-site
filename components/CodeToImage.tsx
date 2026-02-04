import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, Copy, Check } from 'lucide-react';

export function CodeToImage() {
  const [code, setCode] = useState('function helloWorld() {\n  console.log("Hello, World!");\n}');
  const [title, setTitle] = useState('index.js');
  const [theme, setTheme] = useState('indigo');
  const [padding, setPadding] = useState('p-12');
  const [copied, setCopied] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (elementRef.current === null) return;
    try {
      const dataUrl = await toPng(elementRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `${title || 'code'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const themes: Record<string, string> = {
    indigo: 'from-indigo-500 via-purple-500 to-pink-500',
    blue: 'from-blue-600 to-cyan-500',
    green: 'from-emerald-500 to-teal-400',
    orange: 'from-orange-500 to-amber-400',
    dark: 'from-slate-800 to-slate-900',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Controls */}
        <div className="space-y-8">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Paramètres</label>
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-bold text-slate-700 dark:text-slate-300">Titre du fichier</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="index.js"
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Thème du dégradé</span>
              <div className="flex flex-wrap gap-3">
                {Object.keys(themes).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${themes[t]} border-4 transition-all ${theme === t ? 'border-indigo-600 scale-110' : 'border-transparent hover:scale-105'}`}
                    title={t}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Espacement</span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {['p-4', 'p-8', 'p-12', 'p-16'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPadding(p)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${padding === p ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    {p.split('-')[1]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
            <button
              onClick={handleDownload}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> Exporter en PNG
            </button>
            <button
              onClick={handleCopy}
              className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-500 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copié' : 'Copier le code'}
            </button>
          </div>
        </div>

        {/* Editor & Preview */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Code</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300"
              placeholder="Collez votre code ici..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Aperçu</label>
            <div
              ref={elementRef}
              className={`rounded-[2.5rem] bg-gradient-to-br ${themes[theme]} ${padding} transition-all duration-500 overflow-hidden flex items-center justify-center`}
            >
              <div className="w-full max-w-2xl bg-slate-950/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                {/* Window Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-xs font-mono text-slate-400">{title}</div>
                  <div className="w-12" /> {/* Spacer */}
                </div>
                {/* Code Area */}
                <div className="p-8">
                  <pre className="font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap break-all">
                    <code>{code}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
