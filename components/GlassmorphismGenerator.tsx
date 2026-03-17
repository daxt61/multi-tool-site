import React, { useState, useMemo } from 'react';
import { Copy, Check, Sliders, Layout, Code, Palette, Settings2 } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(1);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${isNaN(r) ? 255 : r}, ${isNaN(g) ? 255 : g}, ${isNaN(b) ? 255 : b}`;
  };

  const glassStyle = useMemo(() => {
    const rgb = hexToRgb(color);
    return {
      background: `rgba(${rgb}, ${transparency})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      border: `${outline}px solid rgba(${rgb}, 0.2)`,
      borderRadius: '2.5rem',
    };
  }, [blur, transparency, color, outline]);

  const cssString = useMemo(() => {
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb}, ${transparency});
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: ${outline}px solid rgba(${rgb}, 0.2);
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
        {/* Controls Section */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black">Configuration</h3>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Ajuster l'effet de verre</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                <label htmlFor="blur-slider">Flou (Blur)</label>
                <span className="text-indigo-600">{blur}px</span>
              </div>
              <input
                id="blur-slider"
                type="range"
                min="0"
                max="40"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                <label htmlFor="transparency-slider">Transparence</label>
                <span className="text-indigo-600">{Math.round(transparency * 100)}%</span>
              </div>
              <input
                id="transparency-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={transparency}
                onChange={(e) => setTransparency(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label htmlFor="color-picker" className="block text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Couleur de fond</label>
                <div className="flex items-center gap-4">
                  <input
                    id="color-picker"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={color.toUpperCase()}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm font-bold"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                  <label htmlFor="outline-slider">Bordure</label>
                  <span className="text-indigo-600">{outline}px</span>
                </div>
                <div className="pt-4">
                  <input
                    id="outline-slider"
                    type="range"
                    min="0"
                    max="5"
                    value={outline}
                    onChange={(e) => setOutline(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="space-y-8 h-full flex flex-col">
          <div className="flex-grow min-h-[400px] relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-12 flex items-center justify-center shadow-2xl">
            {/* Background blobs for preview visibility */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-300 rounded-full blur-2xl opacity-60 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-teal-300 rounded-full blur-3xl opacity-60"></div>

            <div
              style={glassStyle}
              className="w-full h-full max-w-sm flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-xl relative z-10 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Layout className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-black text-white">Aperçu Réel</h4>
              <p className="text-white/80 font-medium">L'effet s'adapte parfaitement à tous les types de contenus.</p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 space-y-4 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs tracking-widest">
                <Code className="w-4 h-4" /> CSS
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié' : 'Copier CSS'}
              </button>
            </div>
            <pre className="text-indigo-300 font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {cssString}
            </pre>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-600">
            <Sliders className="w-4 h-4" /> Blur (Flou)
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La propriété backdrop-filter: blur() crée l'effet de verre dépoli caractéristique. Un flou élevé augmente l'illisibilité du fond.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-600">
            <Palette className="w-4 h-4" /> Couleurs RGBA
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'utilisation de RGBA permet de définir l'opacité séparément de la couleur, essentiel pour obtenir un effet semi-transparent réaliste.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-indigo-600">
            <Code className="w-4 h-4" /> Compatibilité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Inclut les préfixes -webkit pour assurer la compatibilité avec tous les navigateurs modernes, y compris Safari sur macOS et iOS.
          </p>
        </div>
      </div>
    </div>
  );
}
