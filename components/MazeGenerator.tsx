import { useState, useEffect, useRef, useCallback } from 'react';
import { Grid3X3, Play, Pause, RotateCcw, Download, Settings2, Info, FastForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

interface Cell {
  x: number;
  y: number;
  visited: boolean;
  walls: [boolean, boolean, boolean, boolean]; // top, right, bottom, left
}

export function MazeGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [cols, setCols] = useState(initialData?.cols ?? 20);
  const [rows, setRows] = useState(initialData?.rows ?? 20);
  const [speed, setSpeed] = useState(initialData?.speed ?? 50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const mazeRef = useRef<Cell[][]>([]);
  const stackRef = useRef<Cell[]>([]);
  const currentCellRef = useRef<Cell | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    onStateChange?.({ cols, rows, speed });
  }, [cols, rows, speed, onStateChange]);

  const initMaze = useCallback(() => {
    const newMaze: Cell[][] = [];
    for (let py = 0; py < rows; py++) {
      const row: Cell[] = [];
      for (let px = 0; px < cols; px++) {
        row.push({
          x: px,
          y: py,
          visited: false,
          walls: [true, true, true, true],
        });
      }
      newMaze.push(row);
    }
    mazeRef.current = newMaze;
    stackRef.current = [];
    const startCell = newMaze[0][0];
    startCell.visited = true;
    currentCellRef.current = startCell;
    stackRef.current.push(startCell);
    setProgress(0);
  }, [cols, rows]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = Math.floor(Math.min(canvas.width / cols, canvas.height / rows));
    const offsetX = (canvas.width - cellSize * cols) / 2;
    const offsetY = (canvas.height - cellSize * rows) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (let py = 0; py < rows; py++) {
      for (let px = 0; px < cols; px++) {
        const cell = mazeRef.current[py][px];
        const x = offsetX + px * cellSize;
        const y = offsetY + py * cellSize;

        if (cell.visited) {
          ctx.fillStyle = '#6366f110';
          ctx.fillRect(x, y, cellSize, cellSize);
        }

        ctx.beginPath();
        if (cell.walls[0]) { ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); }
        if (cell.walls[1]) { ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); }
        if (cell.walls[2]) { ctx.moveTo(x + cellSize, y + cellSize); ctx.lineTo(x, y + cellSize); }
        if (cell.walls[3]) { ctx.moveTo(x, y + cellSize); ctx.lineTo(x, y); }
        ctx.stroke();
      }
    }

    if (currentCellRef.current) {
      const cell = currentCellRef.current;
      ctx.fillStyle = '#6366f1';
      const x = offsetX + cell.x * cellSize + cellSize * 0.2;
      const y = offsetY + cell.y * cellSize + cellSize * 0.2;
      ctx.fillRect(x, y, cellSize * 0.6, cellSize * 0.6);
    }
  }, [cols, rows]);

  const getNeighbors = (cell: Cell) => {
    const neighbors: Cell[] = [];
    const { x, y } = cell;

    if (y > 0 && !mazeRef.current[y - 1][x].visited) neighbors.push(mazeRef.current[y - 1][x]);
    if (x < cols - 1 && !mazeRef.current[y][x + 1].visited) neighbors.push(mazeRef.current[y][x + 1]);
    if (y < rows - 1 && !mazeRef.current[y + 1][x].visited) neighbors.push(mazeRef.current[y + 1][x]);
    if (x > 0 && !mazeRef.current[y][x - 1].visited) neighbors.push(mazeRef.current[y][x - 1]);

    return neighbors;
  };

  const removeWalls = (a: Cell, b: Cell) => {
    const dx = a.x - b.x;
    if (dx === 1) { a.walls[3] = false; b.walls[1] = false; }
    else if (dx === -1) { a.walls[1] = false; b.walls[3] = false; }

    const dy = a.y - b.y;
    if (dy === 1) { a.walls[0] = false; b.walls[2] = false; }
    else if (dy === -1) { a.walls[2] = false; b.walls[0] = false; }
  };

  const step = useCallback(() => {
    if (isPaused) return;

    if (stackRef.current.length > 0) {
      const current = currentCellRef.current;
      if (!current) return;

      const neighbors = getNeighbors(current);
      if (neighbors.length > 0) {
        const next = neighbors[getSecureRandomInt(neighbors.length)];
        next.visited = true;
        stackRef.current.push(next);
        removeWalls(current, next);
        currentCellRef.current = next;

        const visitedCount = mazeRef.current.flat().filter(c => c.visited).length;
        setProgress(Math.floor((visitedCount / (cols * rows)) * 100));
      } else {
        currentCellRef.current = stackRef.current.pop() || null;
      }
      draw();
      timeoutRef.current = window.setTimeout(step, 101 - speed);
    } else {
      setIsGenerating(false);
      currentCellRef.current = null;
      draw();
    }
  }, [speed, isPaused, cols, rows, draw]);

  const handleStart = () => {
    if (isGenerating && !isPaused) {
      setIsPaused(true);
      return;
    }
    if (isGenerating && isPaused) {
      setIsPaused(false);
      return;
    }
    initMaze();
    setIsGenerating(true);
    setIsPaused(false);
  };

  useEffect(() => {
    if (isGenerating && !isPaused) {
      timeoutRef.current = window.setTimeout(step, 101 - speed);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isGenerating, isPaused, step, speed]);

  const handleReset = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsGenerating(false);
    setIsPaused(false);
    initMaze();
    setTimeout(draw, 0);
  }, [initMaze, draw]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current && canvasRef.current) {
        const { clientWidth } = containerRef.current;
        const size = Math.min(clientWidth, 600);
        canvasRef.current.width = size;
        canvasRef.current.height = size;
        if (mazeRef.current.length === 0) {
          initMaze();
        }
        draw();
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [initMaze, draw]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `maze-${cols}x${rows}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('maze.cols')}</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={cols}
                    onChange={(e) => setCols(Math.min(50, Math.max(5, parseInt(e.target.value) || 5)))}
                    disabled={isGenerating}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('maze.rows')}</label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={rows}
                    onChange={(e) => setRows(Math.min(50, Math.max(5, parseInt(e.target.value) || 5)))}
                    disabled={isGenerating}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('maze.speed')}</label>
                  <span className="text-xs font-mono font-bold text-indigo-500">{speed}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <button
                onClick={handleStart}
                className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  isGenerating && !isPaused
                    ? 'bg-amber-500 text-white shadow-amber-500/20'
                    : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
                }`}
              >
                {isGenerating ? (isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />) : <Play className="w-5 h-5 fill-current" />}
                {isGenerating ? (isPaused ? t('common.resume') : t('common.pause')) : t('maze.generate')}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleReset}
                  className="py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-100 transition-all"
                >
                  <RotateCcw className="w-3 h-3" /> {t('common.reset')}
                </button>
                <button
                  onClick={handleDownload}
                  className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <Download className="w-3 h-3" /> PNG
                </button>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-100">{t('maze.algorithm_title')}</h4>
            </div>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed font-medium">
              {t('maze.algorithm_desc')}
            </p>
          </div>
        </div>

        {/* Visualizer */}
        <div className="lg:col-span-8 flex flex-col items-center gap-6">
          <div
            ref={containerRef}
            className="w-full aspect-square bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 relative flex items-center justify-center p-8"
          >
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full"
            />
            {isGenerating && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-bounce">
                {t('maze.generating')} {progress}%
              </div>
            )}
          </div>

          <div className="w-full flex items-center gap-4 px-2">
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest tabular-nums w-12 text-right">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-indigo-500" /> {t('maze.backtracking_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('maze.backtracking_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <FastForward className="w-4 h-4 text-indigo-500" /> {t('maze.perfect_maze_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('maze.perfect_maze_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" /> {t('maze.customization_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('maze.customization_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
