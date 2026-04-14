import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, StopCircle, Flag, Bell, BellOff, Coffee, Brain, ChevronRight } from 'lucide-react';

type PomodoroState = 'work' | 'shortBreak' | 'longBreak';

export function TimerTool({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [mode, setMode] = useState<'timer' | 'stopwatch' | 'pomodoro'>(initialData?.mode || 'timer');

  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(initialData?.timerMinutes ?? 5);
  const [timerSeconds, setTimerSeconds] = useState(initialData?.timerSeconds ?? 0);

  useEffect(() => {
    onStateChange?.({ mode, timerMinutes, timerSeconds });
  }, [mode, timerMinutes, timerSeconds, onStateChange]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTime, setTimerTime] = useState(300);
  const [timerDone, setTimerDone] = useState(false);

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // Pomodoro state
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>('work');
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroCycles, setPomodoroCycles] = useState(0);

  const [soundEnabled, setSoundEnabled] = useState(true);

  const intervalRef = useRef<number | null>(null);
  const targetTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const POMODORO_CONFIG = {
    work: { duration: 25 * 60, label: 'Travail', icon: <Brain className="w-5 h-5" />, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
    shortBreak: { duration: 5 * 60, label: 'Pause courte', icon: <Coffee className="w-5 h-5" />, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    longBreak: { duration: 15 * 60, label: 'Pause longue', icon: <Coffee className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  };

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
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (mode === 'timer' && timerRunning) {
      setTimerDone(false);
      targetTimeRef.current = Date.now() + timerTime * 1000;
      intervalRef.current = window.setInterval(() => {
        const remaining = Math.max(0, Math.ceil((targetTimeRef.current - Date.now()) / 1000));
        setTimerTime(remaining);
        if (remaining <= 0) {
          setTimerRunning(false);
          setTimerDone(true);
          playBeep();
        }
      }, 100);
    } else if (mode === 'stopwatch' && stopwatchRunning) {
      startTimeRef.current = Date.now() - stopwatchTime * 10;
      intervalRef.current = window.setInterval(() => {
        setStopwatchTime(Math.floor((Date.now() - startTimeRef.current) / 10));
      }, 10);
    } else if (mode === 'pomodoro' && pomodoroRunning) {
      targetTimeRef.current = Date.now() + pomodoroTime * 1000;
      intervalRef.current = window.setInterval(() => {
        const remaining = Math.max(0, Math.ceil((targetTimeRef.current - Date.now()) / 1000));
        setPomodoroTime(remaining);
        if (remaining <= 0) {
          playBeep();
          handlePomodoroNext();
        }
      }, 100);
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerRunning, stopwatchRunning, pomodoroRunning, mode]);

  const handlePomodoroNext = () => {
    if (pomodoroState === 'work') {
      const newCycles = pomodoroCycles + 1;
      setPomodoroCycles(newCycles);
      if (newCycles % 4 === 0) {
        setPomodoroState('longBreak');
        setPomodoroTime(POMODORO_CONFIG.longBreak.duration);
      } else {
        setPomodoroState('shortBreak');
        setPomodoroTime(POMODORO_CONFIG.shortBreak.duration);
      }
    } else {
      setPomodoroState('work');
      setPomodoroTime(POMODORO_CONFIG.work.duration);
    }
    setPomodoroRunning(false);
  };

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

  const resetPomodoro = () => {
    setPomodoroRunning(false);
    setPomodoroState('work');
    setPomodoroTime(POMODORO_CONFIG.work.duration);
    setPomodoroCycles(0);
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

  const setPreset = (mins: number) => {
    setTimerMinutes(mins);
    setTimerSeconds(0);
    setTimerTime(mins * 60);
    setTimerRunning(false);
    setTimerDone(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (mode === 'timer') setTimerRunning(prev => !prev);
        else if (mode === 'stopwatch') setStopwatchRunning(prev => !prev);
        else if (mode === 'pomodoro') setPomodoroRunning(prev => !prev);
      } else if (e.key.toLowerCase() === 'r') {
        if (mode === 'timer') resetTimer();
        else if (mode === 'stopwatch') resetStopwatch();
        else if (mode === 'pomodoro') resetPomodoro();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode]);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-fit mx-auto overflow-x-auto no-scrollbar max-w-full">
        <button
          onClick={() => setMode('timer')}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === 'timer' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Timer className="w-4 h-4" /> Minuteur
        </button>
        <button
          onClick={() => setMode('stopwatch')}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === 'stopwatch' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <StopCircle className="w-4 h-4" /> Chronomètre
        </button>
        <button
          onClick={() => setMode('pomodoro')}
          className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === 'pomodoro' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Brain className="w-4 h-4" /> Pomodoro
        </button>
      </div>

      {mode === 'timer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {!timerRunning && (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-center gap-2">
                  {[1, 5, 10, 15, 30].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPreset(m)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:border-indigo-500 transition-colors"
                    >
                      {m} min
                    </button>
                  ))}
                </div>

                <div className="flex justify-center items-end gap-4">
                  <div className="space-y-2">
                    <label htmlFor="timerMinutes" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">Minutes</label>
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
                      className="w-24 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-3xl font-black font-mono outline-none focus:border-indigo-500 transition-colors dark:text-white"
                    />
                  </div>
                  <div className="text-3xl font-black text-slate-300 pb-4" aria-hidden="true">:</div>
                  <div className="space-y-2">
                    <label htmlFor="timerSeconds" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">Secondes</label>
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
                      className="w-24 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-3xl font-black font-mono outline-none focus:border-indigo-500 transition-colors dark:text-white"
                    />
                  </div>
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
                className="px-8 py-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-100 dark:border-rose-500/20 rounded-2xl font-bold transition-all flex items-center gap-2"
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
                strokeWidth="4" strokeDasharray="301.6%" strokeDashoffset={`${301.6 * (1 - (timerMinutes * 60 + timerSeconds - timerTime) / (timerMinutes * 60 + timerSeconds || 1))}%`} strokeLinecap="round"
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
      )}

      {mode === 'stopwatch' && (
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
              className="px-8 py-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-100 dark:border-rose-500/20 rounded-2xl font-bold transition-all flex items-center gap-2"
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

      {mode === 'pomodoro' && (
        <div className="space-y-8">
          <div className="flex justify-center items-center gap-4">
             {Object.entries(POMODORO_CONFIG).map(([key, config]) => (
               <div
                 key={key}
                 className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${pomodoroState === key ? `${config.bg} ${config.color} ring-1 ring-current` : 'opacity-30'}`}
               >
                 {config.icon} {config.label}
               </div>
             ))}
          </div>

          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 relative overflow-hidden">
            <div className={`absolute inset-0 opacity-5 pointer-events-none transition-colors duration-1000 ${POMODORO_CONFIG[pomodoroState].bg.split(' ')[0]}`}></div>
            <div className={`text-9xl font-black font-mono tracking-tighter transition-colors duration-500 ${pomodoroRunning ? 'dark:text-white' : 'text-slate-400'}`}>
              {formatTime(pomodoroTime)}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-sm">
              <Brain className="w-4 h-4" /> Cycle #{pomodoroCycles + 1}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setPomodoroRunning(!pomodoroRunning)}
              className={`px-10 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center gap-2 ${pomodoroRunning ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'}`}
            >
              {pomodoroRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              {pomodoroRunning ? 'Pause' : 'Démarrer'}
            </button>
            <button
              onClick={handlePomodoroNext}
              className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold transition-all hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 dark:text-white"
            >
              Suivant <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={resetPomodoro}
              className="px-8 py-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-100 dark:border-rose-500/20 rounded-2xl font-bold transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Reset
            </button>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4 max-w-2xl mx-auto">
             <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <Brain className="w-6 h-6" />
             </div>
             <div className="space-y-2">
                <h4 className="font-bold dark:text-white">C'est quoi la méthode Pomodoro ?</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  C'est une technique de gestion du temps qui utilise un minuteur pour diviser le travail en intervalles de 25 minutes, séparés par de courtes pauses. Après 4 cycles, faites une pause plus longue de 15 à 30 minutes.
                </p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
