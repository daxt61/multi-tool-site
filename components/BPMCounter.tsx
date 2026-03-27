import { useState, useEffect, useCallback, useRef } from 'react';
import { Music, RotateCcw, Copy, Check } from 'lucide-react';

export function BPMCounter() {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);
  const [isAnimate, setIsAnimate] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = () => {
    if (bpm) {
      navigator.clipboard.writeText(bpm.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
    <div className="max-w-md mx-auto text-center">
      <button
        className={`mb-8 p-12 rounded-full border-4 transition-all duration-100 flex flex-col items-center justify-center aspect-square mx-auto w-full max-w-[300px] cursor-pointer select-none focus:outline-none focus:ring-4 focus:ring-indigo-500/20 ${
          isAnimate
            ? 'bg-indigo-600 border-indigo-400 scale-95 text-white'
            : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-700 text-slate-800 dark:text-white hover:border-indigo-200'
        }`}
        onClick={handleTap}
        aria-label="Taper pour calculer le BPM"
      >
        <Music className={`w-12 h-12 mb-4 ${isAnimate ? 'text-white' : 'text-indigo-600'}`} />
        <div className="text-6xl font-black font-mono">
          {bpm || '--'}
        </div>
        <div className="text-sm font-bold uppercase tracking-widest mt-2 opacity-60">
          BPM
        </div>
      </button>

      <div className="space-y-6">
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Tapez sur le bouton, sur la barre d'espace ou sur Entrée au rythme de la musique.
        </p>

        <div className="flex justify-center gap-4">
          {bpm !== null && (
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl font-bold text-slate-700 dark:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Réinitialiser
          </button>
        </div>

        {taps.length > 0 && (
          <div className="text-sm text-slate-400">
            {taps.length} tap{taps.length > 1 ? 's' : ''} enregistré{taps.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
