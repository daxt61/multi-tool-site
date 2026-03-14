import React, { useState, useMemo } from 'react';
import { Copy, Check, RefreshCw, Layers, Sliders, Palette } from 'lucide-react';

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

  const glassStyle = useMemo(() => ({
    background: `rgba(${hexToRgb(color)}, ${transparency})`,
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    border: `${outline}px solid rgba(${hexToRgb(color)}, 0.2)`,
    borderRadius: '2.5rem'
  }), [blur, transparency, color, outline]);

  const cssCode = useMemo(() => {
    return `background: rgba(${hexToRgb(color)}, ${transparency});\n` +
           `backdrop-filter: blur(${blur}px);\n` +
           `-webkit-backdrop-filter: blur(${blur}px);\n` +
           `border-radius: 2.5rem;\n` +
           `border: ${outline}px solid rgba(${hexToRgb(color)}, 0.2);`;
  }, [blur, transparency, color, outline]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Preview Area */}
        <div className="relative aspect-video lg:aspect-square w-full rounded-[3rem] overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-8 md:p-12">
          {/* Decorative shapes */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-300 rounded-full blur-2xl opacity-60 animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-400 rounded-full blur-3xl opacity-60 animate-bounce transition-all duration-1000" />

          <div style={glassStyle} className="w-full h-full shadow-2xl flex flex-col items-center justify-center text-center p-8 space-y-4">
            <Layers className="w-12 h-12 text-white/80" />
            <h3 className="text-2xl font-black text-white/90 tracking-tight">Preview</h3>
            <p className="text-white/70 text-sm font-medium leading-relaxed max-w-xs">
              This is how your glassmorphism effect will look against a colorful background.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-8">
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] space-y-8">
            <div className="flex items-center gap-3 text-indigo-500">
              <Sliders className="w-5 h-5" />
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Settings</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500">Blur</label>
                  <span className="text-xs font-black font-mono text-indigo-500">{blur}px</span>
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

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500">Transparency</label>
                  <span className="text-xs font-black font-mono text-indigo-500">{Math.round(transparency * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={transparency}
                  onChange={(e) => setTransparency(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500">Outline</label>
                  <span className="text-xs font-black font-mono text-indigo-500">{outline}px</span>
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
                <label className="text-xs font-bold text-slate-500">Color</label>
                <div className="flex gap-4">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer overflow-hidden"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm uppercase outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-900 rounded-[2.5rem] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Generated CSS</h3>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy CSS'}
              </button>
            </div>
            <pre className="text-indigo-400 font-mono text-sm leading-relaxed overflow-x-auto p-4 bg-black/30 rounded-2xl border border-white/5">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
