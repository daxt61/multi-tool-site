import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PenTool, Copy, Check, Trash2, Info, Settings2, Maximize, MousePointer2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface PathCommand {
  type: string;
  values: number[];
  raw: string;
}

export function SVGPathVisualizer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [pathData, setPathData] = useState(initialData?.pathData || 'M 20 20 L 80 20 L 80 80 L 20 80 Z M 50 10 C 70 10 90 30 90 50 S 70 90 50 90 S 10 70 10 50 S 30 10 50 10');
  const [viewBoxSize, setViewBoxSize] = useState(initialData?.viewBoxSize || 100);
  const [strokeWidth, setStrokeWidth] = useState(initialData?.strokeWidth || 1);
  const [strokeColor, setStrokeColor] = useState(initialData?.strokeColor || '#4f46e5');
  const [showPoints, setShowPoints] = useState(initialData?.showPoints ?? true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ pathData, viewBoxSize, strokeWidth, strokeColor, showPoints });
  }, [pathData, viewBoxSize, strokeWidth, strokeColor, showPoints, onStateChange]);

  const commands = useMemo((): PathCommand[] => {
    const cmdRegex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
    const results: PathCommand[] = [];
    let match;

    while ((match = cmdRegex.exec(pathData)) !== null) {
      const type = match[1];
      const values = match[2]
        .trim()
        .split(/[\s,]+/)
        .filter(v => v !== '')
        .map(Number);

      results.push({
        type,
        values,
        raw: match[0].trim()
      });
    }
    return results;
  }, [pathData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pathData);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const points = useMemo(() => {
    const pts: { x: number; y: number; type: string }[] = [];
    let curX = 0;
    let curY = 0;

    commands.forEach(cmd => {
        const { type, values } = cmd;
        const isRelative = type === type.toLowerCase();
        const upperType = type.toUpperCase();

        switch (upperType) {
            case 'M':
            case 'L':
            case 'T':
                for (let i = 0; i < values.length; i += 2) {
                    if (isRelative) {
                        curX += values[i];
                        curY += values[i+1];
                    } else {
                        curX = values[i];
                        curY = values[i+1];
                    }
                    pts.push({ x: curX, y: curY, type: upperType });
                }
                break;
            case 'H':
                for (let i = 0; i < values.length; i++) {
                    if (isRelative) curX += values[i];
                    else curX = values[i];
                    pts.push({ x: curX, y: curY, type: upperType });
                }
                break;
            case 'V':
                for (let i = 0; i < values.length; i++) {
                    if (isRelative) curY += values[i];
                    else curY = values[i];
                    pts.push({ x: curX, y: curY, type: upperType });
                }
                break;
            case 'C':
                for (let i = 0; i < values.length; i += 6) {
                    if (isRelative) {
                        pts.push({ x: curX + values[i], y: curY + values[i+1], type: 'Control' });
                        pts.push({ x: curX + values[i+2], y: curY + values[i+3], type: 'Control' });
                        curX += values[i+4];
                        curY += values[i+5];
                    } else {
                        pts.push({ x: values[i], y: values[i+1], type: 'Control' });
                        pts.push({ x: values[i+2], y: values[i+3], type: 'Control' });
                        curX = values[i+4];
                        curY = values[i+5];
                    }
                    pts.push({ x: curX, y: curY, type: upperType });
                }
                break;
            case 'S':
            case 'Q':
                for (let i = 0; i < values.length; i += 4) {
                    if (isRelative) {
                        pts.push({ x: curX + values[i], y: curY + values[i+1], type: 'Control' });
                        curX += values[i+2];
                        curY += values[i+3];
                    } else {
                        pts.push({ x: values[i], y: values[i+1], type: 'Control' });
                        curX = values[i+2];
                        curY = values[i+3];
                    }
                    pts.push({ x: curX, y: curY, type: upperType });
                }
                break;
            case 'A':
                for (let i = 0; i < values.length; i += 7) {
                    if (isRelative) {
                        curX += values[i+5];
                        curY += values[i+6];
                    } else {
                        curX = values[i+5];
                        curY = values[i+6];
                    }
                    pts.push({ x: curX, y: curY, type: upperType });
                }
                break;
        }
    });

    return pts;
  }, [commands]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          {/* Editor */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <PenTool className="w-4 h-4 text-indigo-500" /> {t('svg_to_css.source') || 'Path Data'}
                </div>
                <button
                    onClick={() => setPathData('')}
                    className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <textarea
              value={pathData}
              onChange={(e) => setPathData(e.target.value)}
              placeholder="M 10 10 L 90 90..."
              className="w-full h-48 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm outline-none focus:border-indigo-500 transition-all dark:text-white resize-none"
            />
          </div>

          {/* Options */}
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('svg_visualizer.viewbox') || 'ViewBox Size'}</label>
                    <span className="text-sm font-black text-indigo-500">{viewBoxSize}</span>
                </div>
                <input
                    type="range"
                    min="10"
                    max="1000"
                    step="10"
                    value={viewBoxSize}
                    onChange={(e) => setViewBoxSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('barcode.bar_width') || 'Stroke Width'}</label>
                    <span className="text-sm font-black text-indigo-500">{strokeWidth}px</span>
                </div>
                <input
                    type="range"
                    min="0.1"
                    max="20"
                    step="0.1"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
            </div>

            <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('common.color')}</label>
                <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-700 cursor-pointer overflow-hidden"
                />
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                    <input
                        type="checkbox"
                        checked={showPoints}
                        onChange={(e) => setShowPoints(e.target.checked)}
                        className="sr-only"
                    />
                    <div className={`w-10 h-6 rounded-full transition-colors ${showPoints ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showPoints ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('svg_visualizer.show_points') || 'Show Points'}</span>
            </label>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Visualizer Area */}
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Maximize className="w-4 h-4 text-indigo-500" /> {t('css_filter.preview') || 'Preview'}
            </div>
            <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  copied ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white dark:bg-slate-800 text-indigo-600 border-slate-200'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-4 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-8 relative overflow-hidden">
            {/* SVG Canvas */}
            <div className="w-full aspect-square max-w-[500px] relative bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                {/* Grid Background */}
                <svg width="100%" height="100%" className="absolute inset-0 opacity-10 pointer-events-none">
                    <defs>
                        <pattern id="grid" width="10%" height="10%" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                        </pattern>
                        <pattern id="gridLarge" width="50%" height="50%" patternUnits="userSpaceOnUse">
                            <rect width="100%" height="100%" fill="url(#grid)"/>
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#gridLarge)" />
                </svg>

                <svg
                    viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                    className="w-full h-full relative z-10"
                >
                    <path
                        d={pathData}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {showPoints && points.map((p, i) => (
                        <g key={i} className="group/pt">
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={strokeWidth * 1.5 || 2}
                                fill={p.type === 'Control' ? '#f59e0b' : '#ef4444'}
                                className="transition-all hover:scale-150 origin-center cursor-crosshair"
                            />
                            <title>{`${p.type}: ${p.x}, ${p.y}`}</title>
                        </g>
                    ))}
                </svg>
            </div>

            {/* Command Breakdown */}
            <div className="w-full pt-8 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-1">
                    {t('svg_visualizer.commands') || 'Path Commands'}
                </h4>
                <div className="flex flex-wrap gap-2 pb-2">
                    {commands.map((cmd, i) => (
                        <div key={i} className="px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col gap-1 min-w-[60px]">
                            <span className="text-[10px] font-black text-indigo-500 uppercase">{cmd.type}</span>
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                                {cmd.values.join(', ') || 'Z'}
                            </span>
                        </div>
                    ))}
                    {commands.length === 0 && (
                        <span className="text-sm text-slate-400 italic px-1">{t('common.waiting')}</span>
                    )}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('unit.guide_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('svg_visualizer.guide_text') || 'Paste your SVG path data (the content of the "d" attribute) into the editor. The preview will update in real-time. Adjust the viewBox to fit your drawing and customize the stroke appearance.'}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <MousePointer2 className="w-4 h-4 text-indigo-500" /> {t('svg_visualizer.points_title') || 'Interactive Inspection'}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('svg_visualizer.points_text') || 'Red dots represent path commands (Move, Line, etc.), while orange dots represent control points for curves (Bezier). Hover over any point to see its exact coordinates.'}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
