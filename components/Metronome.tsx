import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Plus, Minus, Activity, Volume2, VolumeX } from 'lucide-react';

export function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const currentBeatRef = useRef(0);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    bpmRef.current = bpm;
    beatsPerMeasureRef.current = beatsPerMeasure;
    volumeRef.current = volume;
    isMutedRef.current = isMuted;
  }, [bpm, beatsPerMeasure, volume, isMuted]);

  const playClick = useCallback((time: number, beat: number) => {
    if (!audioContextRef.current || isMutedRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.type = 'sine';
    // Accent the first beat of the measure
    osc.frequency.setValueAtTime(beat === 0 ? 880 : 440, time);

    envelope.gain.setValueAtTime(volumeRef.current, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      playClick(nextNoteTimeRef.current, currentBeatRef.current);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;

      const nextBeat = (currentBeatRef.current + 1) % beatsPerMeasureRef.current;
      currentBeatRef.current = nextBeat;
      // Update state for UI visual feedback
      setCurrentBeat(currentBeatRef.current);
    }
    timerIDRef.current = window.setTimeout(scheduler, 25.0);
  }, [playClick]);

  const togglePlay = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (isPlaying) {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      setIsPlaying(false);
      setCurrentBeat(0);
      currentBeatRef.current = 0;
    } else {
      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
      setIsPlaying(true);
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="text-center space-y-8">
        <div className="relative inline-flex items-center justify-center">
          {/* Visual Pulser */}
          <div
            className={`absolute inset-0 rounded-full bg-indigo-500/20 transition-transform duration-100 ${
              isPlaying && currentBeat === 0 ? 'scale-150 opacity-100' : 'scale-100 opacity-0'
            }`}
          />
          <div
            className={`w-48 h-48 rounded-full border-4 flex flex-col items-center justify-center bg-white dark:bg-slate-900 transition-all ${
              isPlaying ? 'border-indigo-500 shadow-xl shadow-indigo-500/20' : 'border-slate-100 dark:border-slate-800'
            }`}
          >
            <Activity className={`w-8 h-8 mb-2 ${isPlaying ? 'text-indigo-500 animate-pulse' : 'text-slate-300'}`} />
            <div className="text-6xl font-black font-mono dark:text-white">
              {bpm}
            </div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">BPM</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setBpm(Math.max(40, bpm - 1))}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Diminuer le BPM"
            >
              <Minus className="w-6 h-6" />
            </button>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-64 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <button
              onClick={() => setBpm(Math.min(240, bpm + 1))}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Augmenter le BPM"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={togglePlay}
            className={`px-12 py-5 rounded-[2rem] font-black text-xl flex items-center gap-3 transition-all active:scale-95 shadow-xl ${
              isPlaying
                ? 'bg-amber-500 text-white shadow-amber-500/20'
                : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            {isPlaying ? 'STOP' : 'START'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 block px-1">
            Signature rythmique
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 6].map((num) => (
              <button
                key={num}
                onClick={() => setBeatsPerMeasure(num)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all border ${
                  beatsPerMeasure === num
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                }`}
              >
                {num}/4
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            {Array.from({ length: beatsPerMeasure }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-100 ${
                  isPlaying && currentBeat === (i + 1) % beatsPerMeasure
                    ? 'bg-indigo-500 scale-y-125'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 block px-1">
            Volume
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              disabled={isMuted}
              className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-30"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
