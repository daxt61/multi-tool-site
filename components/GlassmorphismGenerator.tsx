import { useState } from 'react';
import { Copy, Check, Info, Palette, Layers, Settings } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [opacity, setOpacity] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [saturation, setSaturation] = useState(100);
  const [borderOpacity, setBorderOpacity] = useState(0.1);
  const [copied, setCopied] = useState(false);

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const cssCode = `background: ${hexToRgba(color, opacity)};
backdrop-filter: blur(${blur}px) saturate(${saturation}%);
-webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);
border: 1px solid ${hexToRgba(color, borderOpacity)};
border-radius: 24px;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span className="flex items-center gap-2"><Layers className="w-3 h-3" /> Flou (Blur)</span>
                <span className="text-indigo-500">{blur}px</span>
              </div>
              <input
                type="range" min="0" max="40" value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span className="flex items-center gap-2"><Settings className="w-3 h-3" /> Opacité</span>
                <span className="text-indigo-500">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01" value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span className="flex items-center gap-2"><Palette className="w-3 h-3" /> Couleur</span>
                <span className="text-indigo-500 font-mono uppercase">{color}</span>
              </div>
              <div className="flex gap-4">
                <input
                  type="color" value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-white border border-slate-200 dark:border-slate-700 p-1"
                />
                <input
                  type="text" value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span>Saturation</span>
                <span className="text-indigo-500">{saturation}%</span>
              </div>
              <input
                type="range" min="0" max="200" value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span>Opacité Bordure</span>
                <span className="text-indigo-500">{Math.round(borderOpacity * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.01" value={borderOpacity}
                onChange={(e) => setBorderOpacity(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Preview & Code */}
        <div className="space-y-8 flex flex-col">
          <div className="flex-1 min-h-[300px] relative rounded-[2.5rem] overflow-hidden bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-12">
            <div
              style={{
                background: hexToRgba(color, opacity),
                backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
                WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
                border: `1px solid ${hexToRgba(color, borderOpacity)}`,
                borderRadius: '24px',
              }}
              className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-4 animate-gradient-slow shadow-2xl shadow-black/20"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black text-white drop-shadow-md">Glassmorphism</h3>
              <p className="text-white/80 text-sm font-medium drop-shadow-sm">Aperçu en temps réel de votre effet de verre</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">CSS Code</label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié !' : 'Copier CSS'}
              </button>
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
            <Info className="w-4 h-4 text-indigo-500" /> Qu'est-ce que c'est ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le Glassmorphism est un style de design UI basé sur l'effet de verre dépoli, créé par une combinaison de transparence, de flou d'arrière-plan et de bordures fines.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" /> Propriétés Clés
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'effet repose principalement sur <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">backdrop-filter</code>. Notez que pour le support Safari, il est nécessaire d'inclure le préfixe <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">-webkit-</code>.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-500" /> Conseils Design
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Pour un effet réussi, utilisez des couleurs vives en arrière-plan et une opacité faible (entre 0.1 et 0.3). Une bordure fine semi-transparente aide à définir la forme.
          </p>
        </div>
      </div>
    </div>
  );
}
