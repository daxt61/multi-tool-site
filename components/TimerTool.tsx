import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon, StopCircle, Flag, Bell, BellOff } from 'lucide-react';

export function TimerTool() {
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTime, setTimerTime] = useState(300);
  const [timerDone, setTimerDone] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1);
    } catch (e) {
      console.error('Audio play failed:', e);
    }
  };

  useEffect(() => {
    if (timerRunning && mode === 'timer') {
      setTimerDone(false);
      intervalRef.current = window.setInterval(() => {
        setTimerTime((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            setTimerDone(true);
            playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (stopwatchRunning && mode === 'stopwatch') {
      intervalRef.current = window.setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerRunning, stopwatchRunning, mode, soundEnabled]); // Added soundEnabled to dependencies to ensure playBeep has access to latest state if needed, though here it's called inside. Actually playBeep is called in interval, so it's fine.

  const resetTimer = () => {
    setTimerRunning(false);
    setTimerTime(timerMinutes * 60 + timerSeconds);
    setTimerDone(false);
  };

  const resetStopwatch = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setLaps([]);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? hours.toString().padStart(2, '0') + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatStopwatchTime = (time: number) => {
    const hours = Math.floor(time / 360000);
    const minutes = Math.floor((time % 360000) / 6000);
    const seconds = Math.floor((time % 6000) / 100);
    const ms = time % 100;
    return `${hours > 0 ? hours.toString().padStart(2, '0') + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const totalPossibleSeconds = timerMinutes * 60 + timerSeconds || 1;
  const progress = (totalPossibleSeconds - timerTime) / totalPossibleSeconds;

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[2rem] w-fit mx-auto shadow-sm">
        <button
          onClick={() => setMode('timer')}
          className={`px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2 ${mode === 'timer' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
        >
          <TimerIcon className="w-4 h-4" /> Minuteur
        </button>
        <button
          onClick={() => setMode('stopwatch')}
          className={`px-8 py-3 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2 ${mode === 'stopwatch' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
        >
          <StopCircle className="w-4 h-4" /> Chronomètre
        </button>
      </div>

      {mode === 'timer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-10">
            {!timerRunning && (
              <div className="flex justify-center items-end gap-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-3">
                  <label htmlFor="timerMinutes" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 cursor-pointer">Minutes</label>
                  <input
                    id="timerMinutes"
                    type="number"
                    min="0"
                    max="999"
                    value={timerMinutes}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(999, Number(e.target.value)));
                      setTimerMinutes(val);
                      setTimerTime(val * 60 + timerSeconds);
                    }}
                    className="w-28 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-4xl font-black font-mono outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    aria-label="Minutes"
                  />
                </div>
                <div className="text-4xl font-black text-slate-200 dark:text-slate-800 pb-6" aria-hidden="true">:</div>
                <div className="space-y-3">
                  <label htmlFor="timerSeconds" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1 cursor-pointer">Secondes</label>
                  <input
                    id="timerSeconds"
                    type="number"
                    min="0"
                    max="59"
                    value={timerSeconds}
                    onChange={(e) => {
                      const val = Math.max(0, Math.min(59, Number(e.target.value)));
                      setTimerSeconds(val);
                      setTimerTime(timerMinutes * 60 + val);
                    }}
                    className="w-28 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center text-4xl font-black font-mono outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    aria-label="Secondes"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-12 py-5 rounded-3xl font-black text-xl transition-all active:scale-95 flex items-center gap-3 shadow-xl ${timerRunning ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'}`}
              >
                {timerRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                {timerRunning ? 'Pause' : 'Démarrer'}
              </button>
              <button
                onClick={resetTimer}
                className="px-8 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl font-black text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 transition-all flex items-center gap-2"
                aria-label="Réinitialiser"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative aspect-square max-w-[340px] w-full mx-auto flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full border-8 transition-colors duration-500 ${timerDone ? 'border-rose-500 animate-pulse' : 'border-slate-50 dark:border-slate-900'}`}></div>
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="50%" cy="50%" r="46%"
                className="fill-none stroke-indigo-600 transition-all duration-1000"
                strokeWidth="8" strokeDasharray="289%" strokeDashoffset={`${289 * (1 - progress)}%`} strokeLinecap="round"
              />
            </svg>
            <div className="text-center relative z-10 space-y-4">
              <div className={`text-7xl font-black font-mono tracking-tight ${timerDone ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                {formatTime(timerTime)}
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${soundEnabled ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}
              >
                {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                {soundEnabled ? 'Son activé' : 'Muet'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-inner">
            <div className="text-8xl md:text-9xl font-black font-mono tracking-tighter text-slate-900 dark:text-white tabular-nums">
              {formatStopwatchTime(stopwatchTime)}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setStopwatchRunning(!stopwatchRunning)}
              className={`px-12 py-5 rounded-3xl font-black text-xl transition-all active:scale-95 flex items-center gap-3 shadow-xl ${stopwatchRunning ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-700'}`}
            >
              {stopwatchRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              {stopwatchRunning ? 'Pause' : 'Démarrer'}
            </button>
            <button
              onClick={() => setLaps([stopwatchTime, ...laps])}
              disabled={!stopwatchRunning && stopwatchTime === 0}
              className="px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-0 disabled:pointer-events-none flex items-center gap-3"
            >
              <Flag className="w-6 h-6" /> Tour
            </button>
            <button
              onClick={resetStopwatch}
              className="px-8 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl font-black text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 transition-all flex items-center gap-2"
              aria-label="Réinitialiser"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {laps.length > 0 && (
            <div className="max-w-md mx-auto space-y-4 animate-in slide-in-from-bottom-4 duration-500">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-1">Historique des tours</h4>
              <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/50 shadow-sm">
                {laps.map((lap, i) => (
                  <div key={i} className="flex justify-between items-center p-5 group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-500 transition-colors">TOUR {laps.length - i}</span>
                    <span className="font-mono font-black text-lg text-slate-900 dark:text-white tabular-nums">{formatStopwatchTime(lap)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
