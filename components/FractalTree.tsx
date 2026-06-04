import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Download, RefreshCw, Sliders, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

interface TreeConfig {
  depth: number;
  branchLength: number;
  branchAngle: number;
  shrinkFactor: number;
  trunkThickness: number;
  randomness: number;
  trunkColor: string;
  leafColor: string;
}

const DEFAULT_CONFIG: TreeConfig = {
  depth: 10,
  branchLength: 100,
  branchAngle: 25,
  shrinkFactor: 0.8,
  trunkThickness: 10,
  randomness: 0,
  trunkColor: '#5D4037',
  leafColor: '#4CAF50'
};

export function FractalTree({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [config, setConfig] = useState<TreeConfig>(initialData?.config || DEFAULT_CONFIG);
  const [seed, setSeed] = useState(initialData?.seed || 123);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ config, seed });
  }, [config, seed, onStateChange]);

  const drawBranch = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    len: number,
    angle: number,
    thickness: number,
    depth: number,
    treeRandom: () => number
  ) => {
    ctx.beginPath();
    ctx.save();
    ctx.strokeStyle = depth < 3 ? config.leafColor : config.trunkColor;
    ctx.lineWidth = thickness;
    ctx.translate(x, y);
    ctx.rotate(angle * Math.PI / 180);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -len);
    ctx.stroke();

    if (depth > 0) {
      const nextLen = len * config.shrinkFactor;
      const nextThickness = thickness * 0.7;

      const randAngle = () => (treeRandom() - 0.5) * config.randomness * 2;

      drawBranch(
        ctx,
        0,
        -len,
        nextLen,
        config.branchAngle + randAngle(),
        nextThickness,
        depth - 1,
        treeRandom
      );
      drawBranch(
        ctx,
        0,
        -len,
        nextLen,
        -config.branchAngle + randAngle(),
        nextThickness,
        depth - 1,
        treeRandom
      );
    }
    ctx.restore();
  }, [config]);

  const renderTree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed size for consistency
    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';

    // Simple deterministic LCG for "randomness" based on seed
    let currentSeed = seed;
    const treeRandom = () => {
      currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
      return currentSeed / 4294967296;
    };

    drawBranch(
      ctx,
      canvas.width / 2,
      canvas.height - 50,
      config.branchLength,
      0,
      config.trunkThickness,
      config.depth,
      treeRandom
    );
  }, [config, seed, drawBranch]);

  useEffect(() => {
    renderTree();
  }, [renderTree]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `fractal-tree-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const updateConfig = (key: keyof TreeConfig, val: any) => {
    setConfig(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Sliders className="w-4 h-4 text-indigo-500" /> {t('fractaltree.controls', 'Tree Parameters')}
              </div>
              <button
                onClick={() => setConfig(DEFAULT_CONFIG)}
                className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors"
              >
                {t('common.reset')}
              </button>
            </div>

            <div className="space-y-6">
              {[
                { label: t('fractaltree.depth', 'Recursion Depth'), key: 'depth', min: 1, max: 13, step: 1 },
                { label: t('fractaltree.length', 'Branch Length'), key: 'branchLength', min: 10, max: 200, step: 1 },
                { label: t('fractaltree.angle', 'Branch Angle'), key: 'branchAngle', min: 0, max: 90, step: 1 },
                { label: t('fractaltree.shrink', 'Shrink Factor'), key: 'shrinkFactor', min: 0.2, max: 0.9, step: 0.01 },
                { label: t('fractaltree.thickness', 'Trunk Thickness'), key: 'trunkThickness', min: 1, max: 30, step: 1 },
                { label: t('fractaltree.randomness', 'Randomness'), key: 'randomness', min: 0, max: 50, step: 1 },
              ].map((f) => (
                <div key={f.key} className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{f.label}</label>
                    <span className="text-xs font-bold text-indigo-500 font-mono">
                      {config[f.key as keyof TreeConfig]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={config[f.key as keyof TreeConfig] as number}
                    onChange={(e) => updateConfig(f.key as keyof TreeConfig, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('fractaltree.trunk_color', 'Trunk')}</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={config.trunkColor}
                      onChange={(e) => updateConfig('trunkColor', e.target.value)}
                      className="w-full h-10 rounded-lg cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('fractaltree.leaf_color', 'Leaves')}</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={config.leafColor}
                      onChange={(e) => updateConfig('leafColor', e.target.value)}
                      className="w-full h-10 rounded-lg cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSeed(getSecureRandomInt(1000000))}
                className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:border-indigo-500 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> {t('fractaltree.new_seed', 'Randomize Seed')}
              </button>
            </div>
          </div>
        </div>

        {/* Viewport */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-500" /> {t('common.result')}
            </div>
            <button
              onClick={handleDownload}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" /> {t('common.download')}
            </button>
          </div>

          <div className="relative aspect-square bg-slate-50 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center overflow-hidden">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-600 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('fractaltree.about_title', 'About Fractal Trees')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('fractaltree.about_text', 'This tool uses a recursive algorithm to draw a natural-looking tree. Each branch splits into two smaller branches at a set angle. By adjusting the parameters and adding a bit of randomness, you can create infinitely unique patterns ranging from geometric structures to realistic trees.')}
          </p>
        </div>
      </div>
    </div>
  );
}
