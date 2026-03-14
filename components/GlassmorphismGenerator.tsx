import React, { useState, useMemo } from 'react';
import { Copy, Check, Layers, Info, RotateCcw } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.1);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
      '255, 255, 255';
  };

  const glassStyle = useMemo(() => {
    const rgb = hexToRgb(color);
    return {
      background: `rgba(${rgb}, ${transparency})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      border: `1px solid rgba(${rgb}, ${outline})`,
      borderRadius: '2.5rem'
    };
  }, [blur, transparency, color, outline]);

  const cssCode = useMemo(() => {
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb}, ${transparency});
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: 1px solid rgba(${rgb}, ${outline});
border-radius: 2.5rem;`;
  }, [blur, transparency, color, outline]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setBlur(10);
    setTransparency(0.2);
    setColor('#ffffff');
    setOutline(0.1);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Preview Area */}
        <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-12 flex items-center justify-center">
          <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-400 rounded-full blur-2xl animate-bounce duration-[3000ms]"></div>

          <div
            style={glassStyle}
            className="w-full h-full flex flex-col items-center justify-center text-center p-8 transition-all duration-300"
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2 drop-shadow-sm">Glassmorphism</h3>
            <p className="text-white/80 font-medium text-sm max-w-[200px]">Prévisualisation de l'effet en temps réel sur un fond coloré.</p>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-8">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xl font-black dark:text-white">Configuration</h3>
            <button
              onClick={reset}
              className="text-xs font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Réinitialiser
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-600">Flou (Blur)</label>
                <span className="text-sm font-bold text-indigo-500">{blur}px</span>
              </div>
              <input
                type="range" min="0" max="40" step="1" value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-600">Transparence</label>
                <span className="text-sm font-bold text-indigo-500">{Math.round(transparency * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01" value={transparency}
                onChange={(e) => setTransparency(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-600">Contour (Outline)</label>
                <span className="text-sm font-bold text-indigo-500">{Math.round(outline * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01" value={outline}
                onChange={(e) => setOutline(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-600 px-1">Couleur de fond</label>
              <div className="flex gap-4 items-center">
                <input
                  type="color" value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-16 rounded-2xl border-4 border-white dark:border-slate-800 cursor-pointer overflow-hidden bg-transparent"
                />
                <input
                  type="text" value={color.toUpperCase()}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Area */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-600">Code CSS</label>
          <button
            onClick={handleCopy}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié !' : 'Copier le CSS'}
          </button>
        </div>
        <pre className="p-8 bg-slate-900 dark:bg-black rounded-[2.5rem] border border-slate-800 text-indigo-400 font-mono text-sm md:text-base overflow-x-auto selection:bg-indigo-500/30">
          {cssCode}
        </pre>
      </div>

      <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-bold dark:text-white">Conseils pour un meilleur effet</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Le Glassmorphism fonctionne mieux sur des fonds colorés et contrastés. Pour un aspect premium, gardez une transparence entre 10% et 30% et un flou supérieur à 10px. L'ajout d'une fine bordure claire (Outline) renforce l'illusion de profondeur et de relief.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
