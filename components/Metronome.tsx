import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Volume2, VolumeX, Activity, Info } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerId = useRef<any>(null);
  const bpmRef = useRef(bpm);
  const isMutedRef = useRef(isMuted);
  const beatRef = useRef(0);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const playClick = useCallback((time: number, isFirstBeat: boolean) => {
    if (!audioContext.current || isMutedRef.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    osc.frequency.value = isFirstBeat ? 880 : 440; // High pitch for first beat
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    while (nextNoteTime.current < audioContext.current!.currentTime + 0.1) {
      const time = nextNoteTime.current;
      const isFirstBeat = beatRef.current % 4 === 0;

      playClick(time, isFirstBeat);

      // Update UI beat visualization
      const delay = (time - audioContext.current!.currentTime) * 1000;
      setTimeout(() => {
        setCurrentBeat(beatRef.current % 4);
      }, Math.max(0, delay));

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTime.current += secondsPerBeat;
      beatRef.current++;
    }
    timerId.current = setTimeout(scheduler, 25);
  }, [playClick]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }

      beatRef.current = 0;
      nextNoteTime.current = audioContext.current.currentTime;
      scheduler();
      setIsPlaying(true);
    } else {
      clearTimeout(timerId.current);
      setIsPlaying(false);
      setCurrentBeat(0);
    }
  };

  useEffect(() => {
    return () => {
      if (timerId.current) clearTimeout(timerId.current);
      if (audioContext.current) audioContext.current.close();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 text-center space-y-8">
        <div className="flex justify-center items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Metronome</h2>
        </div>

        <div className="space-y-2">
          <div className="text-8xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
            {bpm}
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">BPM</div>
        </div>

        <div className="max-w-md mx-auto space-y-6">
          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            <span>40 Adagio</span>
            <span>120 Moderato</span>
            <span>240 Presto</span>
          </div>
        </div>

        <div className="flex justify-center items-center gap-6 pt-4">
           <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-2xl border transition-all ${
              isMuted
                ? 'bg-rose-50 border-rose-200 text-rose-500'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500'
            }`}
            aria-label={isMuted ? "Réactiver le son" : "Couper le son"}
          >
            {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>

          <button
            onClick={togglePlay}
            className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all transform active:scale-95 shadow-xl ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-indigo-600/20'
            }`}
          >
            {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </button>

          <div className="w-14" /> {/* Spacer to balance the mute button */}
        </div>

        <div className="flex justify-center gap-4 pt-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                currentBeat === i && isPlaying
                  ? 'bg-indigo-500 scale-150 shadow-lg shadow-indigo-500/50'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold flex items-center gap-2 dark:text-white">
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Réglez le BPM (battements par minute) à l'aide du curseur ou en cliquant sur le nombre. Appuyez sur le bouton central pour démarrer ou arrêter le métronome. Le premier temps de chaque mesure de 4 est accentué par un son plus aigu et un indicateur visuel.
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold flex items-center gap-2 dark:text-white">
            <Activity className="w-4 h-4 text-indigo-500" /> Précision Professionnelle
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cet outil utilise l'API Web Audio pour une précision temporelle de niveau milliseconde, garantissant un rythme stable même si l'onglet du navigateur est en arrière-plan ou si le processeur est sollicité.
          </p>
        </div>
      </div>
    </div>
  );
}
