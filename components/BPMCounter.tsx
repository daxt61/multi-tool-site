import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Music, RotateCcw, Copy, Check, Volume2, VolumeX, BarChart2, Activity, Zap, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export function BPMCounter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(initialData?.bpm || null);
  const [history, setHistory] = useState<{ time: number; bpm: number }[]>([]);
  const [isAnimate, setIsAnimate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const metronomeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    onStateChange?.({ bpm });
  }, [bpm, onStateChange]);

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const bpms = history.map(h => h.bpm);
    const min = Math.min(...bpms);
    const max = Math.max(...bpms);

    // Consistency calculation
    if (taps.length < 3) return { min, max, consistency: null };

    const intervals = [];
    for (let i = 1; i < taps.length; i++) {
      intervals.push(taps[i] - taps[i - 1]);
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    const consistency = Math.max(0, Math.min(100, Math.round(100 * (1 - stdDev / mean))));

    return { min, max, consistency };
  }, [history, taps]);

  const playClick = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.connect(envelope);
    envelope.connect(ctx.destination);

    envelope.gain.setValueAtTime(0, ctx.currentTime);
    envelope.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  const stopMetronome = useCallback(() => {
    if (metronomeTimeoutRef.current) {
      clearTimeout(metronomeTimeoutRef.current);
      metronomeTimeoutRef.current = null;
    }
  }, []);

  const scheduleMetronome = useCallback(() => {
    if (!isMetronomeOn || !bpm) {
      stopMetronome();
      return;
    }

    playClick();
    const interval = 60000 / bpm;
    metronomeTimeoutRef.current = window.setTimeout(scheduleMetronome, interval);
  }, [bpm, isMetronomeOn, playClick, stopMetronome]);

  useEffect(() => {
    if (isMetronomeOn && bpm) {
      scheduleMetronome();
    } else {
      stopMetronome();
    }
    return () => stopMetronome();
  }, [isMetronomeOn, bpm, scheduleMetronome, stopMetronome]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    setIsAnimate(true);
    setTimeout(() => setIsAnimate(false), 100);

    setTaps(prev => {
      const newTaps = [...prev, now].slice(-20); // Keep last 20 taps for better history
      if (newTaps.length < 2) return newTaps;

      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }

      const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
      const calculatedBpm = Math.round(60000 / averageInterval);

      setBpm(calculatedBpm);
      setHistory(h => [...h, { time: now, bpm: calculatedBpm }].slice(-20));

      return newTaps;
    });
  }, []);

  const handleCopy = useCallback(() => {
    if (bpm) {
      navigator.clipboard.writeText(bpm.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [bpm]);

  const handleDownloadCSV = () => {
    if (history.length === 0) return;
    let csv = `Time,BPM\n`;
    history.forEach(h => {
      csv += `${new Date(h.time).toISOString()},${h.bpm}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bpm-history-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reset = useCallback(() => {
    setTaps([]);
    setBpm(null);
    setHistory([]);
    setIsMetronomeOn(false);
    stopMetronome();
  }, [stopMetronome]);

  const handleTapRef = useRef(handleTap);
  const handleResetRef = useRef(reset);
  const handleCopyRef = useRef(handleCopy);

  useEffect(() => {
    handleTapRef.current = handleTap;
    handleResetRef.current = reset;
    handleCopyRef.current = handleCopy;
  }, [handleTap, reset, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleTapRef.current();
      } else if (e.key === 'Escape') {
        handleResetRef.current();
      } else if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey) {
        handleCopyRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Main Tap Area */}
        <div className="text-center space-y-8">
          <button
            className={`p-12 rounded-[3rem] border-4 transition-all duration-100 flex flex-col items-center justify-center aspect-square mx-auto w-full max-w-[320px] cursor-pointer select-none outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20 shadow-2xl ${
              isAnimate
                ? 'bg-indigo-600 border-indigo-400 scale-95 text-white shadow-indigo-500/40'
                : 'bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-700 text-slate-800 dark:text-white hover:border-indigo-300'
            }`}
            onClick={handleTap}
            aria-label={t('bpm.tap_label')}
          >
            <Music className={`w-12 h-12 mb-6 ${isAnimate ? 'text-white' : 'text-indigo-600'}`} />
            <div className="text-7xl font-black font-mono tracking-tighter" aria-live="polite">
              {bpm || '--'}
            </div>
            <div className="text-sm font-black uppercase tracking-[0.2em] mt-2 opacity-60">
              BPM
            </div>
            <div className="flex gap-1 items-center mt-6">
              <Kbd modifier={null} className="bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">Space</Kbd>
              <span className="text-[10px] font-bold text-slate-400">/</span>
              <Kbd modifier={null} className="bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">Enter</Kbd>
            </div>
          </button>

          <div className="flex justify-center gap-3">
            {bpm !== null && (
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? t('common.copied') : (
                  <>
                    {t('common.copy')}
                    <Kbd modifier={null} className="ml-1 bg-white/50 dark:bg-black/20 border-slate-200 dark:border-slate-700">C</Kbd>
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => {
                if (!audioContextRef.current) {
                  audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
                setIsMetronomeOn(!isMetronomeOn);
              }}
              disabled={!bpm}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none disabled:opacity-30 disabled:cursor-not-allowed ${
                isMetronomeOn
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              {isMetronomeOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              {t('bpm.metronome')}
            </button>
            <button
              onClick={reset}
              className="p-3 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl font-bold border border-transparent hover:border-rose-200 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 outline-none flex items-center gap-2"
              title={`${t('common.reset')} (Esc)`}
            >
              <RotateCcw className="w-6 h-6" />
              <Kbd modifier={null} className="bg-white/50 dark:bg-black/20 border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
            </button>
          </div>
        </div>

        {/* Stats and History */}
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-center gap-1">
                <Activity className="w-3 h-3" /> {t('common.min')}
              </div>
              <div className="text-2xl font-black font-mono text-slate-700 dark:text-white">
                {stats?.min || '--'}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-center gap-1">
                <Zap className="w-3 h-3" /> {t('common.max')}
              </div>
              <div className="text-2xl font-black font-mono text-slate-700 dark:text-white">
                {stats?.max || '--'}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t('bpm.consistency')}
              </div>
              <div className="text-2xl font-black font-mono text-indigo-500">
                {(stats && stats.consistency !== null) ? `${stats.consistency}%` : '--'}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 h-[280px] relative">
            <div className="absolute top-6 left-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <BarChart2 className="w-4 h-4 text-indigo-500" /> {t('bpm.history')}
            </div>
            {history.length > 1 ? (
              <>
                <button
                  onClick={handleDownloadCSV}
                  className="absolute top-6 right-8 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline z-10"
                >
                  {t('bpm.export_csv')}
                </button>
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 40, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-xl">
                            <p className="text-sm font-black text-indigo-500">{payload[0].value} BPM</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bpm"
                    stroke="#6366f1"
                    strokeWidth={4}
                    dot={{ fill: '#6366f1', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    animationDuration={300}
                  />
                </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium italic">
                {t('bpm.waiting_history')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('bpm.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bpm.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
