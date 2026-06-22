import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Sliders, Info, Shield, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LorentzAttractor({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sigma, setSigma] = useState(initialData?.sigma || 10);
  const [rho, setRho] = useState(initialData?.rho || 28);
  const [beta, setBeta] = useState(initialData?.beta || 8 / 3);
  const [isRunning, setIsRunning] = useState(true);
  const [hue, setHue] = useState(200);

  const stateRef = useRef({ x: 0.1, y: 0, z: 0 });
  const pointsRef = useRef<{ x: number, y: number, z: number, h: number }[]>([]);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    onStateChange?.({ sigma, rho, beta });
  }, [sigma, rho, beta, onStateChange]);

  const resetSimulation = useCallback(() => {
    stateRef.current = { x: 0.1, y: 0, z: 0 };
    pointsRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const step = useCallback(() => {
    if (!isRunning) return;

    const dt = 0.01;
    const { x, y, z } = stateRef.current;

    const dx = sigma * (y - x) * dt;
    const dy = (x * (rho - z) - y) * dt;
    const dz = (x * y - beta * z) * dt;

    stateRef.current = {
      x: x + dx,
      y: y + dy,
      z: z + dz
    };

    pointsRef.current.push({ ...stateRef.current, h: (hue + pointsRef.current.length / 10) % 360 });
    if (pointsRef.current.length > 5000) pointsRef.current.shift();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = 12;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 50;

    ctx.lineWidth = 1;
    for (let i = 1; i < pointsRef.current.length; i++) {
      const p1 = pointsRef.current[i - 1];
      const p2 = pointsRef.current[i];

      // Simple 3D to 2D projection (ignoring perspective for the classic look)
      const x1 = cx + p1.x * scale;
      const y1 = cy - p1.z * scale;
      const x2 = cx + p2.x * scale;
      const y2 = cy - p2.z * scale;

      ctx.strokeStyle = `hsla(${p2.h}, 80%, 60%, ${i / pointsRef.current.length})`;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    requestRef.current = requestAnimationFrame(step);
  }, [isRunning, sigma, rho, beta, hue]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(step);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [step]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="flex gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all ${
              isRunning
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            {isRunning ? t('common.pause') : t('common.play')}
          </button>
          <button
            onClick={resetSimulation}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{t('lorentz.sigma')}</label>
             <input
               type="range" min="0" max="50" step="0.1" value={sigma}
               onChange={(e) => setSigma(Number(e.target.value))}
               className="w-24 accent-indigo-500"
             />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{t('lorentz.rho')}</label>
             <input
               type="range" min="0" max="100" step="0.1" value={rho}
               onChange={(e) => setRho(Number(e.target.value))}
               className="w-24 accent-indigo-500"
             />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{t('lorentz.beta')}</label>
             <input
               type="range" min="0" max="10" step="0.1" value={beta}
               onChange={(e) => setBeta(Number(e.target.value))}
               className="w-24 accent-indigo-500"
             />
          </div>
          <div className="space-y-1">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{t('lorentz.color')}</label>
             <input
               type="range" min="0" max="360" value={hue}
               onChange={(e) => { setHue(Number(e.target.value)); resetSimulation(); }}
               className="w-24 accent-indigo-500"
             />
          </div>
        </div>
      </div>

      <div className="bg-black rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full aspect-[4/3] cursor-crosshair"
        />
        <div className="absolute top-6 left-6 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 pointer-events-none">
           <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{t('lorentz.status')}</div>
           <div className="text-white font-bold flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
             {isRunning ? t('lorentz.calculating') : t('lorentz.paused')}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('lorentz.about_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('lorentz.about_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" /> {t('lorentz.chaos_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('lorentz.chaos_desc')}
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
