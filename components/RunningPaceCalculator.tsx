import { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, Clock, Ruler, Timer, Table, Info, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Unit = 'km' | 'mi';

export function RunningPaceCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  const [distance, setDistance] = useState<string>(initialData?.distance || '5');
  const [unit, setUnit] = useState<Unit>(initialData?.unit || 'km');

  const [hours, setHours] = useState<string>(initialData?.hours || '0');
  const [minutes, setMinutes] = useState<string>(initialData?.minutes || '25');
  const [seconds, setSeconds] = useState<string>(initialData?.seconds || '0');

  const [paceMinutes, setPaceMinutes] = useState<string>(initialData?.paceMinutes || '5');
  const [paceSeconds, setPaceSeconds] = useState<string>(initialData?.paceSeconds || '00');

  useEffect(() => {
    onStateChange?.({ distance, unit, hours, minutes, seconds, paceMinutes, paceSeconds });
  }, [distance, unit, hours, minutes, seconds, paceMinutes, paceSeconds, onStateChange]);

  const totalSeconds = useMemo(() => {
    return (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
  }, [hours, minutes, seconds]);

  const paceInSecondsPerUnit = useMemo(() => {
    const dist = parseFloat(distance);
    if (!dist || totalSeconds <= 0) return 0;
    return totalSeconds / dist;
  }, [distance, totalSeconds]);

  const calculatedPace = useMemo(() => {
    if (paceInSecondsPerUnit <= 0) return { min: 0, sec: 0 };
    return {
      min: Math.floor(paceInSecondsPerUnit / 60),
      sec: Math.round(paceInSecondsPerUnit % 60)
    };
  }, [paceInSecondsPerUnit]);

  const handleReset = () => {
    setDistance('5');
    setUnit('km');
    setHours('0');
    setMinutes('25');
    setSeconds('0');
    setPaceMinutes('5');
    setPaceSeconds('00');
  };

  const commonDistances = [
    { name: '5K', val: 5, unit: 'km' },
    { name: '10K', val: 10, unit: 'km' },
    { name: 'Half Marathon', val: 21.0975, unit: 'km' },
    { name: 'Marathon', val: 42.195, unit: 'km' },
    { name: '5 Miles', val: 5, unit: 'mi' },
    { name: '10 Miles', val: 10, unit: 'mi' },
  ];

  const splits = useMemo(() => {
    const dist = parseFloat(distance);
    if (!dist || paceInSecondsPerUnit <= 0) return [];
    const items = [];
    const maxSplits = Math.min(Math.ceil(dist), 50);

    for (let i = 1; i <= maxSplits; i++) {
        const currentDist = i === maxSplits ? dist : i;
        const totalSecs = paceInSecondsPerUnit * currentDist;
        const h = Math.floor(totalSecs / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = Math.round(totalSecs % 60);

        items.push({
            dist: currentDist,
            time: `${h > 0 ? h + ':' : ''}${m < 10 && h > 0 ? '0' + m : m}:${s < 10 ? '0' + s : s}`
        });
        if (i === maxSplits) break;
    }
    return items;
  }, [distance, paceInSecondsPerUnit]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Distance */}
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Ruler className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('runningpace.distance', 'Distance')}</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none cursor-pointer"
              >
                <option value="km">km</option>
                <option value="mi">mi</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {commonDistances.map(d => (
                <button
                  key={d.name}
                  onClick={() => { setDistance(d.val.toString()); setUnit(d.unit as Unit); }}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white transition-all rounded-lg text-[10px] font-black uppercase tracking-tighter"
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('runningpace.time', 'Time')}</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 px-1">HH</label>
                <input type="number" value={hours} onChange={e => setHours(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 px-1">MM</label>
                <input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 px-1">SS</label>
                <input type="number" value={seconds} onChange={e => setSeconds(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-mono font-bold" />
              </div>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-all rounded-2xl font-bold text-sm flex items-center justify-center gap-2 group"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform" />
            {t('common.reset')}
          </button>
        </div>

        <div className="space-y-6">
          {/* Pace Display */}
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 flex flex-col items-center justify-center text-center space-y-2">
            <Timer className="w-8 h-8 mb-2 opacity-50" />
            <h4 className="text-sm font-black uppercase tracking-widest opacity-80">{t('runningpace.calculated_pace', 'Calculated Pace')}</h4>
            <div className="text-6xl font-black font-mono tracking-tighter">
              {calculatedPace.min}:{calculatedPace.sec < 10 ? '0' + calculatedPace.sec : calculatedPace.sec}
            </div>
            <p className="text-indigo-200 font-bold">min / {unit}</p>
          </div>

          {/* Speed conversion */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Speed</div>
                <div className="text-xl font-black">{paceInSecondsPerUnit > 0 ? (3600 / paceInSecondsPerUnit).toFixed(2) : '0.00'} {unit}/h</div>
             </div>
             <div className="bg-white dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pace (Other)</div>
                <div className="text-xl font-black">
                    {paceInSecondsPerUnit > 0 ? (
                        unit === 'km'
                        ? `${Math.floor(paceInSecondsPerUnit * 1.60934 / 60)}:${Math.round((paceInSecondsPerUnit * 1.60934) % 60).toString().padStart(2, '0')}`
                        : `${Math.floor(paceInSecondsPerUnit / 1.60934 / 60)}:${Math.round((paceInSecondsPerUnit / 1.60934) % 60).toString().padStart(2, '0')}`
                    ) : '0:00'} min/{unit === 'km' ? 'mi' : 'km'}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Splits Table */}
      {splits.length > 0 && (
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
             <Table className="w-5 h-5 text-indigo-500" />
             <span className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">{t('runningpace.splits', 'Splits')}</span>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-4 py-3 font-black uppercase text-[10px] tracking-widest">{t('runningpace.split_unit', 'Split')} ({unit})</th>
                        <th className="px-4 py-3 font-black uppercase text-[10px] tracking-widest">{t('runningpace.split_time', 'Time')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {splits.map((s, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-slate-500 dark:text-slate-400">{s.dist}</td>
                            <td className="px-4 py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.time}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-900/20 p-6 rounded-[2rem] flex gap-4">
        <Info className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="space-y-1">
          <h4 className="font-bold text-amber-900 dark:text-amber-100">{t('runningpace.about_title', 'Running Pace Calculator')}</h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
            {t('runningpace.about_text', 'Plan your next race or training session. Enter the distance and your target time to see the required pace and kilometer/mile splits. All calculations are performed instantly as you type.')}
          </p>
        </div>
      </div>
    </div>
  );
}
