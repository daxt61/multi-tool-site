import React, { useState, useMemo } from 'react';
import { Copy, Check, RefreshCw, Layers, Palette, Sliders } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.2);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  const cssCode = useMemo(() => {
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${transparency});
box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border-radius: 2.5rem;
border: 1px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${outline});`;
  }, [blur, transparency, color, outline]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Ajustements</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold flex justify-between">
                    Flou (Blur) <span className="text-indigo-500">{blur}px</span>
                  </label>
                  <input
                    type="range" min="0" max="25" step="1" value={blur}
                    onChange={(e) => setBlur(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold flex justify-between">
                    Transparence <span className="text-indigo-500">{Math.round(transparency * 100)}%</span>
                  </label>
                  <input
                    type="range" min="0" max="1" step="0.01" value={transparency}
                    onChange={(e) => setTransparency(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold flex justify-between">
                    Opacité de la bordure <span className="text-indigo-500">{Math.round(outline * 100)}%</span>
                  </label>
                  <input
                    type="range" min="0" max="1" step="0.01" value={outline}
                    onChange={(e) => setOutline(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Couleur de fond</h3>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="color" value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-transparent"
                />
                <input
                  type="text" value={color.toUpperCase()}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">CSS généré</label>
              </div>
              <button
                onClick={copyToClipboard}
                className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié !' : 'Copier le CSS'}
              </button>
            </div>
            <pre className="p-6 bg-slate-900 text-indigo-300 rounded-3xl font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
              {cssCode}
            </pre>
          </div>
        </div>

        {/* Preview Area */}
        <div className="space-y-8">
          <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-12">
            {/* Background elements for depth */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400 rounded-full mix-blend-overlay animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-400 rounded-full mix-blend-overlay animate-bounce" />

            {/* The Glass Element */}
            <div
              style={{
                background: `rgba(${hexToRgb(color).r}, ${hexToRgb(color).g}, ${hexToRgb(color).b}, ${transparency})`,
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                borderRadius: '2.5rem',
                border: `1px solid rgba(${hexToRgb(color).r}, ${hexToRgb(color).g}, ${hexToRgb(color).b}, ${outline})`,
              }}
              className="w-full h-full flex flex-col items-center justify-center text-center p-8 z-10"
            >
              <h4 className="text-2xl font-black text-white mb-2 drop-shadow-sm">Aperçu en direct</h4>
              <p className="text-white/80 text-sm font-medium leading-relaxed">
                Modifiez les réglages à gauche pour voir l'effet de glassmorphism s'appliquer en temps réel sur ce conteneur.
              </p>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <h3 className="font-bold mb-4">Qu'est-ce que le Glassmorphism ?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4">
              Le glassmorphism est une tendance de design basée sur un effet de "verre givré". Ses caractéristiques principales sont la transparence, une approche multi-couches, et un flou d'arrière-plan (background blur).
            </p>
            <div className="flex gap-2">
               <button
                onClick={() => {
                  setBlur(10);
                  setTransparency(0.2);
                  setColor('#ffffff');
                  setOutline(0.2);
                }}
                className="text-xs font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Réinitialiser
              </button>
            </div>
          </div>

          <AdPlaceholder size="medium" />
        </div>
      </div>
    </div>
  );
}
