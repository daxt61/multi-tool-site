import { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, Download, Info, Settings2, Trash2, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DEFAULT_EXPECTANCY = 80;
const MAX_EXPECTANCY = 100;

export function LifeCalendar({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [birthDate, setBirthDate] = useState<string>(initialData?.birthDate || '');
  const [expectancy, setExpectancy] = useState<number>(initialData?.expectancy || DEFAULT_EXPECTANCY);
  const [colorLived, setColorLived] = useState<string>(initialData?.colorLived || '#6366f1');
  const [colorRemaining, setColorRemaining] = useState<string>(initialData?.colorRemaining || '#e2e8f0');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ birthDate, expectancy, colorLived, colorRemaining });
  }, [birthDate, expectancy, colorLived, colorRemaining, onStateChange]);

  const stats = useMemo(() => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();

    if (isNaN(birth.getTime())) return null;

    const diffTime = Math.abs(today.getTime() - birth.getTime());
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    const totalWeeks = expectancy * 52;
    const remainingWeeks = Math.max(0, totalWeeks - diffWeeks);
    const progress = Math.min(100, (diffWeeks / totalWeeks) * 100);

    return {
      lived: diffWeeks,
      remaining: remainingWeeks,
      total: totalWeeks,
      progress: progress.toFixed(1),
      years: (diffWeeks / 52).toFixed(1)
    };
  }, [birthDate, expectancy]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !stats) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 60;
    const boxSize = 10;
    const gap = 4;
    const weeksPerRow = 52;
    const rows = expectancy;

    canvas.width = padding * 2 + weeksPerRow * (boxSize + gap) - gap;
    canvas.height = padding * 2 + rows * (boxSize + gap) - gap + 40;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Title
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Memento Mori - My Life in Weeks', padding, padding - 20);

    // Grid
    for (let i = 0; i < stats.total; i++) {
      const x = padding + (i % 52) * (boxSize + gap);
      const y = padding + Math.floor(i / 52) * (boxSize + gap);

      ctx.fillStyle = i < stats.lived ? colorLived : colorRemaining;
      ctx.fillRect(x, y, boxSize, boxSize);
    }

    // Legend
    const legendY = canvas.height - 30;
    ctx.fillStyle = colorLived;
    ctx.fillRect(padding, legendY, boxSize, boxSize);
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Weeks lived: ${stats.lived} / ${stats.total} (${stats.progress}%)`, padding + boxSize + 10, legendY + 9);

    const link = document.createElement('a');
    link.download = `life-calendar-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
              </div>
              <button
                onClick={() => { setBirthDate(''); setExpectancy(DEFAULT_EXPECTANCY); }}
                className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-3 h-3 inline mr-1" /> {t('common.clear')}
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="birth-date" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('lifecalendar.birth_date', 'Birth Date')}</label>
                <input
                  id="birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="expectancy" className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('lifecalendar.expectancy', 'Life Expectancy')}</label>
                  <span className="text-xs font-bold text-indigo-500">{expectancy} {t('agecalculator.years')}</span>
                </div>
                <input
                  id="expectancy"
                  type="range"
                  min="1"
                  max={MAX_EXPECTANCY}
                  value={expectancy}
                  onChange={(e) => setExpectancy(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('lifecalendar.lived_color')}</label>
                  <input
                    type="color"
                    value={colorLived}
                    onChange={(e) => setColorLived(e.target.value)}
                    className="w-full h-10 rounded-xl cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('lifecalendar.left_color')}</label>
                  <input
                    type="color"
                    value={colorRemaining}
                    onChange={(e) => setColorRemaining(e.target.value)}
                    className="w-full h-10 rounded-xl cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {stats && (
              <button
                onClick={handleDownload}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-5 h-5" /> {t('common.download')} Image
              </button>
            )}
          </div>

          {stats && (
            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
               <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Heart className="w-4 h-4 text-rose-500" /> Statistics
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="text-2xl font-black dark:text-white">{stats.lived}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t('lifecalendar.weeks_lived')}</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="text-2xl font-black dark:text-white">{stats.remaining}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{t('lifecalendar.weeks_left')}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-slate-400">{t('lifecalendar.progress')}</span>
                  <span className="text-indigo-500">{stats.progress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${stats.progress}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Calendar View */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Calendar className="w-4 h-4 text-indigo-500" /> {t('lifecalendar.title_grid')}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-4 md:p-8 flex flex-col items-center overflow-auto max-h-[800px] no-scrollbar">
            {!stats ? (
              <div className="h-96 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                  <Calendar className="w-8 h-8" />
                </div>
                <p className="text-slate-400 font-medium italic">{t('lifecalendar.waiting', 'Enter your birth date to see your life calendar.')}</p>
              </div>
            ) : (
              <div className="inline-grid grid-cols-[auto_1fr] gap-4">
                {/* Year indicators */}
                <div className="flex flex-col gap-[2px] pt-4">
                   {Array.from({ length: expectancy }).map((_, i) => (
                     i % 5 === 0 ? <div key={i} className="h-2 text-[8px] font-bold text-slate-400 flex items-center justify-end pr-2" style={{ marginTop: i === 0 ? 0 : '14px' }}>{i}</div> : null
                   ))}
                </div>
                {/* The actual grid */}
                <div className="flex flex-wrap gap-[2px] w-[520px] md:w-[624px]">
                  {Array.from({ length: stats.total }).map((_, i) => (
                    <div
                      key={i}
                      title={`Year ${Math.floor(i / 52)}, Week ${(i % 52) + 1}`}
                      className="w-2 h-2 rounded-[1px] transition-colors duration-500 hover:scale-150 relative z-10"
                      style={{ backgroundColor: i < stats.lived ? colorLived : colorRemaining }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('lifecalendar.about_title', 'About Life Calendar')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('lifecalendar.about_text', 'A Life Calendar, also known as a Memento Mori chart, represents your life in weeks. Each square is one week of your life. This tool helps visualize time and provides perspective on how much life has been lived and how much might remain based on average life expectancy. It is a powerful reminder to value every moment.')}
          </p>
        </div>
      </div>
    </div>
  );
}
