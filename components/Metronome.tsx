import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Music } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);
  const beatRef = useRef(0);

  const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);

  const playClick = useCallback((time: number, isFirstBeat: boolean) => {
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
  }, []);

  const scheduler = useCallback(() => {
    while (nextNoteTime.current < audioContext.current!.currentTime + 0.1) {
      const isFirstBeat = beatRef.current === 0;
      playClick(nextNoteTime.current, isFirstBeat);

      const secondsPerBeat = 60.0 / bpm;
      nextNoteTime.current += secondsPerBeat;

      const currentBeatVal = beatRef.current;
      setTimeout(() => setCurrentBeat(currentBeatVal), (nextNoteTime.current - audioContext.current!.currentTime) * 1000);

      beatRef.current = (beatRef.current + 1) % beatsPerMeasure;
    }
    timerID.current = window.setTimeout(scheduler, 25.0);
  }, [bpm, beatsPerMeasure, playClick]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      beatRef.current = 0;
      setCurrentBeat(0);
      nextNoteTime.current = audioContext.current.currentTime + 0.05;
      setIsPlaying(true);
      scheduler();
    } else {
      if (timerID.current) {
        clearTimeout(timerID.current);
      }
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerID.current) {
        clearTimeout(timerID.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const handleBpmChange = (newBpm: number) => {
    setBpm(Math.min(Math.max(newBpm, 40), 240));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 md:p-12 border border-slate-200 dark:border-slate-800 text-center">
        <div className="mb-12">
          <div className="text-8xl font-black font-mono tracking-tighter text-indigo-600 dark:text-indigo-400 mb-4">
            {bpm}
          </div>
          <div className="text-sm font-black uppercase tracking-widest text-slate-400">Beats Per Minute</div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => handleBpmChange(bpm - 1)}
              className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-slate-600 dark:text-slate-300"
              aria-label="Diminuer le BPM"
            >
              <Minus className="w-6 h-6" />
            </button>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => handleBpmChange(parseInt(e.target.value))}
              className="w-48 md:w-64 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              aria-label="Ajuster le BPM"
            />
            <button
              onClick={() => handleBpmChange(bpm + 1)}
              className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all text-slate-600 dark:text-slate-300"
              aria-label="Augmenter le BPM"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-4">
            {['2/4', '3/4', '4/4', '6/8'].map((sig) => (
              <button
                key={sig}
                onClick={() => {
                  setTimeSignature(sig);
                  beatRef.current = 0;
                  setCurrentBeat(0);
                }}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all border ${
                  timeSignature === sig
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white"
                    : "bg-white text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:border-indigo-500"
                }`}
              >
                {sig}
              </button>
            ))}
          </div>

          <button
            onClick={togglePlay}
            className={`flex items-center gap-3 px-12 py-6 rounded-3xl font-black text-xl transition-all ${
              isPlaying
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
                : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 hover:scale-105 active:scale-95"
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-6 h-6 fill-current" /> STOP
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" /> START
              </>
            )}
          </button>
        </div>

        {/* Visualizer */}
        <div className="mt-12 flex justify-center gap-4">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-75 ${
                currentBeat === i && isPlaying
                  ? (i === 0 ? "bg-indigo-600 scale-150" : "bg-indigo-400 scale-125")
                  : "bg-slate-200 dark:bg-slate-800"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Music className="w-5 h-5 text-indigo-500" /> Guide Rapide
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Utilisez le curseur ou les boutons +/- pour ajuster le tempo entre 40 et 240 BPM. Choisissez votre signature rythmique et appuyez sur Start pour commencer. Le premier temps de chaque mesure a une tonalité plus aiguë.
          </p>
        </div>
        <AdPlaceholder size="medium" className="rounded-3xl overflow-hidden" />
      </div>
    </div>
  );
}
