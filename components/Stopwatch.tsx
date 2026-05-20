import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Timer, Flag, Download, Trash2, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Lap {
  id: number;
  time: number;
  overallTime: number;
}

export function Stopwatch({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>(initialData?.laps || []);
  const startTimeRef = useRef<number>(0);
  const requestRef = useRef<number>();

  const update = useCallback(() => {
    if (isRunning) {
      const now = performance.now();
      setTime(now - startTimeRef.current);
      requestRef.current = requestAnimationFrame(update);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now() - time;
      requestRef.current = requestAnimationFrame(update);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning, update]);

  useEffect(() => {
    onStateChange?.({ laps });
  }, [laps, onStateChange]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);

    return {
      h: hours.toString().padStart(2, '0'),
      m: minutes.toString().padStart(2, '0'),
      s: seconds.toString().padStart(2, '0'),
      ms: milliseconds.toString().padStart(2, '0')
    };
  };

  const handleStartPause = () => setIsRunning(!isRunning);

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };

  const handleLap = () => {
    const lastLapTime = laps.length > 0 ? laps[0].overallTime : 0;
    const newLap: Lap = {
      id: laps.length + 1,
      time: time - lastLapTime,
      overallTime: time
    };
    setLaps([newLap, ...laps]);
  };

  const handleDownload = () => {
    if (laps.length === 0) return;
    const { h, m, s, ms } = formatTime(time);
    let content = `Total Time: ${h}:${m}:${s}.${ms}\n\nLaps:\n`;
    laps.forEach(lap => {
      const lt = formatTime(lap.time);
      const ot = formatTime(lap.overallTime);
      content += `Lap ${lap.id}: ${lt.h}:${lt.m}:${lt.s}.${lt.ms} (Total: ${ot.h}:${ot.m}:${ot.s}.${ot.ms})\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stopwatch-laps-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const times = formatTime(time);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Main Display */}
      <div className="bg-slate-900 dark:bg-black p-12 md:p-20 rounded-[3rem] shadow-2xl shadow-indigo-500/10 text-center space-y-12 border border-white/5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
          <Timer className="w-3 h-3" /> {t('stopwatch.title', 'Precision Stopwatch')}
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-baseline gap-2 font-mono font-black text-white">
            <span className="text-6xl md:text-8xl tabular-nums">{times.h}:{times.m}:{times.s}</span>
            <span className="text-3xl md:text-5xl text-indigo-500 tabular-nums">.{times.ms}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={handleStartPause}
            className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl ${
              isRunning
                ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600'
                : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
            }`}
          >
            {isRunning ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-current translate-x-0.5" />}
          </button>

          <button
            onClick={handleLap}
            disabled={time === 0}
            className="w-20 h-20 md:w-24 md:h-24 bg-white/10 text-white rounded-full flex items-center justify-center transition-all active:scale-95 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
            title={t('stopwatch.lap', 'Lap')}
          >
            <Flag className="w-8 h-8 md:w-10 md:h-10" />
          </button>

          <button
            onClick={handleReset}
            disabled={time === 0}
            className="w-20 h-20 md:w-24 md:h-24 bg-white/10 text-white rounded-full flex items-center justify-center transition-all active:scale-95 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
            title={t('common.reset', 'Reset')}
          >
            <RotateCcw className="w-8 h-8 md:w-10 md:h-10" />
          </button>
        </div>
      </div>

      {/* Laps List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <List className="w-4 h-4 text-indigo-500" /> {t('stopwatch.laps_count', { count: laps.length })}
          </h3>
          <div className="flex gap-2">
            {laps.length > 0 && (
              <button
                onClick={handleDownload}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
              >
                <Download className="w-3.5 h-3.5" /> {t('common.download', 'Export')}
              </button>
            )}
            <button
              onClick={() => setLaps([])}
              disabled={laps.length === 0}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('common.clear', 'Clear Laps')}
            </button>
          </div>
        </div>

        {laps.length > 0 ? (
          <div className="overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm">
            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <tr>
                    <th className="px-8 py-4">{t('stopwatch.lap_id', 'Lap')}</th>
                    <th className="px-8 py-4">{t('stopwatch.lap_time', 'Time')}</th>
                    <th className="px-8 py-4 text-right">{t('stopwatch.lap_total', 'Total Time')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {laps.map((lap) => {
                    const lt = formatTime(lap.time);
                    const ot = formatTime(lap.overallTime);
                    return (
                      <tr key={lap.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
                        <td className="px-8 py-4 font-bold text-slate-400">#{lap.id}</td>
                        <td className="px-8 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {lt.h !== '00' && <span>{lt.h}:</span>}{lt.m}:{lt.s}<span className="text-[10px] opacity-70">.{lt.ms}</span>
                        </td>
                        <td className="px-8 py-4 text-right font-mono font-bold dark:text-white">
                           {ot.h}:{ot.m}:{ot.s}<span className="text-[10px] text-slate-400">.{ot.ms}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-slate-400 space-y-4">
             <Flag className="w-12 h-12 mx-auto opacity-10" />
             <p className="text-sm font-bold uppercase tracking-widest opacity-40">{t('stopwatch.no_laps', 'No laps recorded')}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
         <div className="space-y-3">
            <h4 className="font-black flex items-center gap-2 dark:text-white uppercase tracking-tight">
               <Timer className="w-4 h-4 text-indigo-500" /> {t('stopwatch.how_it_works', 'High Precision')}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
               This stopwatch uses the <code>performance.now()</code> API to provide sub-millisecond precision. Laps are calculated relative to the previous lap for accurate split times.
            </p>
         </div>
         <div className="space-y-3">
            <h4 className="font-black flex items-center gap-2 dark:text-white uppercase tracking-tight">
               <Download className="w-4 h-4 text-indigo-500" /> {t('stopwatch.export_title', 'Export Data')}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
               Easily export your lap times to a text file for further analysis. Perfect for tracking sports performance or debugging time-sensitive processes.
            </p>
         </div>
      </div>
    </div>
  );
}
