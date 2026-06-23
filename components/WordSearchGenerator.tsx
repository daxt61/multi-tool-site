import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Grid3X3, Download, RefreshCw, Trash2, Info, Settings2, Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';
import { toast } from 'sonner';

interface Position {
  r: number;
  c: number;
}

interface Direction {
  dr: number;
  dc: number;
}

const DIRECTIONS: Record<string, Direction> = {
  horizontal: { dr: 0, dc: 1 },
  vertical: { dr: 1, dc: 0 },
  diagonal: { dr: 1, dc: 1 },
  diagonalBack: { dr: 1, dc: -1 },
};

export function WordSearchGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [wordsInput, setWordsInput] = useState(initialData?.wordsInput || 'REACT\nTYPESCRIPT\nTAILWIND\nVITE\nLUCIDE\nTOOLBOX');
  const [gridSize, setGridSize] = useState(initialData?.gridSize || 12);
  const [allowedDirections, setAllowedDirections] = useState<string[]>(initialData?.allowedDirections || ['horizontal', 'vertical', 'diagonal']);
  const [grid, setGrid] = useState<string[][]>([]);
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  const [failedWords, setFailedWords] = useState<string[]>([]);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionMask, setSolutionMask] = useState<boolean[][]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ wordsInput, gridSize, allowedDirections });
  }, [wordsInput, gridSize, allowedDirections, onStateChange]);

  const generatePuzzle = useCallback(() => {
    const words = wordsInput
      .split('\n')
      .map((w: string) => w.trim().toUpperCase())
      .filter((w: string) => w.length > 1 && w.length <= gridSize);

    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    const newMask = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    const successfullyPlaced: string[] = [];
    const missed: string[] = [];

    // Sort words by length descending to place longer words first
    const sortedWords = [...words].sort((a, b) => b.length - a.length);

    for (const word of sortedWords) {
      let placed = false;
      const directions = allowedDirections.length > 0
        ? allowedDirections.map(d => DIRECTIONS[d])
        : [DIRECTIONS.horizontal];

      // Try random positions and directions
      for (let attempts = 0; attempts < 100; attempts++) {
        const dir = directions[getSecureRandomInt(directions.length)];
        const r = getSecureRandomInt(gridSize);
        const c = getSecureRandomInt(gridSize);

        if (canPlaceWord(newGrid, word, r, c, dir)) {
          placeWord(newGrid, newMask, word, r, c, dir);
          successfullyPlaced.push(word);
          placed = true;
          break;
        }
      }

      if (!placed) missed.push(word);
    }

    // Fill empty cells with random letters
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (newGrid[r][c] === '') {
          newGrid[r][c] = alphabet[getSecureRandomInt(alphabet.length)];
        }
      }
    }

    setGrid(newGrid);
    setSolutionMask(newMask);
    setPlacedWords(successfullyPlaced);
    setFailedWords(missed);
  }, [wordsInput, gridSize, allowedDirections]);

  const canPlaceWord = (grid: string[][], word: string, r: number, c: number, dir: Direction) => {
    for (let i = 0; i < word.length; i++) {
      const nr = r + i * dir.dr;
      const nc = c + i * dir.dc;
      if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) return false;
      if (grid[nr][nc] !== '' && grid[nr][nc] !== word[i]) return false;
    }
    return true;
  };

  const placeWord = (grid: string[][], mask: boolean[][], word: string, r: number, c: number, dir: Direction) => {
    for (let i = 0; i < word.length; i++) {
      const nr = r + i * dir.dr;
      const nc = c + i * dir.dc;
      grid[nr][nc] = word[i];
      mask[nr][nc] = true;
    }
  };

  useEffect(() => {
    generatePuzzle();
  }, [gridSize, allowedDirections]); // Regenerate when settings change. wordsInput changes are manual.

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 40;
    const padding = 40;
    canvas.width = gridSize * cellSize + padding * 2;
    canvas.height = gridSize * cellSize + padding * 2 + 60; // Extra space for title/words

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000000';

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x = padding + c * cellSize + cellSize / 2;
        const y = padding + r * cellSize + cellSize / 2;

        if (showSolution && solutionMask[r][c]) {
            ctx.fillStyle = '#e0e7ff';
            ctx.fillRect(padding + c * cellSize + 2, padding + r * cellSize + 2, cellSize - 4, cellSize - 4);
            ctx.fillStyle = '#4f46e5';
        } else {
            ctx.fillStyle = '#000000';
        }

        ctx.fillText(grid[r][c], x, y);
      }
    }

    // Border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, gridSize * cellSize, gridSize * cellSize);

    const link = document.createElement('a');
    link.download = `wordsearch-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const toggleDirection = (dir: string) => {
    setAllowedDirections(prev =>
      prev.includes(dir)
        ? prev.filter(d => d !== dir)
        : [...prev, dir]
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('wordsearch.words_label') || 'Words (one per line)'}</label>
              <textarea
                value={wordsInput}
                onChange={(e) => setWordsInput(e.target.value)}
                placeholder="ENTER\nWORDS\nHERE"
                className="w-full h-48 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white resize-none"
              />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('maze.cols') || 'Grid Size'}</label>
                    <span className="text-sm font-black text-indigo-500">{gridSize}x{gridSize}</span>
                </div>
                <input
                    type="range"
                    min="8"
                    max="20"
                    value={gridSize}
                    onChange={(e) => setGridSize(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('wordsearch.directions') || 'Allowed Directions'}</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(DIRECTIONS).map(dir => (
                  <button
                    key={dir}
                    onClick={() => toggleDirection(dir)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      allowedDirections.includes(dir)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {t(`wordsearch.dir.${dir}`) || dir}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generatePuzzle}
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all"
            >
              <RefreshCw className="w-5 h-5" /> {t('lorem.regenerate') || 'Regenerate'}
            </button>
          </div>

          {failedWords.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-6 rounded-3xl space-y-2">
                <h4 className="text-sm font-black text-rose-600 flex items-center gap-2">
                    <Info className="w-4 h-4" /> {t('wordsearch.failed_words') || 'Words that didn\'t fit:'}
                </h4>
                <div className="flex flex-wrap gap-2">
                    {failedWords.map(w => (
                        <span key={w} className="px-2 py-1 bg-white dark:bg-slate-800 rounded-lg text-xs font-mono font-bold text-rose-500 border border-rose-100 dark:border-rose-900/30">{w}</span>
                    ))}
                </div>
            </div>
          )}
        </div>

        {/* Puzzle Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Grid3X3 className="w-4 h-4 text-indigo-500" /> {t('wordsearch.puzzle') || 'Puzzle'}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSolution(!showSolution)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  showSolution
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                {showSolution ? t('wordsearch.hide_solution') || 'Hide Solution' : t('wordsearch.show_solution') || 'Show Solution'}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition-all border border-transparent"
                title={t('common.download')}
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-4 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-8">
            <div
                className="grid gap-1 md:gap-2 select-none"
                style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            >
              {grid.map((row, r) => row.map((char, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`w-7 h-7 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl text-sm md:text-lg font-black font-mono transition-all border ${
                    showSolution && solutionMask[r][c]
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700'
                  }`}
                >
                  {char}
                </div>
              )))}
            </div>

            <div className="w-full pt-8 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-1">
                    {t('wordsearch.word_list') || 'Find these words:'}
                </h4>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                    {placedWords.map(w => (
                        <div key={w} className="flex items-center gap-2 group">
                            <div className="w-2 h-2 rounded-full bg-indigo-500/30 group-hover:bg-indigo-500 transition-colors" />
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300 font-mono">{w}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('unit.guide_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('wordsearch.guide_text') || 'Enter a list of words in the left panel. Adjust the grid size and allowed directions to your preference. The puzzle will regenerate automatically. You can view the solution or download the grid as an image for printing.'}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" /> {t('wordsearch.complexity_title') || 'Customization'}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('wordsearch.complexity_text') || 'Choose from horizontal, vertical, and diagonal directions. Increase the grid size to accommodate longer words or a larger word list. If a word cannot be placed within 100 random attempts, it will appear in the "failed words" section.'}
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
