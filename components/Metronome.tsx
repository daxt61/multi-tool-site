import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Volume2, VolumeX, Activity } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerId = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const isMutedRef = useRef(isMuted);
  const beatRef = useRef(0);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const playClick = useCallback((time: number, beat: number) => {
    if (!audioContext.current || isMutedRef.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    osc.frequency.value = beat === 0 ? 880 : 440;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;

    while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
      playClick(nextNoteTime.current, beatRef.current);

      const secondsPerBeat = 60.0 / bpmRef.current;

      // Schedule visual update
      const delay = (nextNoteTime.current - audioContext.current.currentTime) * 1000;
      setTimeout(() => {
        setCurrentBeat(beatRef.current);
      }, Math.max(0, delay));

      nextNoteTime.current += secondsPerBeat;
      beatRef.current = (beatRef.current + 1) % 4;
    }
    timerId.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const togglePlay = () => {
    if (isPlaying) {
      if (timerId.current) clearTimeout(timerId.current);
      setIsPlaying(false);
      setCurrentBeat(0);
      beatRef.current = 0;
    } else {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
      nextNoteTime.current = audioContext.current.currentTime;
      setIsPlaying(true);
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerId.current) clearTimeout(timerId.current);
      if (audioContext.current) audioContext.current.close();
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(240, Math.max(40, prev + delta)));
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-100 ${
                  isPlaying && currentBeat === i
                    ? 'bg-indigo-500 scale-125 shadow-lg shadow-indigo-500/50'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="text-7xl font-black font-mono tracking-tighter text-slate-900 dark:text-white mb-2">
            {bpm}
          </div>
          <div className="text-sm font-bold uppercase tracking-widest text-slate-400">BPM</div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => adjustBpm(-1)}
              className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 transition-all"
              aria-label="Diminuer le BPM"
            >
              <Minus className="w-6 h-6" />
            </button>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="flex-grow accent-indigo-500"
              aria-label="Réglage du tempo"
            />
            <button
              onClick={() => adjustBpm(1)}
              className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 transition-all"
              aria-label="Augmenter le BPM"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={togglePlay}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isPlaying
                  ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20'
                  : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95'
              }`}
              aria-label={isPlaying ? "Arrêter" : "Démarrer"}
            >
              {isPlaying ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all ${
                isMuted
                  ? 'border-rose-500 text-rose-500 bg-rose-50 dark:bg-rose-500/10'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
              }`}
              aria-label={isMuted ? "Réactiver le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <h4 className="font-bold flex items-center gap-2 mb-2 dark:text-white">
            <Activity className="w-4 h-4 text-indigo-500" /> Précision Musicale
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilise l'API Web Audio pour une précision temporelle de niveau professionnel, indépendamment de la charge du processeur.
          </p>
        </div>
      </div>
    </div>
  );
}
