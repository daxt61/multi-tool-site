import { useState, useEffect, useCallback, useRef } from 'react';
import { Zap, Timer, RefreshCcw, History, Award, Info, Shield, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

type GameState = 'waiting' | 'ready' | 'clicked' | 'too-early' | 'finished';

export function ReactionTimeTester() {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const timerRef = useRef<any>(null);

  const startTest = useCallback(() => {
    setGameState('ready');
    setReactionTime(null);

    const delay = getSecureRandomInt(3000) + 2000; // 2-5 seconds
    timerRef.current = setTimeout(() => {
      setGameState('clicked');
      setStartTime(performance.now());
    }, delay);
  }, []);

  const handleClick = useCallback(() => {
    if (gameState === 'ready') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setGameState('too-early');
    } else if (gameState === 'clicked') {
      const endTime = performance.now();
      const time = Math.floor(endTime - startTime);
      setReactionTime(time);
      setHistory(prev => [time, ...prev].slice(0, 10));
      setGameState('finished');
    } else if (gameState === 'waiting' || gameState === 'finished' || gameState === 'too-early') {
      startTest();
    }
  }, [gameState, startTime, startTest]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const average = history.length > 0
    ? Math.floor(history.reduce((a, b) => a + b, 0) / history.length)
    : null;

  const best = history.length > 0
    ? Math.min(...history)
    : null;

  const getBackground = () => {
    switch (gameState) {
      case 'ready': return 'bg-rose-500 hover:bg-rose-600';
      case 'clicked': return 'bg-emerald-500 hover:bg-emerald-600';
      default: return 'bg-indigo-600 hover:bg-indigo-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Game Area */}
        <div className="lg:col-span-8">
          <button
            onClick={handleClick}
            className={`w-full aspect-[4/3] rounded-[3rem] transition-all flex flex-col items-center justify-center text-white shadow-2xl p-12 text-center select-none active:scale-[0.98] ${getBackground()}`}
          >
            {gameState === 'waiting' && (
              <>
                <Zap className="w-20 h-20 mb-6 animate-pulse" />
                <h2 className="text-3xl font-black mb-2">Reaction Time Test</h2>
                <p className="text-indigo-100 font-bold">When the red box turns green, click as fast as you can.</p>
                <span className="mt-8 px-6 py-2 bg-white/20 rounded-full text-sm font-black uppercase tracking-widest">Click anywhere to start</span>
              </>
            )}
            {gameState === 'ready' && (
              <>
                <Timer className="w-20 h-20 mb-6 animate-spin-slow" />
                <h2 className="text-4xl font-black">Wait for green...</h2>
              </>
            )}
            {gameState === 'clicked' && (
              <>
                <Zap className="w-24 h-24 mb-6 fill-current" />
                <h2 className="text-6xl font-black uppercase tracking-tighter">CLICK!</h2>
              </>
            )}
            {gameState === 'too-early' && (
              <>
                <Award className="w-20 h-20 mb-6 opacity-50" />
                <h2 className="text-4xl font-black mb-2">Too early!</h2>
                <p className="text-indigo-100 font-bold">Click to try again.</p>
              </>
            )}
            {gameState === 'finished' && (
              <>
                <div className="text-8xl font-black font-mono mb-4 tabular-nums">
                  {reactionTime}<span className="text-2xl ml-2">ms</span>
                </div>
                <h2 className="text-2xl font-bold mb-8">Great job!</h2>
                <button
                  onClick={(e) => { e.stopPropagation(); startTest(); }}
                  className="flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black shadow-xl hover:bg-slate-50 transition-all"
                >
                  <RefreshCcw className="w-5 h-5" /> Try Again
                </button>
              </>
            )}
          </button>
        </div>

        {/* Stats & History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average</span>
                <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                  {average ? `${average}ms` : '---'}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Best</span>
                <div className="text-2xl font-black font-mono text-emerald-500">
                  {best ? `${best}ms` : '---'}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <History className="w-4 h-4" /> Recent History
              </h3>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <p className="text-sm text-slate-400 italic px-1">No tests completed yet.</p>
                ) : (
                  history.map((time, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-right-2 duration-300">
                      <span className="text-xs font-bold text-slate-400">Trial {history.length - i}</span>
                      <span className="font-black font-mono text-slate-700 dark:text-slate-300">{time}ms</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="w-full py-3 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> About Human Reaction
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            The average human reaction time is about 273 milliseconds. This test measures the time it takes for a signal to go from your eyes to your brain and then to your finger.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" /> Tips for Speed
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ensure you have a stable connection and a high-refresh-rate monitor for the best results. Using a physical mouse is usually faster than a laptop trackpad.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
