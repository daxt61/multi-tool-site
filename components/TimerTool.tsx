import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, StopCircle, Flag, Bell, BellOff } from 'lucide-react';

export function TimerTool() {
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
  
  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTime, setTimerTime] = useState(300); // in seconds
  const [timerDone, setTimerDone] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Stopwatch state
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
            if (soundEnabled) {
              const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiP1vPTgjMGHm7A7+OZRA0PV6vo8blhGAg+ltryxXMqBSh+zPHaizsIGGS58OScTgwOUKXi8bllHAY2jdXzzn0vBSh9yfDdkEEKFF+16O+qVxQJRp/f8sFwJAU4jtXz1YU1Bx1tvO7mnEYODlWq5/K8aB8IOJPa88h1LAUme8rx3pBCChResOjwq1kVCkeg4PKnXx8GOI/X8s+APgcZb7zv56BGEQ1VqObxvmgjCDmT2vLJdS0GJnrJ8N+RQwoUXrDo8KxaFQlIn+HyvmwhBjiP1vPTgjQGHG/A7+WcSQ0NU6rm8L5pJAc5k9nyyXYuBiR6yPDfkkMLFFyv6PCtWhUISp/h8sFsIQU5j9fz04I0Bhxvv+7mnEkNDlOq5vC+aSQHOZPZ8sp3LgYket/w35RECxNbr+jwr1wWCEue4fPEcCYGOJDZ88+FNwgZb7/w6J1KDg1Tqebyv2sjCDmT2fLKdy8HJHrh8OCVRAwTWq/o8a5bFQhNnuLzxnEmBjiP2PPQhzkIGW+/8OaeSg4OUank8cBoJAc4k9nyy3oxBiN64PDglUQME1qv6PGvXBYITZ7i9MdxJwY4j9j0z4c5CBpvwPHnnkoODlKo4/HBaiYIOZPY8sx8MwYjed/w4ZZEDBRar+jxsF0XCU6f4/PGcigFOI/Y88+HOggZb8Dx5p5KDg5SqOPxwWomCDmU2fPMfDMGI3nf8OGWRAwUWq/o8bBdFwlOn+Pzx3IoBTiP2PPPhjkJGW/A8eaeSg4OUqjj8cJrJgk5lNnzzH02ByJ45/Dhl0ULFFqv6PGwXRcKT5/j88dyKAU4kNjzz4c5CRlvwPHmnkoODlGo4/HCayYJOpTZ88x9Ngcid+bw4phECxRar+nzsF4XCk+f5PPHcikFOJDY88+HOQkZbr/w5p1KDg9RqOPxwmwmCTqT2fPMfjYHInfm8OKYRAsUWq/p87BeGApPn+Tzx3IpBTiQ2PPPhjkJGW6/8OWdSg4PUajj8cJsJgk6k9nzzH42ByJ35vDimEQLFFuv6fOwXhgKUJ/k88ZyKAY4kNjzz4Y5CRluv/DlnUPD1Go4/HCbCYJOpPa88x+NgYjd+bw4phECxRbr+nzsF4YClCf5PPGcigGOJDY88+GOQkZbr/w5Z1KDw9RqOPxwmwmCTqT2vPMfjYGI3fm8OKZRAsUW6/p87BeGApPn+Pzx3IpBjiP2PPPhjkJGm6/8OWdSg4PUajk8cJsJgo5k9nzzH42BiN35/DimUQLFFuv6fOwXhgKT5/j88dxKQY4j9jzz4Y5CRluv/DlnUPD1Ko5PHCbCYKOZPZ88x+NgYjd+fw4plECxRbr+nzsF4XClCf4/PHcikGOI/Y88+GOQkZbr/w5Z1KDw9SqOTxwmwmCTmU2fPLfjYGI3bn8OOZRAwTW6/o8q9eGApQn+Pzx3IpBjiP2PPPhjkJGW2+8eWdSg8PUajk8cJrJgk5k9rzzH42BiN25/DjmkQME1yv6PKwXhgKUJ/j88dyKQY4j9jzz4Y5CRltvvHlnUoPD1Go5PHCayUJOZPa88x+NgYjdufwI5pFDBNcr+jysF4YClCf4/PHcikGOI/X88+GOQkabL7x5Z1KDw9RqOTxwmslCTmT2vPMfjYGI3bn8COaRQwTXK/o8rBeFwpQn+Lzx3IoB=');
              audio.play().catch(() => {});
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (stopwatchRunning && mode === 'stopwatch') {
      intervalRef.current = window.setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerRunning, stopwatchRunning, mode, soundEnabled]);

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

  const addLap = () => {
    setLaps([stopwatchTime, ...laps]);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours > 0 ? hours.toString().padStart(2, '0') + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = (timerMinutes * 60 + timerSeconds - timerTime) / (timerMinutes * 60 + timerSeconds || 1);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Mode selector */}
      <div className="flex gap-2 mb-12 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
        <button
          onClick={() => {
            setMode('timer');
            setStopwatchRunning(false);
          }}
          className={`flex-1 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            mode === 'timer'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Timer className="w-5 h-5" />
          Minuteur
        </button>
        <button
          onClick={() => {
            setMode('stopwatch');
            setTimerRunning(false);
          }}
          className={`flex-1 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            mode === 'stopwatch'
              ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <StopCircle className="w-5 h-5" />
          Chronomètre
        </button>
      </div>

      {mode === 'timer' ? (
        <div className="space-y-12">
          {/* Timer settings */}
          {!timerRunning && (
            <div className="flex gap-8 justify-center items-end">
              <div className="flex flex-col items-center">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={timerMinutes}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    setTimerMinutes(val);
                    setTimerTime(val * 60 + timerSeconds);
                  }}
                  className="w-32 p-6 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-3xl text-center text-4xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white shadow-sm"
                />
              </div>
              <div className="text-4xl font-black text-gray-300 pb-6">:</div>
              <div className="flex flex-col items-center">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Secondes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timerSeconds}
                  onChange={(e) => {
                    const val = Math.min(59, Math.max(0, Number(e.target.value)));
                    setTimerSeconds(val);
                    setTimerTime(timerMinutes * 60 + val);
                  }}
                  className="w-32 p-6 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-3xl text-center text-4xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Timer display */}
          <div className={`relative aspect-square max-w-[400px] mx-auto flex items-center justify-center rounded-full p-8 border-8 ${timerDone ? 'border-red-500 animate-pulse' : 'border-gray-100 dark:border-gray-800'}`}>
             <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="50%"
                  cy="50%"
                  r="48%"
                  className="fill-none stroke-indigo-600 transition-all duration-1000"
                  strokeWidth="8"
                  strokeDasharray="301.6%"
                  strokeDashoffset={`${301.6 * (1 - progress)}%`}
                  strokeLinecap="round"
                />
             </svg>

             <div className="text-center relative z-10">
                {timerDone && (
                  <div className="text-xl font-black text-red-500 mb-2 tracking-widest uppercase">
                    Terminé !
                  </div>
                )}
                <div className={`text-8xl font-black font-mono tracking-tighter ${timerDone ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                  {formatTime(timerTime)}
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`mt-4 p-2 rounded-full transition-colors ${soundEnabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-300'}`}
                >
                  {soundEnabled ? <Bell className="w-6 h-6" /> : <BellOff className="w-6 h-6" />}
                </button>
             </div>
          </div>

          {/* Timer controls */}
          <div className="flex gap-6 justify-center">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              disabled={timerTime === 0}
              className={`px-12 py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 flex items-center gap-3 ${
                timerRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
              } disabled:opacity-50`}
            >
              {timerRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              {timerRunning ? 'Pause' : 'Démarrer'}
            </button>
            <button
              onClick={resetTimer}
              className="px-8 py-5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-[2rem] font-bold shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Stopwatch display */}
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="text-9xl font-black font-mono tracking-tighter text-gray-900 dark:text-white">
              {formatTime(stopwatchTime)}
            </div>
            <div className="text-indigo-500 font-bold tracking-widest uppercase mt-4">Chronomètre</div>
          </div>

          {/* Stopwatch controls */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setStopwatchRunning(!stopwatchRunning)}
              className={`px-12 py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all active:scale-95 flex items-center gap-3 ${
                stopwatchRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                : 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20'
              }`}
            >
              {stopwatchRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              {stopwatchRunning ? 'Pause' : 'Démarrer'}
            </button>

            <button
              onClick={addLap}
              disabled={!stopwatchRunning && stopwatchTime === 0}
              className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <Flag className="w-6 h-6" />
              Tour
            </button>

            <button
              onClick={resetStopwatch}
              className="px-8 py-5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-[2rem] font-bold shadow-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
          </div>

          {/* Laps List */}
          {laps.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-700 shadow-sm max-h-[400px] overflow-y-auto">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <Flag className="w-6 h-6 text-indigo-500" /> Tours enregistrés
              </h3>
              <div className="space-y-3">
                {laps.map((lapTime, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-5 rounded-2xl border border-transparent hover:border-indigo-500/20 transition-all">
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                        {laps.length - index}
                      </span>
                      <span className="font-bold text-gray-400">TOUR</span>
                    </div>
                    <span className="text-3xl font-black font-mono dark:text-white">{formatTime(lapTime)}</span>
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
