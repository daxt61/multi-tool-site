import { useState, useMemo } from 'react';
import { Copy, Check, Layers } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.1);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '255, 255, 255';
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
  };

  const glassStyle = useMemo(() => {
    const rgb = hexToRgb(color);
    return {
      background: `rgba(${rgb}, ${transparency})`,
      backdropFilter: `blur(${blur}px)`,
      WebkitBackdropFilter: `blur(${blur}px)`,
      border: `1px solid rgba(${rgb}, ${outline})`,
      borderRadius: '2.5rem',
    };
  }, [blur, transparency, color, outline]);

  const cssCode = useMemo(() => {
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb}, ${transparency});
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border: 1px solid rgba(${rgb}, ${outline});
border-radius: 2.5rem;`;
  }, [blur, transparency, color, outline]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">Configuration</h3>

            <div className="space-y-6">
              {[
                { label: 'Flou (Blur)', value: blur, set: setBlur, min: 0, max: 20, step: 1, unit: 'px' },
                { label: 'Transparence', value: transparency, set: setTransparency, min: 0, max: 1, step: 0.01, unit: '' },
                { label: 'Contraste Bordure', value: outline, set: setOutline, min: 0, max: 1, step: 0.01, unit: '' },
              ].map((control) => (
                <div key={control.label} className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor={`control-${control.label}`} className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {control.label}
                    </label>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{control.value}{control.unit}</span>
                  </div>
                  <input
                    id={`control-${control.label}`}
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={control.value}
                    onChange={(e) => control.set(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}

              <div className="space-y-3">
                <label htmlFor="color-picker" className="text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
                  Couleur de fond
                </label>
                <div className="flex items-center gap-4">
                  <input
                    id="color-picker"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-none bg-transparent"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">CSS Code</span>
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="font-mono text-sm text-indigo-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {cssCode}
            </pre>
          </div>
        </div>

        <div className="relative flex items-center justify-center rounded-[2.5rem] overflow-hidden min-h-[500px] border border-slate-200 dark:border-slate-800 shadow-inner">
          {/* Preview Background Decor */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-300 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-cyan-300 rounded-full blur-3xl opacity-60"></div>

          {/* The Glass Element */}
          <div
            style={glassStyle}
            className="w-64 h-64 md:w-80 md:h-80 relative z-10 flex flex-col items-center justify-center text-center p-8 transition-all duration-300"
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/30">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white text-xl font-black mb-2 drop-shadow-sm">Aperçu</h4>
            <p className="text-white/80 text-sm font-medium drop-shadow-sm leading-relaxed">
              Ce conteneur utilise l'effet de glassmorphisme généré à gauche.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
