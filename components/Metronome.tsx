import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Plus, Minus } from 'lucide-react';

export function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentBeat, setCurrentBeat] = useState(0);
  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerId = useRef<number | null>(null);

  // Use refs to avoid stale closures in the scheduler loop
  const bpmRef = useRef(bpm);
  const beatRef = useRef(0);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const scheduleNote = (beatNumber: number, time: number) => {
    if (!audioContext.current) return;
    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    osc.frequency.value = beatNumber === 0 ? 880 : 440;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);

    // Synchronize visual beat with React state
    const delay = Math.max(0, (time - audioContext.current.currentTime) * 1000);
    setTimeout(() => {
      setCurrentBeat(beatNumber);
    }, delay);
  };

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;

    // Schedule notes for the next 100ms
    while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
      scheduleNote(beatRef.current, nextNoteTime.current);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTime.current += secondsPerBeat;

      // Increment local beat counter for next iteration
      beatRef.current = (beatRef.current + 1) % 4;
    }

    timerId.current = window.setTimeout(scheduler, 25);
  }, []);

  const toggleMetronome = () => {
    if (!isPlaying) {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      setIsPlaying(true);
      beatRef.current = 0;
      setCurrentBeat(0);
      nextNoteTime.current = audioContext.current.currentTime + 0.05;
      scheduler();
    } else {
      setIsPlaying(false);
      if (timerId.current) {
        clearTimeout(timerId.current);
        timerId.current = null;
      }
      setCurrentBeat(0);
      beatRef.current = 0;
    }
  };

  useEffect(() => {
    return () => {
      if (timerId.current) clearTimeout(timerId.current);
      if (audioContext.current) audioContext.current.close();
    };
  }, []);

  return (
    <div className="max-w-md mx-auto text-center space-y-8">
      <div className="flex justify-center gap-4">
        {[0, 1, 2, 3].map((beat) => (
          <div
            key={beat}
            className={`w-4 h-4 rounded-full transition-all duration-100 ${
              isPlaying && currentBeat === beat
                ? 'bg-indigo-600 scale-125 shadow-lg shadow-indigo-500/50'
                : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        ))}
      </div>

      <div className="space-y-4">
        <div className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
          {bpm} <span className="text-xl text-slate-400 font-medium uppercase tracking-widest">BPM</span>
        </div>
        <input
          id="bpm-range"
          type="range"
          min="40"
          max="240"
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          aria-label="Réglage du BPM"
        />
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setBpm(Math.max(40, bpm - 1))}
          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          aria-label="Diminuer le BPM"
        >
          <Minus className="w-6 h-6" />
        </button>
        <button
          onClick={toggleMetronome}
          className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20 hover:bg-rose-600'
              : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700'
          }`}
          aria-label={isPlaying ? "Arrêter" : "Démarrer"}
        >
          {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
        </button>
        <button
          onClick={() => setBpm(Math.min(240, bpm + 1))}
          className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          aria-label="Augmenter le BPM"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[60, 120, 140, 180].map((preset) => (
          <button
            key={preset}
            onClick={() => setBpm(preset)}
            className={`py-3 rounded-xl font-bold border transition-all ${
              bpm === preset
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
            }`}
          >
            {preset} BPM
          </button>
        ))}
      </div>
    </div>
  );
}
