import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, RotateCcw, Shuffle, Info, Settings2, BarChart3, Pause, FastForward, StepForward, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';
import { Kbd } from './ui/Kbd';

// Types for the sorting state
type Algorithm = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick' | 'heap' | 'shell' | 'cocktail' | 'comb' | 'radix' | 'gnome' | 'odd_even' | 'bogo';

interface Bar {
  value: number;
  status: 'idle' | 'comparing' | 'swapping' | 'sorted';
}

const MAX_ARRAY_SIZE = 100;
const MIN_ARRAY_SIZE = 5;
const MAX_SPEED = 500; // ms delay
const MIN_SPEED = 0;

export function SortingVisualizer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n } = useTranslation();
  const [algorithm, setAlgorithm] = useState<Algorithm>(initialData?.algorithm || 'bubble');
  const [arraySize, setArraySize] = useState(initialData?.arraySize || 30);
  const [speed, setSpeed] = useState(initialData?.speed || 50);
  const [soundEnabled, setSoundToggle] = useState(initialData?.soundEnabled ?? true);
  const [volume, setVolume] = useState(initialData?.volume ?? 0.5);
  const [array, setArray] = useState<Bar[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStepMode, setIsStepMode] = useState(false);
  const [stats, setStats] = useState({ comparisons: 0, swaps: 0 });

  const isSortingRef = useRef(false);
  const isPausedRef = useRef(false);
  const isStepModeRef = useRef(false);
  const stepTriggerRef = useRef<(() => void) | null>(null);
  const arrayRef = useRef<Bar[]>([]);
  const speedRef = useRef(speed);
  const audioContextRef = useRef<AudioContext | null>(null);
  const volumeRef = useRef(volume);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    volumeRef.current = volume;
    soundEnabledRef.current = soundEnabled;
  }, [volume, soundEnabled]);

  const playNote = useCallback((value: number) => {
    if (!soundEnabledRef.current) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();

    // Map value (20-320) to frequency (200-1000Hz)
    const freq = 200 + (value - 20) * (800 / 300);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(envelope);
    envelope.connect(ctx.destination);

    envelope.gain.setValueAtTime(0, ctx.currentTime);
    envelope.gain.linearRampToValueAtTime(volumeRef.current * 0.1, ctx.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }, []);

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
    onStateChange?.({ algorithm, arraySize, speed, soundEnabled, volume });
    speedRef.current = speed;
  }, [algorithm, arraySize, speed, soundEnabled, volume, onStateChange]);

  const sleep = (ms: number) => {
    return new Promise(resolve => {
      const check = () => {
        if (!isSortingRef.current) {
          resolve(false);
          return;
        }
        if (isStepModeRef.current) {
           stepTriggerRef.current = () => {
              stepTriggerRef.current = null;
              resolve(true);
           };
        } else if (isPausedRef.current) {
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
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (!isSortingRef.current) return;
        updateBarStatus([j, j + 1], 'comparing');
        playNote(arrayRef.current[j].value);
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        if (!(await sleep(speedRef.current))) return;
        if (arrayRef.current[j].value > arrayRef.current[j + 1].value) {
          updateBarStatus([j, j + 1], 'swapping');
          playNote(arrayRef.current[j+1].value);
          if (!(await sleep(speedRef.current))) return;
          swapBars(j, j + 1);
          if (!(await sleep(speedRef.current))) return;
        }
        updateBarStatus([j, j + 1], 'idle');
      }
      const newArray = [...arrayRef.current];
      newArray[n - i - 1].status = 'sorted';
      setArray(newArray);
      arrayRef.current = newArray;
    }
  };

  const selectionSort = async () => {
    const n = arrayRef.current.length;
    for (let i = 0; i < n; i++) {
      if (!isSortingRef.current) return;
      let minIdx = i;
      updateBarStatus([i], 'comparing');
      playNote(arrayRef.current[i].value);
      for (let j = i + 1; j < n; j++) {
        if (!isSortingRef.current) return;
        updateBarStatus([j], 'comparing');
        playNote(arrayRef.current[j].value);
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        if (!(await sleep(speedRef.current))) return;
        if (arrayRef.current[j].value < arrayRef.current[minIdx].value) {
          updateBarStatus([minIdx], 'idle');
          minIdx = j;
          updateBarStatus([minIdx], 'swapping');
          playNote(arrayRef.current[minIdx].value);
          if (!(await sleep(speedRef.current))) return;
        } else {
          updateBarStatus([j], 'idle');
        }
      }
      if (!isSortingRef.current) return;
      if (minIdx !== i) {
        updateBarStatus([i, minIdx], 'swapping');
        if (!(await sleep(speedRef.current))) return;
        swapBars(i, minIdx);
        if (!(await sleep(speedRef.current))) return;
      }
      if (!isSortingRef.current) return;
      const newArray = [...arrayRef.current];
      newArray[i].status = 'sorted';
      if (minIdx !== i) newArray[minIdx].status = 'idle';
      setArray(newArray);
      arrayRef.current = newArray;
    }
  };

  const insertionSort = async () => {
    const n = arrayRef.current.length;
    if (!isSortingRef.current) return;
    updateBarStatus([0], 'sorted');
    for (let i = 1; i < n; i++) {
      if (!isSortingRef.current) return;
      let j = i;
      updateBarStatus([i], 'swapping');
      if (!(await sleep(speedRef.current))) return;
      while (j > 0 && arrayRef.current[j].value < arrayRef.current[j - 1].value) {
        if (!isSortingRef.current) return;
        updateBarStatus([j, j - 1], 'comparing');
        playNote(arrayRef.current[j].value);
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        if (!(await sleep(speedRef.current))) return;
        updateBarStatus([j, j - 1], 'swapping');
        if (!(await sleep(speedRef.current))) return;
        swapBars(j, j - 1);
        if (!(await sleep(speedRef.current))) return;
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

  const shellSort = async () => {
    const n = arrayRef.current.length;
    for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      for (let i = gap; i < n; i++) {
        if (!isSortingRef.current) return;
        let tempValue = arrayRef.current[i].value;
        let j = i;
        updateBarStatus([i], 'comparing');
        playNote(arrayRef.current[i].value);
        if (!(await sleep(speedRef.current))) return;
        while (j >= gap && arrayRef.current[j - gap].value > tempValue) {
          if (!isSortingRef.current) return;
          updateBarStatus([j, j - gap], 'swapping');
          playNote(arrayRef.current[j-gap].value);
          setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
          if (!(await sleep(speedRef.current))) return;
          updateBarValue(j, arrayRef.current[j - gap].value, 'swapping');
          if (!(await sleep(speedRef.current))) return;
          updateBarStatus([j], 'idle');
          j -= gap;
        }
        updateBarValue(j, tempValue, 'sorted');
        if (!(await sleep(speedRef.current))) return;
      }
    }
  };

  const cocktailSort = async () => {
    const n = arrayRef.current.length;
    let swapped = true;
    let start = 0;
    let end = n - 1;

    while (swapped) {
      swapped = false;
      for (let i = start; i < end; i++) {
        if (!isSortingRef.current) return;
        updateBarStatus([i, i + 1], 'comparing');
        playNote(arrayRef.current[i].value);
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        if (!(await sleep(speedRef.current))) return;
        if (arrayRef.current[i].value > arrayRef.current[i + 1].value) {
          updateBarStatus([i, i + 1], 'swapping');
          if (!(await sleep(speedRef.current))) return;
          swapBars(i, i + 1);
          swapped = true;
          if (!(await sleep(speedRef.current))) return;
        }
        updateBarStatus([i, i + 1], 'idle');
      }
      if (!swapped) break;
      swapped = false;
      const lastSorted = [...arrayRef.current];
      lastSorted[end].status = 'sorted';
      setArray(lastSorted);
      arrayRef.current = lastSorted;
      end--;

      for (let i = end - 1; i >= start; i--) {
        if (!isSortingRef.current) return;
        updateBarStatus([i, i + 1], 'comparing');
        playNote(arrayRef.current[i].value);
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        if (!(await sleep(speedRef.current))) return;
        if (arrayRef.current[i].value > arrayRef.current[i + 1].value) {
          updateBarStatus([i, i + 1], 'swapping');
          if (!(await sleep(speedRef.current))) return;
          swapBars(i, i + 1);
          swapped = true;
          if (!(await sleep(speedRef.current))) return;
        }
        updateBarStatus([i, i + 1], 'idle');
      }
      const firstSorted = [...arrayRef.current];
      firstSorted[start].status = 'sorted';
      setArray(firstSorted);
      arrayRef.current = firstSorted;
      start++;
    }
  };

  const combSort = async () => {
    const n = arrayRef.current.length;
    let gap = n;
    const shrink = 1.3;
    let swapped = true;

    while (gap > 1 || swapped) {
      gap = Math.floor(gap / shrink);
      if (gap < 1) gap = 1;

      swapped = false;
      for (let i = 0; i + gap < n; i++) {
        if (!isSortingRef.current) return;
        updateBarStatus([i, i + gap], 'comparing');
        playNote(arrayRef.current[i].value);
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        if (!(await sleep(speedRef.current))) return;

        if (arrayRef.current[i].value > arrayRef.current[i + gap].value) {
          updateBarStatus([i, i + gap], 'swapping');
          if (!(await sleep(speedRef.current))) return;
          swapBars(i, i + gap);
          swapped = true;
          if (!(await sleep(speedRef.current))) return;
        }
        updateBarStatus([i, i + gap], 'idle');
      }
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
      playNote(left[i]);
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
      i++; k++;
    }
    while (j < right.length) {
      if (!isSortingRef.current) return;
      updateBarValue(k, right[j], 'swapping');
      if (!(await sleep(speedRef.current))) return;
      updateBarStatus([k], 'idle');
      j++; k++;
    }
  };

  const heapSort = async () => {
    const n = arrayRef.current.length;
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await heapify(n, i);
    for (let i = n - 1; i > 0; i--) {
      if (!isSortingRef.current) return;
      updateBarStatus([0, i], 'swapping');
      if (!(await sleep(speedRef.current))) return;
      swapBars(0, i);
      if (!(await sleep(speedRef.current))) return;
      const newArray = [...arrayRef.current];
      newArray[i].status = 'sorted';
      setArray(newArray);
      arrayRef.current = newArray;
      await heapify(i, 0);
    }
    if (!isSortingRef.current) return;
    const finalArray = [...arrayRef.current];
    finalArray[0].status = 'sorted';
    setArray(finalArray);
    arrayRef.current = finalArray;
  };

  const heapify = async (n: number, i: number) => {
    if (!isSortingRef.current) return;
    let largest = i;
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    updateBarStatus([i], 'comparing');
    playNote(arrayRef.current[i].value);
    if (l < n) updateBarStatus([l], 'comparing');
    if (r < n) updateBarStatus([r], 'comparing');
    setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
    if (!(await sleep(speedRef.current))) return;
    if (l < n && arrayRef.current[l].value > arrayRef.current[largest].value) largest = l;
    if (r < n && arrayRef.current[r].value > arrayRef.current[largest].value) largest = r;
    if (largest !== i) {
      updateBarStatus([i, largest], 'swapping');
      if (!(await sleep(speedRef.current))) return;
      swapBars(i, largest);
      if (!(await sleep(speedRef.current))) return;
      updateBarStatus([i, largest], 'idle');
      await heapify(n, largest);
    } else {
      updateBarStatus([i], 'idle');
      if (l < n) updateBarStatus([l], 'idle');
      if (r < n) updateBarStatus([r], 'idle');
    }
  };

  const radixSort = async () => {
    const n = arrayRef.current.length;
    const maxVal = Math.max(...arrayRef.current.map(b => b.value));

    for (let exp = 1; Math.floor(maxVal / exp) > 0; exp *= 10) {
      if (!isSortingRef.current) return;
      await countingSortForRadix(n, exp);
    }

    const finalArray = [...arrayRef.current];
    for (let i = 0; i < n; i++) finalArray[i].status = 'sorted';
    setArray(finalArray);
    arrayRef.current = finalArray;
  };

  const countingSortForRadix = async (n: number, exp: number) => {
    const output = new Array(n);
    const count = new Array(10).fill(0);

    for (let i = 0; i < n; i++) {
      if (!isSortingRef.current) return;
      const digit = Math.floor(arrayRef.current[i].value / exp) % 10;
      count[digit]++;
      updateBarStatus([i], 'comparing');
      playNote(arrayRef.current[i].value);
      setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
      if (!(await sleep(speedRef.current))) return;
      updateBarStatus([i], 'idle');
    }

    for (let i = 1; i < 10; i++) {
      count[i] += count[i - 1];
    }

    for (let i = n - 1; i >= 0; i--) {
      if (!isSortingRef.current) return;
      const digit = Math.floor(arrayRef.current[i].value / exp) % 10;
      output[count[digit] - 1] = arrayRef.current[i].value;
      count[digit]--;
    }

    for (let i = 0; i < n; i++) {
      if (!isSortingRef.current) return;
      updateBarValue(i, output[i], 'swapping');
      setStats(prev => ({ ...prev, swaps: prev.swaps + 1 }));
      if (!(await sleep(speedRef.current))) return;
      updateBarStatus([i], 'idle');
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
    playNote(pivotValue);
    let i = start;
    for (let j = start; j < end; j++) {
      if (!isSortingRef.current) return i;
      updateBarStatus([j], 'comparing');
      playNote(arrayRef.current[j].value);
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

  const isSorted = (arr: Bar[]) => {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i].value > arr[i + 1].value) return false;
    }
    return true;
  };

  const gnomeSort = async () => {
    const n = arrayRef.current.length;
    let index = 0;
    while (index < n) {
      if (!isSortingRef.current) return;
      if (index === 0) {
        index++;
        continue;
      }
      updateBarStatus([index, index - 1], 'comparing');
      playNote(arrayRef.current[index].value);
      setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
      if (!(await sleep(speedRef.current))) return;

      if (arrayRef.current[index].value >= arrayRef.current[index - 1].value) {
        updateBarStatus([index, index - 1], 'idle');
        index++;
      } else {
        updateBarStatus([index, index - 1], 'swapping');
        if (!(await sleep(speedRef.current))) return;
        swapBars(index, index - 1);
        if (!(await sleep(speedRef.current))) return;
        updateBarStatus([index, index - 1], 'idle');
        index--;
      }
    }
  };

  const oddEvenSort = async () => {
    const n = arrayRef.current.length;
    let sorted = false;
    while (!sorted) {
      if (!isSortingRef.current) return;
      sorted = true;

      // Odd pass
      for (let i = 1; i < n - 1; i += 2) {
        if (!isSortingRef.current) return;
        updateBarStatus([i, i + 1], 'comparing');
        playNote(arrayRef.current[i].value);
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        if (!(await sleep(speedRef.current))) return;
        if (arrayRef.current[i].value > arrayRef.current[i + 1].value) {
          updateBarStatus([i, i + 1], 'swapping');
          if (!(await sleep(speedRef.current))) return;
          swapBars(i, i + 1);
          sorted = false;
          if (!(await sleep(speedRef.current))) return;
        }
        updateBarStatus([i, i + 1], 'idle');
      }

      // Even pass
      for (let i = 0; i < n - 1; i += 2) {
        if (!isSortingRef.current) return;
        updateBarStatus([i, i + 1], 'comparing');
        playNote(arrayRef.current[i].value);
        setStats(prev => ({ ...prev, comparisons: prev.comparisons + 1 }));
        if (!(await sleep(speedRef.current))) return;
        if (arrayRef.current[i].value > arrayRef.current[i + 1].value) {
          updateBarStatus([i, i + 1], 'swapping');
          if (!(await sleep(speedRef.current))) return;
          swapBars(i, i + 1);
          sorted = false;
          if (!(await sleep(speedRef.current))) return;
        }
        updateBarStatus([i, i + 1], 'idle');
      }
    }
  };

  const bogoSort = async () => {
    const n = arrayRef.current.length;
    while (!isSorted(arrayRef.current)) {
      if (!isSortingRef.current) return;

      // Shuffle
      for (let i = n - 1; i > 0; i--) {
        const j = getSecureRandomInt(i + 1);
        swapBars(i, j);
      }

      setStats(prev => ({ ...prev, comparisons: prev.comparisons + n }));
      setArray([...arrayRef.current]);
      if (!(await sleep(speedRef.current))) return;
    }
  };

  const startSort = async (mode: 'auto' | 'step') => {
    if (isSortingRef.current) {
      if (mode === 'step' && isStepModeRef.current) {
        stepTriggerRef.current?.();
      }
      return;
    }

    setIsSorting(true);
    isSortingRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
    setIsStepMode(mode === 'step');
    isStepModeRef.current = mode === 'step';

    const resetArray: Bar[] = arrayRef.current.map(b => ({ ...b, status: 'idle' }));
    setArray(resetArray);
    arrayRef.current = resetArray;
    setStats({ comparisons: 0, swaps: 0 });

    try {
      switch (algorithm) {
        case 'bubble': await bubbleSort(); break;
        case 'selection': await selectionSort(); break;
        case 'insertion': await insertionSort(); break;
        case 'shell': await shellSort(); break;
        case 'cocktail': await cocktailSort(); break;
        case 'comb': await combSort(); break;
        case 'merge': await mergeSort(); break;
        case 'quick': await quickSort(); break;
        case 'heap': await heapSort(); break;
        case 'radix': await radixSort(); break;
        case 'gnome': await gnomeSort(); break;
        case 'odd_even': await oddEvenSort(); break;
        case 'bogo': await bogoSort(); break;
      }
    } catch (e) {
      console.error('Sorting interrupted', e);
    }

    if (isSortingRef.current) {
      setArray(prev => prev.map(bar => ({ ...bar, status: 'sorted' })));
    }

    setIsSorting(false);
    isSortingRef.current = false;
    setIsStepMode(false);
    isStepModeRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
  };

  const stopSort = () => {
    isSortingRef.current = false;
    setIsSorting(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setIsStepMode(false);
    isStepModeRef.current = false;
    generateArray(arraySize);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    isPausedRef.current = !isPaused;
    if (isStepMode) {
       setIsStepMode(false);
       isStepModeRef.current = false;
    }
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
          startSort('auto');
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
      } else if (e.key === 'ArrowRight' && isSorting) {
         e.preventDefault();
         startSort('step');
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
                  <option value="shell">{t('sorting.algo.shell')}</option>
                  <option value="cocktail">{t('sorting.algo.cocktail')}</option>
                  <option value="comb">{t('sorting.algo.comb')}</option>
                  <option value="merge">{t('sorting.algo.merge')}</option>
                  <option value="quick">{t('sorting.algo.quick')}</option>
                  <option value="heap">{t('sorting.algo.heap')}</option>
                  <option value="radix">{t('sorting.algo.radix')}</option>
                  <option value="gnome">{t('sorting.algo.gnome')}</option>
                  <option value="odd_even">{t('sorting.algo.odd_even')}</option>
                  <option value="bogo">{t('sorting.algo.bogo')}</option>
                </select>
              </div>

              {algorithm === 'bogo' && arraySize > 6 && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 p-3 rounded-xl flex items-start gap-2 text-amber-600 dark:text-amber-400 font-bold text-[10px] animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <p>{t('sorting.bogo_warning')}</p>
                </div>
              )}

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

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="sound-toggle" className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer">{t('sorting.sound')}</label>
                  <button
                    id="sound-toggle"
                    onClick={() => setSoundToggle(!soundEnabled)}
                    className={`p-2 rounded-lg transition-all ${soundEnabled ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                </div>
                {soundEnabled && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label htmlFor="volume-range" className="text-[10px] font-bold text-slate-400 uppercase">{t('common.volume')}</label>
                      <span className="text-[10px] font-bold text-indigo-500">{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      id="volume-range"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex flex-wrap gap-4">
               {!isSorting ? (
                 <div className="flex gap-2">
                    <button
                      onClick={() => startSort('auto')}
                      className="group px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    >
                      <Play className="w-5 h-5 fill-current" /> {t('common.play')}
                    </button>
                    <button
                      onClick={() => startSort('step')}
                      className="group px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                      title={t('sorting.step_mode_hint')}
                    >
                      <FastForward className="w-5 h-5" /> {t('sorting.step_by_step')}
                    </button>
                 </div>
               ) : (
                 <>
                    {isStepMode ? (
                       <button
                         onClick={() => startSort('step')}
                         className="group px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                       >
                         <StepForward className="w-5 h-5" /> {t('sorting.next_step')}
                         <Kbd modifier={null} className="ml-1 border-white/20 bg-white/10 text-white/70 group-hover:bg-white/20">→</Kbd>
                       </button>
                    ) : (
                       <button
                         onClick={togglePause}
                         className="group px-8 py-3 bg-amber-500 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
                       >
                         {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Pause className="w-5 h-5 fill-current" />}
                         {isPaused ? t('common.play') : t('timer.pause')}
                         <Kbd modifier={null} className="ml-1 border-white/20 bg-white/10 text-white/70 group-hover:bg-white/20">Space</Kbd>
                       </button>
                    )}
                   <button
                     onClick={stopSort}
                     className="group px-8 py-3 bg-rose-500 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                   >
                     <RotateCcw className="w-5 h-5" /> {t('common.reset')}
                     <Kbd modifier={null} className="ml-1 border-white/20 bg-white/10 text-white/70 group-hover:bg-white/20">Esc</Kbd>
                   </button>
                 </>
               )}
               <button
                 onClick={() => generateArray(arraySize)}
                 disabled={isSorting}
                 className="group px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
               >
                 <Shuffle className="w-5 h-5" /> {t('random.shuffle')}
                 <Kbd modifier={null} className="ml-1 group-hover:bg-black/10 dark:group-hover:bg-white/10">S</Kbd>
               </button>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-6 md:mt-0" aria-live="polite" aria-atomic="true">
               <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('sorting.comparisons')}</div>
                  <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">{stats.comparisons}</div>
               </div>
               <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('sorting.swaps')}</div>
                  <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">{stats.swaps}</div>
               </div>
            </div>
          </div>
       </div>

       {/* Visualization Area */}
       <div
         className="bg-slate-100 dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 min-h-[400px] flex items-end justify-center gap-px overflow-hidden relative"
         role="img"
         aria-label={t('tool.sorting-visualizer.description')}
       >
          {array.map((bar, idx) => (
            <div
              key={idx}
              className={`w-full transition-all rounded-t-sm ${
                bar.status === 'idle' ? 'bg-indigo-200 dark:bg-indigo-900/40' :
                bar.status === 'comparing' ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.5)] relative z-10' :
                bar.status === 'swapping' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] relative z-10' :
                'bg-emerald-500'
              }`}
              style={{
                height: `${bar.value}px`,
              }}
            />
          ))}
          {isSorting && (
             <div className="absolute top-4 right-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{isStepMode ? t('sorting.step_by_step') : t('sorting.auto_sorting')}</span>
             </div>
          )}
       </div>

       {/* Info */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('unit.guide_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
             {t('sorting.guide')} {i18n.language === 'fr' ? <>Utilisez le mode <span className="font-bold">Pas à Pas</span> pour contrôler manuellement la progression de l'algorithme à l'aide de la touche <span className="font-bold">Flèche Droite</span>.</> : <>Use the <span className="font-bold">Step-by-Step</span> mode to manually control the algorithm's progress using the <span className="font-bold">Arrow Right</span> key.</>}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" /> {t('sorting.complexity_title')}
          </h4>
          <div className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>{t('sorting.algo.bubble')} / Cocktail</span>
                <span className="font-mono text-indigo-500">O(n²)</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>{t('sorting.algo.selection')} / {t('sorting.algo.insertion')}</span>
                <span className="font-mono text-indigo-500">O(n²)</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>Shell Sort</span>
                <span className="font-mono text-indigo-500">O(n log² n)</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>{t('sorting.algo.merge')} / {t('sorting.algo.quick')} / {t('sorting.algo.heap')}</span>
                <span className="font-mono text-indigo-500">O(n log n)</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>{t('sorting.algo.radix')}</span>
                <span className="font-mono text-indigo-500">O(nk)</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>{t('sorting.algo.gnome')} / {t('sorting.algo.odd_even')}</span>
                <span className="font-mono text-indigo-500">O(n²)</span>
             </div>
             <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1">
                <span>{t('sorting.algo.bogo')}</span>
                <span className="font-mono text-indigo-500">O(n!)</span>
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
