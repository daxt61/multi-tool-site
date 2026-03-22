import { useState, useMemo } from 'react';
import { Layers, Copy, Check, RotateCcw, Info, Settings2 } from 'lucide-react';

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
      borderRadius: '24px',
    };
  }, [blur, transparency, color, outline]);

  const cssCode = useMemo(() => {
    const rgb = hexToRgb(color);
    return `background: rgba(${rgb}, ${transparency});\nbackdrop-filter: blur(${blur}px);\n-webkit-backdrop-filter: blur(${blur}px);\nborder: 1px solid rgba(${rgb}, ${outline});\nborder-radius: 24px;`;
  }, [blur, transparency, color, outline]);

  const handleCopy = () => {
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Flou (Blur)</span>
                  <span className="text-indigo-600">{blur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={blur}
                  onChange={(e) => setBlur(parseInt(e.target.value))}
                  className="w-full h-2 bg-white dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Transparence</span>
                  <span className="text-indigo-600">{Math.round(transparency * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={transparency}
                  onChange={(e) => setTransparency(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Bordure (Outline)</span>
                  <span className="text-indigo-600">{Math.round(outline * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={outline}
                  onChange={(e) => setOutline(parseFloat(e.target.value))}
                  className="w-full h-2 bg-white dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 px-1">Couleur</label>
                <div className="flex gap-4">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-16 h-12 rounded-xl border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={color.toUpperCase()}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-grow p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <button
                onClick={reset}
                className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3 h-3" /> Réinitialiser
              </button>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">CSS Code</label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="p-6 bg-slate-950 rounded-2xl font-mono text-sm text-indigo-300 overflow-x-auto leading-relaxed border border-slate-800">
              {cssCode}
            </pre>
          </div>
        </div>

        {/* Preview */}
        <div className="relative rounded-[2.5rem] overflow-hidden min-h-[400px] lg:min-h-auto bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-8 lg:p-12">
          {/* Background shapes for depth */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-300 rounded-full blur-2xl opacity-60"></div>
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-blue-300 rounded-full blur-3xl opacity-60"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>

          <div
            style={glassStyle}
            className="w-full max-w-sm aspect-video flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-2xl relative z-10"
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm">
              <Layers className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-black text-white tracking-tight">Preview Glass</h4>
            <p className="text-white/80 text-sm leading-relaxed">
              Expérimentez avec les réglages pour créer l'effet de verre parfait pour votre interface.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">Le Glassmorphism, c'est quoi ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            C'est un style de design UI basé sur un effet de "verre dépoli". Il repose sur la transparence, le flou d'arrière-plan (`backdrop-filter`) et des bordures légères pour donner un sentiment de profondeur et de hiérarchie visuelle.
          </p>
        </div>
      </div>
    </div>
  );
}
