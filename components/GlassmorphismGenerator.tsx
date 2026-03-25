import React, { useState, useMemo } from 'react';
import { Layers, Copy, Check, RefreshCw, Sliders, Palette, Info, Code } from 'lucide-react';

export function GlassmorphismGenerator() {
  const [blur, setBlur] = useState(10);
  const [transparency, setTransparency] = useState(0.25);
  const [color, setColor] = useState('#ffffff');
  const [outline, setOutline] = useState(0.1);
  const [copied, setCopied] = useState(false);

  const rgbaColor = useMemo(() => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${transparency})`;
  }, [color, transparency]);

  const outlineColor = useMemo(() => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${outline})`;
  }, [color, outline]);

  const cssCode = useMemo(() => {
    return `background: ${rgbaColor};\nbackdrop-filter: blur(${blur}px);\n-webkit-backdrop-filter: blur(${blur}px);\nborder: 1px solid ${outlineColor};\nborder-radius: 20px;`;
  }, [rgbaColor, blur, outlineColor]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setBlur(10);
    setTransparency(0.25);
    setColor('#ffffff');
    setOutline(0.1);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8 p-8 md:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold flex items-center gap-2 dark:text-white uppercase tracking-wider text-sm">
              <Sliders className="w-5 h-5 text-indigo-500" /> Configuration
            </h3>
            <button
              onClick={reset}
              className="text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Réinitialiser
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <span>Flou (Blur)</span>
                <span className="text-indigo-500">{blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={blur}
                onChange={(e) => setBlur(parseInt(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <span>Transparence</span>
                <span className="text-indigo-500">{Math.round(transparency * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={transparency}
                onChange={(e) => setTransparency(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <span>Opacité Bordure</span>
                <span className="text-indigo-500">{Math.round(outline * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={outline}
                onChange={(e) => setOutline(parseFloat(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-4">
              <div className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Couleur de fond</div>
              <div className="flex gap-4">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-20 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer overflow-hidden p-1"
                />
                <input
                  type="text"
                  value={color.toUpperCase()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith('#') && val.length <= 7) setColor(val);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col gap-6">
          <div className="relative flex-1 min-h-[400px] rounded-[2.5rem] overflow-hidden flex items-center justify-center p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            {/* Background shapes for better glass effect visibility */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full blur-xl opacity-60 animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 bg-blue-400 rounded-full blur-xl opacity-60 animate-bounce"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-emerald-400 rotate-45 rounded-full blur-xl opacity-40"></div>

            <div
              className="relative z-10 w-full max-w-sm p-12 text-center"
              style={{
                background: rgbaColor,
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                border: `1px solid ${outlineColor}`,
                borderRadius: '20px',
              }}
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-2 drop-shadow-md">Glassmorphism</h2>
              <p className="text-white/80 font-medium drop-shadow-sm">Aperçu en temps réel</p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Code className="w-4 h-4" /> Code CSS
              </h4>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié' : 'Copier CSS'}
              </button>
            </div>
            <pre className="text-indigo-300 font-mono text-sm leading-relaxed overflow-x-auto p-4 bg-slate-950/50 rounded-xl">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
            <Palette className="w-5 h-5" />
          </div>
          <h4 className="font-black dark:text-white">Esthétique moderne</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le glassmorphism utilise des effets de flou et de transparence pour créer des interfaces élégantes inspirées de macOS Big Sur et Windows 11.
          </p>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500">
            <Info className="w-5 h-5" />
          </div>
          <h4 className="font-black dark:text-white">Conseils d'usage</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Gardez un contraste élevé pour le texte. L'accessibilité est clé lors de l'utilisation de fonds transparents ou flous.
          </p>
        </div>

        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
            <Code className="w-5 h-5" />
          </div>
          <h4 className="font-black dark:text-white">Compatibilité</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            `backdrop-filter` est bien supporté par les navigateurs modernes. Un fallback vers une couleur semi-opaque est recommandé pour les anciens navigateurs.
          </p>
        </div>
      </div>
    </div>
  );
}
