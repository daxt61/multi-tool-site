import React, { useState, useMemo } from 'react';
import { Layers, Copy, Check, Settings2, Info, Palette } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [opacity, setOpacity] = useState(0.2);
  const [saturation, setSaturation] = useState(100);
  const [color, setColor] = useState('#ffffff');
  const [borderColor, setBorderColor] = useState('#ffffff');
  const [borderOpacity, setBorderOpacity] = useState(0.3);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  const cssStyles = useMemo(() => {
    const rgb = hexToRgb(color);
    const borderRgb = hexToRgb(borderColor);
    return {
      background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
      backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
      WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
      border: `1px solid rgba(${borderRgb.r}, ${borderRgb.g}, ${borderRgb.b}, ${borderOpacity})`,
      borderRadius: '24px',
    };
  }, [blur, opacity, saturation, color, borderColor, borderOpacity]);

  const cssString = useMemo(() => {
    return `background: ${cssStyles.background};\nbackdrop-filter: ${cssStyles.backdropFilter};\n-webkit-backdrop-filter: ${cssStyles.WebkitBackdropFilter};\nborder: ${cssStyles.border};\nborder-radius: ${cssStyles.borderRadius};`;
  }, [cssStyles]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Réglages</h3>
            </div>

            <div className="space-y-6">
              {/* Color & Opacity */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label htmlFor="bg-color" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Couleur</label>
                  <div className="flex gap-2">
                    <input
                      id="bg-color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono uppercase dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opacité</label>
                    <span className="text-xs font-mono font-bold text-indigo-500">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={opacity}
                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              {/* Blur & Saturation */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flou (Blur)</label>
                    <span className="text-xs font-mono font-bold text-indigo-500">{blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={blur}
                    onChange={(e) => setBlur(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saturation</label>
                    <span className="text-xs font-mono font-bold text-indigo-500">{saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="1"
                    value={saturation}
                    onChange={(e) => setSaturation(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              {/* Border */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label htmlFor="border-color" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bordure</label>
                    <div className="flex gap-2">
                      <input
                        id="border-color"
                        type="color"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                      />
                      <input
                        type="text"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono uppercase dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opacité Bordure</label>
                      <span className="text-xs font-mono font-bold text-indigo-500">{Math.round(borderOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={borderOpacity}
                      onChange={(e) => setBorderOpacity(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Code */}
        <div className="space-y-6">
          <div className="relative h-64 rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-12">
            {/* Background elements for depth */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-indigo-300/30 rounded-full blur-2xl"></div>

            {/* The Glass Element */}
            <div style={cssStyles} className="w-full h-full flex items-center justify-center text-white font-black text-2xl shadow-2xl">
              Preview
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 space-y-4 shadow-xl">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Code CSS</label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="text-sm font-mono text-indigo-300 overflow-x-auto p-4 bg-black/30 rounded-2xl leading-relaxed">
              {cssString}
            </pre>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
             <h3 className="font-bold flex items-center gap-2 dark:text-white text-sm">
              <Info className="w-4 h-4 text-indigo-500" /> Qu'est-ce que le Glassmorphism ?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Le glassmorphisme est un style de design qui utilise la transparence, le flou d'arrière-plan (backdrop-filter) et des bordures légères pour créer un effet de "verre dépoli". Il apporte de la hiérarchie et de la profondeur aux interfaces modernes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
