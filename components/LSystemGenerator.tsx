import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Settings2, Download, Trash2, RefreshCw,
  Maximize, Play, Info, AlertCircle, Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Rule {
  char: string;
  replacement: string;
}

interface LSystemPreset {
  name: string;
  axiom: string;
  rules: Rule[];
  angle: number;
  iterations: number;
}

const PRESETS: Record<string, LSystemPreset> = {
  koch_snowflake: {
    name: 'Koch Snowflake',
    axiom: 'F++F++F',
    rules: [{ char: 'F', replacement: 'F-F++F-F' }],
    angle: 60,
    iterations: 4
  },
  dragon_curve: {
    name: 'Dragon Curve',
    axiom: 'FX',
    rules: [
      { char: 'X', replacement: 'X+YF+' },
      { char: 'Y', replacement: '-FX-Y' }
    ],
    angle: 90,
    iterations: 10
  },
  sierpinski_triangle: {
    name: 'Sierpinski Triangle',
    axiom: 'F-G-G',
    rules: [
      { char: 'F', replacement: 'F-G+F+G-F' },
      { char: 'G', replacement: 'GG' }
    ],
    angle: 120,
    iterations: 5
  },
  plant: {
    name: 'Fractal Plant',
    axiom: 'X',
    rules: [
      { char: 'X', replacement: 'F+[[X]-X]-F[-FX]+X' },
      { char: 'F', replacement: 'FF' }
    ],
    angle: 25,
    iterations: 5
  },
  levy_curve: {
    name: 'Levy C Curve',
    axiom: 'F',
    rules: [{ char: 'F', replacement: '+F--F+' }],
    angle: 45,
    iterations: 10
  }
};

