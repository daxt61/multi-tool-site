import { useState, useEffect, useCallback } from 'react';
import { Music, RotateCcw, Activity, History, Info, Sparkles } from 'lucide-react';

export function BPMCounter() {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);
  const [isAnimate, setIsAnimate] = useState(false);
  const [history, setHistory] = useState<number[]>([]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    setIsAnimate(true);
    setTimeout(() => setIsAnimate(false), 100);

    setTaps(prev => {
      // Sentinel: Maintain a list of recent taps for calculation (last 10)
      const newTaps = [...prev, now].slice(-10);
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
    if (bpm) {
      setHistory(prev => [bpm, ...prev].slice(0, 5));
    }
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
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="text-center space-y-8">
          <div className="relative inline-flex items-center justify-center">
            {/* Visual Ring Pulser */}
            <div
              className={`absolute inset-0 rounded-full border-4 border-indigo-500/20 transition-all duration-300 ${
                isAnimate ? 'scale-125 opacity-100' : 'scale-100 opacity-0'
              }`}
            />
            <div
              className={`w-64 h-64 rounded-full border-4 transition-all duration-100 flex flex-col items-center justify-center aspect-square mx-auto cursor-pointer select-none relative z-10 ${
                isAnimate
                  ? 'bg-indigo-600 border-indigo-400 scale-95 text-white shadow-2xl shadow-indigo-500/40'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-white hover:border-indigo-200 dark:hover:border-indigo-500/30'
              }`}
              onClick={handleTap}
            >
              <Music className={`w-10 h-10 mb-3 ${isAnimate ? 'text-white' : 'text-indigo-600'}`} />
              <div className="text-7xl font-black font-mono tracking-tighter">
                {bpm || '--'}
              </div>
              <div className="text-xs font-black uppercase tracking-widest mt-2 opacity-50">
                BPM
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Tapez sur le bouton, sur la barre d'espace ou sur Entrée au rythme de la musique.
            </p>

            <div className="flex justify-center gap-4">
              <button
                onClick={reset}
                className="flex items-center gap-2 px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-black text-slate-700 dark:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
              <History className="w-4 h-4" /> Historique récent
            </h3>
            <div className="space-y-3">
              {history.length > 0 ? (
                history.map((val, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${i * 100}ms` }}>
                    <span className="text-xs font-bold text-slate-400">SESSION {history.length - i}</span>
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{val} BPM</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-sm font-medium italic">
                  Aucun historique pour le moment
                </div>
              )}
            </div>
          </div>

          <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white space-y-4 shadow-xl shadow-indigo-500/10">
            <h4 className="font-black flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Précision optimale
            </h4>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
              Nous calculons la moyenne glissante des 10 derniers battements pour lisser les variations de frappe et vous donner un résultat stable et précis.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Pour un résultat précis, essayez de maintenir le rythme pendant au moins 5 à 10 secondes. Le compteur s'ajuste en temps réel.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" /> Pourquoi le BPM ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le tempo est essentiel pour les musiciens, les DJs et même pour les sportifs qui souhaitent synchroniser leurs mouvements sur une cadence précise.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-500" /> Rythme et Tempo
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            120 BPM est le tempo standard pour la plupart des musiques House et Pop modernes. 60 BPM correspond à un battement par seconde.
          </p>
        </div>
      </div>
    </div>
  );
}
