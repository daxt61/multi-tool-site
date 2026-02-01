import React, { useState, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { Download, Image as ImageIcon, Copy, Check, Type, Palette } from 'lucide-react';

const THEMES = [
  { id: 'indigo', bg: 'bg-gradient-to-br from-indigo-500 to-purple-600' },
  { id: 'rose', bg: 'bg-gradient-to-br from-rose-500 to-orange-500' },
  { id: 'emerald', bg: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
  { id: 'blue', bg: 'bg-gradient-to-br from-blue-600 to-cyan-500' },
  { id: 'amber', bg: 'bg-gradient-to-br from-amber-400 to-rose-600' },
  { id: 'dark', bg: 'bg-slate-900' },
];

export function CodeToImage() {
  const [code, setCode] = useState('// Exemple de code\nfunction helloWorld() {\n  console.log("Hello, World!");\n}');
  const [title, setTitle] = useState('script.js');
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [padding, setPadding] = useState('p-12');
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const downloadImage = useCallback(async () => {
    if (previewRef.current === null) return;

    try {
      const dataUrl = await toPng(previewRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `${title || 'code'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erreur lors de la génération de l\'image:', err);
    }
  }, [title]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Type className="w-3 h-3" /> Titre du fichier
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="index.js"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Palette className="w-3 h-3" /> Arrière-plan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme)}
                  className={`h-12 rounded-xl transition-all border-2 ${theme.bg} ${selectedTheme.id === theme.id ? 'border-indigo-500 scale-105' : 'border-transparent hover:scale-105'}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> Espacement
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: 'p-6', label: 'S' },
                { id: 'p-12', label: 'M' },
                { id: 'p-20', label: 'L' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPadding(p.id)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${padding === p.id ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={downloadImage}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" /> Télécharger PNG
          </button>
        </div>

        {/* Editor & Preview */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code</label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed resize-none"
              spellCheck={false}
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Aperçu</label>
            <div
              ref={previewRef}
              className={`${selectedTheme.bg} ${padding} transition-all duration-500 flex items-center justify-center overflow-hidden min-h-[300px]`}
            >
              <div className="w-full max-w-2xl bg-slate-950/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 overflow-hidden">
                {/* Window Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{title}</div>
                  <div className="w-12"></div>
                </div>
                {/* Code Content */}
                <pre className="p-6 font-mono text-sm leading-relaxed text-indigo-100 overflow-x-auto">
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
