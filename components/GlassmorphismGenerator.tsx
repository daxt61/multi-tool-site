import React, { useState, useMemo } from 'react';
import { Copy, Check, RefreshCw, Box, Layers, MousePointer2 } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(12);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(1);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  const glassStyle = useMemo(() => {
    const rgb = hexToRgb(color);
    return {
      background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${transparency})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      border: `${outline}px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
      borderRadius: '2.5rem',
    };
  }, [blur, transparency, color, outline]);

  const cssCode = useMemo(() => {
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${transparency});
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: ${outline}px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2);
border-radius: 2.5rem;`;
  }, [blur, transparency, color, outline]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isValidHex = (h: string) => /^#([A-Fa-f0-9]{3,6})$/.test(h);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 px-1">
              <Layers className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Configurations</h3>
            </div>

            <div className="space-y-6">
              {/* Blur */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Flou (Blur)</label>
                  <span className="text-sm font-mono font-bold text-indigo-600">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={blur}
                  onChange={(e) => setBlur(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Transparency */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Transparence</label>
                  <span className="text-sm font-mono font-bold text-indigo-600">{transparency}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={transparency}
                  onChange={(e) => setTransparency(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Outline */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Épaisseur de bordure</label>
                  <span className="text-sm font-mono font-bold text-indigo-600">{outline}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={outline}
                  onChange={(e) => setOutline(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Color */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Couleur de fond</label>
                <div className="flex gap-4">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className={`flex-1 px-4 py-2 bg-white dark:bg-slate-800 border ${isValidHex(color) ? 'border-slate-200 dark:border-slate-700' : 'border-rose-500'} rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code CSS</label>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="p-6 bg-slate-900 text-indigo-300 rounded-3xl font-mono text-xs overflow-x-auto leading-relaxed">
              <code>{cssCode}</code>
            </pre>
          </div>
        </div>

        {/* Preview */}
        <div className="relative min-h-[400px] lg:min-h-full rounded-[2.5rem] overflow-hidden flex items-center justify-center p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

          <div className="relative z-10 w-full max-w-sm aspect-square flex flex-col items-center justify-center text-center p-8 shadow-2xl transition-all duration-300 group" style={glassStyle}>
            <Box className="w-16 h-16 text-white mb-6 animate-bounce" />
            <h4 className="text-2xl font-black text-white mb-2">Aperçu</h4>
            <p className="text-white/80 font-medium">L'effet de verre en temps réel.</p>

            <div className="mt-8 flex gap-2">
              <div className="w-3 h-3 rounded-full bg-white/40"></div>
              <div className="w-3 h-3 rounded-full bg-white/40"></div>
              <div className="w-3 h-3 rounded-full bg-white/40"></div>
            </div>
          </div>

          {/* Background floaters */}
          <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-300 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-32 h-32 bg-cyan-300 rounded-full blur-xl animate-pulse delay-700"></div>
        </div>
      </div>
    </div>
  );
}