export function LSystemGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [axiom, setAxiom] = useState(initialData?.axiom || PRESETS.koch_snowflake.axiom);
  const [rules, setRules] = useState<Rule[]>(initialData?.rules || PRESETS.koch_snowflake.rules);
  const [iterations, setIterations] = useState(initialData?.iterations ?? PRESETS.koch_snowflake.iterations);
  const [angle, setAngle] = useState(initialData?.angle ?? PRESETS.koch_snowflake.angle);
  const [color, setColor] = useState(initialData?.color || '#6366f1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ axiom, rules, iterations, angle, color });
  }, [axiom, rules, iterations, angle, color, onStateChange]);

  const generateSystem = useCallback(() => {
    let current = axiom;
    const ruleMap: Record<string, string> = {};
    rules.forEach(r => {
      if (r.char) ruleMap[r.char] = r.replacement;
    });

    for (let i = 0; i < iterations; i++) {
      let next = '';
      for (const char of current) {
        next += ruleMap[char] || char;
      }
      current = next;
      if (current.length > 500000) break; // Limit size
    }
    return current;
  }, [axiom, rules, iterations]);

  const drawSystem = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsProcessing(true);
    setError(null);

    // Give the browser a chance to update UI before heavy calculation
    setTimeout(() => {
      try {
        const instructions = generateSystem();
        const rad = (angle * Math.PI) / 180;

        // First pass: Calculate bounds to auto-scale and center
        let x = 0, y = 0, currentAngle = -Math.PI / 2;
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        const stack: { x: number; y: number; angle: number }[] = [];

        for (const char of instructions) {
          if (char === 'F' || char === 'G') {
            x += Math.cos(currentAngle);
            y += Math.sin(currentAngle);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          } else if (char === '+') {
            currentAngle += rad;
          } else if (char === '-') {
            currentAngle -= rad;
          } else if (char === '[') {
            stack.push({ x, y, angle: currentAngle });
          } else if (char === ']') {
            const state = stack.pop();
            if (state) {
              x = state.x;
              y = state.y;
              currentAngle = state.angle;
            }
          }
        }

        // Setup canvas
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, rect.width, rect.height);

        const margin = 40;
        const drawWidth = rect.width - margin * 2;
        const drawHeight = rect.height - margin * 2;
        const systemWidth = maxX - minX || 1;
        const systemHeight = maxY - minY || 1;

        const scale = Math.min(drawWidth / systemWidth, drawHeight / systemHeight);

        // Center the drawing
        const offsetX = margin + (drawWidth - systemWidth * scale) / 2 - minX * scale;
        const offsetY = margin + (drawHeight - systemHeight * scale) / 2 - minY * scale;

        // Second pass: Draw
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(0.5, 1 / scale);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        x = 0; y = 0; currentAngle = -Math.PI / 2;
        ctx.moveTo(x * scale + offsetX, y * scale + offsetY);

        for (const char of instructions) {
          if (char === 'F' || char === 'G') {
            x += Math.cos(currentAngle);
            y += Math.sin(currentAngle);
            ctx.lineTo(x * scale + offsetX, y * scale + offsetY);
          } else if (char === '+') {
            currentAngle += rad;
          } else if (char === '-') {
            currentAngle -= rad;
          } else if (char === '[') {
            stack.push({ x, y, angle: currentAngle });
          } else if (char === ']') {
            const state = stack.pop();
            if (state) {
              x = state.x;
              y = state.y;
              currentAngle = state.angle;
              ctx.moveTo(x * scale + offsetX, y * scale + offsetY);
            }
          }
        }
        ctx.stroke();
      } catch (err) {
        console.error(err);
        setError(t('lsystem.error_draw'));
      } finally {
        setIsProcessing(false);
      }
    }, 10);
  }, [generateSystem, angle, color, t]);

  useEffect(() => {
    drawSystem();
  }, [drawSystem]);

  const handlePreset = (key: string) => {
    const p = PRESETS[key];
    setAxiom(p.axiom);
    setRules([...p.rules]);
    setAngle(p.angle);
    setIterations(p.iterations);
  };

  const addRule = () => setRules([...rules, { char: '', replacement: '' }]);
  const removeRule = (idx: number) => setRules(rules.filter((_, i) => i !== idx));
  const updateRule = (idx: number, field: keyof Rule, val: string) => {
    const newRules = [...rules];
    newRules[idx] = { ...newRules[idx], [field]: val };
    setRules(newRules);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `lsystem-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
              </div>
              <button
                onClick={() => handlePreset('koch_snowflake')}
                className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors"
              >
                {t('common.reset')}
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('lsystem.presets')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PRESETS).map(([key, p]) => (
                    <button
                      key={key}
                      onClick={() => handlePreset(key)}
                      className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:border-indigo-500 transition-all text-left truncate"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="axiom" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('lsystem.axiom')}</label>
                <input
                  id="axiom"
                  type="text"
                  value={axiom}
                  onChange={(e) => setAxiom(e.target.value.toUpperCase())}
                  className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                  placeholder="F++F++F"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('lsystem.rules')}</label>
                  <button onClick={addRule} className="text-indigo-600 hover:text-indigo-700 text-[10px] font-black uppercase tracking-widest">+ {t('common.add')}</button>
                </div>
                {rules.map((rule, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      value={rule.char}
                      onChange={(e) => updateRule(idx, 'char', e.target.value.toUpperCase())}
                      className="w-12 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-center text-sm font-bold dark:text-white"
                      placeholder="F"
                    />
                    <span className="text-slate-400 font-bold">=</span>
                    <input
                      value={rule.replacement}
                      onChange={(e) => updateRule(idx, 'replacement', e.target.value.toUpperCase())}
                      className="flex-1 p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-bold dark:text-white"
                      placeholder="F-F++F-F"
                    />
                    <button onClick={() => removeRule(idx)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="angle" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('lsystem.angle')} (°)</label>
                  <input
                    id="angle"
                    type="number"
                    value={angle}
                    onChange={(e) => setAngle(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="iters" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('lsystem.iterations')}</label>
                  <input
                    id="iters"
                    type="number"
                    min="1"
                    max="10"
                    value={iterations}
                    onChange={(e) => setIterations(Math.min(10, parseInt(e.target.value) || 1))}
                    className="w-full p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="color" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('lsystem.color')}</label>
                <div className="flex gap-3">
                  <input
                    id="color"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-12 rounded-xl border-2 border-white dark:border-slate-800 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 p-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-bold uppercase dark:text-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={drawSystem}
              disabled={isProcessing}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {t('lsystem.render')}
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Maximize className="w-4 h-4 text-indigo-500" /> {t('common.output')}
            </div>
            <button
              onClick={handleDownload}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> {t('common.download')}
            </button>
          </div>

          <div className="relative aspect-square md:aspect-auto md:h-[700px] bg-slate-50 dark:bg-slate-900 border-4 border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-full"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-4">
                  <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mx-auto" />
                  <p className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 animate-pulse">{t('lsystem.calculating')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold dark:text-white">{t('lsystem.about_title')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('lsystem.about_text')}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white dark:bg-slate-800 text-emerald-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold dark:text-white">{t('lsystem.guide_title')}</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                { k: 'F / G', v: t('lsystem.guide_move') },
                { k: '+', v: t('lsystem.guide_left') },
                { k: '-', v: t('lsystem.guide_right') },
                { k: '[', v: t('lsystem.guide_push') },
                { k: ']', v: t('lsystem.guide_pop') },
              ].map(item => (
                <div key={item.k} className="flex justify-between text-xs border-b border-slate-200 dark:border-slate-800 pb-1">
                  <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{item.k}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{item.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
