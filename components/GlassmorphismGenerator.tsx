import { useState } from 'react';
import { Copy, Check, RefreshCw, Layers, Sliders, Code } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(1);
  const [copied, setCopied] = useState(false);

  const rgb = hexToRgb(color) || { r: 255, g: 255, b: 255 };

  const glassStyle = {
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${transparency})`,
    border: `${outline}px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${transparency + 0.1})`,
  };

  const cssCode = `/* Glassmorphism CSS */
background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${transparency});
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: ${outline}px solid rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${transparency + 0.1});
border-radius: 16px;`;

  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres</h3>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Flou ({blur}px)</label>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Transparence ({transparency})</label>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={transparency}
                onChange={(e) => setTransparency(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Couleur</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl border-0 p-0 overflow-hidden cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Contour ({outline}px)</label>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={outline}
                onChange={(e) => setOutline(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <button
              onClick={() => {setBlur(10); setTransparency(0.2); setColor('#ffffff'); setOutline(1);}}
              className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] h-[400px] relative overflow-hidden flex items-center justify-center p-12 border border-slate-200 dark:border-slate-700">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-rose-500 rounded-full blur-2xl opacity-50 animate-bounce transition-all duration-1000"></div>

            <div
              style={glassStyle}
              className="w-full max-w-sm h-48 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center gap-4 relative z-10 p-8 text-center"
            >
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-black text-white text-xl">Aperçu Glass</h4>
                <p className="text-white/70 text-sm font-medium">Votre effet en temps réel</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-8 border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-indigo-400">
                <Code className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">Code CSS</span>
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="text-indigo-300 font-mono text-sm overflow-x-auto p-4 bg-white/5 rounded-2xl">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
