import React, { useState, useMemo } from 'react';
import { Copy, Check, Sliders, Palette, Layout, Info } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(1);
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
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      background: `rgba(${rgb}, ${transparency})`,
      border: `${outline}px solid rgba(${rgb}, 0.2)`,
      borderRadius: '2.5rem',
    };
  }, [blur, transparency, color, outline]);

  const cssCode = useMemo(() => {
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb}, ${transparency});
border-radius: 40px;
box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: ${outline}px solid rgba(${rgb}, 0.2);`;
  }, [blur, transparency, color, outline]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Controls */}
        <div className="space-y-6">
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] space-y-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Paramètres
            </h3>

            <div className="space-y-6">
              {/* Blur */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Flou (Blur)</label>
                  <span className="text-sm font-mono text-indigo-600 font-bold">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  step="1"
                  value={blur}
                  onChange={(e) => setBlur(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Transparency */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Transparence</label>
                  <span className="text-sm font-mono text-indigo-600 font-bold">{transparency.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={transparency}
                  onChange={(e) => setTransparency(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Color */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Couleur de fond</label>
                  <span className="text-sm font-mono text-indigo-600 font-bold">{color.toUpperCase()}</span>
                </div>
                <div className="flex gap-4">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-grow p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Outline */}
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Épaisseur bordure</label>
                  <span className="text-sm font-mono text-indigo-600 font-bold">{outline}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={outline}
                  onChange={(e) => setOutline(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-900 border border-slate-800 rounded-[2.5rem] space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                CSS Snippet
              </h3>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié' : 'Copier CSS'}
              </button>
            </div>
            <pre className="text-xs font-mono text-indigo-300 overflow-x-auto p-4 bg-black/30 rounded-2xl leading-relaxed">
              {cssCode}
            </pre>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="sticky top-8 space-y-6">
          <div className="relative h-[500px] w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[2.5rem] overflow-hidden flex items-center justify-center p-12">
            {/* Animated background elements for better glass visualization */}
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-yellow-300/20 rounded-full blur-3xl animate-bounce duration-[5000ms]" />

            <div
              style={glassStyle}
              className="w-full h-full flex flex-col items-center justify-center text-center p-8 shadow-2xl transition-all duration-300"
            >
              <div className="w-20 h-20 bg-white/30 rounded-3xl mb-6 flex items-center justify-center backdrop-blur-sm">
                <Palette className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4 drop-shadow-sm">Glassmorphism</h2>
              <p className="text-white/80 font-medium leading-relaxed max-w-xs drop-shadow-sm">
                Un effet visuel moderne utilisant le flou d'arrière-plan et la transparence.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-3">
              <h4 className="font-bold dark:text-white flex items-center gap-2 text-sm">
                <Layout className="w-4 h-4 text-indigo-500" /> UI Trend
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Le Glassmorphism est devenu populaire avec macOS Big Sur et Windows 11. Il crée une sensation de profondeur et de hiérarchie.
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-3">
              <h4 className="font-bold dark:text-white flex items-center gap-2 text-sm">
                <Info className="w-4 h-4 text-indigo-500" /> Support
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Nécessite <code className="text-indigo-500">backdrop-filter</code>. Supporté par tous les navigateurs modernes. Firefox nécessite parfois l'activation d'un flag.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
