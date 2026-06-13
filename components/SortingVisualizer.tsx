import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Shuffle, Info, Settings2, BarChart3, Pause } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

// Types for the sorting state
type Algorithm = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick';

interface Bar {
  value: number;
  status: 'idle' | 'comparing' | 'swapping' | 'sorted';
}

const MAX_ARRAY_SIZE = 100;
const MIN_ARRAY_SIZE = 5;
const MAX_SPEED = 500; // ms delay
const MIN_SPEED = 0;

export function SortingVisualizer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [algorithm, setAlgorithm] = useState<Algorithm>(initialData?.algorithm || 'bubble');
  const [arraySize, setArraySize] = useState(initialData?.arraySize || 30);
  const [speed, setSpeed] = useState(initialData?.speed || 50);
  const [array, setArray] = useState<Bar[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState({ comparisons: 0, swaps: 0 });

  const isSortingRef = useRef(false);
  const isPausedRef = useRef(false);
  const arrayRef = useRef<Bar[]>([]);
  const speedRef = useRef(speed);

  // Initialize array
  const generateArray = useCallback((size: number) => {
    const newArray: Bar[] = [];
    for (let i = 0; i < size; i++) {
      newArray.push({
        value: getSecureRandomInt(300) + 20, // values between 20 and 320
        status: 'idle'
      });
    }
    setArray(newArray);
    arrayRef.current = [...newArray];
    setStats({ comparisons: 0, swaps: 0 });
    setIsSorting(false);
    isSortingRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    generateArray(arraySize);
  }, [arraySize, generateArray]);

  useEffect(() => {
    onStateChange?.({ algorithm, arraySize, speed });
    speedRef.current = speed;
  }, [algorithm, arraySize, speed, onStateChange]);

  const sleep = (ms: number) => {
    return new Promise(resolve => {
      const check = () => {
        if (!isSortingRef.current) {
          resolve(false);
          return;
        }
        if (isPausedRef.current) {
          setTimeout(check, 100);
        } else {
          setTimeout(() => resolve(true), ms);
        }
      };
      check();
    });
  };

  const updateBarStatus = (indices: number[], status: Bar['status']) => {
    const newArray = arrayRef.current.map((bar, idx) => {
      if (indices.includes(idx)) return { ...bar, status };
      return bar;
    });
    setArray(newArray);
    arrayRef.current = newArray;
  };

  const updateBarValue = (idx: number, value: number, status: Bar['status']) => {
    const newArray = [...arrayRef.current];
    newArray[idx] = { value, status };
    setArray(newArray);
    arrayRef.current = newArray;
  };

  const swapBars = (i: number, j: number) => {
    const newArray = [...arrayRef.current];
    const temp = { ...newArray[i] };
    newArray[i] = { ...newArray[j] };
    newArray[j] = temp;
    setArray(newArray);
    arrayRef.current = newArray;
    setStats(prev => ({ ...prev, swaps: prev.swaps + 1 }));
  };

  // Sorting Algorithms
  const bubbleSort = async () => {
    const n = arrayRef.current.length;
    const arr = [...arrayRef.current];

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (!isSortingRef.current) return;

        updateBarStatus([j, j + 1], 'comparing');
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        if (!(await sleep(speedRef.current))) return;

        if (arrayRef.current[j].value > arrayRef.current[j + 1].value) {
          updateBarStatus([j, j + 1], 'swapping');
          if (!(await sleep(speedRef.current))) return;
          swapBars(j, j + 1);
          if (!(await sleep(speedRef.current))) return;
        }
        updateBarStatus([j, j + 1], 'idle');
      }
      // Last element is sorted
      const newArray = [...arrayRef.current];
      newArray[n - i - 1].status = 'sorted';
      setArray(newArray);
      arrayRef.current = newArray;
    }
  };

  const selectionSort = async () => {
    const n = arrayRef.current.length;

    for (let i = 0; i < n; i++) {
      let minIdx = i;
      updateBarStatus([i], 'comparing');

      for (let j = i + 1; j < n; j++) {
        if (!isSortingRef.current) return;

        updateBarStatus([j], 'comparing');
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        if (!(await sleep(speedRef.current))) return;

        if (arrayRef.current[j].value < arrayRef.current[minIdx].value) {
          updateBarStatus([minIdx], 'idle');
          minIdx = j;
          updateBarStatus([minIdx], 'swapping');
          if (!(await sleep(speedRef.current))) return;
        } else {
          updateBarStatus([j], 'idle');
        }
      }

      if (minIdx !== i) {
        updateBarStatus([i, minIdx], 'swapping');
        if (!(await sleep(speedRef.current))) return;
        swapBars(i, minIdx);
        if (!(await sleep(speedRef.current))) return;
      }

      const newArray = [...arrayRef.current];
      newArray[i].status = 'sorted';
      if (minIdx !== i) newArray[minIdx].status = 'idle';
      setArray(newArray);
      arrayRef.current = newArray;
    }
  };

  const insertionSort = async () => {
    const n = arrayRef.current.length;

    // First element is sorted by definition in visualization
    updateBarStatus([0], 'sorted');

    for (let i = 1; i < n; i++) {
      let j = i;
      updateBarStatus([i], 'swapping');
      if (!(await sleep(speedRef.current))) return;

      while (j > 0 && arrayRef.current[j].value < arrayRef.current[j - 1].value) {
        if (!isSortingRef.current) return;

        updateBarStatus([j, j - 1], 'comparing');
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        if (!(await sleep(speedRef.current))) return;

        updateBarStatus([j, j - 1], 'swapping');
        if (!(await sleep(speedRef.current))) return;
        swapBars(j, j - 1);
        if (!(await sleep(speedRef.current))) return;

        // After swap, mark the previous one as sorted if it was part of the sorted sublist
        const newArr = [...arrayRef.current];
        newArr[j].status = 'sorted';
        setArray(newArr);
        arrayRef.current = newArr;

        j--;
      }
      const finalArr = [...arrayRef.current];
      finalArr[j].status = 'sorted';
      setArray(finalArr);
      arrayRef.current = finalArr;
    }
  };

  const mergeSort = async () => {
    const n = arrayRef.current.length;
    await mergeSortHelper(0, n - 1);
  };

  const mergeSortHelper = async (start: number, end: number) => {
    if (start >= end) return;
    if (!isSortingRef.current) return;

    const mid = Math.floor((start + end) / 2);
    await mergeSortHelper(start, mid);
    await mergeSortHelper(mid + 1, end);
    await merge(start, mid, end);
  };

  const merge = async (start: number, mid: number, end: number) => {
    if (!isSortingRef.current) return;

    const left = arrayRef.current.slice(start, mid + 1).map(b => b.value);
    const right = arrayRef.current.slice(mid + 1, end + 1).map(b => b.value);

    let i = 0, j = 0, k = start;

    while (i < left.length && j < right.length) {
      if (!isSortingRef.current) return;

      updateBarStatus([k], 'comparing');
      setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
      if (!(await sleep(speedRef.current))) return;

      if (left[i] <= right[j]) {
        updateBarValue(k, left[i], 'swapping');
        i++;
      } else {
        updateBarValue(k, right[j], 'swapping');
        j++;
      }
      if (!(await sleep(speedRef.current))) return;
      updateBarStatus([k], 'idle');
      k++;
    }

    while (i < left.length) {
      if (!isSortingRef.current) return;
      updateBarValue(k, left[i], 'swapping');
      if (!(await sleep(speedRef.current))) return;
      updateBarStatus([k], 'idle');
      i++;
      k++;
    }

    while (j < right.length) {
      if (!isSortingRef.current) return;
      updateBarValue(k, right[j], 'swapping');
      if (!(await sleep(speedRef.current))) return;
      updateBarStatus([k], 'idle');
      j++;
      k++;
    }
  };

  const quickSort = async () => {
    const n = arrayRef.current.length;
    await quickSortHelper(0, n - 1);
  };

  const quickSortHelper = async (start: number, end: number) => {
    if (start >= end) {
      if (start === end) updateBarStatus([start], 'sorted');
      return;
    }
    if (!isSortingRef.current) return;

    const pivotIdx = await partition(start, end);
    await quickSortHelper(start, pivotIdx - 1);
    await quickSortHelper(pivotIdx + 1, end);
  };

  const partition = async (start: number, end: number) => {
    const pivotValue = arrayRef.current[end].value;
    updateBarStatus([end], 'comparing');
    let i = start;

    for (let j = start; j < end; j++) {
      if (!isSortingRef.current) return i;

      updateBarStatus([j], 'comparing');
      setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
      if (!(await sleep(speedRef.current))) return i;

      if (arrayRef.current[j].value < pivotValue) {
        if (i !== j) {
          updateBarStatus([i, j], 'swapping');
          if (!(await sleep(speedRef.current))) return i;
          swapBars(i, j);
          if (!(await sleep(speedRef.current))) return i;
          updateBarStatus([i, j], 'idle');
        }
        i++;
      } else {
        updateBarStatus([j], 'idle');
      }
    }

    updateBarStatus([i, end], 'swapping');
    if (!(await sleep(speedRef.current))) return i;
    swapBars(i, end);
    if (!(await sleep(speedRef.current))) return i;
    updateBarStatus([end], 'idle');
    updateBarStatus([i], 'sorted');

    return i;
  };

  const startSort = async () => {
    if (isSorting) return;
    setIsSorting(true);
    isSortingRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;

    // Reset status to idle before starting
    const resetArray: Bar[] = arrayRef.current.map(b => ({ ...b, status: 'idle' }));
    setArray(resetArray);
    arrayRef.current = resetArray;
    setStats({ comparisons: 0, swaps: 0 });

    try {
      switch (algorithm) {
        case 'bubble': await bubbleSort(); break;
        case 'selection': await selectionSort(); break;
        case 'insertion': await insertionSort(); break;
        case 'merge': await mergeSort(); break;
        case 'quick': await quickSort(); break;
      }
    } catch (e) {
      console.error('Sorting interrupted', e);
    }

    if (isSortingRef.current) {
        // If finished naturally, mark all as sorted
        setArray(prev => prev.map(bar => ({ ...bar, status: 'sorted' })));
    }

    setIsSorting(false);
    isSortingRef.current = false;
  };

  const stopSort = () => {
    isSortingRef.current = false;
    setIsSorting(false);
    setIsPaused(false);
    isPausedRef.current = false;
    generateArray(arraySize);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    isPausedRef.current = !isPaused;
  };

  // Keyboard shortcuts using the "latest ref" pattern
  const handlersRef = useRef({
    startSort,
    stopSort,
    togglePause,
    generateArray,
    isSorting,
    isPaused,
    arraySize
  });

  useEffect(() => {
    handlersRef.current = {
      startSort,
      stopSort,
      togglePause,
      generateArray,
      isSorting,
      isPaused,
      arraySize
    };
  }, [startSort, stopSort, togglePause, generateArray, isSorting, isPaused, arraySize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      const { isSorting, isPaused, startSort, stopSort, togglePause, generateArray, arraySize } = handlersRef.current;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isSorting) {
          startSort();
        } else {
          togglePause();
        }
      } else if (e.key === 'Escape') {
        if (isSorting) {
          e.preventDefault();
          stopSort();
        }
      } else if (e.key.toLowerCase() === 's') {
        if (!isSorting) {
          e.preventDefault();
          generateArray(arraySize);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
       {/* Controls */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h4>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="algo-select" className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('sorting.algorithm')}</label>
                <select
                  id="algo-select"
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
                  disabled={isSorting}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white disabled:opacity-50"
                >
                  <option value="bubble">{t('sorting.algo.bubble')}</option>
                  <option value="selection">{t('sorting.algo.selection')}</option>
                  <option value="insertion">{t('sorting.algo.insertion')}</option>
                  <option value="merge">{t('sorting.algo.merge')}</option>
                  <option value="quick">{t('sorting.algo.quick')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                   <label htmlFor="size-range" className="text-[10px] font-bold text-slate-400 uppercase">{t('sorting.array_size')}</label>
                   <span className="text-[10px] font-bold text-indigo-500">{arraySize}</span>
                </div>
                <input
                  id="size-range"
                  type="range"
                  min={MIN_ARRAY_SIZE}
                  max={MAX_ARRAY_SIZE}
                  value={arraySize}
                  onChange={(e) => setArraySize(parseInt(e.target.value))}
                  disabled={isSorting}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                   <label htmlFor="speed-range" className="text-[10px] font-bold text-slate-400 uppercase">{t('sorting.speed')}</label>
                   <span className="text-[10px] font-bold text-indigo-500">{MAX_SPEED - speed}ms</span>
                </div>
                <input
                  id="speed-range"
                  type="range"
                  min={MIN_SPEED}
                  max={MAX_SPEED}
                  value={speed}
                  onChange={(e) => setSpeed(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex flex-wrap gap-4">
               {!isSorting ? (
                 <button
                   onClick={startSort}
                   className="group px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                 >
                   <Play className="w-5 h-5 fill-current" /> {t('common.play')}
                   <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 border rounded text-[10px] font-bold ml-1 transition-all bg-white/10 border-white/20 text-white/70 group-hover:bg-white/20">Space</kbd>
                 </button>
               ) : (
                 <>
                   <button
                     onClick={togglePause}
                     className="group px-8 py-3 bg-amber-500 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                   >
                     {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                     {isPaused ? t('common.play') : t('timer.pause')}
                     <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 border rounded text-[10px] font-bold ml-1 transition-all bg-white/10 border-white/20 text-white/70 group-hover:bg-white/20">Space</kbd>
                   </button>
                   <button
                     onClick={stopSort}
                     className="group px-8 py-3 bg-rose-500 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                   >
                     <RotateCcw className="w-5 h-5" /> {t('common.reset')}
                     <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 border rounded text-[10px] font-bold ml-1 transition-all bg-white/10 border-white/20 text-white/70 group-hover:bg-white/20">Esc</kbd>
                   </button>
                 </>
               )}
               <button
                 onClick={() => generateArray(arraySize)}
                 disabled={isSorting}
                 className="group px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
               >
                 <Shuffle className="w-5 h-5" /> {t('random.shuffle')}
                 <kbd className="hidden md:inline-flex items-center justify-center w-6 h-6 border rounded text-xs font-bold ml-1 transition-all bg-black/5 border-black/10 text-slate-400 group-hover:bg-black/10 dark:bg-white/5 dark:border-white/10 dark:text-slate-500 dark:group-hover:bg-white/10">S</kbd>
               </button>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-6 md:mt-0">
               <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('sorting.comparisons')}</div>
                  <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400" aria-live="polite">{stats.comparisons}</div>
               </div>
               <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('sorting.swaps')}</div>
                  <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400" aria-live="polite">{stats.swaps}</div>
               </div>
            </div>
          </div>
       </div>

       {/* Visualization Area */}
       <div
         className="bg-slate-100 dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 min-h-[400px] flex items-end justify-center gap-px overflow-hidden"
         role="img"
         aria-label={t('tool.sorting-visualizer.description')}
       >
          {array.map((bar, idx) => (
            <div
              key={idx}
              className={`w-full transition-all rounded-t-sm ${
                bar.status === 'idle' ? 'bg-indigo-200 dark:bg-indigo-900/40' :
                bar.status === 'comparing' ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)]' :
                bar.status === 'swapping' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' :
                'bg-emerald-500'
              }`}
              style={{
                height: `${bar.value}px`,
              }}
            />
          ))}
       </div>

       {/* Info */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('unit.guide_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
             {t('sorting.guide')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" /> {t('sorting.complexity_title')}
          </h4>
          <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>{t('sorting.algo.bubble')}</span>
                <span className="font-mono text-indigo-500">O(n²)</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>{t('sorting.algo.selection')}</span>
                <span className="font-mono text-indigo-500">O(n²)</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>{t('sorting.algo.insertion')}</span>
                <span className="font-mono text-indigo-500">O(n²)</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>{t('sorting.algo.merge')}</span>
                <span className="font-mono text-indigo-500">O(n log n)</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>{t('sorting.algo.quick')}</span>
                <span className="font-mono text-indigo-500">O(n log n)</span>
             </div>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
             <BarChart3 className="w-4 h-4 text-indigo-500" /> {t('sorting.visual_title')}
          </h4>
          <div className="flex flex-wrap gap-4">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="w-3 h-3 bg-amber-400 rounded-sm" /> {t('sorting.status_comparing')}
             </div>
             <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="w-3 h-3 bg-rose-500 rounded-sm" /> {t('sorting.status_swapping')}
             </div>
             <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <div className="w-3 h-3 bg-emerald-500 rounded-sm" /> {t('sorting.status_sorted')}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
