import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Grid, Info, Shield, Trash2, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

const COLS = 40;
const ROWS = 30;

const PRESETS: Record<string, number[][]> = {
  glider: [[1, 2], [2, 3], [3, 1], [3, 2], [3, 3]],
  pulsar: [
    [2, 4], [2, 5], [2, 6], [2, 10], [2, 11], [2, 12],
    [7, 4], [7, 5], [7, 6], [7, 10], [7, 11], [7, 12],
    [9, 4], [9, 5], [9, 6], [9, 10], [9, 11], [9, 12],
    [14, 4], [14, 5], [14, 6], [14, 10], [14, 11], [14, 12],
    [4, 2], [5, 2], [6, 2], [10, 2], [11, 2], [12, 2],
    [4, 7], [5, 7], [6, 7], [10, 7], [11, 7], [12, 7],
    [4, 9], [5, 9], [6, 9], [10, 9], [11, 9], [12, 9],
    [4, 14], [5, 14], [6, 14], [10, 14], [11, 14], [12, 14]
  ],
  gosper: [
    [5, 1], [5, 2], [6, 1], [6, 2],
    [5, 11], [6, 11], [7, 11], [4, 12], [8, 12], [3, 13], [9, 13], [3, 14], [9, 14], [6, 15], [4, 16], [8, 16], [5, 17], [6, 17], [7, 17], [6, 18],
    [3, 21], [4, 21], [5, 21], [3, 22], [4, 22], [5, 22], [2, 23], [6, 23], [1, 25], [2, 25], [6, 25], [7, 25],
    [3, 35], [4, 35], [3, 36], [4, 36]
  ]
};

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

  const applyPreset = (key: string) => {
    handleClear();
    const newGrid = Array(ROWS).fill(0).map(() => Array(COLS).fill(0));
    const points = PRESETS[key];
    const offsetI = Math.floor(ROWS / 4);
    const offsetJ = Math.floor(COLS / 4);

    points.forEach(([r, c]) => {
      if (r + offsetI < ROWS && c + offsetJ < COLS) {
        newGrid[r + offsetI][c + offsetJ] = 1;
      }
    });
    setGrid(newGrid);
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
            className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            title={t('gol.next_generation')}
            aria-label={t('gol.next_generation')}
          >
            <SkipForward className="w-5 h-5" />
          </button>
          <button
            onClick={handleRandomize}
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            title={t('gol.randomize')}
            aria-label={t('gol.randomize')}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={handleClear}
            className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-900/30 rounded-2xl text-rose-500 hover:bg-rose-100 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            title={t('common.clear')}
            aria-label={t('common.clear')}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('gol.generation')}</span>
            <span className="text-2xl font-black font-mono tabular-nums text-indigo-600 dark:text-indigo-400">{generation}</span>
          </div>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 hidden md:block" />
          <div className="space-y-1">
            <label htmlFor="gol-speed" className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{t('gol.speed')}</label>
            <input
              id="gol-speed"
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

      <div className="flex flex-wrap gap-2 justify-center">
         <div className="flex items-center gap-2 mr-4 text-xs font-black uppercase tracking-widest text-slate-400">
           <LayoutGrid className="w-3 h-3" /> {t('gol.presets')}:
         </div>
         {Object.keys(PRESETS).map(key => (
           <button
             key={key}
             onClick={() => applyPreset(key)}
             className="px-4 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-bold hover:border-indigo-500/50 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
           >
             {t(`gol.preset.${key}`)}
           </button>
         ))}
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
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  grid[i][j]
                    ? 'bg-indigo-500'
                    : 'bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                }`}
                aria-label={t(grid[i][j] ? 'gol.cell_alive' : 'gol.cell_dead', { row: i, col: j })}
              />
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('gol.rules_title')}
          </h4>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
            <li>• {t('gol.rule_1')}</li>
            <li>• {t('gol.rule_2')}</li>
            <li>• {t('gol.rule_3')}</li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Grid className="w-4 h-4 text-indigo-500" /> {t('gol.interactive_title')}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('gol.interactive_desc')}
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
