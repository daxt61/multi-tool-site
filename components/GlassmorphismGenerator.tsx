import React, { useState, useMemo } from 'react';
import { Layers, Copy, Check, RefreshCw, Palette, Settings2 } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [color, setColor] = useState('#ffffff');
  const [opacity, setOpacity] = useState(0.2);
  const [blur, setBlur] = useState(10);
  const [border, setBorder] = useState(20);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    let r = 255, g = 255, b = 255;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      r = parseInt(result[1], 16);
      g = parseInt(result[2], 16);
      b = parseInt(result[3], 16);
    }
    return `${r}, ${g}, ${b}`;
  };

  const cssStyles = useMemo(() => {
    const rgb = hexToRgb(color);
    return {
      background: `rgba(${rgb}, ${opacity})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      borderRadius: '2rem',
      border: `1px solid rgba(${rgb}, ${border / 100})`,
    };
  }, [color, opacity, blur, border]);

  const cssCode = useMemo(() => {
    return `background: ${cssStyles.background};\nbackdrop-filter: ${cssStyles.backdropFilter};\n-webkit-backdrop-filter: ${cssStyles.WebkitBackdropFilter};\nborder-radius: ${cssStyles.borderRadius};\nborder: ${cssStyles.border};`;
  }, [cssStyles]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Live Preview */}
        <div className="relative aspect-square md:aspect-video lg:aspect-square rounded-[3rem] overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 p-12 flex items-center justify-center">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="w-64 h-64 bg-white/20 rounded-full absolute -top-12 -left-12 blur-3xl animate-pulse" />
          <div className="w-80 h-80 bg-rose-500/20 rounded-full absolute -bottom-20 -right-20 blur-3xl animate-pulse delay-700" />

          <div
            style={cssStyles}
            className="w-full max-w-sm aspect-square flex flex-col items-center justify-center text-white text-center p-8 shadow-2xl relative z-10"
          >
            <Layers className="w-12 h-12 mb-4 opacity-80" />
            <h3 className="text-2xl font-black mb-2">Effet Glass</h3>
            <p className="text-sm font-medium opacity-60">Prévisualisation en temps réel</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Couleur de fond
              </label>
              <div className="flex gap-4">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white dark:border-slate-700 shadow-sm"
                />
                <input
                  type="text"
                  value={color.toUpperCase()}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl font-mono text-sm dark:text-white"
                />
              </div>
            </div>

            {[
              { label: 'Opacité', value: opacity, set: setOpacity, min: 0, max: 1, step: 0.01, unit: '' },
              { label: 'Flou (Blur)', value: blur, set: setBlur, min: 0, max: 25, step: 1, unit: 'px' },
              { label: 'Bordure', value: border, set: setBorder, min: 0, max: 100, step: 1, unit: '%' },
            ].map((control) => (
              <div key={control.label} className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-500">{control.label}</label>
                  <span className="text-xs font-black font-mono text-indigo-500">{control.value}{control.unit}</span>
                </div>
                <input
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={control.value}
                  onChange={(e) => control.set(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code CSS</label>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="p-6 bg-slate-900 text-indigo-300 rounded-2xl font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
