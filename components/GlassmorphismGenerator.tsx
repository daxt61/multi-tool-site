import React, { useState, useMemo } from 'react';
import { Copy, Check, Settings2, Eye, Code as CodeIcon, Palette } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.1);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    // Basic validation
    if (!/^[0-9A-Fa-f]{3,6}$/.test(hex.replace('#', ''))) return '255, 255, 255';

    let r = 0, g = 0, b = 0;
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }
    return `${r}, ${g}, ${b}`;
  };

  const cssCode = useMemo(() => {
    const rgb = hexToRgb(color);
    return `/* Glassmorphism CSS */
background: rgba(${rgb}, ${transparency});
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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-3 text-indigo-500 px-1">
              <Settings2 className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Configuration</h3>
            </div>

            <div className="space-y-6">
              {[
                { id: 'blur', label: 'Flou (Blur)', value: blur, setter: setBlur, min: 0, max: 40, step: 1, suffix: 'px' },
                { id: 'transparency', label: 'Transparence', value: transparency, setter: setTransparency, min: 0, max: 1, step: 0.01, suffix: '' },
                { id: 'outline', label: 'Contour (Outline)', value: outline, setter: setOutline, min: 0, max: 1, step: 0.01, suffix: '' },
              ].map((param) => (
                <div key={param.id} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label htmlFor={param.id} className="text-sm font-bold text-slate-700 dark:text-slate-300">{param.label}</label>
                    <span className="text-xs font-mono font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">
                      {param.value}{param.suffix}
                    </span>
                  </div>
                  <input
                    id={param.id}
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={param.value}
                    onChange={(e) => param.setter(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}

              <div className="space-y-3">
                <label htmlFor="color" className="text-sm font-bold text-slate-700 dark:text-slate-300">Couleur de fond</label>
                <div className="flex gap-4">
                  <input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-xl border-4 border-white dark:border-slate-800 shadow-sm cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color.toUpperCase()}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-3 text-indigo-400">
                <CodeIcon className="w-5 h-5" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">CSS Généré</h3>
              </div>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié !' : 'Copier CSS'}
              </button>
            </div>
            <pre className="text-sm font-mono text-indigo-300 leading-relaxed overflow-x-auto whitespace-pre-wrap">
              {cssCode}
            </pre>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 text-indigo-500 px-1">
            <Eye className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Aperçu Réel</h3>
          </div>

          <div className="relative aspect-square w-full rounded-[3rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
            {/* Dynamic Background Pattern */}
            <div className="absolute inset-0 opacity-20 dark:opacity-40">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-rose-500 rounded-full blur-3xl animate-bounce duration-10000"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-8 border-indigo-500/20 rounded-full rotate-45"></div>
            </div>

            {/* The Glass Card */}
            <div
              className="w-4/5 h-4/5 flex flex-col items-center justify-center p-8 text-center relative z-10 shadow-2xl transition-all duration-300"
              style={{
                backgroundColor: `rgba(${hexToRgb(color)}, ${transparency})`,
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                border: `1px solid rgba(${hexToRgb(color)}, ${outline})`,
                borderRadius: '2.5rem'
              }}
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-black text-white mb-2 tracking-tight">Effet Glassmorphism</h4>
              <p className="text-white/80 text-sm font-medium leading-relaxed">
                Ajustez les contrôles pour voir l'effet en temps réel sur ce composant.
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/10 space-y-2">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-400">Qu'est-ce que le Glassmorphism ?</h4>
            <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed opacity-80">
              C'est une tendance de design basée sur un effet de "verre dépoli". Elle repose sur trois couches : une couleur de fond semi-transparente, un flou d'arrière-plan (backdrop-filter) et un fin contour clair pour simuler l'épaisseur du verre.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
