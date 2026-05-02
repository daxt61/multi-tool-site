import React, { useState, useEffect } from 'react';
import { Play, Copy, Check, RotateCcw, Layout, Maximize, Palette } from 'lucide-react';

type Direction = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface TriangleState {
  direction: Direction;
  width: number;
  height: number;
  color: string;
}

const DEFAULT_STATE: TriangleState = {
  direction: 'top',
  width: 100,
  height: 100,
  color: '#6366f1',
};

export function CSSTriangleGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [direction, setDirection] = useState<Direction>(initialData?.direction || DEFAULT_STATE.direction);
  const [width, setWidth] = useState<number>(initialData?.width || DEFAULT_STATE.width);
  const [height, setHeight] = useState<number>(initialData?.height || DEFAULT_STATE.height);
  const [color, setColor] = useState<string>(initialData?.color || DEFAULT_STATE.color);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ direction, width, height, color });
  }, [direction, width, height, color]);

  const getCss = () => {
    const w = width / 2;
    const h = height / 2;

    switch (direction) {
      case 'top':
        return `width: 0;\nheight: 0;\nborder-left: ${w}px solid transparent;\nborder-right: ${w}px solid transparent;\nborder-bottom: ${height}px solid ${color};`;
      case 'bottom':
        return `width: 0;\nheight: 0;\nborder-left: ${w}px solid transparent;\nborder-right: ${w}px solid transparent;\nborder-top: ${height}px solid ${color};`;
      case 'left':
        return `width: 0;\nheight: 0;\nborder-top: ${h}px solid transparent;\nborder-bottom: ${h}px solid transparent;\nborder-right: ${width}px solid ${color};`;
      case 'right':
        return `width: 0;\nheight: 0;\nborder-top: ${h}px solid transparent;\nborder-bottom: ${h}px solid transparent;\nborder-left: ${width}px solid ${color};`;
      case 'top-left':
        return `width: 0;\nheight: 0;\nborder-top: ${height}px solid ${color};\nborder-right: ${width}px solid transparent;`;
      case 'top-right':
        return `width: 0;\nheight: 0;\nborder-top: ${height}px solid ${color};\nborder-left: ${width}px solid transparent;`;
      case 'bottom-left':
        return `width: 0;\nheight: 0;\nborder-bottom: ${height}px solid ${color};\nborder-right: ${width}px solid transparent;`;
      case 'bottom-right':
        return `width: 0;\nheight: 0;\nborder-bottom: ${height}px solid ${color};\nborder-left: ${width}px solid transparent;`;
      default:
        return '';
    }
  };

  const getPreviewStyle = (): React.CSSProperties => {
    const w = width / 2;
    const h = height / 2;

    switch (direction) {
      case 'top':
        return { borderLeft: `${w}px solid transparent`, borderRight: `${w}px solid transparent`, borderBottom: `${height}px solid ${color}` };
      case 'bottom':
        return { borderLeft: `${w}px solid transparent`, borderRight: `${w}px solid transparent`, borderTop: `${height}px solid ${color}` };
      case 'left':
        return { borderTop: `${h}px solid transparent`, borderBottom: `${h}px solid transparent`, borderRight: `${width}px solid ${color}` };
      case 'right':
        return { borderTop: `${h}px solid transparent`, borderBottom: `${h}px solid transparent`, borderLeft: `${width}px solid ${color}` };
      case 'top-left':
        return { borderTop: `${height}px solid ${color}`, borderRight: `${width}px solid transparent` };
      case 'top-right':
        return { borderTop: `${height}px solid ${color}`, borderLeft: `${width}px solid transparent` };
      case 'bottom-left':
        return { borderBottom: `${height}px solid ${color}`, borderRight: `${width}px solid transparent` };
      case 'bottom-right':
        return { borderBottom: `${height}px solid ${color}`, borderLeft: `${width}px solid transparent` };
      default:
        return {};
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCss());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setDirection(DEFAULT_STATE.direction);
    setWidth(DEFAULT_STATE.width);
    setHeight(DEFAULT_STATE.height);
    setColor(DEFAULT_STATE.color);
  };

  const directions: { id: Direction; label: string }[] = [
    { id: 'top', label: 'Haut' },
    { id: 'bottom', label: 'Bas' },
    { id: 'left', label: 'Gauche' },
    { id: 'right', label: 'Droite' },
    { id: 'top-left', label: 'Haut-Gauche' },
    { id: 'top-right', label: 'Haut-Droite' },
    { id: 'bottom-left', label: 'Bas-Gauche' },
    { id: 'bottom-right', label: 'Bas-Droite' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
              <Layout className="w-4 h-4 text-indigo-500" /> Direction
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {directions.map((dir) => (
                <button
                  key={dir.id}
                  onClick={() => setDirection(dir.id)}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 group ${
                    direction === dir.id
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 text-slate-400'
                  }`}
                  aria-label={dir.label}
                  aria-pressed={direction === dir.id}
                >
                  <div className={`w-4 h-4 border-2 border-current transition-transform group-hover:scale-110 ${
                    dir.id === 'top' ? 'border-t-4 border-l-transparent border-r-transparent border-b-transparent' :
                    dir.id === 'bottom' ? 'border-b-4 border-l-transparent border-r-transparent border-t-transparent' :
                    dir.id === 'left' ? 'border-l-4 border-t-transparent border-b-transparent border-r-transparent' :
                    dir.id === 'right' ? 'border-r-4 border-t-transparent border-b-transparent border-l-transparent' :
                    dir.id === 'top-left' ? 'border-t-4 border-l-4 border-r-transparent border-b-transparent' :
                    dir.id === 'top-right' ? 'border-t-4 border-r-4 border-l-transparent border-b-transparent' :
                    dir.id === 'bottom-left' ? 'border-b-4 border-l-4 border-r-transparent border-t-transparent' :
                    'border-b-4 border-r-4 border-l-transparent border-t-transparent'
                  }`} />
                  <span className="text-[10px] font-bold uppercase truncate w-full text-center">{dir.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="width" className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  <Maximize className="w-3 h-3" /> Largeur (px)
                </label>
                <span className="text-sm font-black font-mono dark:text-slate-300">{width}</span>
              </div>
              <input
                id="width"
                type="range"
                min="10"
                max="300"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="height" className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  <Maximize className="w-3 h-3 rotate-90" /> Hauteur (px)
                </label>
                <span className="text-sm font-black font-mono dark:text-slate-300">{height}</span>
              </div>
              <input
                id="height"
                type="range"
                min="10"
                max="300"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-100 dark:bg-slate-800 accent-indigo-600"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="color" className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Couleur
                </label>
                <span className="text-sm font-black font-mono dark:text-slate-300">{color.toUpperCase()}</span>
              </div>
              <div className="flex gap-4 items-center">
                <input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-slate-100 dark:border-slate-800 cursor-pointer overflow-hidden"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-sm outline-none focus:border-indigo-500 transition-colors dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Code */}
        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-12 flex items-center justify-center min-h-[300px] relative overflow-hidden">
             {/* Checkerboard background for transparency preview */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 10%, transparent 10%)', backgroundSize: '10px 10px' }}></div>
            <div style={{ width: 0, height: 0, ...getPreviewStyle() }} className="relative z-10 transition-all duration-300" />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">CSS Code</h4>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié !' : 'Copier le CSS'}
              </button>
            </div>
            <pre className="p-6 bg-slate-900 text-indigo-400 rounded-3xl font-mono text-sm overflow-x-auto border border-slate-800">
              {`.triangle {\n  ${getCss().replace(/\n/g, '\n  ')}\n}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
