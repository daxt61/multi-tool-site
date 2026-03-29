import { useState, useCallback } from 'react';
import { Copy, Check, Info, Palette, Layers, Settings, Maximize, RotateCcw } from 'lucide-react';

export function BoxShadowGenerator() {
  const [hOffset, setHOffset] = useState(10);
  const [vOffset, setVOffset] = useState(10);
  const [blur, setBlur] = useState(20);
  const [spread, setSpread] = useState(0);
  const [color, setColor] = useState('#000000');
  const [opacity, setOpacity] = useState(0.2);
  const [inset, setInset] = useState(false);
  const [copied, setCopied] = useState(false);

  const hexToRgba = (hex: string, alpha: number) => {
    let r = 0, g = 0, b = 0;
    try {
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
      }
    } catch {
      return `rgba(0, 0, 0, ${alpha})`;
    }
    return `rgba(${r || 0}, ${g || 0}, ${b || 0}, ${alpha})`;
  };

  const shadowCode = `${inset ? 'inset ' : ''}${hOffset}px ${vOffset}px ${blur}px ${spread}px ${hexToRgba(color, opacity)}`;
  const cssCode = `box-shadow: ${shadowCode};
-webkit-box-shadow: ${shadowCode};
-moz-box-shadow: ${shadowCode};`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setHOffset(10);
    setVOffset(10);
    setBlur(20);
    setSpread(0);
    setColor('#000000');
    setOpacity(0.2);
    setInset(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="h-offset" className="flex items-center gap-2 cursor-pointer"><Settings className="w-3 h-3" /> Décalage Horizontal</label>
                <span className="text-indigo-500">{hOffset}px</span>
              </div>
              <input
                id="h-offset"
                type="range" min="-100" max="100" value={hOffset}
                onChange={(e) => setHOffset(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="v-offset" className="flex items-center gap-2 cursor-pointer"><Settings className="w-3 h-3" /> Décalage Vertical</label>
                <span className="text-indigo-500">{vOffset}px</span>
              </div>
              <input
                id="v-offset"
                type="range" min="-100" max="100" value={vOffset}
                onChange={(e) => setVOffset(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="blur" className="flex items-center gap-2 cursor-pointer"><Layers className="w-3 h-3" /> Flou (Blur)</label>
                <span className="text-indigo-500">{blur}px</span>
              </div>
              <input
                id="blur"
                type="range" min="0" max="100" value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="spread" className="flex items-center gap-2 cursor-pointer"><Maximize className="w-3 h-3" /> Étendue (Spread)</label>
                <span className="text-indigo-500">{spread}px</span>
              </div>
              <input
                id="spread"
                type="range" min="-50" max="50" value={spread}
                onChange={(e) => setSpread(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="shadow-color" className="flex items-center gap-2 cursor-pointer"><Palette className="w-3 h-3" /> Couleur & Opacité</label>
                <span className="text-indigo-500">{Math.round(opacity * 100)}%</span>
              </div>
              <div className="flex gap-4">
                <input
                  id="shadow-color"
                  type="color" value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-white border border-slate-200 dark:border-slate-700 p-1"
                />
                <input
                  id="opacity"
                  type="range" min="0" max="1" step="0.01" value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 self-center"
                  aria-label="Opacité de l'ombre"
                />
              </div>
            </div>

            <button
              onClick={() => setInset(!inset)}
              className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between font-bold ${
                inset
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              <span>Ombre intérieure (Inset)</span>
              <div className={`w-10 h-6 rounded-full relative transition-colors ${inset ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${inset ? 'left-5' : 'left-1'}`} />
              </div>
            </button>
          </div>
        </div>

        {/* Preview & Code */}
        <div className="space-y-8 flex flex-col">
          <div className="flex-1 min-h-[300px] bg-slate-100 dark:bg-slate-900/30 rounded-[2.5rem] flex items-center justify-center p-12 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />
            <div
              style={{
                boxShadow: shadowCode,
                backgroundColor: 'white',
              }}
              className="w-48 h-48 rounded-3xl z-10 flex items-center justify-center text-slate-300 font-black text-xl"
            >
              Aperçu
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">CSS Code</label>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="text-xs font-bold px-4 py-2 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-3 h-3" /> Réinitialiser
                </button>
                <button
                  onClick={handleCopy}
                  className={`text-xs font-bold px-6 py-2 rounded-full transition-all flex items-center gap-2 ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copié !' : 'Copier CSS'}
                </button>
              </div>
            </div>
            <pre className="p-6 bg-slate-900 text-slate-300 rounded-[2rem] font-mono text-sm overflow-x-auto leading-relaxed border border-slate-800">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Comprendre box-shadow
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La propriété <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">box-shadow</code> permet d'ajouter des effets d'ombre aux éléments. Elle prend en charge les décalages, le flou, l'étalement et la couleur.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-500" /> Flou vs Étendue</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le flou (Blur) définit la netteté de l'ombre, tandis que l'étendue (Spread) augmente ou réduit la taille globale de l'ombre par rapport à l'élément.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2"><Maximize className="w-4 h-4 text-indigo-500" /> Profondeur</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilisez des ombres douces (grand flou, faible opacité) pour créer une sensation de profondeur et de hiérarchie visuelle dans vos interfaces.
          </p>
        </div>
      </div>
    </div>
  );
}
