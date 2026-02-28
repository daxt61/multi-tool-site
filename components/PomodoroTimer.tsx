import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Timer } from 'lucide-react';

type Mode = 'work' | 'shortBreak' | 'longBreak';

export function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const intervalRef = useRef<number | null>(null);

  const settings = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  const modeLabels = {
    work: 'Travail',
    shortBreak: 'Pause Courte',
    longBreak: 'Pause Longue',
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (mode === 'work') {
      const nextSessions = sessionsCompleted + 1;
      setSessionsCompleted(nextSessions);
      if (nextSessions % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(settings.longBreak);
      } else {
        setMode('shortBreak');
        setTimeLeft(settings.shortBreak);
      }
    } else {
      setMode('work');
      setTimeLeft(settings.work);
    }

    // Notification sound (using same as TimerTool)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiP1vPTgjMGHm7A7+OZRA0PV6vo8blhGAg+ltryxXMqBSh+zPHaizsIGGS58OScTgwOUKXi8bllHAY2jdXzzn0vBSh9yfDdkEEKFF+16O+qVxQJRp/f8sFwJAU4jtXz1YU1Bx1tvO7mnEYODlWq5/K8aB8IOJPa88h1LAUme8rx3pBCChResOjwq1kVCkeg4PKnXx8GOI/X8s+APgcZb7zv56BGEQ1VqObxvmgjCDmT2vLJdS0GJnrJ8N+RQwoUXrDo8KxaFQlIn+HyvmwhBjiP1vPTgjQGHG/A7+WcSQ0NU6rm8L5pJAc5k9nyyXYuBiR6yPDfkkMLFFyv6PCtWhUISp/h8sFsIQU5j9fz04I0Bhxvv+7mnEkNDlOq5vC+aSQHOZPZ8sp3LgYket/w35RECxNbr+jwr1wWCEue4fPEcCYGOJDZ88+FNwgZb7/w6J1KDg1Tqebyv2sjCDmT2fLKdy8HJHrh8OCVRAwTWq/o8a5bFQhNnuLzxnEmBjiP2PPQhzkIGW+/8OaeSg4OUank8cBoJAc4k9nyy3oxBiN64PDglUQME1qv6PGvXBYITZ7i9MdxJwY4j9j0z4c5CBpvwPHnnkoODlKo4/HBaiYIOZPY8sx8MwYjed/w4ZZEDBRar+jxsF0XCU6f4/PGcigFOI/Y88+HOggZb8Dx5p5KDg5SqOPxwWomCDmU2fPMfDMGI3nf8OGWRAwUWq/o8bBdFwlOn+Pzx3IoBTiP2PPPhjkJGW/A8eaeSg4OUqjj8cJrJgk5lNnzzH02ByJ45/Dhl0ULFFqv6PGwXRcKT5/j88dyKAU4kNjzz4c5CRlvwPHmnkoODlGo4/HCayYJOpTZ88x9Ngcid+bw4phECxRar+nzsF4XCk+f5PPHcikFOJDY88+HOQkZbr/waw1KDg9RqOPxwmwmCTqT2fPMfjYHInfm8OKYRAsUWq/p87BeGApPn+Tzx3IpBTiQ2PPPhjkJGW6/8OWdSg4PUajj8cJsJgk6k9nzzH42ByJ35vDimEQLFFuv6fOwXhgKUJ/k88ZyKAY4kNjzz4Y5CRluv/DlnUoPD1Go4/HCbCYJOpPa88x+NgYjd+bw4phECxRbr+nzsF4YClCf5PPGcigGOJDY88+GOQkZbr/w5Z1KDw9RqOPxwmwmCTqT2vPMfjYGI3fm8OKZRAsUW6/p87BeGApPn+Pzx3IpBjiP2PPPhjkJGm6/8OWdSg4PUajk8cJsJgo5k9nzzH42BiN35/DimUQLFFuv6fOwXhgKT5/j88dxKQY4j9jzz4Y5CRluv/DlnUoPD1Ko5PHCbCYKOZPZ88x+NgYjd+fw4plECxRbr+nzsF4XClCf4/PHcikGOI/Y88+GOQkZbr/w5Z1KDw9SqOTxwmwmCTmU2fPLfjYGI3bn8OOZRAwTW6/o8q9eGApQn+Pzx3IpBjiP2PPPhjkJGW2+8eWdSg8PUajk8cJrJgk5k9rzzH42BiN25/DjmkQME1yv6PKwXhgKUJ/j88dyKQY4j9jzz4Y5CRltvvHlnUoPD1Go5PHCayUJOZPa88x+NgYjdufwI5pFDBNcr+jysF4YClCf4/PHcikGOI/X88+GOQkabL7x5Z1KDw9RqOTxwmslCTmT2vPMfjYGI3bn8COaRQwTXK/o8rBeFwpQn+Lzx3IoB=');
    audio.play().catch(() => {});
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setTimeLeft(settings[newMode]);
    setIsRunning(false);
  };

  const resetTimer = () => {
    setTimeLeft(settings[mode]);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((settings[mode] - timeLeft) / settings[mode]) * 100;

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        {/* Mode Selector */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
          {(['work', 'shortBreak', 'longBreak'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 px-2 text-sm font-medium rounded-lg transition-all ${
                mode === m
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>

        {/* Timer Display */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center">
            <svg className="w-64 h-64 transform -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-gray-100"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={753.98}
                strokeDashoffset={753.98 - (753.98 * progress) / 100}
                className={`${
                  mode === 'work' ? 'text-indigo-500' : 'text-emerald-500'
                } transition-all duration-1000 ease-linear`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl font-bold text-gray-800 font-mono">
                {formatTime(timeLeft)}
              </div>
              <div className="text-gray-500 mt-2 font-medium flex items-center gap-2">
                {mode === 'work' ? <Brain className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
                {modeLabels[mode]}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`w-16 h-16 flex items-center justify-center rounded-full transition-all ${
              isRunning
                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isRunning ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>
          <button
            onClick={resetTimer}
            className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
          >
            <RotateCcw className="w-8 h-8" />
          </button>
        </div>

        {/* Stats */}
        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <div className="text-gray-500 text-sm flex items-center justify-center gap-2">
            <Timer className="w-4 h-4" />
            Sessions terminées : <span className="font-bold text-gray-800">{sessionsCompleted}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
        <h4 className="text-indigo-800 font-semibold mb-2 flex items-center gap-2">
          💡 C'est quoi la technique Pomodoro ?
        </h4>
        <p className="text-indigo-700 text-sm leading-relaxed">
          C'est une méthode de gestion du temps qui utilise un minuteur pour diviser le travail en intervalles (généralement 25 min), séparés par de courtes pauses. Cela favorise la concentration et prévient la fatigue mentale.
        </p>
      </div>
    </div>
  );
}
