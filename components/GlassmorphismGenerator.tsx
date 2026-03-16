import React, { useState, useMemo } from 'react';
import { Copy, Check, Settings2, Eye, Code, Palette, Droplets, Box, Info } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.1);
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
      border: `1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${outline})`,
      borderRadius: '2.5rem',
    };
  }, [blur, transparency, color, outline]);

  const cssString = useMemo(() => {
    const rgb = hexToRgb(color);
    return `/* Glassmorphism Effect */
background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${transparency});
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: 1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${outline});
border-radius: 2.5rem;`;
  }, [blur, transparency, color, outline]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Configuration Panel */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 md:p-12 rounded-[2.5rem] shadow-sm space-y-10">
          <div className="flex items-center gap-3 text-indigo-500 mb-2">
            <Settings2 className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Configuration</h3>
          </div>

          <div className="space-y-8">
            {/* Blur Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5" /> Flou (Blur)
                </label>
                <span className="text-xs font-black font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">{blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Transparency Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5" /> Opacité
                </label>
                <span className="text-xs font-black font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">{transparency}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={transparency}
                onChange={(e) => setTransparency(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Outline Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  <Box className="w-3.5 h-3.5" /> Bordure
                </label>
                <span className="text-xs font-black font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">{outline}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={outline}
                onChange={(e) => setOutline(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* Color Picker */}
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-2 px-1">
                <Palette className="w-3.5 h-3.5" /> Couleur de fond
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-slate-100 dark:border-slate-800 cursor-pointer overflow-hidden"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm uppercase outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="space-y-8">
          <div className="relative h-[400px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] flex items-center justify-center overflow-hidden shadow-2xl">
            {/* Background shapes for depth */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-xl opacity-60 animate-pulse" />
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-cyan-400 rounded-full blur-xl opacity-60" />

            <div style={glassStyle} className="w-64 h-64 p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-xl border-white/20">
              <Eye className="w-10 h-10 text-white drop-shadow-md" />
              <div>
                <h4 className="font-black text-white text-lg drop-shadow-md">Prévisualisation</h4>
                <p className="text-white/80 text-xs drop-shadow-md">Le style s'applique en temps réel</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 space-y-6 overflow-hidden relative group">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3 text-indigo-400">
                <Code className="w-5 h-5" />
                <h3 className="font-black uppercase tracking-widest text-xs text-slate-500">CSS Généré</h3>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copié !' : 'Copier le CSS'}
              </button>
            </div>
            <pre className="font-mono text-sm text-indigo-300 overflow-x-auto leading-relaxed">
              {cssString}
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30">
        <h4 className="font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-300 mb-4">
          <Info className="w-4 h-4" /> Qu'est-ce que le Glassmorphism ?
        </h4>
        <p className="text-sm text-indigo-700 dark:text-indigo-400 leading-relaxed max-w-4xl">
          Le glassmorphism est une tendance de design basée sur un effet de "verre dépoli". Il repose sur la propriété CSS <code>backdrop-filter</code> pour créer un flou d'arrière-plan, combiné à une légère opacité, une bordure subtile et des ombres pour donner de la profondeur et du réalisme aux interfaces.
        </p>
      </div>
    </div>
  );
}
