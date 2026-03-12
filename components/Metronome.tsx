import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Plus, Minus, Volume2, Music, Settings2 } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.5);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const beatRef = useRef(0);
  const volumeRef = useRef(volume);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure;
  }, [beatsPerMeasure]);

  const playClick = useCallback((time: number, isFirstBeat: boolean) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.frequency.value = isFirstBeat ? 880 : 440;
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
      const isFirstBeat = beatRef.current % beatsPerMeasureRef.current === 0;
      playClick(nextNoteTimeRef.current, isFirstBeat);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;

      const currentBeatInMeasure = beatRef.current % beatsPerMeasureRef.current;
      setTimeout(() => setCurrentBeat(currentBeatInMeasure), (nextNoteTimeRef.current - audioContextRef.current.currentTime) * 1000);

      beatRef.current++;
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const toggleMetronome = () => {
    if (isPlaying) {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      beatRef.current = 0;
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

  const handleBpmChange = (newBpm: number) => {
    setBpm(Math.max(40, Math.min(240, newBpm)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest">
          <Music className="w-3 h-3" /> Metronome Pro
        </div>
        <div className="text-9xl font-black font-mono tracking-tighter dark:text-white tabular-nums">
          {bpm}
        </div>
        <div className="text-xl font-bold text-slate-400 uppercase tracking-widest">BPM</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* BPM Controls */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleBpmChange(bpm - 1)}
              className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-all text-slate-600 dark:text-slate-300 shadow-sm"
              aria-label="Diminuer BPM"
            >
              <Minus className="w-6 h-6" />
            </button>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => handleBpmChange(parseInt(e.target.value))}
              className="flex-1 mx-8 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <button
              onClick={() => handleBpmChange(bpm + 1)}
              className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-all text-slate-600 dark:text-slate-300 shadow-sm"
              aria-label="Augmenter BPM"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {[60, 90, 120, 140].map((preset) => (
              <button
                key={preset}
                onClick={() => setBpm(preset)}
                className={`py-2 rounded-xl text-xs font-black transition-all border ${
                  bpm === preset
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Playback & Settings */}
        <div className="space-y-6">
          <button
            onClick={toggleMetronome}
            className={`w-full py-8 rounded-[2rem] font-black text-2xl transition-all active:scale-95 flex items-center justify-center gap-4 ${
              isPlaying
                ? 'bg-amber-500 text-white shadow-xl shadow-amber-500/20'
                : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
            {isPlaying ? 'ARRÊTER' : 'DÉMARRER'}
          </button>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Settings2 className="w-3 h-3" /> Mesure
              </label>
              <select
                value={beatsPerMeasure}
                onChange={(e) => setBeatsPerMeasure(parseInt(e.target.value))}
                className="w-full bg-transparent font-bold text-lg outline-none dark:text-white"
              >
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n} className="dark:bg-slate-900">{n} temps</option>
                ))}
              </select>
            </div>
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Volume2 className="w-3 h-3" /> Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Indicator */}
      <div className="flex justify-center gap-4 pt-8">
        {Array.from({ length: beatsPerMeasure }).map((_, i) => (
          <div
            key={i}
            className={`w-12 h-12 rounded-2xl transition-all duration-75 border-4 ${
              currentBeat === i
                ? 'bg-indigo-500 border-indigo-400 scale-110 shadow-lg shadow-indigo-500/20'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
