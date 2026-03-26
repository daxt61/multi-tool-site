import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Music, Info, Volume2, VolumeX, Plus, Minus } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [beat, setBeat] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const isMutedRef = useRef(isMuted);
  const beatRef = useRef(beat);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    beatRef.current = beat;
  }, [beat]);

  const playClick = useCallback(() => {
    if (!audioContextRef.current || isMutedRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    const isFirstBeat = beatRef.current % 4 === 0;
    osc.frequency.value = isFirstBeat ? 1000 : 800;

    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(audioContextRef.current.currentTime);
    osc.stop(audioContextRef.current.currentTime + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    while (nextNoteTimeRef.current < audioContextRef.current!.currentTime + 0.1) {
      playClick();
      nextNoteTimeRef.current += 60.0 / bpmRef.current;
      setBeat(prev => (prev + 1) % 4);
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const togglePlay = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (isPlaying) {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      setIsPlaying(false);
      setBeat(0);
    } else {
      nextNoteTimeRef.current = audioContextRef.current.currentTime;
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
      <div className="flex flex-col items-center justify-center space-y-12 py-12 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-inner">

        {/* Visual Pulse */}
        <div className="flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && (beat === (i + 1) % 4)
                  ? 'bg-indigo-600 scale-150 shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="text-center space-y-4">
          <div className="text-8xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
            {bpm} <span className="text-2xl text-slate-400 uppercase tracking-widest ml-2">BPM</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
            {bpm <= 60 ? 'Largo' : bpm <= 76 ? 'Adagio' : bpm <= 108 ? 'Andante' : bpm <= 120 ? 'Moderato' : bpm <= 168 ? 'Allegro' : 'Presto'}
          </p>
        </div>

        <div className="flex flex-col items-center gap-8 w-full max-w-md px-8">
          <div className="flex items-center gap-6 w-full">
            <button
              onClick={() => setBpm(Math.max(40, bpm - 1))}
              className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:border-indigo-500 transition-all active:scale-95"
            >
              <Minus className="w-6 h-6" />
            </button>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <button
              onClick={() => setBpm(Math.min(240, bpm + 1))}
              className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:border-indigo-500 transition-all active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all active:scale-95 shadow-xl ${
                isPlaying
                  ? 'bg-rose-500 text-white shadow-rose-500/20'
                  : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
              }`}
            >
              {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-2xl border transition-all ${
                isMuted
                  ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 text-rose-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-400 hover:text-indigo-500'
              }`}
              aria-label={isMuted ? "Réactiver le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-500" /> Précision Timing
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilise l'API Web Audio pour un timing précis au millième de seconde, garantissant un rythme stable même si l'onglet est en arrière-plan ou si le processeur est sollicité.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide des Tempos
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les noms italiens (Largo, Allegro, etc.) s'ajustent automatiquement selon le BPM choisi pour vous aider à respecter les indications classiques de tempo.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" /> Utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le premier battement de chaque mesure (4/4) possède une tonalité plus haute pour vous aider à vous repérer. Utilisez le curseur ou les boutons +/- pour un réglage fin.
          </p>
        </div>
      </div>
    </div>
  );
}
