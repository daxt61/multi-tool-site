import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Plus, Minus, Activity } from 'lucide-react';

export function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const beatRef = useRef(0);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const playClick = useCallback((time: number, isFirstBeat: boolean, beat: number) => {
    if (!audioContext.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    osc.frequency.value = isFirstBeat ? 880 : 440;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);

    // Schedule visual update
    const delay = (time - audioContext.current.currentTime) * 1000;
    setTimeout(() => {
      setCurrentBeat(beat);
    }, delay);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;

    while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
      const currentBeatInLoop = beatRef.current;
      playClick(nextNoteTime.current, currentBeatInLoop === 0, currentBeatInLoop);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTime.current += secondsPerBeat;
      beatRef.current = (beatRef.current + 1) % 4;
    }
    timerID.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const toggleMetronome = () => {
    if (!isPlaying) {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }

      setIsPlaying(true);
      beatRef.current = 0;
      nextNoteTime.current = audioContext.current.currentTime;
      scheduler();
    } else {
      setIsPlaying(false);
      if (timerID.current) clearTimeout(timerID.current);
      setCurrentBeat(0);
      beatRef.current = 0;
    }
  };

  useEffect(() => {
    return () => {
      if (timerID.current) clearTimeout(timerID.current);
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-widest">
          <Activity className="w-3 h-3" /> Rythme
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Métronome</h2>
        <p className="text-slate-500 dark:text-slate-400">Gardez le tempo avec précision.</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center space-y-12">
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === i
                  ? i === 0 ? 'bg-indigo-600 scale-150 shadow-lg shadow-indigo-500/50' : 'bg-indigo-400 scale-125'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col items-center space-y-8">
          <div className="text-8xl font-black font-mono text-slate-900 dark:text-white tabular-nums tracking-tighter">
            {bpm}
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setBpm(Math.max(40, bpm - 1))}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition-all active:scale-95"
            >
              <Minus className="w-6 h-6" />
            </button>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-48 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <button
              onClick={() => setBpm(Math.min(240, bpm + 1))}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <button
          onClick={toggleMetronome}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl ${
            isPlaying
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
          }`}
        >
          {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: 'Adagio', range: '66-76' },
          { name: 'Andante', range: '76-108' },
          { name: 'Moderato', range: '108-120' },
          { name: 'Allegro', range: '120-168' }
        ].map((tempo) => (
          <div key={tempo.name} className="p-4 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 flex justify-between items-center px-6">
            <span className="font-bold text-slate-700 dark:text-slate-300">{tempo.name}</span>
            <span className="text-sm font-mono text-slate-400">{tempo.range} BPM</span>
          </div>
        ))}
      </div>
    </div>
  );
}
