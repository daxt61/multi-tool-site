import { useState, useMemo, useEffect } from 'react';
import { Clock, Copy, Check, RotateCcw, Info, Trash2, Hash, AlignLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function AverageTimeCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const stats = useMemo(() => {
    const lines = input.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (lines.length === 0) return null;

    let totalSeconds = 0;
    let validCount = 0;

    lines.forEach(line => {
      // Matches HH:MM or HH:MM:SS or HH:MM:SS.mmm
      const match = line.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
      if (match) {
        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = match[3] ? parseInt(match[3]) : 0;

        if (hours < 24 && minutes < 60 && seconds < 60) {
          totalSeconds += (hours * 3600) + (minutes * 60) + seconds;
          validCount++;
        }
      }
    });

    if (validCount === 0) return null;

    const avgSeconds = Math.round(totalSeconds / validCount);
    const h = Math.floor(avgSeconds / 3600);
    const m = Math.floor((avgSeconds % 3600) / 60);
    const s = avgSeconds % 60;

    const format = (val: number) => val.toString().padStart(2, '0');

    return {
      average: `${format(h)}:${format(m)}:${format(s)}`,
      count: validCount,
      total: `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m ${totalSeconds % 60}s`
    };
  }, [input]);

  const handleClear = () => {
    setInput('');
  };

  const handleCopy = () => {
    if (!stats) return;
    navigator.clipboard.writeText(stats.average);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="times-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock className="w-3 h-3" /> {t('averagetime.input_label', 'Clock Times (One per line)')}
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <RotateCcw className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <div className="relative">
            <textarea
              id="times-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-xl font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white resize-none"
              placeholder="12:00&#10;14:30&#10;09:15"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-3 h-3" /> {t('averagetime.result_label', 'Average Time')}
            </label>
            <button
              onClick={handleCopy}
              disabled={!stats}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                copied ? 'bg-emerald-50 text-emerald-600' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100'
              } disabled:opacity-50`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>

          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 min-h-[200px] flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full -ml-16 -mt-16 blur-3xl"></div>
            {stats ? (
              <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
                <p className="text-5xl md:text-6xl font-black text-white font-mono tracking-tighter">
                  {stats.average}
                </p>
                <div className="flex gap-4 justify-center">
                  <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">{t('common.count')}</span>
                    <span className="text-sm font-bold text-indigo-400">{stats.count}</span>
                  </div>
                  <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">{t('averagetime.total', 'Total')}</span>
                    <span className="text-sm font-bold text-indigo-400">{stats.total}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 font-bold italic">{t('averagetime.waiting', 'Enter valid times to see average...')}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <AlignLeft className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="text-xs">
                  <p className="font-black text-slate-400 uppercase tracking-widest mb-1">{t('averagetime.format_title', 'Supported Formats')}</p>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">HH:MM, HH:MM:SS</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('averagetime.about_title', 'About Average Time')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('averagetime.about_text', 'This utility calculates the arithmetic mean of a list of clock times. It is useful for finding the average duration of tasks, average arrival times, or center of a time range. Ensure each time is on a new line.')}
          </p>
        </div>
      </div>
    </div>
  );
}
