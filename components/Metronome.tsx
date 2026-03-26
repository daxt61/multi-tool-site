import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Volume2, VolumeX, Plus, Minus } from 'lucide-react';

export function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [isMuted, setIsMuted] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const isMutedRef = useRef(isMuted);

  // Update refs to avoid stale closures in the scheduler
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const playClick = useCallback((time: number) => {
    if (!audioContextRef.current || isMutedRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.frequency.value = 880; // Standard click frequency
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      const scheduleTime = nextNoteTimeRef.current;
      playClick(scheduleTime);

      // Visual synchronization
      const delay = (scheduleTime - audioContextRef.current.currentTime) * 1000;
      setTimeout(() => {
        setCurrentBeat(prev => (prev + 1) % 4);
      }, Math.max(0, delay));

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;
    }

    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      setIsPlaying(true);
      setCurrentBeat(0);
      nextNoteTimeRef.current = audioContextRef.current.currentTime;
      scheduler();
    } else {
      setIsPlaying(false);
      if (timerIDRef.current) {
        clearTimeout(timerIDRef.current);
      }
    }
  };

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(240, Math.max(40, prev + delta)));
  };

  useEffect(() => {
    return () => {
      if (timerIDRef.current) {
        clearTimeout(timerIDRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center">
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((beat) => (
            <div
              key={beat}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === beat
                  ? 'bg-indigo-500 scale-125 shadow-lg shadow-indigo-500/50'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="mb-8">
          <span className="text-7xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white">
            {bpm}
          </span>
          <span className="text-sm font-bold uppercase tracking-widest text-slate-400 block mt-2">
            BPM
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={() => adjustBpm(-5)}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300 active:scale-95"
            aria-label="Diminuer le tempo de 5"
          >
            <Minus className="w-6 h-6" />
          </button>

          <button
            onClick={togglePlay}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
            aria-label={isPlaying ? "Arrêter le métronome" : "Démarrer le métronome"}
          >
            {isPlaying ? <Square className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
          </button>

          <button
            onClick={() => adjustBpm(5)}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300 active:scale-95"
            aria-label="Augmenter le tempo de 5"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="bpm-slider" className="text-xs font-black uppercase tracking-widest text-slate-400">
                Tempo
              </label>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg transition-colors ${isMuted ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'text-slate-400 hover:text-indigo-500'}`}
                aria-label={isMuted ? "Réactiver le son" : "Couper le son"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
            <input
              id="bpm-slider"
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">Conseil</h3>
        <p className="text-sm text-indigo-900/70 dark:text-indigo-300/70 leading-relaxed">
          Un tempo entre 60 et 80 BPM est idéal pour la relaxation ou l'étude calme. Pour la musique entraînante, visez 120-130 BPM.
        </p>
      </div>
    </div>
  );
}
