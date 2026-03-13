import { useState, useEffect, useCallback } from 'react';
import { Music, RotateCcw, Info } from 'lucide-react';

export function BPMCounter() {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);
  const [isAnimate, setIsAnimate] = useState(false);

  const handleTap = useCallback(() => {
    const now = Date.now();
    setIsAnimate(true);
    setTimeout(() => setIsAnimate(false), 100);

    setTaps(prev => {
      const newTaps = [...prev, now].slice(-10); // Keep last 10 taps
      if (newTaps.length < 2) return newTaps;

      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }

      const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const calculatedBpm = Math.round(60000 / averageInterval);
      setBpm(calculatedBpm);

      return newTaps;
    });
  }, []);

  const reset = () => {
    setTaps([]);
    setBpm(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap]);

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="flex flex-col items-center justify-center space-y-8">
        <button
          onClick={handleTap}
          aria-label="Taper pour calculer le BPM"
          className={`relative w-64 h-64 rounded-full border-4 transition-all duration-100 flex flex-col items-center justify-center group outline-none focus:ring-4 focus:ring-indigo-500/20 ${
            isAnimate
              ? 'bg-indigo-600 border-indigo-400 scale-95 text-white shadow-2xl shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-slate-800 text-slate-900 dark:text-white hover:border-indigo-200'
          }`}
        >
          <Music className={`w-12 h-12 mb-4 transition-colors ${isAnimate ? 'text-white' : 'text-indigo-600'}`} />
          <div className="text-7xl font-black font-mono tracking-tighter">
            {bpm || '--'}
          </div>
          <div className="text-sm font-bold uppercase tracking-widest mt-2 opacity-60">
            BPM
          </div>

          {/* Animated rings */}
          {isAnimate && (
            <div className="absolute inset-0 rounded-full animate-ping border-4 border-indigo-500/30" />
          )}
        </button>

        <div className="flex flex-col items-center gap-6 w-full">
          <p className="text-slate-500 dark:text-slate-400 font-medium text-center max-w-md">
            Tapez sur le bouton, sur la barre d'espace ou sur Entrée au rythme de la musique.
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold text-slate-700 dark:text-slate-200 transition-all active:scale-95"
            >
              <RotateCcw className="w-5 h-5" />
              Réinitialiser
            </button>

            {taps.length > 0 && (
              <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold uppercase tracking-wider animate-in fade-in zoom-in duration-300">
                {taps.length} tap{taps.length > 1 ? 's' : ''} enregistré{taps.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Précision
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Pour une meilleure précision, nous calculons la moyenne sur les 10 derniers battements. Plus vous tapez longtemps, plus le résultat se stabilise.
          </p>
        </div>
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-500" /> Utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilisez cet outil pour trouver le tempo d'une chanson, caler un métronome ou préparer un mix DJ.
          </p>
        </div>
      </div>
    </div>
  );
}
