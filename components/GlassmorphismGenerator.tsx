import { useState, useMemo } from 'react';
import { Copy, Check, Box, Sliders } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(1);
  const [copied, setCopied] = useState(false);

  const rgba = useMemo(() => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${transparency})`;
  }, [color, transparency]);

  const cssCode = useMemo(() => {
    return `/* Glassmorphism CSS */
background: ${rgba};
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: ${outline}px solid rgba(255, 255, 255, 0.2);
border-radius: 2.5rem;`;
  }, [rgba, blur, outline]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Controls */}
        <div className="space-y-8 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <Sliders className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Configuration</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Flou (Blur)</label>
                <span className="text-sm font-black text-indigo-500">{blur}px</span>
              </div>
              <input
                type="range" min="0" max="40" step="1"
                value={blur} onChange={(e) => setBlur(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Transparence</label>
                <span className="text-sm font-black text-indigo-500">{transparency.toFixed(2)}</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01"
                value={transparency} onChange={(e) => setTransparency(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block">Couleur</label>
              <div className="flex gap-4 items-center">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-grow p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm uppercase"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Bordure</label>
                <span className="text-sm font-black text-indigo-500">{outline}px</span>
              </div>
              <input
                type="range" min="0" max="10" step="1"
                value={outline} onChange={(e) => setOutline(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-8">
          <div className="relative aspect-square w-full max-w-[400px] mx-auto rounded-[3rem] overflow-hidden flex items-center justify-center p-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 animate-gradient-xy"></div>
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-300 rounded-full blur-2xl opacity-50"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-emerald-300 rounded-full blur-3xl opacity-50"></div>

            {/* Glass Element */}
            <div
              className="relative z-10 w-full h-full shadow-2xl transition-all duration-300"
              style={{
                backgroundColor: rgba,
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                border: `${outline}px solid rgba(255, 255, 255, 0.2)`,
                borderRadius: '2.5rem'
              }}
            >
              <div className="p-8 h-full flex flex-col items-center justify-center text-center space-y-4">
                <Box className="w-12 h-12 text-white/80" />
                <h4 className="text-xl font-black text-white drop-shadow-sm">Aperçu</h4>
                <p className="text-white/70 text-sm font-medium leading-relaxed">
                  Le Glassmorphism utilise le flou d'arrière-plan pour créer un effet de verre dépoli moderne.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">CSS</h3>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié !' : 'Copier CSS'}
              </button>
            </div>
            <pre className="p-6 bg-slate-900 text-indigo-300 rounded-3xl font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 shadow-xl">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
