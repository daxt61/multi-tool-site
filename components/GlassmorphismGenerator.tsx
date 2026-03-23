import React, { useState, useMemo } from 'react';
import { Copy, Check, Layers, Info, Trash2 } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.1);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const validHex = /^[0-9A-Fa-f]{3,6}$/.test(hex.replace('#', '')) ? hex.replace('#', '') : 'ffffff';
    const r = parseInt(validHex.length === 3 ? validHex[0].repeat(2) : validHex.substring(0, 2), 16);
    const g = parseInt(validHex.length === 3 ? validHex[1].repeat(2) : validHex.substring(2, 4), 16);
    const b = parseInt(validHex.length === 3 ? validHex[2].repeat(2) : validHex.substring(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? '255, 255, 255' : `${r}, ${g}, ${b}`;
  };

  const glassStyle = useMemo(() => ({
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    backgroundColor: `rgba(${hexToRgb(color)}, ${transparency})`,
    border: `1px solid rgba(${hexToRgb(color)}, ${outline})`,
  }), [blur, transparency, color, outline]);

  const cssCode = `background: rgba(${hexToRgb(color)}, ${transparency});
border-radius: 16px;
box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: 1px solid rgba(${hexToRgb(color)}, ${outline});`;

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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Configuration</h3>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg"
              aria-label="Réinitialiser les paramètres"
            >
              <Trash2 className="w-3.5 h-3.5" /> Réinitialiser
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label htmlFor="blur" className="text-xs font-bold text-slate-500 uppercase">Flou (Blur)</label>
                <span className="text-xs font-black text-indigo-500">{blur}px</span>
              </div>
              <input
                id="blur"
                type="range"
                min="0"
                max="20"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label htmlFor="transparency" className="text-xs font-bold text-slate-500 uppercase">Transparence</label>
                <span className="text-xs font-black text-indigo-500">{transparency.toFixed(2)}</span>
              </div>
              <input
                id="transparency"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={transparency}
                onChange={(e) => setTransparency(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label htmlFor="outline" className="text-xs font-bold text-slate-500 uppercase">Bordure (Outline)</label>
                <span className="text-xs font-black text-indigo-500">{outline.toFixed(2)}</span>
              </div>
              <input
                id="outline"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={outline}
                onChange={(e) => setOutline(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <label htmlFor="color-input" className="text-xs font-bold text-slate-500 uppercase block px-1">Couleur de fond</label>
              <div className="flex gap-4">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                  <input
                    id="color-picker"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                    aria-label="Choisir une couleur"
                  />
                </div>
                <input
                  id="color-input"
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-grow p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-8 group">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-40">
              <div className="absolute top-10 left-10 w-32 h-32 bg-indigo-500 rounded-full blur-2xl"></div>
              <div className="absolute bottom-10 right-10 w-40 h-40 bg-rose-500 rounded-full blur-2xl"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-amber-500 rotate-45 rounded-full blur-3xl"></div>
            </div>

            {/* Glass Card */}
            <div
              style={glassStyle}
              className="relative w-full h-full rounded-3xl flex flex-col items-center justify-center text-center p-6 shadow-2xl transition-all"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/30">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-black text-white drop-shadow-sm mb-2">Aperçu Glassmorphism</h4>
              <p className="text-sm text-white/80 font-medium">Modifiez les réglages pour voir l'effet en temps réel.</p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-6 space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">CSS Output</span>
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copié' : 'Copier CSS'}
              </button>
            </div>
            <pre className="text-indigo-300 font-mono text-xs leading-relaxed overflow-x-auto p-2">
              <code>{cssCode}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">Qu'est-ce que le Glassmorphism ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le Glassmorphism est un style visuel qui imite l'aspect du verre dépoli. Il repose sur la transparence, le flou d'arrière-plan (`backdrop-filter`) et des bordures légères pour créer une hiérarchie visuelle moderne et élégante.
          </p>
        </div>
      </div>
    </div>
  );
}
