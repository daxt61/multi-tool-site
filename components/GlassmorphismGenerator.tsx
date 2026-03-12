import React, { useState, useMemo } from 'react';
import { Copy, Check, Palette, Layers, Sparkles, Info, Eye } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.1);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '255, 255, 255';
  };

  const glassStyle = useMemo(() => {
    const rgb = hexToRgb(color);
    return {
      background: `rgba(${rgb}, ${transparency})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      border: `1px solid rgba(${rgb}, ${outline})`,
      borderRadius: '2.5rem',
    };
  }, [blur, transparency, color, outline]);

  const cssString = useMemo(() => {
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb}, ${transparency});\nbackdrop-filter: blur(${blur}px);\n-webkit-backdrop-filter: blur(${blur}px);\nborder: 1px solid rgba(${rgb}, ${outline});\nborder-radius: 2.5rem;`;
  }, [blur, transparency, color, outline]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex items-center gap-3 text-indigo-500 px-1">
            <Palette className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Configuration</h3>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-500">Flou (Blur)</label>
                <span className="text-sm font-black font-mono text-indigo-500">{blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="w-full h-1.5 bg-white dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 shadow-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-500">Transparence</label>
                <span className="text-sm font-black font-mono text-indigo-500">{transparency}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={transparency}
                onChange={(e) => setTransparency(Number(e.target.value))}
                className="w-full h-1.5 bg-white dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 shadow-sm"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-500">Couleur de fond</label>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black font-mono text-slate-400 uppercase">{color}</span>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-2 border-white dark:border-slate-800 cursor-pointer overflow-hidden shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-slate-500">Contour (Outline)</label>
                <span className="text-sm font-black font-mono text-indigo-500">{outline}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={outline}
                onChange={(e) => setOutline(Number(e.target.value))}
                className="w-full h-1.5 bg-white dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative h-[400px] rounded-[3rem] overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-12 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-xl">
             {/* Decorative bubbles behind */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-yellow-300/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-blue-400/20 rounded-full blur-xl animate-bounce duration-[5000ms]"></div>

            {/* The Glass Element */}
            <div style={glassStyle} className="w-full max-w-sm h-48 flex flex-col items-center justify-center text-white shadow-2xl transition-all duration-300">
               <Sparkles className="w-8 h-8 mb-2 opacity-80" />
               <span className="text-xl font-black tracking-tight uppercase">Aperçu</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code CSS</label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl font-mono text-sm leading-relaxed text-indigo-300 border border-slate-800 overflow-x-auto whitespace-pre">
              {cssString}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" /> Effet de verre
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le Glassmorphism est un style UI qui imite l'apparence du verre dépoli. Il repose sur trois piliers : la transparence, le flou d'arrière-plan (backdrop-filter) et une bordure fine et subtile.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" /> Hiérarchie Visuelle
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilisez cet effet pour donner de la profondeur à vos interfaces. Il fonctionne mieux sur des arrière-plans colorés ou texturés pour mettre en évidence la réfraction du flou.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Compatibilité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La propriété <code className="text-indigo-600">backdrop-filter</code> est largement supportée par les navigateurs modernes, mais nécessite souvent un préfixe <code className="text-indigo-600">-webkit-</code> pour Safari.
          </p>
        </div>
      </div>
    </div>
  );
}
