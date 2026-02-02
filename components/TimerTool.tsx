import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, StopCircle, Flag, Bell, BellOff } from 'lucide-react';

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

  useEffect(() => {
    if (timerRunning && mode === 'timer') {
      setTimerDone(false);
      intervalRef.current = window.setInterval(() => {
        setTimerTime((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            setTimerDone(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (stopwatchRunning && mode === 'stopwatch') {
      intervalRef.current = window.setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 10);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, stopwatchRunning, mode]);

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

  const progress = (timerMinutes * 60 + timerSeconds - timerTime) / (timerMinutes * 60 + timerSeconds || 1);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setMode('timer')}
          className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'timer' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Timer className="w-4 h-4" /> Minuteur
        </button>
        <button
          onClick={() => setMode('stopwatch')}
          className={`px-8 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === 'stopwatch' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <StopCircle className="w-4 h-4" /> Chronomètre
        </button>
      </div>

      {mode === 'timer' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {!timerRunning && (
              <div className="flex justify-center items-end gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Minutes</label>
                  <input
                    type="number"
                    value={timerMinutes}
                    onChange={(e) => { setTimerMinutes(Number(e.target.value)); setTimerTime(Number(e.target.value) * 60 + timerSeconds); }}
                    className="w-24 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-3xl font-black font-mono outline-none"
                  />
                </div>
                <div className="text-3xl font-black text-slate-300 pb-4">:</div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Secondes</label>
                  <input
                    type="number"
                    value={timerSeconds}
                    onChange={(e) => { setTimerSeconds(Number(e.target.value)); setTimerTime(timerMinutes * 60 + Number(e.target.value)); }}
                    className="w-24 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-3xl font-black font-mono outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-10 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center gap-2 ${timerRunning ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'}`}
              >
                {timerRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                {timerRunning ? 'Pause' : 'Démarrer'}
              </button>
              <button
                onClick={resetTimer}
                className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-500 hover:border-slate-300 transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5" /> Reset
              </button>
            </div>
          </div>

          <div className={`relative aspect-square max-w-[320px] mx-auto flex items-center justify-center rounded-full border-4 ${timerDone ? 'border-rose-500 animate-pulse' : 'border-slate-100 dark:border-slate-800'}`}>
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="50%" cy="50%" r="48%"
                className="fill-none stroke-indigo-600 transition-all duration-1000"
                strokeWidth="4" strokeDasharray="301.6%" strokeDashoffset={`${301.6 * (1 - progress)}%`} strokeLinecap="round"
              />
            </svg>
            <div className="text-center relative z-10">
              <div className={`text-6xl font-black font-mono tracking-tighter ${timerDone ? 'text-rose-500' : 'dark:text-white'}`}>
                {formatTime(timerTime)}
              </div>
              <button onClick={() => setSoundEnabled(!soundEnabled)} className={`mt-4 p-2 rounded-full transition-colors ${soundEnabled ? 'text-indigo-600' : 'text-slate-300'}`}>
                {soundEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800">
            <div className="text-8xl md:text-9xl font-black font-mono tracking-tighter dark:text-white">
              {formatStopwatchTime(stopwatchTime)}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setStopwatchRunning(!stopwatchRunning)}
              className={`px-10 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center gap-2 ${stopwatchRunning ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'}`}
            >
              {stopwatchRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              {stopwatchRunning ? 'Pause' : 'Démarrer'}
            </button>
            <button
              onClick={() => setLaps([stopwatchTime, ...laps])}
              disabled={!stopwatchRunning && stopwatchTime === 0}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Flag className="w-5 h-5" /> Tour
            </button>
            <button
              onClick={resetStopwatch}
              className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-500 hover:border-slate-300 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Reset
            </button>
          </div>

          {laps.length > 0 && (
            <div className="max-w-md mx-auto space-y-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Tours</h4>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {laps.map((lap, i) => (
                  <div key={i} className="flex justify-between items-center p-4">
                    <span className="text-xs font-bold text-slate-400">TOUR {laps.length - i}</span>
                    <span className="font-mono font-black dark:text-white">{formatStopwatchTime(lap)}</span>
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
