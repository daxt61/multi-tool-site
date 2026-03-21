import { useState, useMemo } from 'react';
import { Layers, Copy, Check, Sliders, Type, Palette } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.1);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '255, 255, 255';
  };

  const glassStyle = useMemo(() => ({
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    backgroundColor: `rgba(${hexToRgb(color)}, ${transparency})`,
    border: `1px solid rgba(${hexToRgb(color)}, ${outline})`,
    borderRadius: '2rem',
  }), [blur, transparency, color, outline]);

  const cssCode = `/* Glassmorphism CSS */
background: rgba(${hexToRgb(color)}, ${transparency});
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border-radius: 32px;
border: 1px solid rgba(${hexToRgb(color)}, ${outline});`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
      <div className="space-y-8">
        <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">Paramètres</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="blur" className="text-sm font-bold text-slate-700 dark:text-slate-300">Flou (Blur): {blur}px</label>
            </div>
            <input
              id="blur"
              type="range"
              min="0"
              max="20"
              value={blur}
              onChange={(e) => setBlur(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="transparency" className="text-sm font-bold text-slate-700 dark:text-slate-300">Opacité: {(transparency * 100).toFixed(0)}%</label>
            </div>
            <input
              id="transparency"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={transparency}
              onChange={(e) => setTransparency(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="outline" className="text-sm font-bold text-slate-700 dark:text-slate-300">Contour: {(outline * 100).toFixed(0)}%</label>
            </div>
            <input
              id="outline"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={outline}
              onChange={(e) => setOutline(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-4">
            <label htmlFor="color" className="text-sm font-bold text-slate-700 dark:text-slate-300">Couleur</label>
            <div className="flex gap-4">
              <input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-12 rounded-xl bg-transparent cursor-pointer overflow-hidden border-0 p-0"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
              />
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">CSS Output</span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                copied
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <pre className="p-6 bg-slate-900 text-indigo-300 rounded-[2rem] text-sm font-mono overflow-x-auto border border-slate-800 shadow-2xl">
            {cssCode}
          </pre>
        </div>
      </div>

      <div className="relative min-h-[500px] flex items-center justify-center rounded-[3rem] overflow-hidden">
        {/* Preview Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-600">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-400 rounded-full blur-3xl opacity-50 animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-4 gap-4 opacity-20">
             {[...Array(16)].map((_, i) => (
               <div key={i} className="w-12 h-12 bg-white rounded-full"></div>
             ))}
          </div>
        </div>

        {/* The Glass Element */}
        <div style={glassStyle} className="relative w-72 h-72 md:w-96 md:h-96 p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
            <Layers className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Aperçu</h2>
          <p className="text-white/80 font-medium">L'effet glassmorphism en temps réel</p>
        </div>
      </div>
    </div>
  );
}
