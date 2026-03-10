import { useState, useMemo } from 'react';
import { Copy, Check, Settings2, Sliders, Layers, Info, RotateCcw } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(16);
  const [transparency, setTransparency] = useState(0.25);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.2);
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    // Remove # if present
    const cleanHex = hex.replace('#', '');

    // Default to white if invalid
    if (!/^[0-9A-Fa-f]{3,6}$/.test(cleanHex)) return '255, 255, 255';

    let r, g, b;
    if (cleanHex.length === 3) {
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else {
      r = parseInt(cleanHex.slice(0, 2), 16);
      g = parseInt(cleanHex.slice(2, 4), 16);
      b = parseInt(cleanHex.slice(4, 6), 16);
    }

    return `${isNaN(r) ? 255 : r}, ${isNaN(g) ? 255 : g}, ${isNaN(b) ? 255 : b}`;
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

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setBlur(16);
    setTransparency(0.25);
    setColor('#ffffff');
    setOutline(0.2);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contrôles */}
        <div className="space-y-8">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-3 text-indigo-500">
                <Settings2 className="w-5 h-5" />
                <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Configuration</h3>
              </div>
              <button
                onClick={reset}
                className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Réinitialiser
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <label htmlFor="blur-range">Flou (Blur)</label>
                  <span className="text-indigo-500 font-mono">{blur}px</span>
                </div>
                <input
                  id="blur-range"
                  type="range"
                  min="0"
                  max="40"
                  value={blur}
                  onChange={(e) => setBlur(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <label htmlFor="transparency-range">Transparence</label>
                  <span className="text-indigo-500 font-mono">{transparency}</span>
                </div>
                <input
                  id="transparency-range"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={transparency}
                  onChange={(e) => setTransparency(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                  <label htmlFor="outline-range">Contour (Outline)</label>
                  <span className="text-indigo-500 font-mono">{outline}</span>
                </div>
                <input
                  id="outline-range"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={outline}
                  onChange={(e) => setOutline(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <label htmlFor="color-input" className="block text-xs font-black uppercase tracking-widest text-slate-400">Couleur de fond</label>
                <div className="flex items-center gap-4">
                  <input
                    id="color-input"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={color.toUpperCase()}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-mono text-sm uppercase outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Code CSS</h3>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <pre className="p-6 bg-slate-900 text-indigo-300 rounded-2xl text-sm font-mono overflow-x-auto">
              {cssCode}
            </pre>
          </div>
        </div>

        {/* Prévisualisation */}
        <div className="relative min-h-[500px] flex items-center justify-center rounded-[2.5rem] overflow-hidden group">
          {/* Background shapes */}
          <div className="absolute inset-0 bg-slate-100 dark:bg-slate-950">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-indigo-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-emerald-500 rounded-full blur-3xl opacity-30 animate-bounce transition-all duration-1000"></div>
            <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-rose-500 rounded-full blur-2xl opacity-20 animate-pulse delay-75"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
          </div>

          <div
            style={glassStyle}
            className="w-80 h-80 flex flex-col items-center justify-center p-8 text-center space-y-4 z-10 transition-all duration-300 group-hover:scale-105 shadow-2xl"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-1">
              <h4 className="text-2xl font-black text-white">Glassmorphism</h4>
              <p className="text-white/70 text-sm font-medium">Prévisualisation en temps réel de votre effet de verre dépoli.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" /> C'est quoi ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le Glassmorphism est une tendance de design UI basée sur un effet de verre dépoli. Il combine transparence, flou d'arrière-plan et bordures fines.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" /> Accessibilité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Attention : assurez-vous de conserver un contraste suffisant pour le texte placé au-dessus des éléments vitrés pour garantir une bonne lisibilité.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Compatibilité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'effet `backdrop-filter` est largement supporté mais peut nécessiter le préfixe `-webkit-` pour Safari, que nous incluons automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
}
