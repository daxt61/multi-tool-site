import { useState, useEffect } from 'react';
import { Maximize2, Monitor, Smartphone, Laptop, Tablet, Tv, Info } from 'lucide-react';

export function AspectRatioCalculator() {
  const [width, setWidth] = useState<string>('1920');
  const [height, setHeight] = useState<string>('1080');
  const [ratioW, setRatioW] = useState<string>('16');
  const [ratioH, setRatioH] = useState<string>('9');

  const commonRatios = [
    { name: '16:9', w: 16, h: 9, icon: <Monitor className="w-4 h-4" />, desc: 'Vidéo HD, Écrans' },
    { name: '4:3', w: 4, h: 3, icon: <Tv className="w-4 h-4" />, desc: 'TV Classique, Photo' },
    { name: '1:1', w: 1, h: 1, icon: <Maximize2 className="w-4 h-4" />, desc: 'Carré (Instagram)' },
    { name: '9:16', w: 9, h: 16, icon: <Smartphone className="w-4 h-4" />, desc: 'Story, TikTok' },
    { name: '3:2', w: 3, h: 2, icon: <Laptop className="w-4 h-4" />, desc: 'Photo DSLR' },
    { name: '21:9', w: 21, h: 9, icon: <Monitor className="w-4 h-4" />, desc: 'Ultrawide, Cinéma' },
    { name: '4:5', w: 4, h: 5, icon: <Smartphone className="w-4 h-4" />, desc: 'Portrait Instagram' },
    { name: '2:3', w: 2, h: 3, icon: <Tablet className="w-4 h-4" />, desc: 'Liseuses, Photo' },
  ];

  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b);
  };

  const calculateFromDims = (w: number, h: number) => {
    if (w > 0 && h > 0) {
      const common = gcd(w, h);
      setRatioW((w / common).toString());
      setRatioH((h / common).toString());
    }
  };

  const calculateFromRatio = (rw: number, rh: number, val: number, isWidth: boolean) => {
    if (rw > 0 && rh > 0 && val > 0) {
      if (isWidth) {
        setHeight(Math.round((val * rh) / rw).toString());
      } else {
        setWidth(Math.round((val * rw) / rh).toString());
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Controls */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            {/* Dimensions Section */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <Maximize2 className="w-4 h-4" /> Dimensions (Pixels)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="width" className="text-xs font-bold text-slate-500 px-1">Largeur</label>
                  <input
                    id="width"
                    type="number"
                    value={width}
                    onChange={(e) => {
                      const val = e.target.value;
                      setWidth(val);
                      calculateFromDims(Number(val), Number(height));
                    }}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="height" className="text-xs font-bold text-slate-500 px-1">Hauteur</label>
                  <input
                    id="height"
                    type="number"
                    value={height}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHeight(val);
                      calculateFromDims(Number(width), Number(val));
                    }}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Ratio Section */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <Monitor className="w-4 h-4" /> Ratio
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <label htmlFor="ratioW" className="text-xs font-bold text-slate-500 px-1">Ratio Largeur</label>
                  <input
                    id="ratioW"
                    type="number"
                    value={ratioW}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRatioW(val);
                      calculateFromRatio(Number(val), Number(ratioH), Number(width), true);
                    }}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white text-indigo-600 dark:text-indigo-400"
                  />
                </div>
                <div className="text-3xl font-black text-slate-300 dark:text-slate-700 pt-8" aria-hidden="true">:</div>
                <div className="flex-1 space-y-2">
                  <label htmlFor="ratioH" className="text-xs font-bold text-slate-500 px-1">Ratio Hauteur</label>
                  <input
                    id="ratioH"
                    type="number"
                    value={ratioH}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRatioH(val);
                      calculateFromRatio(Number(ratioW), Number(val), Number(width), true);
                    }}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white text-indigo-600 dark:text-indigo-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-600/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-1">Format Résultant</p>
                <h4 className="text-3xl font-black font-mono">{width} × {height}</h4>
              </div>
              <div className="h-12 w-px bg-white/20 hidden md:block" />
              <div className="text-center md:text-right">
                <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-1">Ratio Simplifié</p>
                <h4 className="text-3xl font-black font-mono">{ratioW}:{ratioH}</h4>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Preview & Presets */}
        <div className="lg:col-span-5 space-y-8">
          {/* Visual Preview */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Aperçu Visuel</h3>
            <div className="aspect-square bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center p-8 border border-slate-100 dark:border-slate-800 overflow-hidden">
               <div
                 className="bg-indigo-500/20 border-2 border-indigo-500 rounded-lg shadow-2xl shadow-indigo-500/10 transition-all duration-500 flex items-center justify-center text-indigo-500 font-black text-xs"
                 style={{
                   aspectRatio: `${ratioW}/${ratioH}`,
                   maxWidth: '100%',
                   maxHeight: '100%',
                   width: Number(ratioW) >= Number(ratioH) ? '100%' : 'auto',
                   height: Number(ratioH) > Number(ratioW) ? '100%' : 'auto',
                 }}
               >
                 {ratioW}:{ratioH}
               </div>
            </div>
          </div>

          {/* Presets */}
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 px-1">Ratios Standards</h3>
            <div className="grid grid-cols-2 gap-3">
              {commonRatios.map((r) => (
                <button
                  key={r.name}
                  onClick={() => {
                    setRatioW(r.w.toString());
                    setRatioH(r.h.toString());
                    calculateFromRatio(r.w, r.h, Number(width), true);
                  }}
                  className="flex flex-col items-start p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-white dark:bg-slate-700 rounded-lg text-slate-400 group-hover:text-indigo-500 transition-colors">
                      {r.icon}
                    </div>
                    <span className="font-black text-sm dark:text-white">{r.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-start gap-4">
         <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Info className="w-6 h-6" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">Pourquoi utiliser un calculateur de ratio ?</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Le ratio d'aspect représente le rapport entre la largeur et la hauteur d'une image ou d'un écran. Il est crucial pour éviter les déformations lors du redimensionnement (le fameux effet "écrasé" ou "étiré"). Utilisez cet outil pour calculer les dimensions exactes nécessaires pour vos montages vidéo, vos photos Instagram ou vos designs web.
            </p>
         </div>
      </div>
    </div>
  );
}
