import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Minus, Plus, Music, Volume2, VolumeX, Activity } from "lucide-react";

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const currentBeatRef = useRef(currentBeat);
  const isMutedRef = useRef(isMuted);

  // Keep refs in sync with state for the scheduler
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
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const playClick = useCallback((time: number, isFirstBeat: boolean) => {
    if (!audioContextRef.current || isMutedRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.type = "sine";
    osc.frequency.value = isFirstBeat ? 1000 : 800;

    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, [isMuted]);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      const isFirstBeat = currentBeatRef.current === 0;
      playClick(nextNoteTimeRef.current, isFirstBeat);

      // Schedule visual update
      const delay = (nextNoteTimeRef.current - audioContextRef.current.currentTime) * 1000;
      setTimeout(() => {
        setCurrentBeat((prev) => (prev + 1) % beatsPerMeasureRef.current);
      }, Math.max(0, delay));

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;
    }

    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const togglePlay = () => {
    if (isPlaying) {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      nextNoteTimeRef.current = audioContextRef.current.currentTime;
      setCurrentBeat(0);
      setIsPlaying(true);
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const adjustBpm = (amount: number) => {
    setBpm((prev) => Math.min(240, Math.max(40, prev + amount)));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 text-center">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Metronome</span>
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 transition-colors"
            aria-label={isMuted ? "Activer le son" : "Couper le son"}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-4 mb-12">
          <div className="text-7xl font-black text-slate-900 dark:text-white font-mono tracking-tighter">
            {bpm}
            <span className="text-xl text-slate-400 ml-2">BPM</span>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => adjustBpm(-1)}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 hover:border-indigo-500 hover:text-indigo-500 transition-all active:scale-95"
              aria-label="Diminuer le BPM de 1"
            >
              <Minus className="w-6 h-6" />
            </button>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="flex-grow max-w-xs accent-indigo-600"
              aria-label="Ajuster le tempo"
            />
            <button
              onClick={() => adjustBpm(1)}
              className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 hover:border-indigo-500 hover:text-indigo-500 transition-all active:scale-95"
              aria-label="Augmenter le BPM de 1"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-12">
          {[...Array(beatsPerMeasure)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === i
                  ? i === 0
                    ? "bg-indigo-600 scale-125 shadow-lg shadow-indigo-500/20"
                    : "bg-indigo-400 scale-110"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>

        <button
          onClick={togglePlay}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl ${
            isPlaying
              ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
          }`}
          aria-label={isPlaying ? "Arrêter" : "Démarrer"}
        >
          {isPlaying ? (
            <Square className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800">
          <label htmlFor="beats-select" className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">
            Signature rythmique
          </label>
          <select
            id="beats-select"
            value={beatsPerMeasure}
            onChange={(e) => setBeatsPerMeasure(parseInt(e.target.value))}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} temps
              </option>
            ))}
          </select>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <Music className="w-5 h-5" />
            <p className="text-sm font-medium">
              Utilisez le métronome pour garder le tempo pendant vos répétitions musicales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
