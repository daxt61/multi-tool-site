import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Plus, Minus, Activity, Volume2, VolumeX } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
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
    volumeRef.current = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const playClick = useCallback((time: number, beat: number) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.frequency.value = beat === 0 ? 1000 : 800;
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

      currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasureRef.current;
      const displayBeat = currentBeatRef.current;
      // Use requestAnimationFrame for smooth UI updates
      requestAnimationFrame(() => setCurrentBeat(displayBeat));
    }

    timerRef.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const toggleMetronome = () => {
    if (isPlaying) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setIsPlaying(false);
      setCurrentBeat(0);
      currentBeatRef.current = 0;
    } else {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
      setIsPlaying(true);
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.max(40, Math.min(240, prev + delta)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-8">
        {/* BPM Display */}
        <div className="relative inline-block">
          <div className="text-[10rem] md:text-[12rem] font-black font-mono tracking-tighter dark:text-white leading-none">
            {bpm}
          </div>
          <div className="text-sm font-black uppercase tracking-widest text-slate-400">Beats Per Minute</div>
        </div>

        {/* Visual Indicator */}
        <div className="flex justify-center gap-3">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && (currentBeat === (i + 1) % beatsPerMeasure)
                  ? (i === 0 ? 'bg-indigo-600 scale-125 shadow-lg shadow-indigo-600/50' : 'bg-slate-400 scale-110')
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] space-y-8">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => adjustBpm(-1)}
              className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              <Minus className="w-6 h-6" />
            </button>
            <button
              onClick={toggleMetronome}
              className={`flex-1 flex items-center justify-center gap-3 py-6 rounded-3xl font-black text-2xl transition-all active:scale-95 shadow-xl ${
                isPlaying
                  ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600'
                  : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
              }`}
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
              {isPlaying ? 'STOP' : 'START'}
            </button>
            <button
              onClick={() => adjustBpm(1)}
              className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />

          <div className="flex gap-2">
            {[40, 60, 80, 100, 120, 140, 160].map(val => (
              <button
                key={val}
                onClick={() => setBpm(val)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  bpm === val
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] space-y-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Mesure</label>
              <div className="flex gap-2">
                {[2, 3, 4, 6, 8].map(val => (
                  <button
                    key={val}
                    onClick={() => { setBeatsPerMeasure(val); setCurrentBeat(0); currentBeatRef.current = 0; }}
                    className={`flex-1 py-3 rounded-2xl font-black transition-all ${
                      beatsPerMeasure === val
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {val}/4
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Volume</label>
                <button onClick={() => setIsMuted(!isMuted)} className="text-indigo-500">
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-indigo-500 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Tempo</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              {bpm <= 60 ? 'Adagio (Lent)' : bpm <= 76 ? 'Andante (Modéré)' : bpm <= 120 ? 'Moderato' : bpm <= 168 ? 'Allegro (Vite)' : 'Presto (Très vite)'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
