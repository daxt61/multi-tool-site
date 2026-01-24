import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Music } from 'lucide-react';

export function BPMCounter() {
  const [bpm, setBpm] = useState<number | null>(null);
  const [taps, setTaps] = useState<number[]>([]);

  const handleTap = () => {
    const now = Date.now();
    const newTaps = [...taps, now].slice(-10); // Keep last 10 taps for average
    setTaps(newTaps);

    if (newTaps.length > 1) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      setBpm(Math.round(60000 / averageInterval));
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
  }, [taps]);

  return (
    <div className="max-w-md mx-auto text-center space-y-8 py-8">
      <div className="relative inline-block">
        <div className={`w-48 h-48 rounded-full flex items-center justify-center border-8 transition-all duration-100 ${
          taps.length > 0 ? 'border-indigo-500 scale-105 shadow-lg shadow-indigo-500/20' : 'border-gray-200 dark:border-gray-700'
        }`}>
          <div className="text-5xl font-bold text-gray-900 dark:text-white font-mono">
            {bpm || '--'}
          </div>
        </div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-700 text-white px-4 py-1 rounded-full text-sm font-bold">
          BPM
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleTap}
          className="w-full py-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl shadow-xl hover:shadow-2xl transition-all active:scale-95 text-2xl font-bold flex items-center justify-center gap-3"
        >
          <Music className="w-8 h-8" />
          TAPPER ICI
        </button>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Ou appuyez sur <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">Espace</kbd> ou <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">Entrée</kbd>
        </p>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl transition-colors font-semibold"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Battements</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{taps.length}</div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">Précision</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{taps.length > 5 ? 'Stable' : '...'}</div>
        </div>
      </div>
    </div>
  );
}
