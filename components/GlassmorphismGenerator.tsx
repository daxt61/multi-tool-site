import React, { useState, useMemo } from 'react';
import { Copy, Check, RefreshCw, Layers, Sliders, Palette } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.1);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? '255, 255, 255' : `${r}, ${g}, ${b}`;
  };

  const styles = useMemo(() => {
    const rgb = hexToRgb(color);
    return {
      background: `rgba(${rgb}, ${transparency})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      border: `1px solid rgba(${rgb}, ${outline})`,
      borderRadius: '24px',
    };
  }, [blur, transparency, color, outline]);

  const cssCode = `background: rgba(${hexToRgb(color)}, ${transparency});
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: 1px solid rgba(${hexToRgb(color)}, ${outline});
border-radius: 24px;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Controls */}
        <div className="space-y-8 p-8 md:p-12 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm shadow-indigo-500/5">
          <div className="flex items-center gap-3 mb-8">
            <Sliders className="w-6 h-6 text-indigo-500" />
            <h3 className="text-xl font-black dark:text-white">Paramètres</h3>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Flou</label>
                <span className="text-sm font-bold text-indigo-500">{blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Transparence</label>
                <span className="text-sm font-bold text-indigo-500">{Math.round(transparency * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={transparency}
                onChange={(e) => setTransparency(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Couleur</label>
                <span className="text-sm font-mono font-bold text-indigo-500">{color.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-12 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer overflow-hidden group-focus-within:ring-4 focus-within:ring-indigo-500/20"
                />
                <button
                  onClick={() => setColor('#ffffff')}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-indigo-500 transition-colors"
                >
                  Réinitialiser en blanc
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Opacité du contour</label>
                <span className="text-sm font-bold text-indigo-500">{Math.round(outline * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={outline}
                onChange={(e) => setOutline(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="space-y-8 h-full flex flex-col">
          <div className="flex-1 min-h-[400px] relative rounded-[2.5rem] overflow-hidden bg-slate-900 flex items-center justify-center">
            {/* Background Decoration */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-rose-500 rounded-full blur-3xl animate-pulse delay-700"></div>
              <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-amber-500 rounded-full blur-3xl animate-pulse delay-300"></div>
            </div>

            <div style={styles} className="w-64 h-64 shadow-2xl z-10 flex flex-col items-center justify-center p-8 text-center text-white">
              <Layers className="w-12 h-12 mb-4 opacity-50" />
              <h4 className="text-xl font-black mb-2 tracking-tight">Aperçu</h4>
              <p className="text-sm font-medium opacity-60">L'effet glassmorphism en action</p>
            </div>
          </div>

          <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-slate-800 space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-widest text-slate-50">Code CSS</label>
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all text-sm ${
                  copied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié' : 'Copier le CSS'}
              </button>
            </div>
            <pre className="text-sm font-mono text-indigo-400 bg-black/40 p-6 rounded-2xl overflow-x-auto leading-relaxed border border-white/5">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
