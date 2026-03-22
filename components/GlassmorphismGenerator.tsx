import { useState, useMemo } from "react";
import { Copy, Check, Settings2, Eye, Layers } from "lucide-react";

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState("#ffffff");
  const [saturation, setSaturation] = useState(100);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    // Check for 3-digit hex (#fff)
    let result = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (result) {
      return {
        r: parseInt(result[1] + result[1], 16),
        g: parseInt(result[2] + result[2], 16),
        b: parseInt(result[3] + result[3], 16),
      };
    }
    // Check for 6-digit hex (#ffffff)
    result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 255, g: 255, b: 255 };
  };

  const glassStyle = useMemo(() => {
    const rgb = hexToRgb(color);
    return {
      backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${transparency})`,
      backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
      WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
      border: "1px solid rgba(255, 255, 255, 0.1)",
    };
  }, [blur, transparency, color, saturation]);

  const cssCode = useMemo(() => {
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${transparency});
backdrop-filter: blur(${blur}px) saturate(${saturation}%);
-webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 1rem;`;
  }, [blur, transparency, color, saturation]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Controls */}
      <div className="space-y-6">
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Settings2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Configuration</span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label htmlFor="blur" className="text-sm font-bold text-slate-600 dark:text-slate-400">Flou (Blur)</label>
                <span className="text-sm font-mono font-bold text-indigo-600">{blur}px</span>
              </div>
              <input
                id="blur"
                type="range"
                min="0"
                max="40"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label htmlFor="transparency" className="text-sm font-bold text-slate-600 dark:text-slate-400">Transparence</label>
                <span className="text-sm font-mono font-bold text-indigo-600">{transparency}</span>
              </div>
              <input
                id="transparency"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={transparency}
                onChange={(e) => setTransparency(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label htmlFor="saturation" className="text-sm font-bold text-slate-600 dark:text-slate-400">Saturation</label>
                <span className="text-sm font-mono font-bold text-indigo-600">{saturation}%</span>
              </div>
              <input
                id="saturation"
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => setSaturation(parseInt(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">Couleur de fond</label>
              <div className="flex gap-4">
                <input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-none"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-grow px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-indigo-400">
            <Layers className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Code CSS</span>
          </div>
          <pre className="p-8 pt-12 bg-slate-900 text-indigo-300 rounded-3xl overflow-x-auto font-mono text-sm leading-relaxed border border-slate-800">
            <code>{cssCode}</code>
          </pre>
          <button
            onClick={handleCopy}
            className={`absolute top-4 right-4 p-2 rounded-xl transition-all ${
              copied ? "bg-emerald-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
            }`}
            aria-label="Copier le code"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="relative min-h-[500px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        {/* Abstract Background for Preview */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-rose-500 rounded-full blur-[80px] opacity-60 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500 rounded-full blur-[100px] opacity-60"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] opacity-40"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400 mb-4">
            <Eye className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Aperçu en temps réel</span>
          </div>

          <div
            style={glassStyle}
            className="w-80 h-48 rounded-2xl flex items-center justify-center p-8 text-center"
          >
            <div>
              <h3 className="text-lg font-bold mb-2">Glassmorphism</h3>
              <p className="text-sm opacity-80">Testez votre effet de transparence ici.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
