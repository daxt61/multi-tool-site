import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Volume2, Activity, Info } from 'lucide-react';

export function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [volume, setVolume] = useState(0.5);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const currentBeatRef = useRef(0);
  const volumeRef = useRef(volume);

  useEffect(() => {
    bpmRef.current = bpm;
    beatsPerMeasureRef.current = beatsPerMeasure;
    volumeRef.current = volume;
  }, [bpm, beatsPerMeasure, volume]);

  const playClick = useCallback((time: number, isFirstBeat: boolean) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.frequency.value = isFirstBeat ? 1000 : 800;
    envelope.gain.setValueAtTime(volumeRef.current, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    while (nextNoteTimeRef.current < audioContextRef.current!.currentTime + 0.1) {
      const isFirstBeat = currentBeatRef.current === 0;
      playClick(nextNoteTimeRef.current, isFirstBeat);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;

      const beatToSet = currentBeatRef.current;
      const delay = (nextNoteTimeRef.current - audioContextRef.current!.currentTime) * 1000;
      setTimeout(() => setCurrentBeat(beatToSet), Math.max(0, delay));

      currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasureRef.current;
    }
    timerIDRef.current = window.requestAnimationFrame(scheduler);
  }, [playClick]);

  const togglePlay = () => {
    if (isPlaying) {
      if (timerIDRef.current) cancelAnimationFrame(timerIDRef.current);
      setIsPlaying(false);
      setCurrentBeat(0);
      currentBeatRef.current = 0;
    } else {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
      setIsPlaying(true);
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerIDRef.current) cancelAnimationFrame(timerIDRef.current);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-12">
        <div className="relative">
          <div className={`w-32 h-32 rounded-full border-8 ${isPlaying ? 'border-indigo-500 animate-pulse' : 'border-slate-200 dark:border-slate-700'} flex items-center justify-center transition-all duration-300`}>
            <Activity className={`w-12 h-12 ${isPlaying ? 'text-indigo-500' : 'text-slate-300'}`} />
          </div>
          {isPlaying && (
            <div className="absolute -inset-4 border-2 border-indigo-500/20 rounded-full animate-ping" />
          )}
        </div>

        <div className="space-y-4 w-full max-w-sm">
          <div className="text-7xl font-black font-mono tracking-tighter dark:text-white">
            {bpm} <span className="text-xl text-slate-400">BPM</span>
          </div>
          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            <span>Largo</span>
            <span>Moderato</span>
            <span>Presto</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={togglePlay}
            className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all active:scale-95 shadow-2xl ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600'
                : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3 w-full max-w-md">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <div
              key={i}
              className={`h-3 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === i
                  ? (i === 0 ? 'bg-indigo-500 scale-y-125' : 'bg-slate-400 scale-y-110')
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">Paramètres</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 flex justify-between">
                Temps par mesure <span>{beatsPerMeasure}</span>
              </label>
              <div className="flex gap-2">
                {[2, 3, 4, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => setBeatsPerMeasure(n)}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                      beatsPerMeasure === n
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 flex justify-between">
                Volume <span>{Math.round(volume * 100)}%</span>
              </label>
              <div className="flex items-center gap-4">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
            <Info className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold dark:text-white">Précision Web Audio</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Ce métronome utilise l'API Web Audio pour une précision rythmique professionnelle. Contrairement aux minuteurs JavaScript classiques, le son est programmé à l'avance pour éviter tout décalage, même si le navigateur est occupé.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
