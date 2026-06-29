import React, { useState, useEffect } from 'react';
import { Grid3X3, Trash2, Play, CheckCircle2, RotateCcw, Lightbulb, Info, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

type Grid = (number | null)[][];

const isValid = (grid: Grid, row: number, col: number, num: number): boolean => {
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num) return false;
  }
  for (let x = 0; x < 9; x++) {
    if (grid[x][col] === num) return false;
  }
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[i + startRow][j + startCol] === num) return false;
    }
  }
  return true;
};

const solveSudoku = (grid: Grid): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid)) return true;
            grid[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const isInitialValid = (grid: Grid): boolean => {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const num = grid[row][col];
            if (num !== null) {
                const temp = grid[row][col];
                grid[row][col] = null;
                if (!isValid(grid, row, col, num)) {
                    grid[row][col] = temp;
                    return false;
                }
                grid[row][col] = temp;
            }
        }
    }
    return true;
};

const EXAMPLES: Grid[] = [
    [
        [5, 3, null, null, 7, null, null, null, null],
        [6, null, null, 1, 9, 5, null, null, null],
        [null, 9, 8, null, null, null, null, 6, null],
        [8, null, null, null, 6, null, null, null, 3],
        [4, null, null, 8, null, 3, null, null, 1],
        [7, null, null, null, 2, null, null, null, 6],
        [null, 6, null, null, null, null, 2, 8, null],
        [null, null, null, 4, 1, 9, null, null, 5],
        [null, null, null, null, 8, null, null, 7, 9]
    ]
];

export function SudokuSolver({ onStateChange }: { onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [grid, setGrid] = useState<Grid>(Array(9).fill(null).map(() => Array(9).fill(null)));
  const [solving, setSolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      onStateChange?.({ grid });
  }, [grid, onStateChange]);

  const handleCellChange = (row: number, col: number, value: string) => {
    const num = value === '' ? null : parseInt(value, 10);
    if (num !== null && (isNaN(num) || num < 1 || num > 9)) return;

    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = num;
    setGrid(newGrid);
    setError(null);
  };

  const handleSolve = () => {
    if (!isInitialValid(grid)) {
        setError(t('sudoku.invalid_initial'));
        return;
    }

    setSolving(true);
    const newGrid = grid.map(r => [...r]);
    if (solveSudoku(newGrid)) {
      setGrid(newGrid);
      toast.success(t('sudoku.solved_success'));
      setError(null);
    } else {
      setError(t('sudoku.no_solution'));
    }
    setSolving(false);
  };

  const handleClear = () => {
    setGrid(Array(9).fill(null).map(() => Array(9).fill(null)));
    setError(null);
  };

  const handleExample = () => {
      setGrid(EXAMPLES[0]);
      setError(null);
  };

  const validateGrid = () => {
    if (!isInitialValid(grid)) {
      setError(t('sudoku.invalid_board'));
      return;
    }

    const isFull = grid.every(row => row.every(cell => cell !== null));
    if (isFull) {
      toast.success(t('sudoku.completed_success'));
    } else {
      toast.success(t('sudoku.valid_so_far'));
    }
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-8">
        <div className="grid grid-cols-9 gap-0 border-2 border-slate-900 dark:border-slate-100 bg-slate-900 dark:bg-slate-100 shadow-2xl">
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <input
                key={`${rowIndex}-${colIndex}`}
                type="number"
                min="1"
                max="9"
                autoComplete="off"
                value={cell || ''}
                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                className={`w-10 h-10 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:bg-indigo-50 dark:focus:bg-indigo-900/30 transition-colors
                  ${colIndex % 3 === 2 && colIndex !== 8 ? 'mr-1' : ''}
                  ${rowIndex % 3 === 2 && rowIndex !== 8 ? 'mb-1' : ''}
                  ${(rowIndex + colIndex) % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-800/50' : ''}
                `}
                aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}`}
              />
            ))
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={handleSolve}
            disabled={solving}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            {solving ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            {t('sudoku.solve')}
          </button>
          <button
            onClick={validateGrid}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            {t('sudoku.validate')}
          </button>
          <button
            onClick={handleExample}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <Lightbulb className="w-5 h-5 text-amber-500" />
            {t('sudoku.example')}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-6 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-2xl font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-5 h-5" />
            {t('common.clear')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('sudoku.how_to_use')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sudoku.how_to_use_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-indigo-500" /> {t('sudoku.algorithm')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('sudoku.algorithm_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
