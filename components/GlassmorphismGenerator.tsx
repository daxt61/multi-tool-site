import { useState, useMemo } from 'react';
import { Copy, Check, Settings2, Palette, Layers, Eye } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(1);
  const [copied, setCopied] = useState(false);

  const cssCode = useMemo(() => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    return `background: rgba(${r}, ${g}, ${b}, ${transparency});
border-radius: 2.5rem;
box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: ${outline}px solid rgba(${r}, ${g}, ${b}, 0.2);`;
  }, [blur, transparency, color, outline]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: Configuration */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres</h3>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between px-1">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Flou (Blur)
                  </label>
                  <span className="text-xs font-black font-mono dark:text-indigo-400">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={blur}
                  onChange={(e) => setBlur(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between px-1">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Transparence
                  </label>
                  <span className="text-xs font-black font-mono dark:text-indigo-400">{Math.round(transparency * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={transparency}
                  onChange={(e) => setTransparency(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between px-1">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Eye className="w-3 h-3" /> Épaisseur de bordure
                  </label>
                  <span className="text-xs font-black font-mono dark:text-indigo-400">{outline}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={outline}
                  onChange={(e) => setOutline(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 px-1">Couleur de base</label>
                <div className="flex gap-4">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-slate-100 dark:border-slate-800 overflow-hidden"
                  />
                  <input
                    type="text"
                    value={color.toUpperCase()}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">CSS Code</label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié !' : 'Copier le CSS'}
              </button>
            </div>
            <pre className="p-6 bg-slate-900 text-slate-300 rounded-3xl font-mono text-sm leading-relaxed overflow-x-auto border border-slate-800 shadow-xl">
              {cssCode}
            </pre>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="lg:sticky lg:top-8 h-[600px] rounded-[3rem] overflow-hidden relative border border-slate-200 dark:border-slate-800 shadow-2xl">
          {/* Abstract Background for Preview */}
          <div className="absolute inset-0 bg-slate-100 dark:bg-slate-950">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute bottom-1/4 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>

            {/* Grid Pattern */}
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#6366f1 0.5px, transparent 0.5px)', backgroundSize: '24px 24px', opacity: 0.1 }}></div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div
              style={{
                background: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, ${transparency})`,
                borderRadius: '2.5rem',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                border: `${outline}px solid rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.2)`
              }}
              className="w-full h-full max-w-md max-h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-4"
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-black text-white drop-shadow-sm">Aperçu Visuel</h4>
              <p className="text-white/80 font-medium leading-relaxed drop-shadow-sm">
                Ceci est une prévisualisation de l'effet de flou sur un arrière-plan coloré.
              </p>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 text-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Preview Area</span>
          </div>
        </div>
      </div>
    </div>
  );
}
