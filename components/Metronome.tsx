import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Volume2, Music } from 'lucide-react';

export function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.5);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const currentBeatRef = useRef(currentBeat);
  const volumeRef = useRef(volume);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure;
  }, [beatsPerMeasure]);

  useEffect(() => {
    currentBeatRef.current = currentBeat;
  }, [currentBeat]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.frequency.value = beatNumber === 0 ? 880 : 440;
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

      setCurrentBeat((prev) => {
        const next = (prev + 1) % beatsPerMeasureRef.current;
        currentBeatRef.current = next;
        return next;
      });
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

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className={`w-20 h-20 rounded-3xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-indigo-600 shadow-sm transition-transform ${isPlaying ? 'animate-pulse' : ''}`}>
              <Music className="w-10 h-10" />
            </div>
          </div>
          <div className="text-7xl font-black font-mono tracking-tighter dark:text-white">
            {bpm}
          </div>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            Beats Per Minute
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => setBpm(Math.max(40, bpm - 1))}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95"
            aria-label="Diminuer le BPM"
          >
            <Minus className="w-6 h-6" />
          </button>

          <button
            onClick={togglePlay}
            className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all shadow-lg active:scale-90 ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600'
                : 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700'
            }`}
            aria-label={isPlaying ? "Arrêter le métronome" : "Démarrer le métronome"}
          >
            {isPlaying ? <Square className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
          </button>

          <button
            onClick={() => setBpm(Math.min(240, bpm + 1))}
            className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95"
            aria-label="Augmenter le BPM"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6 max-w-sm mx-auto">
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
              <span>Vitesse</span>
              <span className="text-indigo-500">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              aria-label="Réglage du BPM"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider text-left">
                Temps / Mesure
              </label>
              <select
                value={beatsPerMeasure}
                onChange={(e) => setBeatsPerMeasure(parseInt(e.target.value))}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              >
                {[2, 3, 4, 5, 6, 7, 8].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Volume
                </label>
                <Volume2 className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                aria-label="Réglage du volume"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === i
                  ? 'bg-indigo-600 scale-125 shadow-lg shadow-indigo-500/50'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
          <h4 className="font-bold dark:text-white">Précision Audio</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilise l'API Web Audio pour une précision temporelle millimétrée, indépendamment des ralentissements du navigateur ou de l'interface.
          </p>
        </div>
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
          <h4 className="font-bold dark:text-white">Comment l'utiliser</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Réglez votre BPM cible, choisissez la signature rythmique et appuyez sur Lecture. Le premier temps de chaque mesure est accentué par une tonalité plus aiguë.
          </p>
        </div>
      </div>
    </div>
  );
}
