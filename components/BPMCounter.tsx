import { useState, useEffect, useCallback } from 'react';
import { Music, RotateCcw, Activity, Info, TrendingUp } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Tap Area */}
        <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
          {/* Visual Tap Rings */}
          {isAnimate && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-4 border-indigo-500/30 rounded-full animate-ping"></div>
              <div className="absolute w-80 h-80 border border-indigo-500/10 rounded-full animate-ping" style={{ animationDelay: '50ms' }}></div>
            </div>
          )}

          <button
            onClick={handleTap}
            className={`relative z-10 w-64 h-64 rounded-full border-4 transition-all duration-100 flex flex-col items-center justify-center shadow-2xl active:scale-90 ${
              isAnimate
                ? 'bg-indigo-600 border-indigo-400 scale-95 text-white shadow-indigo-500/40'
                : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-700 text-slate-800 dark:text-white hover:border-indigo-200 shadow-indigo-500/5'
            }`}
          >
            <Music className={`w-12 h-12 mb-4 transition-colors ${isAnimate ? 'text-white' : 'text-indigo-600'}`} />
            <div className="text-8xl font-black font-mono tracking-tighter">
              {bpm || '--'}
            </div>
            <div className="text-xs font-black uppercase tracking-[0.2em] mt-2 opacity-60">
              BPM
            </div>
          </button>

          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-slate-500 dark:text-slate-400 font-bold text-center">
              Tapez sur le bouton, sur la barre d'espace ou sur Entrée au rythme de la musique.
            </p>
            <button
              onClick={reset}
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-black text-slate-600 dark:text-slate-300 transition-all active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <RotateCcw className="w-5 h-5" />
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Stats and Info Sidebar */}
        <div className="space-y-6 flex flex-col">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-2 shadow-sm">
              <div className="text-indigo-500"><Activity className="w-5 h-5" /></div>
              <div className="text-4xl font-black font-mono tracking-tighter dark:text-white">{taps.length}</div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Taps enregistrés</div>
            </div>
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-2 shadow-sm">
              <div className="text-emerald-500"><TrendingUp className="w-5 h-5" /></div>
              <div className="text-4xl font-black font-mono tracking-tighter dark:text-white">{bpm ? Math.round(bpm / 60) : '--'}</div>
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Battements / Sec</div>
            </div>
          </div>

          <div className="flex-1 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6 shadow-sm">
            <h3 className="font-black dark:text-white flex items-center gap-2 uppercase tracking-widest text-sm">
              <Info className="w-5 h-5 text-indigo-500" /> Précision
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Pour obtenir un résultat précis, essayez de maintenir un rythme régulier pendant au moins 10 battements. Le calculateur utilise la moyenne des derniers intervalles pour lisser les variations mineures.
            </p>
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-4">Utilisation classique</h4>
              <ul className="space-y-3">
                {[
                  { range: '60 - 100 BPM', label: 'Rythme cardiaque normal' },
                  { range: '120 - 128 BPM', label: 'House / Dance Music' },
                  { range: '140 BPM', label: 'Dubstep / Trap' },
                  { range: '170 - 175 BPM', label: 'Drum & Bass' }
                ].map((item) => (
                  <li key={item.range} className="flex justify-between items-center text-sm font-bold">
                    <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-indigo-500 font-mono bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-lg">{item.range}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
