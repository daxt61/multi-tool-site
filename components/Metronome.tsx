import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Music, Volume2, Plus, Minus } from 'lucide-react';

export function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [volume, setVolume] = useState(0.5);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const nextTickTime = useRef(0);
  const currentBeatRef = useRef(0);
  const timerID = useRef<number | null>(null);

  // Use refs for values needed in the scheduler to avoid re-running the loop
  const bpmRef = useRef(bpm);
  const volumeRef = useRef(volume);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure;
  }, [beatsPerMeasure]);

  const scheduleTick = useCallback((time: number, beat: number) => {
    if (!audioContext.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    // Accentuating the first beat
    osc.frequency.value = beat === 0 ? 1000 : 800;

    envelope.gain.value = volumeRef.current;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;

    while (nextTickTime.current < audioContext.current.currentTime + 0.1) {
      scheduleTick(nextTickTime.current, currentBeatRef.current);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextTickTime.current += secondsPerBeat;

      const nextBeat = (currentBeatRef.current + 1) % beatsPerMeasureRef.current;
      currentBeatRef.current = nextBeat;
      setCurrentBeat(nextBeat);
    }

    timerID.current = window.setTimeout(scheduler, 25);
  }, [scheduleTick]);

  const toggleMetronome = () => {
    if (isPlaying) {
      if (timerID.current) clearTimeout(timerID.current);
      setIsPlaying(false);
      setCurrentBeat(0);
      currentBeatRef.current = 0;
    } else {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }

      setIsPlaying(true);
      nextTickTime.current = audioContext.current.currentTime;
      currentBeatRef.current = 0;
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerID.current) clearTimeout(timerID.current);
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-12">
        {/* Visual Pulse */}
        <div className="flex justify-center gap-4">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === i
                  ? i === 0
                    ? 'bg-indigo-600 scale-150 shadow-lg shadow-indigo-600/50'
                    : 'bg-indigo-400 scale-125'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* BPM Display & Control */}
        <div className="text-center space-y-8">
          <div className="relative inline-block">
            <div className="text-8xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
              {bpm}
            </div>
            <div className="text-sm font-black uppercase tracking-[0.2em] text-indigo-500 mt-2">
              Beats Per Minute
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setBpm(Math.max(40, bpm - 1))}
              className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-400 active:scale-90"
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
              className="w-full max-w-xs h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <button
              onClick={() => setBpm(Math.min(240, bpm + 1))}
              className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-400 active:scale-90"
              aria-label="Augmenter le BPM"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Action */}
        <div className="flex flex-col sm:flex-row gap-6">
          <button
            onClick={toggleMetronome}
            className={`flex-1 py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-6 h-6 fill-current" /> Arrêter
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" /> Démarrer
              </>
            )}
          </button>
        </div>

        {/* Secondary Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              <Music className="w-4 h-4" /> Signature
            </div>
            <div className="flex gap-2">
              {[2, 3, 4, 6, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setBeatsPerMeasure(n)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all border ${
                    beatsPerMeasure === n
                      ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {n}/4
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Volume2 className="w-4 h-4" /> Volume
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
