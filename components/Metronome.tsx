import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Music, Volume2, Info, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.5);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const volumeRef = useRef(volume);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const currentBeatRef = useRef(0);

  useEffect(() => {
    bpmRef.current = bpm;
    volumeRef.current = volume;
    beatsPerMeasureRef.current = beatsPerMeasure;
  }, [bpm, volume, beatsPerMeasure]);

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    // High pitch for the first beat of the measure
    osc.frequency.value = beatNumber % beatsPerMeasureRef.current === 0 ? 1000 : 800;

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
      setCurrentBeat(nextBeat);
    }
    timerIDRef.current = window.setTimeout(scheduler, 25.0);
  }, [scheduleNote]);

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

  const adjustBpm = (amount: number) => {
    setBpm((prev) => Math.max(40, Math.min(240, prev + amount)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex flex-col items-center space-y-12">
        {/* BPM Display & Main Control */}
        <div className="relative group">
          <div className="w-80 h-80 rounded-full bg-slate-50 dark:bg-slate-900 border-8 border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-2 shadow-2xl transition-all group-hover:border-indigo-500/20 group-hover:scale-[1.02]">
            <div className="text-sm font-black text-slate-400 uppercase tracking-widest">BPM</div>
            <div className="text-8xl font-black font-mono tracking-tighter text-slate-900 dark:text-white tabular-nums">
              {bpm}
            </div>
            <div className="flex items-center gap-1">
               {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                 <div
                   key={i}
                   className={`w-3 h-3 rounded-full transition-all duration-100 ${
                     isPlaying && (currentBeat - 1 + beatsPerMeasure) % beatsPerMeasure === i
                       ? 'bg-indigo-500 scale-125 shadow-lg shadow-indigo-500/50'
                       : 'bg-slate-200 dark:bg-slate-700'
                   }`}
                 />
               ))}
            </div>
          </div>

          <button
            onClick={toggleMetronome}
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 border-b-4 ${
              isPlaying
                ? 'bg-rose-500 border-rose-700 hover:bg-rose-600'
                : 'bg-indigo-600 border-indigo-800 hover:bg-indigo-700'
            }`}
          >
            {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </button>
        </div>

        {/* Adjustments */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
          {/* Tempo Control */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
             <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tempo</label>
                <div className="flex gap-2">
                   <button onClick={() => adjustBpm(-1)} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                   <button onClick={() => adjustBpm(1)} className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
             </div>
             <div className="space-y-6">
                <input
                  type="range"
                  min="40"
                  max="240"
                  value={bpm}
                  onChange={(e) => setBpm(Number(e.target.value))}
                  className="w-full h-2 bg-white dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 shadow-sm"
                />
                <div className="flex justify-between gap-2">
                   {[60, 90, 120, 150, 180].map(val => (
                     <button
                       key={val}
                       onClick={() => setBpm(val)}
                       className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                         bpm === val
                           ? 'bg-indigo-600 border-indigo-600 text-white'
                           : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-500'
                       }`}
                     >
                       {val}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          {/* Volume & Time Sig */}
          <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
             <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-500" /> Volume
                  </label>
                  <span className="text-sm font-black font-mono text-indigo-500">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-2 bg-slate-50 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 shadow-sm"
                />
             </div>

             <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <Zap className="w-4 h-4 text-indigo-500" /> Signature
                </label>
                <div className="flex gap-2">
                   {[2, 3, 4, 6, 8].map(val => (
                     <button
                       key={val}
                       onClick={() => { setBeatsPerMeasure(val); setCurrentBeat(0); currentBeatRef.current = 0; }}
                       className={`flex-grow py-3 rounded-2xl text-sm font-bold border transition-all ${
                         beatsPerMeasure === val
                           ? 'bg-indigo-600 border-indigo-600 text-white'
                           : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-500'
                       }`}
                     >
                       {val}/4
                     </button>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-500" /> Précision Audio
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ce métronome utilise l'API Web Audio pour une précision de synchronisation maximale. Contrairement aux timers JavaScript classiques, il garantit un rythme stable même si votre processeur est sollicité.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Réglez le BPM (Battements Par Minute) à l'aide du curseur ou des raccourcis. Choisissez votre signature rythmique et ajustez le volume pour votre pratique musicale.
          </p>
        </div>
      </div>
    </div>
  );
}
