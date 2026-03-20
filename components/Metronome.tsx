import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Music } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);
  const bpmRef = useRef(120);
  const currentBeatRef = useRef(0);
  const beatsPerMeasure = 4;

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  const playClick = useCallback((time: number, beat: number) => {
    if (!audioContext.current) return;
    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    osc.frequency.value = beat === 0 ? 880 : 440;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);

    // Synchronize visual beat with audio
    const delay = (time - audioContext.current.currentTime) * 1000;
    setTimeout(() => {
      setCurrentBeat(beat);
    }, Math.max(0, delay));
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;
    while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
      playClick(nextNoteTime.current, currentBeatRef.current);
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTime.current += secondsPerBeat;
      currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasure;
    }
    timerID.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const toggleMetronome = () => {
    if (!isPlaying) {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      nextNoteTime.current = audioContext.current.currentTime;
      currentBeatRef.current = 0;
      setIsPlaying(true);
      scheduler();
    } else {
      setIsPlaying(false);
      if (timerID.current) clearTimeout(timerID.current);
      setCurrentBeat(0);
    }
  };

  useEffect(() => {
    return () => {
      if (timerID.current) clearTimeout(timerID.current);
      if (audioContext.current) audioContext.current.close();
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(Math.max(prev + delta, 40), 240));
  };

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 text-center space-y-8">
        <div className="flex justify-center gap-3">
          {[...Array(beatsPerMeasure)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === i
                  ? 'bg-indigo-600 scale-125 shadow-lg shadow-indigo-500/50'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-7xl font-black text-slate-900 dark:text-white tabular-nums">
            {bpm}
          </div>
          <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">BPM</div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => adjustBpm(-5)}
            className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500 transition-all active:scale-95"
            aria-label="Diminuer le BPM de 5"
          >
            <Minus className="w-6 h-6" />
          </button>

          <button
            onClick={toggleMetronome}
            className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all active:scale-95 shadow-xl ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-rose-500/25 hover:bg-rose-600'
                : 'bg-indigo-600 text-white shadow-indigo-500/25 hover:bg-indigo-700'
            }`}
            aria-label={isPlaying ? "Arrêter" : "Démarrer"}
          >
            {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-0.5" />}
          </button>

          <button
            onClick={() => adjustBpm(5)}
            className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500 transition-all active:scale-95"
            aria-label="Augmenter le BPM de 5"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4">
          <input
            id="bpm-slider"
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <label htmlFor="bpm-slider" className="sr-only">Régler le tempo</label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
              <Music className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Conseil</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Utilisez le métronome pour garder un rythme régulier lors de vos séances de pratique musicale ou de sport. Le premier temps est accentué pour vous aider à vous repérer.
          </p>
        </div>
      </div>
    </div>
  );
}
