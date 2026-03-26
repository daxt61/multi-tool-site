import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [opacity, setOpacity] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [border, setBorder] = useState(0.1);
  const [copied, setCopied] = useState(false);

  const rgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const glassStyle = {
    backgroundColor: rgba(color, opacity),
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    border: `1px solid ${rgba(color, border)}`,
  };

  const cssCode = `background: ${rgba(color, opacity)};
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: 1px solid ${rgba(color, border)};
border-radius: 24px;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label htmlFor="glass-blur" className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Flou (Blur)
                </label>
                <span className="text-xs font-bold text-indigo-500">{blur}px</span>
              </div>
              <input
                id="glass-blur"
                type="range"
                min="0"
                max="40"
                value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label htmlFor="glass-opacity" className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Opacité
                </label>
                <span className="text-xs font-bold text-indigo-500">{(opacity * 100).toFixed(0)}%</span>
              </div>
              <input
                id="glass-opacity"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label htmlFor="glass-border" className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Bordure (Alpha)
                </label>
                <span className="text-xs font-bold text-indigo-500">{(border * 100).toFixed(0)}%</span>
              </div>
              <input
                id="glass-border"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={border}
                onChange={(e) => setBorder(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <label htmlFor="glass-color" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 block">
                Couleur de fond
              </label>
              <div className="flex gap-4">
                <input
                  id="glass-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-12 rounded-xl border-0 cursor-pointer p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={color.toUpperCase()}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 relative group">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">CSS</span>
              <button
                onClick={copyToClipboard}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Copier le code CSS"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <pre className="text-indigo-400 font-mono text-sm overflow-x-auto">
              <code>{cssCode}</code>
            </pre>
          </div>
        </div>

        <div className="relative rounded-[2.5rem] overflow-hidden min-h-[400px] flex items-center justify-center border border-slate-200 dark:border-slate-800">
          {/* Mock Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient-slow">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-300 rounded-full blur-2xl opacity-50"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-cyan-400 rounded-full blur-3xl opacity-50"></div>
          </div>

          <div style={glassStyle} className="w-64 h-64 rounded-3xl relative z-10 flex flex-col items-center justify-center text-center p-6 shadow-2xl">
            <h3 className="text-white font-bold text-xl mb-2 drop-shadow-md">Aperçu</h3>
            <p className="text-white/80 text-sm drop-shadow-sm">Ceci est un exemple de l'effet glassmorphism généré.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
