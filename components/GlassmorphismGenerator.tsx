import { useState, useMemo } from 'react';
import { Layers, Copy, Check, Palette, Settings } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.1);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const validHex = /^[0-9A-Fa-f]{3,6}$/.test(hex.replace('#', ''));
    if (!validHex) return '255, 255, 255';

    let r = 0, g = 0, b = 0;
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.substring(0, 2), 16);
      g = parseInt(cleanHex.substring(2, 4), 16);
      b = parseInt(cleanHex.substring(4, 6), 16);
    }
    return isNaN(r) || isNaN(g) || isNaN(b) ? '255, 255, 255' : `${r}, ${g}, ${b}`;
  };

  const cssStyles = useMemo(() => {
    const rgb = hexToRgb(color);
    return {
      background: `rgba(${rgb}, ${transparency})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      borderRadius: '2rem',
      border: `1px solid rgba(${rgb}, ${outline})`,
    };
  }, [blur, transparency, color, outline]);

  const cssCode = useMemo(() => {
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb}, ${transparency});
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border-radius: 2rem;
border: 1px solid rgba(${rgb}, ${outline});`;
  }, [blur, transparency, color, outline]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="relative aspect-video rounded-[3rem] overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 p-12 flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-4 opacity-30">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="bg-white/20 rounded-full w-2 h-2" />
              ))}
            </div>

            <div style={cssStyles} className="w-full h-full flex flex-col items-center justify-center text-white p-8 animate-in zoom-in duration-500 shadow-xl">
              <Layers className="w-12 h-12 mb-4 opacity-80" />
              <h3 className="text-2xl font-black tracking-tight mb-2">Aperçu en direct</h3>
              <p className="text-white/80 font-medium">L'effet s'adapte à votre contenu.</p>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Code CSS</label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-indigo-400'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="font-mono text-sm leading-relaxed text-indigo-300 overflow-x-auto p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
              {cssCode}
            </pre>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 shadow-xl shadow-indigo-500/5">
            <div className="flex items-center gap-2 px-1">
              <Settings className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres</h3>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="blur-range" className="text-sm font-bold text-slate-700 dark:text-slate-300">Flou</label>
                  <span className="text-xs font-mono font-bold text-indigo-500">{blur}px</span>
                </div>
                <input
                  id="blur-range"
                  type="range"
                  min="0"
                  max="40"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="transparency-range" className="text-sm font-bold text-slate-700 dark:text-slate-300">Transparence</label>
                  <span className="text-xs font-mono font-bold text-indigo-500">{(transparency * 100).toFixed(0)}%</span>
                </div>
                <input
                  id="transparency-range"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={transparency}
                  onChange={(e) => setTransparency(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="outline-range" className="text-sm font-bold text-slate-700 dark:text-slate-300">Bordure</label>
                  <span className="text-xs font-mono font-bold text-indigo-500">{(outline * 100).toFixed(0)}%</span>
                </div>
                <input
                  id="outline-range"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={outline}
                  onChange={(e) => setOutline(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <Palette className="w-3 h-3 text-indigo-500" />
                  <label htmlFor="color-picker" className="text-sm font-bold text-slate-700 dark:text-slate-300">Couleur de fond</label>
                </div>
                <div className="flex gap-4 items-center">
                  <input
                    id="color-picker"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-14 h-14 rounded-xl border-none outline-none cursor-pointer p-0 overflow-hidden"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-grow p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 uppercase"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
