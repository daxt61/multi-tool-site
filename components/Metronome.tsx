import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Plus, Minus, Info, Activity } from 'lucide-react';

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

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { beatsPerMeasureRef.current = beatsPerMeasure; }, [beatsPerMeasure]);
  useEffect(() => { currentBeatRef.current = currentBeat; }, [currentBeat]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  const playClick = useCallback((time: number, isAccent: boolean) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const gain = audioContextRef.current.createGain();

    osc.connect(gain);
    gain.connect(audioContextRef.current.destination);

    osc.frequency.setValueAtTime(isAccent ? 880 : 440, time);
    gain.gain.setValueAtTime(volumeRef.current, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      const isAccent = currentBeatRef.current === 0;
      playClick(nextNoteTimeRef.current, isAccent);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;

      const nextBeat = (currentBeatRef.current + 1) % beatsPerMeasureRef.current;
      currentBeatRef.current = nextBeat;
      setCurrentBeat(nextBeat);
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const toggleMetronome = () => {
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
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-8">
        <div className="relative inline-block">
          <div className={`w-64 h-64 rounded-full border-8 flex items-center justify-center transition-all duration-300 ${isPlaying ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105' : 'border-slate-100 dark:border-slate-800'}`}>
            <div className="text-center">
              <div className="text-7xl font-black font-mono tracking-tighter dark:text-white">
                {bpm}
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-600 mt-2">BPM</div>
            </div>
          </div>
          {isPlaying && (
             <div
               className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-indigo-500/50 animate-ping"
               key={currentBeat}
             />
          )}
        </div>

        <div className="flex justify-center items-center gap-8">
          <button
            onClick={() => setBpm(Math.max(40, bpm - 1))}
            className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 transition-all active:scale-90"
          >
            <Minus className="w-6 h-6 dark:text-white" />
          </button>

          <button
            onClick={toggleMetronome}
            className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all active:scale-95 shadow-xl ${isPlaying ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/20'}`}
          >
            {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
          </button>

          <button
            onClick={() => setBpm(Math.min(240, bpm + 1))}
            className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 transition-all active:scale-90"
          >
            <Plus className="w-6 h-6 dark:text-white" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-600 px-1">Signature Temporelle</label>
            <div className="flex gap-2">
              {[2, 3, 4, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setBeatsPerMeasure(num)}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all border ${beatsPerMeasure === num ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                  {num}/4
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-600">Volume</label>
              <span className="text-sm font-bold text-indigo-500">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white flex flex-col justify-center">
          <Activity className="w-10 h-10 mb-6 opacity-50" />
          <h3 className="text-xl font-black mb-4">Précision Audio</h3>
          <p className="text-indigo-100 text-sm leading-relaxed">
            Ce métronome utilise l'API Web Audio pour une précision temporelle parfaite, indépendante des ralentissements du navigateur. Le premier temps de chaque mesure est accentué pour vous aider à garder le rythme.
          </p>
        </div>
      </div>

      <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-bold dark:text-white">Comment ça marche ?</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Le métronome bat la mesure de 40 à 240 BPM. Vous pouvez ajuster le tempo avec les boutons +/- ou en faisant glisser le curseur (si disponible). La signature temporelle change le nombre de battements par cycle, avec un son plus aigu sur le premier temps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
