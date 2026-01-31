import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Download, Code, Palette, Maximize2, RefreshCw, Check, Copy } from 'lucide-react';

const THEMES = [
  { id: 'slate', name: 'Ardoise', bg: 'bg-slate-900', text: 'text-slate-300', dot: 'bg-slate-700' },
  { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-950', text: 'text-indigo-200', dot: 'bg-indigo-400' },
  { id: 'rose', name: 'Rose', bg: 'bg-rose-950', text: 'text-rose-200', dot: 'bg-rose-400' },
  { id: 'emerald', name: 'Émeraude', bg: 'bg-emerald-950', text: 'text-emerald-200', dot: 'bg-emerald-400' },
  { id: 'amber', name: 'Ambre', bg: 'bg-amber-950', text: 'text-amber-200', dot: 'bg-amber-400' },
  { id: 'zinc', name: 'Zinc', bg: 'bg-zinc-900', text: 'text-zinc-400', dot: 'bg-zinc-600' },
];

const PADDINGS = [
  { id: 'sm', name: 'Petit', class: 'p-6' },
  { id: 'md', name: 'Moyen', class: 'p-12' },
  { id: 'lg', name: 'Grand', class: 'p-20' },
];

export function CodeToImage() {
  const [code, setCode] = useState('// Exemple de code\nfunction helloWorld() {\n  console.log("Hello, World!");\n}\n\nhelloWorld();');
  const [theme, setTheme] = useState(THEMES[0]);
  const [padding, setPadding] = useState(PADDINGS[1]);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (previewRef.current === null) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(previewRef.current, { cacheBust: true });
      const link = document.createElement('a');
      link.download = `code-snippet-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Erreur lors de la génération de l\'image:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <Palette className="w-3 h-3" /> Thème
              </label>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t)}
                    className={`h-10 rounded-xl transition-all border-2 ${
                      theme.id === t.id ? 'border-indigo-500 scale-105 shadow-sm' : 'border-transparent hover:border-slate-300'
                    } ${t.bg}`}
                    title={t.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <Maximize2 className="w-3 h-3" /> Padding
              </label>
              <div className="flex gap-2">
                {PADDINGS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPadding(p)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                      padding.id === p.id
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Numéros de lignes</label>
              <button
                onClick={() => setShowLineNumbers(!showLineNumbers)}
                className={`w-12 h-6 rounded-full transition-all relative ${showLineNumbers ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showLineNumbers ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isDownloading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
            {isDownloading ? 'Génération...' : 'Télécharger l\'image'}
          </button>
        </div>

        {/* Editor & Preview */}
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-500" /> Code Source
              </label>
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
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
              placeholder="Collez votre code ici..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Aperçu</label>
            <div className="overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-4">
              <div
                ref={previewRef}
                className={`${theme.bg} ${padding.class} transition-all duration-500 flex items-center justify-center min-h-[300px]`}
              >
                <div className="bg-slate-900/90 rounded-2xl shadow-2xl border border-white/10 w-full overflow-hidden backdrop-blur-sm">
                  <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                  </div>
                  <div className={`p-6 font-mono text-sm leading-relaxed ${theme.text} whitespace-pre overflow-hidden`}>
                    {code.split('\n').map((line, i) => (
                      <div key={i} className="flex gap-4">
                        {showLineNumbers && (
                          <span className="w-8 text-right opacity-30 select-none">{i + 1}</span>
                        )}
                        <span>{line || ' '}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
