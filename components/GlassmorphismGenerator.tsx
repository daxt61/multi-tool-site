import { useState, useMemo } from 'react';
import { Layers, Copy, Check, RefreshCw, Sliders, Code, Info } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(1);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const isValid = /^[0-9A-Fa-f]{3,6}$/.test(cleanHex);

    if (!isValid) return '255, 255, 255';

    let r, g, b;
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
    return `/* Glassmorphism CSS Effect */
background: rgba(${rgb}, ${transparency});
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: ${outline}px solid rgba(${rgb}, 0.2);
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
    setOutline(1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres</h3>
              </div>
              <button onClick={reset} className="text-slate-400 hover:text-indigo-500 transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Flou (Blur)</label>
                  <span className="text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={blur}
                  onChange={(e) => setBlur(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transparence</label>
                  <span className="text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">{Math.round(transparency * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={transparency}
                  onChange={(e) => setTransparency(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Couleur</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase">{color}</span>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded-lg overflow-hidden border-none p-0 cursor-pointer bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bordure</label>
                  <span className="text-xs font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md">{outline}px</span>
                </div>
                <input
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

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/10 space-y-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 opacity-50" />
              <h3 className="font-bold">Qu'est-ce que le Glassmorphism ?</h3>
            </div>
            <p className="text-sm text-indigo-100 leading-relaxed">
              C'est une tendance de design UI basée sur un effet de "verre dépoli". Il utilise le flou d'arrière-plan (backdrop-filter) et la transparence pour créer de la profondeur et de la hiérarchie.
            </p>
          </div>
        </div>

        {/* Preview & Code */}
        <div className="lg:col-span-7 space-y-8">
          {/* Preview Container */}
          <div className="relative h-80 rounded-[3rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/40 group">
            {/* Background pattern for preview */}
            <div className="absolute inset-0 grid grid-cols-6 gap-2 p-4 opacity-40">
              {[...Array(24)].map((_, i) => (
                <div key={i} className={`rounded-xl ${i % 3 === 0 ? 'bg-indigo-500/20' : i % 3 === 1 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`} />
              ))}
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-30 animate-pulse" />

            {/* The Glass Card */}
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div
                className="w-full h-full flex flex-col items-center justify-center text-center p-8 transition-all duration-300"
                style={{
                  background: `rgba(${hexToRgb(color)}, ${transparency})`,
                  backdropFilter: `blur(${blur}px)`,
                  WebkitBackdropFilter: `blur(${blur}px)`,
                  border: `${outline}px solid rgba(${hexToRgb(color)}, 0.2)`,
                  borderRadius: '2.5rem'
                }}
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 border border-white/20">
                  <Layers className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <h4 className="text-2xl font-black text-white drop-shadow-md mb-2">Aperçu en direct</h4>
                <p className="text-white/80 font-medium drop-shadow-sm">Ajustez les paramètres à gauche</p>
              </div>
            </div>
          </div>

          {/* CSS Output */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-500" />
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">CSS Généré</label>
              </div>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié !' : 'Copier CSS'}
              </button>
            </div>
            <div className="relative group">
              <textarea
                value={cssCode}
                readOnly
                className="w-full h-[220px] p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2.5rem] font-mono text-sm leading-relaxed resize-none outline-none ring-offset-4 ring-offset-white dark:ring-offset-slate-950 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
