import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Volume2, Activity, Info } from 'lucide-react';

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
  const volumeRef = useRef(volume);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const currentBeatRef = useRef(0);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure;
  }, [beatsPerMeasure]);

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.frequency.value = beatNumber === 0 ? 1000 : 800;
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
      scheduleNote(currentBeatRef.current, nextNoteTimeRef.current);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;

      const nextBeat = (currentBeatRef.current + 1) % beatsPerMeasureRef.current;
      currentBeatRef.current = nextBeat;

      setCurrentBeat(currentBeatRef.current);
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [scheduleNote]);

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

      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
      setIsPlaying(true);
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(240, Math.max(40, prev + delta)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 md:p-12 rounded-[2.5rem] shadow-sm space-y-10">
          <div className="flex flex-col items-center space-y-8">
            <div className="text-center">
              <div className="text-8xl font-black font-mono tracking-tighter text-slate-900 dark:text-white mb-2">
                {bpm}
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Battements par minute</div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => adjustBpm(-1)}
                className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-all"
              >
                <Minus className="w-6 h-6" />
              </button>
              <input
                type="range"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-48 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <button
                onClick={() => adjustBpm(1)}
                className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <button
              onClick={togglePlay}
              className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all shadow-xl ${
                isPlaying
                  ? 'bg-rose-500 text-white shadow-rose-500/20 hover:scale-95'
                  : 'bg-indigo-600 text-white shadow-indigo-500/20 hover:scale-105 active:scale-95'
              }`}
            >
              {isPlaying ? <Square className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Mesure</label>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black dark:text-white">{beatsPerMeasure}/4</span>
                <div className="flex gap-2">
                  <button onClick={() => setBeatsPerMeasure(Math.max(1, beatsPerMeasure - 1))} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all">
                    <Minus className="w-4 h-4" />
                  </button>
                  <button onClick={() => setBeatsPerMeasure(Math.min(16, beatsPerMeasure + 1))} className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 transition-all">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4 flex items-center gap-2">
                <Volume2 className="w-3 h-3" /> Volume
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[300px]">
            <div className="flex gap-4">
              {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full transition-all duration-75 ${
                    isPlaying && ((currentBeat === 0 ? beatsPerMeasure : currentBeat) - 1) === i
                      ? i === 0 ? 'bg-indigo-500 scale-125 shadow-lg shadow-indigo-500/50' : 'bg-slate-400 scale-110'
                      : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
            <div className="mt-12 text-center">
              <Activity className={`w-8 h-8 mx-auto mb-4 transition-colors ${isPlaying ? 'text-indigo-500 animate-pulse' : 'text-slate-300'}`} />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {isPlaying ? 'Le métronome est en cours...' : 'Prêt à démarrer'}
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30 space-y-4">
            <h4 className="font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
              <Info className="w-4 h-4" /> Guide Rapide
            </h4>
            <ul className="text-sm text-indigo-700 dark:text-indigo-400 space-y-2 leading-relaxed">
              <li>• Ajustez le <strong>BPM</strong> pour changer la vitesse.</li>
              <li>• Modifiez la <strong>Mesure</strong> pour le nombre de temps par cycle.</li>
              <li>• Utilisez le bouton central pour démarrer ou arrêter.</li>
              <li>• Le premier temps de chaque mesure a une tonalité plus haute.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
