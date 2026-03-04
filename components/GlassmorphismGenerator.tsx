import { useState, useMemo } from 'react';
import { Copy, Check, Palette, Box, Layers, RefreshCw } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.1);
  const [copied, setCopied] = useState(false);

  const rgbaColor = useMemo(() => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${transparency})`;
  }, [color, transparency]);

  const cssCode = useMemo(() => {
    return `background: ${rgbaColor};
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: 1px solid rgba(255, 255, 255, ${outline});
border-radius: 24px;`;
  }, [rgbaColor, blur, outline]);

  const copyToClipboard = () => {
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Paramètres</h3>
              </div>
              <button
                onClick={reset}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Réinitialiser"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="blur-range" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Flou (Blur)</label>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">{blur}px</span>
                </div>
                <input
                  id="blur-range"
                  type="range"
                  min="0"
                  max="40"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="transparency-range" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Transparence</label>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">{transparency.toFixed(2)}</span>
                </div>
                <input
                  id="transparency-range"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={transparency}
                  onChange={(e) => setTransparency(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="outline-range" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Bordure (Opacity)</label>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">{outline.toFixed(2)}</span>
                </div>
                <input
                  id="outline-range"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={outline}
                  onChange={(e) => setOutline(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="glass-color" className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Couleur de fond</label>
                <div className="flex gap-4 items-center">
                  <div className="relative w-full h-12 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <input
                      id="glass-color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="absolute inset-0 w-full h-full cursor-pointer border-none p-0 scale-150"
                    />
                  </div>
                  <code className="text-xs font-black text-slate-400 font-mono uppercase">{color}</code>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] space-y-4 shadow-xl shadow-indigo-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Box className="w-4 h-4 text-indigo-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">CSS Result</h3>
              </div>
              <button
                onClick={copyToClipboard}
                className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                aria-label="Copier le CSS"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="text-xs font-mono text-indigo-300 overflow-x-auto leading-relaxed">
              {cssCode}
            </pre>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-7 relative min-h-[500px] flex items-center justify-center rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-900">
          {/* Background shapes */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-40 animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-40 animate-pulse delay-700" />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-rose-500 rounded-full blur-3xl opacity-30 animate-pulse delay-300" />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100" />

          {/* The Glass Element */}
          <div
            className="relative z-10 w-80 h-80 flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-2xl transition-all duration-300"
            style={{
              background: rgbaColor,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              border: `1px solid rgba(255, 255, 255, ${outline})`,
              borderRadius: '24px'
            }}
          >
            <Layers className="w-12 h-12 text-white/80" />
            <h4 className="text-2xl font-black text-white drop-shadow-sm">Glassmorphism</h4>
            <p className="text-sm text-white/70 font-medium leading-relaxed">
              Expérimentez avec le flou et la transparence pour créer des effets de verre modernes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
