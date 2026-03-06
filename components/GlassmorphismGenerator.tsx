import React, { useState, useMemo } from 'react';
import { Copy, Check, Settings, Trash2, Layout, Maximize2, Palette, Info } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(1);
  const [copied, setCopied] = useState(false);

  const rgbaColor = useMemo(() => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${transparency})`;
  }, [color, transparency]);

  const cssCode = useMemo(() => {
    return `background: ${rgbaColor};
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: ${outline}px solid rgba(255, 255, 255, 0.2);
border-radius: 20px;
box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);`;
  }, [rgbaColor, blur, outline]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setBlur(10);
    setTransparency(0.2);
    setColor('#ffffff');
    setOutline(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Settings Area */}
        <div className="lg:col-span-5 space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Paramètres
            </h3>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              aria-label="Réinitialiser"
            >
              <Trash2 className="w-3 h-3" /> Réinitialiser
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   Blur (Flou)
                </label>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   Transparence
                </label>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{Math.round(transparency * 100)}%</span>
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

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   Épaisseur de bordure
                </label>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{outline}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={outline}
                onChange={(e) => setOutline(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                   Couleur de base
                </label>
                <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 uppercase">{color}</span>
              </div>
              <div className="flex gap-4">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-12 rounded-xl cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-7 space-y-8">
           <div className="relative h-[400px] rounded-[2.5rem] overflow-hidden group shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center p-12">
            {/* Background Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient-slow"></div>
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-400 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-400 rounded-full blur-3xl animate-bounce duration-[4000ms]"></div>

            {/* Glass Element */}
            <div
                className="w-full max-w-md h-full relative z-10 flex flex-col items-center justify-center text-center p-8 transition-all duration-300"
                style={{
                    background: rgbaColor,
                    backdropFilter: `blur(${blur}px)`,
                    WebkitBackdropFilter: `blur(${blur}px)`,
                    border: `${outline}px solid rgba(255, 255, 255, 0.2)`,
                    borderRadius: '2.5rem',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                }}
            >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 text-white">
                    <Maximize2 className="w-8 h-8" />
                </div>
                <h4 className="text-2xl font-black text-white mb-2">Aperçu en direct</h4>
                <p className="text-white/80 font-medium">Ajustez les curseurs pour voir l'effet en temps réel sur ce fond coloré.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Layout className="w-4 h-4" /> Code CSS
                </h3>
                <button
                    onClick={handleCopy}
                    className={`text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                        copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                    }`}
                >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copié !' : 'Copier le CSS'}
                </button>
            </div>
            <div className="relative">
                <pre className="bg-slate-900 text-indigo-300 p-8 rounded-[2rem] border border-slate-800 font-mono text-sm overflow-x-auto shadow-inner leading-relaxed">
                    <code>{cssCode}</code>
                </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white dark:bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-10">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Palette className="w-10 h-10" />
        </div>
        <div className="space-y-4">
            <h4 className="font-black text-xl flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-500" /> Qu'est-ce que le Glassmorphism ?
            </h4>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Le glassmorphism est un style visuel moderne basé sur la <strong>transparence</strong>, un flou d'arrière-plan (<strong>background-blur</strong>) et des bordures légères pour créer un effet de verre dépoli flottant. Il s'appuie fortement sur la propriété CSS <code>backdrop-filter</code> pour créer de la profondeur et de la hiérarchie visuelle.
            </p>
        </div>
      </div>
    </div>
  );
}
