import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Grid, Info, Shield, Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

const COLS = 40;
const ROWS = 30;

export function GameOfLife() {
  const { t } = useTranslation();
  const [grid, setGrid] = useState<number[][]>(() => {
    const rows = [];
    for (let i = 0; i < ROWS; i++) {
      rows.push(Array.from(Array(COLS), () => 0));
    }
    return rows;
  });

  const [running, setRunning] = useState(false);
  const runningRef = useRef(running);
  runningRef.current = running;

  const [generation, setGeneration] = useState(0);
  const [speed, setSpeed] = useState(100);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const runSimulation = useCallback(() => {
    if (!runningRef.current) return;

    setGrid((g) => {
      const nextGrid = g.map((row, i) =>
        row.map((cell, j) => {
          let neighbors = 0;
          const operations = [
            [0, 1], [0, -1], [1, -1], [-1, 1],
            [1, 1], [-1, -1], [1, 0], [-1, 0]
          ];

          operations.forEach(([x, y]) => {
            const newI = i + x;
            const newJ = j + y;
            if (newI >= 0 && newI < ROWS && newJ >= 0 && newJ < COLS) {
              neighbors += g[newI][newJ];
            }
          });

          if (neighbors < 2 || neighbors > 3) return 0;
          if (g[i][j] === 0 && neighbors === 3) return 1;
          return g[i][j];
        })
      );

      // Check if grid changed to stop if static
      let changed = false;
      for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
          if (nextGrid[i][j] !== g[i][j]) {
            changed = true;
            break;
          }
        }
        if (changed) break;
      }

      if (!changed) {
        setRunning(false);
        return g;
      }

      setGeneration((gen) => gen + 1);
      return nextGrid;
    });

    setTimeout(runSimulation, speedRef.current);
  }, []);

  const handleToggle = (i: number, j: number) => {
    const newGrid = [...grid];
    newGrid[i] = [...grid[i]];
    newGrid[i][j] = grid[i][j] ? 0 : 1;
    setGrid(newGrid);
  };

  const handleRandomize = () => {
    const rows = [];
    for (let i = 0; i < ROWS; i++) {
      rows.push(Array.from(Array(COLS), () => (getSecureRandomInt(10) > 7 ? 1 : 0)));
    }
    setGrid(rows);
    setGeneration(0);
  };

  const handleClear = () => {
    setGrid(grid.map(row => Array(COLS).fill(0)));
    setRunning(false);
    setGeneration(0);
  };

  const handleNextStep = () => {
    setRunning(true);
    runningRef.current = true;
    runSimulation();
    setRunning(false);
    runningRef.current = false;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setRunning(!running);
              if (!running) {
                runningRef.current = true;
                runSimulation();
              }
            }}
            className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all ${
              running
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {running ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            {running ? t('common.pause') : t('common.play')}
          </button>
          <button
            onClick={handleNextStep}
            disabled={running}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all"
            title="Next Generation"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          <button
            onClick={handleRandomize}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all"
            title="Randomize"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={handleClear}
            className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-900/30 rounded-2xl text-rose-500 hover:bg-rose-100 transition-all"
            title="Clear"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Generation</span>
            <span className="text-2xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400">{generation}</span>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Speed</label>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-32 accent-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center bg-white dark:bg-slate-950 p-4 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
        <div
          className="grid gap-px bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {grid.map((rows, i) =>
            rows.map((col, j) => (
              <button
                key={`${i}-${j}`}
                onClick={() => handleToggle(i, j)}
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                  grid[i][j]
                    ? 'bg-indigo-500'
                    : 'bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                }`}
                aria-label={`Cell ${i},${j}`}
              />
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Rules of Life
          </h4>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
            <li>• Any live cell with 2 or 3 neighbors survives.</li>
            <li>• Any dead cell with exactly 3 neighbors becomes alive.</li>
            <li>• All other live cells die (isolation or overpopulation).</li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Grid className="w-4 h-4 text-indigo-500" /> Interactive Play
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Click on cells to toggle them manually while the simulation is paused. Try creating stable patterns like blocks or oscillators like blinkers and pulsars.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
