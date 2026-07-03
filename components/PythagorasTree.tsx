import { useState, useRef, useEffect, useCallback } from 'react';
import { Zap, Download, Trash2, Sliders, RefreshCw, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_DEPTH = 12;

export function PythagorasTree({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [depth, setDepth] = useState(initialData?.depth ?? 8);
  const [angle, setAngle] = useState(initialData?.angle ?? 45);
  const [baseSize, setBaseSize] = useState(initialData?.baseSize ?? 80);
  const [trunkColor, setTrunkColor] = useState(initialData?.trunkColor ?? '#4b2c20');
  const [leafColor, setLeafColor] = useState(initialData?.leafColor ?? '#22c55e');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ depth, angle, baseSize, trunkColor, leafColor });
  }, [depth, angle, baseSize, trunkColor, leafColor, onStateChange]);

  const drawTree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const radAngle = (angle * Math.PI) / 180;

    const lerpColor = (c1: string, c2: string, alpha: number) => {
      const r1 = parseInt(c1.slice(1, 3), 16);
      const g1 = parseInt(c1.slice(3, 5), 16);
      const b1 = parseInt(c1.slice(5, 7), 16);
      const r2 = parseInt(c2.slice(1, 3), 16);
      const g2 = parseInt(c2.slice(3, 5), 16);
      const b2 = parseInt(c2.slice(5, 7), 16);

      const r = Math.round(r1 + (r2 - r1) * alpha);
      const g = Math.round(g1 + (g2 - g1) * alpha);
      const b = Math.round(b1 + (b2 - b1) * alpha);

      return `rgb(${r}, ${g}, ${b})`;
    };

    const drawBranch = (x: number, y: number, size: number, currentDepth: number, currentAngle: number) => {
      if (currentDepth > depth || size < 1) return;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(currentAngle);

      ctx.fillStyle = lerpColor(trunkColor, leafColor, currentDepth / depth);
      ctx.fillRect(0, -size, size, size);

      // Recursive step for children
      const nextSizeLeft = size * Math.cos(radAngle);
      const nextSizeRight = size * Math.sin(radAngle);

      // Left branch
      drawBranch(0, -size, nextSizeLeft, currentDepth + 1, -radAngle);

      // Right branch
      const rx = nextSizeLeft * Math.cos(-radAngle);
      const ry = nextSizeLeft * Math.sin(-radAngle);
      drawBranch(rx, -size + ry, nextSizeRight, currentDepth + 1, Math.PI / 2 - radAngle);

      ctx.restore();
    };

    // Center base
    const startX = width / 2 - baseSize / 2;
    const startY = height - 50;
    drawBranch(startX, startY, baseSize, 0, 0);

  }, [depth, angle, baseSize, trunkColor, leafColor]);

  useEffect(() => {
    drawTree();
  }, [drawTree]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `pythagoras-tree-d${depth}-a${angle}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Sliders className="w-4 h-4 text-indigo-500" /> {t('common.options')}
              </div>
              <button
                onClick={() => {
                  setDepth(8);
                  setAngle(45);
                  setBaseSize(80);
                  setTrunkColor('#4b2c20');
                  setLeafColor('#22c55e');
                }}
                className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors"
              >
                {t('common.reset')}
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="tree-depth" className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('lsystem.iterations', 'Recursion Depth')}</label>
                  <span className="text-xs font-bold text-indigo-500 font-mono">{depth}</span>
                </div>
                <input
                  id="tree-depth"
                  type="range"
                  min="0"
                  max={MAX_DEPTH}
                  step="1"
                  value={depth}
                  onChange={(e) => setDepth(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="tree-angle" className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('lsystem.angle', 'Branching Angle')}</label>
                  <span className="text-xs font-bold text-indigo-500 font-mono">{angle}°</span>
                </div>
                <input
                  id="tree-angle"
                  type="range"
                  min="0"
                  max="90"
                  step="1"
                  value={angle}
                  onChange={(e) => setAngle(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="trunk-color" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('fractaltree.trunk_color', 'Base Color')}</label>
                  <input
                    id="trunk-color"
                    type="color"
                    value={trunkColor}
                    onChange={(e) => setTrunkColor(e.target.value)}
                    className="h-10 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="leaf-color" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('fractaltree.leaf_color', 'Top Color')}</label>
                  <input
                    id="leaf-color"
                    type="color"
                    value={leafColor}
                    onChange={(e) => setLeafColor(e.target.value)}
                    className="h-10 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Zap className="w-4 h-4 text-indigo-500" /> {t('imageeffects.preview')}
            </div>
            <button
              onClick={handleDownload}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" /> {t('common.download')}
            </button>
          </div>

          <div className="relative min-h-[500px] bg-slate-50 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center overflow-hidden p-8">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="max-w-full max-h-[600px] object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('pythagoras.about_title', 'The Pythagoras Tree')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('pythagoras.about_text', 'The Pythagoras tree is a plane fractal constructed from squares. Invented by the Dutch mathematics teacher Albert E. Bosman in 1942, it is named after the ancient Greek mathematician Pythagoras because every triple of touching squares encloses a right triangle, in a configuration traditionally used to depict the Pythagorean theorem.')}
          </p>
        </div>
      </div>
    </div>
  );
}
