import { useState, useMemo } from 'react';
import { Copy, Check, Layers, Settings2 } from 'lucide-react';
import { Slider } from './ui/slider';

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

  const cssCode = useMemo(() => {
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb}, ${transparency});
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border-radius: 2.5rem;
border: ${outline}px solid rgba(${rgb}, 0.2);`;
  }, [blur, transparency, color, outline]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Settings2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg">Paramètres</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Flou (Blur)</label>
                  <span className="text-sm font-mono font-bold text-indigo-600">{blur}px</span>
                </div>
                <Slider
                  value={[blur]}
                  onValueChange={(vals) => setBlur(vals[0])}
                  min={0}
                  max={40}
                  step={1}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Transparence</label>
                  <span className="text-sm font-mono font-bold text-indigo-600">{transparency.toFixed(2)}</span>
                </div>
                <Slider
                  value={[transparency]}
                  onValueChange={(vals) => setTransparency(vals[0])}
                  min={0}
                  max={1}
                  step={0.01}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Épaisseur du contour</label>
                  <span className="text-sm font-mono font-bold text-indigo-600">{outline}px</span>
                </div>
                <Slider
                  value={[outline]}
                  onValueChange={(vals) => setOutline(vals[0])}
                  min={0}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block">Couleur</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={color.toUpperCase()}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 relative group">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">CSS Code</span>
              <button
                onClick={copyToClipboard}
                className={`p-2 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                aria-label="Copier le code CSS"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="font-mono text-sm text-indigo-300 overflow-x-auto">
              <code>{cssCode}</code>
            </pre>
          </div>
        </div>

        {/* Preview */}
        <div className="relative min-h-[500px] rounded-[3rem] overflow-hidden flex items-center justify-center p-12 bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {/* Background pattern */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-60 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-[80px] opacity-60 animate-pulse delay-700"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-400 rounded-full blur-[60px] opacity-40"></div>
          </div>

          <div
            style={{
              background: `rgba(${hexToRgb(color)}, ${transparency})`,
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              borderRadius: '2.5rem',
              border: `${outline}px solid rgba(${hexToRgb(color)}, 0.2)`,
            }}
            className="w-full h-full max-w-sm max-h-64 relative z-10 flex flex-col items-center justify-center text-center p-8 shadow-2xl"
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 border border-white/20">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-2xl font-black text-white mb-2">Aperçu</h4>
            <p className="text-white/80 font-medium">Effet de verre en temps réel</p>
          </div>
        </div>
      </div>
    </div>
  );
}
