import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Volume2, Minus, Plus, Music } from 'lucide-react';

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
  }, [bpm]);

  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure;
  }, [beatsPerMeasure]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

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
    while (nextNoteTimeRef.current < audioContextRef.current!.currentTime + 0.1) {
      const isFirstBeat = currentBeatRef.current === 0;
      playClick(nextNoteTimeRef.current, isFirstBeat);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;

      // Schedule visual update
      const beatToSet = currentBeatRef.current;
      setTimeout(() => {
        setCurrentBeat(beatToSet);
      }, (nextNoteTimeRef.current - audioContextRef.current!.currentTime) * 1000);

      currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasureRef.current;
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const togglePlay = () => {
    if (isPlaying) {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
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
      nextNoteTimeRef.current = audioContextRef.current.currentTime;
      currentBeatRef.current = 0;
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
    const val = Math.min(Math.max(newBpm, 40), 240);
    setBpm(val);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 text-center space-y-12">
        {/* Visual Metronome */}
        <div className="flex justify-center gap-4">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-75 ${
                isPlaying && currentBeat === i
                  ? (i === 0 ? 'bg-indigo-500 scale-150 shadow-lg shadow-indigo-500/20' : 'bg-slate-400 dark:bg-slate-500 scale-125')
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* BPM Display */}
        <div className="space-y-4">
          <div className="text-8xl font-black font-mono tracking-tighter dark:text-white">
            {bpm}
          </div>
          <div className="text-sm font-bold uppercase tracking-widest text-slate-400">
            BPM
          </div>
        </div>

        {/* BPM Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => handleBpmChange(bpm - 1)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-slate-600 dark:text-slate-300 shadow-sm"
          >
            <Minus className="w-6 h-6" />
          </button>

          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => handleBpmChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />

          <button
            onClick={() => handleBpmChange(bpm + 1)}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-slate-600 dark:text-slate-300 shadow-sm"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Main Control */}
        <button
          onClick={togglePlay}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20 scale-95'
              : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95'
          }`}
        >
          {isPlaying ? <Square className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Beats per Measure */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Music className="w-4 h-4" /> Mesure
            </h3>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{beatsPerMeasure}/4</span>
          </div>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6, 8].map((num) => (
              <button
                key={num}
                onClick={() => setBeatsPerMeasure(num)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  beatsPerMeasure === num
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Volume Control */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Volume
            </h3>
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>
    </div>
  );
}
