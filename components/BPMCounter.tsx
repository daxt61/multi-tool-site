import { useState, useCallback, useEffect } from 'react';
import { Activity, RotateCcw } from 'lucide-react';

export function BPMCounter() {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);

  const handleTap = useCallback(() => {
    const now = Date.now();
    setTaps(prev => {
      const newTaps = [...prev, now].slice(-10); // Keep last 10 taps
      if (newTaps.length > 1) {
        const intervals = [];
        for (let i = 1; i < newTaps.length; i++) {
          intervals.push(newTaps[i] - newTaps[i - 1]);
        }
        const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        setBpm(Math.round(60000 / averageInterval));
      }
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
      <div className="mb-12">
        <div className="text-7xl font-bold text-indigo-600 mb-2">
          {bpm || '--'}
        </div>
        <div className="text-gray-500 font-semibold uppercase tracking-wider">
          Beats Per Minute
        </div>
      </div>

      <button
        onClick={handleTap}
        className="w-48 h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex flex-col items-center justify-center text-white gap-2 mx-auto mb-8 select-none flex-shrink-0"
      >
        <Activity className="w-12 h-12" />
        <span className="font-bold text-xl uppercase">Tap</span>
      </button>

      <div className="text-sm text-gray-600 mb-8">
        Appuyez sur le bouton ou la barre d'espace en rythme
      </div>

      <button
        onClick={reset}
        className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors mx-auto"
      >
        <RotateCcw className="w-4 h-4" />
        Réinitialiser
      </button>

      <div className="mt-12 p-4 bg-gray-50 rounded-lg border border-gray-200 text-left">
        <h3 className="font-semibold text-gray-800 mb-2">À quoi ça sert ?</h3>
        <p className="text-sm text-gray-600">
          Ce compteur de BPM vous permet de trouver le tempo d'une musique. Tapez simplement en rythme et la moyenne sera calculée sur les 10 dernières frappes.
        </p>
      </div>
    </div>
  );
}
