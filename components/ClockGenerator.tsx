import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Settings2, Download, Trash2, Palette, Type, Info, Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ClockGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [type, setType] = useState<'analog' | 'digital'>(initialData?.type || 'analog');
  const [bgColor, setBgColor] = useState(initialData?.bgColor || '#ffffff');
  const [handColor, setHandColor] = useState(initialData?.handColor || '#000000');
  const [numberColor, setNumberColor] = useState(initialData?.numberColor || '#000000');
  const [showSeconds, setShowSeconds] = useState(initialData?.showSeconds ?? true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ type, bgColor, handColor, numberColor, showSeconds });
  }, [type, bgColor, handColor, numberColor, showSeconds, onStateChange]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const drawClock = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || type === 'digital') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = canvas.height / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(radius, radius);
    const drawRadius = radius * 0.9;

    // Background
    ctx.beginPath();
    ctx.arc(0, 0, drawRadius, 0, 2 * Math.PI);
    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.strokeStyle = handColor;
    ctx.lineWidth = drawRadius * 0.05;
    ctx.stroke();

    // Numbers
    ctx.font = `${drawRadius * 0.15}px arial`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = numberColor;
    for (let num = 1; num <= 12; num++) {
      const ang = (num * Math.PI) / 6;
      ctx.rotate(ang);
      ctx.translate(0, -drawRadius * 0.85);
      ctx.rotate(-ang);
      ctx.fillText(num.toString(), 0, 0);
      ctx.rotate(ang);
      ctx.translate(0, drawRadius * 0.85);
      ctx.rotate(-ang);
    }

    // Time
    const now = currentTime;
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();

    // Hour hand
    const hourPos = ((hour % 12) * Math.PI) / 6 + (minute * Math.PI) / (6 * 60) + (second * Math.PI) / (360 * 60);
    drawHand(ctx, hourPos, drawRadius * 0.5, drawRadius * 0.07);

    // Minute hand
    const minutePos = (minute * Math.PI) / 30 + (second * Math.PI) / (30 * 60);
    drawHand(ctx, minutePos, drawRadius * 0.8, drawRadius * 0.07);

    // Second hand
    if (showSeconds) {
      const secondPos = (second * Math.PI) / 30;
      ctx.strokeStyle = '#ef4444'; // Standard red for seconds
      drawHand(ctx, secondPos, drawRadius * 0.9, drawRadius * 0.02);
    }

    // Center point
    ctx.beginPath();
    ctx.arc(0, 0, drawRadius * 0.05, 0, 2 * Math.PI);
    ctx.fillStyle = handColor;
    ctx.fill();
  }, [type, bgColor, handColor, numberColor, showSeconds, currentTime]);

  function drawHand(ctx: CanvasRenderingContext2D, pos: number, length: number, width: number) {
    ctx.beginPath();
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.moveTo(0, 0);
    ctx.rotate(pos);
    ctx.lineTo(0, -length);
    ctx.stroke();
    ctx.rotate(-pos);
  }

  useEffect(() => {
    drawClock();
  }, [drawClock]);

  const handleDownload = () => {
    if (type === 'analog') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `analog-clock-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Preview Section */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-12 flex items-center justify-center min-h-[500px]">
            {type === 'analog' ? (
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className="max-w-full h-auto drop-shadow-2xl"
              />
            ) : (
              <div
                className="text-7xl md:text-8xl font-black font-mono tracking-tighter transition-all"
                style={{ color: numberColor, backgroundColor: bgColor, padding: '2rem', borderRadius: '2rem' }}
              >
                {currentTime.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: showSeconds ? '2-digit' : undefined,
                  hour12: false
                })}
              </div>
            )}
          </div>

          {type === 'analog' && (
            <div className="flex justify-center">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-5 h-5" /> {t('common.download')} PNG
              </button>
            </div>
          )}
        </div>

        {/* Customization Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setType('analog')}
                className={`p-4 rounded-2xl border-2 transition-all text-center space-y-2 ${type === 'analog' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <Clock className={`w-6 h-6 mx-auto ${type === 'analog' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`block text-xs font-black uppercase tracking-widest ${type === 'analog' ? 'text-indigo-600' : 'text-slate-500'}`}>{t('clock.analog', 'Analog')}</span>
              </button>
              <button
                onClick={() => setType('digital')}
                className={`p-4 rounded-2xl border-2 transition-all text-center space-y-2 ${type === 'digital' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-transparent bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                <Type className={`w-6 h-6 mx-auto ${type === 'digital' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`block text-xs font-black uppercase tracking-widest ${type === 'digital' ? 'text-indigo-600' : 'text-slate-500'}`}>{t('clock.digital', 'Digital')}</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('clock.show_seconds', 'Show Seconds')}</label>
                <button
                  onClick={() => setShowSeconds(!showSeconds)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${showSeconds ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${showSeconds ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('clock.bg_color', 'Background')}</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                    <span className="text-xs font-mono font-bold uppercase">{bgColor}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('clock.text_color', 'Numbers')}</label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <input type="color" value={numberColor} onChange={(e) => setNumberColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                    <span className="text-xs font-mono font-bold uppercase">{numberColor}</span>
                  </div>
                </div>
                {type === 'analog' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('clock.hand_color', 'Hands')}</label>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <input type="color" value={handColor} onChange={(e) => setHandColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                      <span className="text-xs font-mono font-bold uppercase">{handColor}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-2xl flex items-start gap-4">
            <Info className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold dark:text-white">{t('clock.how_title', 'About Clock Generator')}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('clock.how_text', 'Create your own personalized clock. Customize colors, toggle the second hand, and choose between analog and digital styles. For the analog version, you can even download the result as a PNG image for your projects.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
