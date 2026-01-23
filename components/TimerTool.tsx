import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export function TimerTool() {
  const [mode, setMode] = useState<'timer' | 'stopwatch'>('timer');
  
  // Timer state
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTime, setTimerTime] = useState(300); // in seconds
  const [timerDone, setTimerDone] = useState(false);
  
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
            // Play sound notification
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiP1vPTgjMGHm7A7+OZRA0PV6vo8blhGAg+ltryxXMqBSh+zPHaizsIGGS58OScTgwOUKXi8bllHAY2jdXzzn0vBSh9yfDdkEEKFF+16O+qVxQJRp/f8sFwJAU4jtXz1YU1Bx1tvO7mnEYODlWq5/K8aB8IOJPa88h1LAUme8rx3pBCChResOjwq1kVCkeg4PKnXx8GOI/X8s+APgcZb7zv56BGEQ1VqObxvmgjCDmT2vLJdS0GJnrJ8N+RQwoUXrDo8KxaFQlIn+HyvmwhBjiP1vPTgjQGHG/A7+WcSQ0NU6rm8L5pJAc5k9nyyXYuBiR6yPDfkkMLFFyv6PCtWhUISp/h8sFsIQU5j9fz04I0Bhxvv+7mnEkNDlOq5vC+aSQHOZPZ8sp3LgYket/w35RECxNbr+jwr1wWCEue4fPEcCYGOJDZ88+FNwgZb7/w6J1KDg1Tqebyv2sjCDmT2fLKdy8HJHrh8OCVRAwTWq/o8a5bFQhNnuLzxnEmBjiP2PPQhzkIGW+/8OaeSg4OUank8cBoJAc4k9nyy3oxBiN64PDglUQME1qv6PGvXBYITZ7i9MdxJwY4j9j0z4c5CBpvwPHnnkoODlKo4/HBaiYIOZPY8sx8MwYjed/w4ZZEDBRar+jxsF0XCU6f4/PGcigFOI/Y88+HOggZb8Dx5p5KDg5SqOPxwWomCDmU2fPMfDMGI3nf8OGWRAwUWq/o8bBdFwlOn+Pzx3IoBTiP2PPPhjkJGW/A8eaeSg4OUqjj8cJrJgk5lNnzzH02ByJ45/Dhl0ULFFqv6PGwXRcKT5/j88dyKAU4kNjzz4c5CRlvwPHmnkoODlGo4/HCayYJOpTZ88x9Ngcid+bw4phECxRar+nzsF4XCk+f5PPHcikFOJDY88+HOQkZbr/w5p1KDg9RqOPxwmwmCTqT2fPMfjYHInfm8OKYRAsUWq/p87BeGApPn+Tzx3IpBTiQ2PPPhjkJGW6/8OWdSg4PUajj8cJsJgk6k9nzzH42ByJ35vDimEQLFFuv6fOwXhgKUJ/k88ZyKAY4kNjzz4Y5CRluv/DlnUoPD1Go4/HCbCYJOpPa88x+NgYjd+bw4phECxRbr+nzsF4YClCf5PPGcigGOJDY88+GOQkZbr/w5Z1KDw9RqOPxwmwmCTqT2vPMfjYGI3fm8OKZRAsUW6/p87BeGApPn+Pzx3IpBjiP2PPPhjkJGm6/8OWdSg4PUajk8cJsJgo5k9nzzH42BiN35/DimUQLFFuv6fOwXhgKT5/j88dxKQY4j9jzz4Y5CRluv/DlnUoPD1Ko5PHCbCYKOZPZ88x+NgYjd+fw4plECxRbr+nzsF4XClCf4/PHcikGOI/Y88+GOQkZbr/w5Z1KDw9SqOTxwmwmCTmU2fPLfjYGI3bn8OOZRAwTW6/o8q9eGApQn+Pzx3IpBjiP2PPPhjkJGW2+8eWdSg8PUajk8cJrJgk5k9rzzH42BiN25/DjmkQME1yv6PKwXhgKUJ/j88dyKQY4j9jzz4Y5CRltvvHlnUoPD1Go5PHCayUJOZPa88x+NgYjdufwI5pFDBNcr+jysF4YClCf4/PHcikGOI/X88+GOQkabL7x5Z1KDw9RqOTxwmslCTmT2vPMfjYGI3bn8COaRQwTXK/o8rBeFwpQn+Lzx3IoB='
);
            audio.play().catch(() => {});
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

  const addLap = () => {
    setLaps([stopwatchTime, ...laps]);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Mode selector */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => {
            setMode('timer');
            setStopwatchRunning(false);
          }}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            mode === 'timer'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Minuteur
        </button>
        <button
          onClick={() => {
            setMode('stopwatch');
            setTimerRunning(false);
          }}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
            mode === 'stopwatch'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Chronomètre
        </button>
      </div>

      {mode === 'timer' ? (
        <div>
          {/* Timer settings */}
          {!timerRunning && (
            <div className="flex gap-4 mb-8 justify-center">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timerMinutes}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTimerMinutes(val);
                    setTimerTime(val * 60 + timerSeconds);
                  }}
                  className="w-24 p-3 border border-gray-300 rounded-lg text-center text-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">Secondes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={timerSeconds}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTimerSeconds(val);
                    setTimerTime(timerMinutes * 60 + val);
                  }}
                  className="w-24 p-3 border border-gray-300 rounded-lg text-center text-lg"
                />
              </div>
            </div>
          )}

          {/* Timer display */}
          <div className={`text-center mb-8 p-8 rounded-xl transition-colors ${timerDone ? 'bg-red-100 animate-pulse' : ''}`}>
            {timerDone && (
              <div className="text-2xl font-bold text-red-600 mb-4 animate-bounce">
                Terminé !
              </div>
            )}
            <div className={`text-7xl font-mono font-bold ${timerDone ? 'text-red-600' : 'text-gray-900'}`}>
              {formatTime(timerTime)}
            </div>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{
                  width: `${((timerMinutes * 60 + timerSeconds - timerTime) / (timerMinutes * 60 + timerSeconds)) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Timer controls */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              disabled={timerTime === 0}
              className="px-8 py-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {timerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {timerRunning ? 'Pause' : 'Démarrer'}
            </button>
            <button
              onClick={resetTimer}
              className="px-8 py-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Réinitialiser
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Stopwatch display */}
          <div className="text-center mb-8">
            <div className="text-7xl font-mono font-bold text-gray-900">
              {formatTime(stopwatchTime)}
            </div>
          </div>

          {/* Stopwatch controls */}
          <div className="flex gap-4 justify-center mb-8">
            <button
              onClick={() => setStopwatchRunning(!stopwatchRunning)}
              className={`px-8 py-4 ${stopwatchRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg font-semibold transition-colors flex items-center gap-2`}
            >
              {stopwatchRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {stopwatchRunning ? 'Pause' : 'Démarrer'}
            </button>
            <button
              onClick={addLap}
              disabled={!stopwatchRunning && stopwatchTime === 0}
              className="px-8 py-4 bg-blue-500 text-white hover:bg-blue-600 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Tour
            </button>
            <button
              onClick={resetStopwatch}
              className="px-8 py-4 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Réinitialiser
            </button>
          </div>

          {/* Laps List */}
          {laps.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <h3 className="font-semibold text-gray-700 mb-4 border-b pb-2">Tours</h3>
              <div className="space-y-2">
                {laps.map((lapTime, index) => (
                  <div key={index} className="flex justify-between items-center font-mono py-2 border-b border-gray-200 last:border-0">
                    <span className="text-gray-500 text-sm">Tour {laps.length - index}</span>
                    <span className="text-gray-900 font-bold">{formatTime(lapTime)}</span>
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
