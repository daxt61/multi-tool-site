import { useState, useMemo } from 'react';
import { Palette, Type, Check, X, Info, Copy, RefreshCw } from 'lucide-react';

export function ColorContrastChecker() {
  const [foreground, setForeground] = useState('#FFFFFF');
  const [background, setBackground] = useState('#4F46E5');
  const [copied, setCopied] = useState<string | null>(null);

  const getLuminance = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const { r, g, b } = rgb;
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const contrastRatio = useMemo(() => {
    const lum1 = getLuminance(foreground);
    const lum2 = getLuminance(background);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  }, [foreground, background]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const swapColors = () => {
    const temp = foreground;
    setForeground(background);
    setBackground(temp);
  };

  const getStatus = (ratio: number, threshold: number) => ratio >= threshold;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-6">
              {/* Foreground */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="foreground" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Type className="w-4 h-4" /> Texte (Premier plan)
                  </label>
                  <button
                    onClick={() => copyToClipboard(foreground, 'fg')}
                    className={`p-1.5 rounded-lg transition-all ${copied === 'fg' ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'}`}
                  >
                    {copied === 'fg' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex gap-3">
                  <input
                    id="foreground"
                    type="color"
                    value={foreground}
                    onChange={(e) => setForeground(e.target.value.toUpperCase())}
                    className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white dark:border-slate-800 shadow-sm"
                  />
                  <input
                    type="text"
                    value={foreground}
                    onChange={(e) => setForeground(e.target.value.toUpperCase())}
                    className="flex-1 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center -my-4">
                <button
                  onClick={swapColors}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm hover:scale-110 active:scale-95 transition-all text-slate-400 hover:text-indigo-600"
                  title="Inverser les couleurs"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {/* Background */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="background" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Fond (Arrière-plan)
                  </label>
                  <button
                    onClick={() => copyToClipboard(background, 'bg')}
                    className={`p-1.5 rounded-lg transition-all ${copied === 'bg' ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'}`}
                  >
                    {copied === 'bg' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex gap-3">
                  <input
                    id="background"
                    type="color"
                    value={background}
                    onChange={(e) => setBackground(e.target.value.toUpperCase())}
                    className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white dark:border-slate-800 shadow-sm"
                  />
                  <input
                    type="text"
                    value={background}
                    onChange={(e) => setBackground(e.target.value.toUpperCase())}
                    className="flex-1 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-7 space-y-8">
          {/* Ratio Card */}
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Ratio de Contraste</div>
            <div className="text-6xl md:text-8xl font-black text-white font-mono tracking-tighter">
              {contrastRatio.toFixed(2)}:1
            </div>
          </div>

          {/* Compliance Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Standard WCAG AA</div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold dark:text-slate-300">Texte Normal (4.5:1)</span>
                  {getStatus(contrastRatio, 4.5) ? (
                    <div className="flex items-center gap-1.5 text-emerald-500 font-black text-xs uppercase"><Check className="w-4 h-4" /> Succès</div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-500 font-black text-xs uppercase"><X className="w-4 h-4" /> Échec</div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold dark:text-slate-300">Grand Texte (3.0:1)</span>
                  {getStatus(contrastRatio, 3.0) ? (
                    <div className="flex items-center gap-1.5 text-emerald-500 font-black text-xs uppercase"><Check className="w-4 h-4" /> Succès</div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-500 font-black text-xs uppercase"><X className="w-4 h-4" /> Échec</div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Standard WCAG AAA</div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold dark:text-slate-300">Texte Normal (7.0:1)</span>
                  {getStatus(contrastRatio, 7.0) ? (
                    <div className="flex items-center gap-1.5 text-emerald-500 font-black text-xs uppercase"><Check className="w-4 h-4" /> Succès</div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-500 font-black text-xs uppercase"><X className="w-4 h-4" /> Échec</div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold dark:text-slate-300">Grand Texte (4.5:1)</span>
                  {getStatus(contrastRatio, 4.5) ? (
                    <div className="flex items-center gap-1.5 text-emerald-500 font-black text-xs uppercase"><Check className="w-4 h-4" /> Succès</div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-rose-500 font-black text-xs uppercase"><X className="w-4 h-4" /> Échec</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div
            className="p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-6 transition-all shadow-sm"
            style={{ backgroundColor: background, color: foreground }}
          >
            <h4 className="text-3xl font-black">Aperçu du texte</h4>
            <p className="text-center max-w-md font-medium leading-relaxed">
              C'est ainsi que votre texte apparaîtra sur ce fond. Vérifiez la lisibilité sur différents écrans.
            </p>
            <div className="text-sm font-bold uppercase tracking-widest opacity-60">Texte normal (16px)</div>
            <div className="text-2xl font-black tracking-tight">Grand Texte (24px+)</div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Qu'est-ce que le ratio de contraste ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Il s'agit d'une mesure de la différence de luminance perçue entre deux couleurs. Un ratio élevé garantit que le texte est lisible pour tous les utilisateurs, y compris ceux ayant des déficiences visuelles.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Check className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Niveaux AA & AAA</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le niveau AA est le standard minimum recommandé. Le niveau AAA est le standard de lisibilité le plus élevé, idéal pour le contenu purement textuel.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Palette className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Conseils Design</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Si votre ratio est trop faible, essayez d'assombrir la couleur du texte ou d'éclaircir celle du fond (ou vice versa) pour améliorer l'accessibilité.
          </p>
        </div>
      </div>
    </div>
  );
}
