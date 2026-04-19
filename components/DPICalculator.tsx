import { useState, useMemo } from 'react';
import { Monitor, Ruler, Hash, Info, Trash2, Copy, Check } from 'lucide-react';

export function DPICalculator() {
  const [width, setWidth] = useState<string>('1920');
  const [height, setHeight] = useState<string>('1080');
  const [diagonal, setDiagonal] = useState<string>('24');
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    const d = parseFloat(diagonal);

    if (isNaN(w) || isNaN(h) || isNaN(d) || d <= 0) {
      return { ppi: 0, pixelPitch: 0, totalPixels: 0, aspectRatio: '0:0' };
    }

    const diagonalPixels = Math.sqrt(w * w + h * h);
    const ppi = diagonalPixels / d;
    const pixelPitch = 25.4 / ppi; // in mm
    const totalPixels = w * h;

    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const common = gcd(w, h);
    const aspectRatio = `${w / common}:${h / common}`;

    return {
      ppi: ppi.toFixed(2),
      pixelPitch: pixelPitch.toFixed(4),
      totalPixels: totalPixels.toLocaleString('fr-FR'),
      aspectRatio
    };
  }, [width, height, diagonal]);

  const handleClear = () => {
    setWidth('');
    setHeight('');
    setDiagonal('');
  };

  const handleCopy = () => {
    const text = `Résolution: ${width}x${height}\nTaille: ${diagonal}"\nPPI: ${stats.ppi}\nPixel Pitch: ${stats.pixelPitch}mm\nRatio: ${stats.aspectRatio}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-indigo-500" /> Spécifications
              </h3>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="width" className="text-[10px] font-bold text-slate-400 uppercase px-1">Largeur (px)</label>
                  <input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="1920"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="height" className="text-[10px] font-bold text-slate-400 uppercase px-1">Hauteur (px)</label>
                  <input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="1080"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="diagonal" className="text-[10px] font-bold text-slate-400 uppercase px-1">Diagonale (pouces)</label>
                <div className="relative">
                  <input
                    id="diagonal"
                    type="number"
                    step="0.1"
                    value={diagonal}
                    onChange={(e) => setDiagonal(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="24"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">"</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Le DPI (Dots Per Inch) ou PPI (Pixels Per Inch) définit la densité de pixels d'un écran. Plus cette valeur est élevée, plus l'image sera nette à une distance de visionnage normale.
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <button
              onClick={handleCopy}
              className={`absolute top-6 right-6 p-3 rounded-2xl transition-all ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20'
              }`}
              title="Copier les spécifications"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Densité de pixels</div>
            <div className="text-6xl md:text-8xl font-black text-white font-mono tracking-tighter">
              {stats.ppi}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              PPI / DPI
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Ruler className="w-3 h-3" /> Pixel Pitch
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {stats.pixelPitch}mm
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Monitor className="w-3 h-3" /> Ratio
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {stats.aspectRatio}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <Hash className="w-3 h-3" /> Total Pixels
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono text-sm sm:text-lg">
                {stats.totalPixels}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
