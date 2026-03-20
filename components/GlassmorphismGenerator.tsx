import React, { useState, useMemo } from 'react';
import { Layers, Copy, Check, RefreshCcw } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [opacity, setOpacity] = useState(0.2);
  const [saturation, setSaturation] = useState(100);
  const [color, setColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 255, g: 255, b: 255 };
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  };

  const glassStyle = useMemo(() => {
    const rgb = hexToRgb(color);
    return {
      background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`,
      backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
      WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '24px',
    };
  }, [blur, opacity, saturation, color]);

  const cssCode = useMemo(() => {
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity});\nbackdrop-filter: blur(${blur}px) saturate(${saturation}%);\n-webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);\nborder: 1px solid rgba(255, 255, 255, 0.1);\nborder-radius: 24px;`;
  }, [blur, opacity, saturation, color]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setBlur(10);
    setOpacity(0.2);
    setSaturation(100);
    setColor('#ffffff');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 space-y-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" /> Paramètres
              </h3>
              <button
                onClick={reset}
                className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                aria-label="Réinitialiser"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label htmlFor="blur" className="text-sm font-bold text-slate-600 dark:text-slate-400">Flou: {blur}px</label>
                </div>
                <input
                  id="blur"
                  type="range"
                  min="0"
                  max="40"
                  value={blur}
                  onChange={(e) => setBlur(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label htmlFor="opacity" className="text-sm font-bold text-slate-600 dark:text-slate-400">Opacité: {Math.round(opacity * 100)}%</label>
                </div>
                <input
                  id="opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label htmlFor="saturation" className="text-sm font-bold text-slate-600 dark:text-slate-400">Saturation: {saturation}%</label>
                </div>
                <input
                  id="saturation"
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <label htmlFor="color" className="text-sm font-bold text-slate-600 dark:text-slate-400">Couleur de fond</label>
                <div className="flex gap-4">
                  <input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-slate-200 dark:border-slate-700 bg-transparent p-1 transition-all hover:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={color.toUpperCase()}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-grow px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-slate-300 p-8 rounded-[2rem] relative group border border-slate-800">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">CSS Code</span>
              <button
                onClick={copyToClipboard}
                className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-all text-slate-300 flex items-center gap-2 text-xs font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
              {cssCode}
            </pre>
          </div>
        </div>

        <div className="relative rounded-[2.5rem] overflow-hidden min-h-[500px] flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-30">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="border border-white/20" />
            ))}
          </div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-amber-400 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-emerald-400 rounded-full blur-3xl animate-bounce duration-[10s]" />

          <div
            style={glassStyle}
            className="w-72 h-72 md:w-96 md:h-96 relative z-10 flex flex-col items-center justify-center p-8 text-center text-white"
          >
            <Layers className="w-16 h-16 mb-4 opacity-50" />
            <h4 className="text-2xl font-black mb-2">Aperçu</h4>
            <p className="text-sm opacity-80 font-medium leading-relaxed">
              Ce conteneur utilise l'effet Glassmorphism généré ci-contre. L'effet de flou s'adapte en temps réel aux formes d'arrière-plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
