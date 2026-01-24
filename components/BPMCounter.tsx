import { useState, useEffect, useCallback, useRef } from 'react';
import { Music, RotateCcw } from 'lucide-react';

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
    <div className="max-w-md mx-auto text-center">
      <div
        className={`mb-8 p-12 rounded-full border-4 transition-all duration-100 flex flex-col items-center justify-center aspect-square mx-auto max-w-[300px] cursor-pointer select-none ${
          isAnimate
            ? 'bg-indigo-600 border-indigo-400 scale-95 text-white'
            : 'bg-white dark:bg-gray-800 border-indigo-100 dark:border-gray-700 text-gray-800 dark:text-white hover:border-indigo-200'
        }`}
        onClick={handleTap}
      >
        <Music className={`w-12 h-12 mb-4 ${isAnimate ? 'text-white' : 'text-indigo-600'}`} />
        <div className="text-6xl font-black font-mono">
          {bpm || '--'}
        </div>
        <div className="text-sm font-bold uppercase tracking-widest mt-2 opacity-60">
          BPM
        </div>
      </div>

      <div className="space-y-6">
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Tapez sur le bouton, sur la barre d'espace ou sur Entrée au rythme de la musique.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl font-bold text-gray-700 dark:text-gray-200 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Réinitialiser
          </button>
        </div>

        {taps.length > 0 && (
          <div className="text-sm text-gray-400">
            {taps.length} tap{taps.length > 1 ? 's' : ''} enregistré{taps.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
