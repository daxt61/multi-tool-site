import { useState } from 'react';
import { Layers, Copy, Check, RefreshCw, Palette, Settings } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.2);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.1);
  const [rounded, setRounded] = useState(24);
  const [copied, setCopied] = useState(false);

  const glassStyle = {
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    backgroundColor: `${color}${Math.round(transparency * 255).toString(16).padStart(2, '0')}`,
    border: `1px solid rgba(255, 255, 255, ${outline})`,
    borderRadius: `${rounded}px`,
  };

  const cssCode = `/* Glassmorphism CSS */
background: ${color}${Math.round(transparency * 255).toString(16).padStart(2, '0')};
backdrop-filter: blur(${blur}px);
-webkit-backdrop-filter: blur(${blur}px);
border-radius: ${rounded}px;
border: 1px solid rgba(255, 255, 255, ${outline});`;

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
    setRounded(24);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Preview Area */}
        <div className="relative group p-12 lg:p-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-[3rem] overflow-hidden min-h-[400px] flex items-center justify-center shadow-2xl">
          {/* Animated Background Elements */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-300 rounded-full blur-xl opacity-60 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-cyan-300 rounded-full blur-2xl opacity-50 animate-bounce transition-all duration-3000"></div>
          <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-white rounded-full blur-3xl opacity-30"></div>

          <div
            style={glassStyle}
            className="w-full max-w-sm aspect-video flex flex-col items-center justify-center p-8 text-center transition-all duration-300 relative z-10"
          >
            <Layers className="w-12 h-12 mb-4 opacity-80" />
            <h3 className="text-2xl font-bold opacity-90">Prévisualisation</h3>
            <p className="text-sm opacity-60 mt-2">Générateur de Glassmorphism</p>
          </div>
        </div>

        {/* Controls Area */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Paramètres
            </h3>
            <button
              onClick={reset}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Réinitialiser
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold">
                <label htmlFor="blur-control">Flou (Blur)</label>
                <span className="text-indigo-500">{blur}px</span>
              </div>
              <input
                id="blur-control"
                type="range"
                min="0"
                max="25"
                step="1"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold">
                <label htmlFor="transparency-control">Transparence</label>
                <span className="text-indigo-500">{Math.round(transparency * 100)}%</span>
              </div>
              <input
                id="transparency-control"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={transparency}
                onChange={(e) => setTransparency(parseFloat(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-sm font-bold flex items-center gap-2" htmlFor="color-control">
                  <Palette className="w-4 h-4" /> Couleur
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="color-control"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border-0 cursor-pointer overflow-hidden p-0"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-grow p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold">
                  <label htmlFor="outline-control">Bordure</label>
                  <span className="text-indigo-500">{Math.round(outline * 100)}%</span>
                </div>
                <input
                  id="outline-control"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={outline}
                  onChange={(e) => setOutline(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold">
                <label htmlFor="rounded-control">Arrondi (Radius)</label>
                <span className="text-indigo-500">{rounded}px</span>
              </div>
              <input
                id="rounded-control"
                type="range"
                min="0"
                max="60"
                step="2"
                value={rounded}
                onChange={(e) => setRounded(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="css-output" className="text-xs font-black uppercase tracking-widest text-slate-400">Code CSS</label>
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié !' : 'Copier le CSS'}
              </button>
            </div>
            <pre id="css-output" className="p-6 bg-slate-900 text-indigo-300 rounded-2xl text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
