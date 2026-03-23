import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Volume2, VolumeX, Activity, Info } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerId = useRef<any>(null);

  const bpmRef = useRef(bpm);
  const isMutedRef = useRef(isMuted);
  const beatRef = useRef(0);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const scheduleNote = useCallback((time: number) => {
    if (!audioContext.current || isMutedRef.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    osc.frequency.value = beatRef.current === 0 ? 880 : 440;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    while (nextNoteTime.current < audioContext.current!.currentTime + 0.1) {
      scheduleNote(nextNoteTime.current);

      const delay = (nextNoteTime.current - audioContext.current!.currentTime) * 1000;
      const beatToSet = beatRef.current;
      setTimeout(() => {
        setCurrentBeat(beatToSet);
      }, Math.max(0, delay));

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTime.current += secondsPerBeat;
      beatRef.current = (beatRef.current + 1) % 4;
    }
    timerId.current = setTimeout(scheduler, 25);
  }, [scheduleNote]);

  const startStop = () => {
    if (isPlaying) {
      clearTimeout(timerId.current);
      setIsPlaying(false);
      setCurrentBeat(0);
      beatRef.current = 0;
    } else {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      setIsPlaying(true);
      nextNoteTime.current = audioContext.current.currentTime + 0.05;
      beatRef.current = 0;
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerId.current) clearTimeout(timerId.current);
      if (audioContext.current) audioContext.current.close();
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(240, Math.max(40, prev + delta)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Main Controls */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-10 flex flex-col items-center justify-center text-center">
          <div className="space-y-2">
            <label htmlFor="bpm-range" className="text-xs font-black uppercase tracking-widest text-slate-400">Tempo (BPM)</label>
            <div className="text-7xl font-black tabular-nums text-slate-900 dark:text-white">{bpm}</div>
          </div>

          <div className="flex items-center gap-6 w-full">
            <button
              onClick={() => adjustBpm(-1)}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition-all active:scale-95 shadow-sm"
              aria-label="Diminuer le BPM"
            >
              <Minus className="w-6 h-6" />
            </button>
            <input
              id="bpm-range"
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="flex-grow accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <button
              onClick={() => adjustBpm(1)}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition-all active:scale-95 shadow-sm"
              aria-label="Augmenter le BPM"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={startStop}
              className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all active:scale-95 shadow-lg ${
                isPlaying
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-indigo-600/20'
              }`}
              aria-label={isPlaying ? "Arrêter" : "Démarrer"}
            >
              {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${
                isMuted
                ? 'bg-rose-50 border-rose-100 text-rose-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500'
              }`}
              aria-label={isMuted ? "Réactiver le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Visualizer & Beats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 h-full flex flex-col justify-center gap-8">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Visualiseur</h3>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-75 ${
                      isPlaying && currentBeat === i
                      ? (i === 0 ? 'bg-indigo-500 scale-150' : 'bg-slate-400 scale-125')
                      : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-3xl flex items-center justify-center text-2xl font-black transition-all duration-75 ${
                    isPlaying && currentBeat === i
                    ? (i === 0 ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-105' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 scale-105')
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-700'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>

            <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-4">
               <div
                className="absolute inset-y-0 left-0 bg-indigo-500 transition-all duration-75"
                style={{
                  width: isPlaying ? '100%' : '0%',
                  opacity: isPlaying ? (1 - (currentBeat / 4)) : 0
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Activity className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">Pourquoi utiliser un métronome ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Un métronome est essentiel pour développer un sens précis du rythme. Que vous soyez musicien, danseur ou que vous fassiez du sport, maintenir un tempo constant améliore la mémoire musculaire et la précision.
          </p>
        </div>
      </div>
    </div>
  );
}
