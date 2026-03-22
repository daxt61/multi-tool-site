import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Plus, Minus, Volume2, VolumeX, Activity, Info } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const isMutedRef = useRef(isMuted);
  const beatRef = useRef(0);

  // Sync refs with state
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

    // High pitch for the first beat of the measure (assuming 4/4)
    osc.frequency.value = beat === 0 ? 1000 : 800;

    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);

    // Update visual beat
    const delay = (time - audioContext.current.currentTime) * 1000;
    setTimeout(() => {
      setCurrentBeat(beat);
    }, Math.max(0, delay));
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;

    while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
      playClick(nextNoteTime.current, beatRef.current);
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTime.current += secondsPerBeat;
      beatRef.current = (beatRef.current + 1) % 4;
    }
    timerID.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const toggleMetronome = () => {
    if (isPlaying) {
      if (timerID.current) clearTimeout(timerID.current);
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

      setIsPlaying(true);
      beatRef.current = 0;
      nextNoteTime.current = audioContext.current.currentTime + 0.05;
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerID.current) clearTimeout(timerID.current);
      if (audioContext.current) audioContext.current.close();
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(240, Math.max(40, prev + delta)));
  };

  return (
    <div className="max-w-xl mx-auto space-y-12">
      <div className="relative flex flex-col items-center">
        {/* Visual Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-8 border-slate-100 dark:border-slate-800 rounded-full"></div>

        {/* Active Beat Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 flex items-center justify-center">
          {[0, 1, 2, 3].map((beat) => (
            <div
              key={beat}
              className={`absolute w-4 h-4 rounded-full transition-all duration-150 ${
                currentBeat === beat && isPlaying
                  ? 'bg-indigo-600 scale-150 shadow-lg shadow-indigo-500/50'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
              style={{
                transform: `rotate(${beat * 90}deg) translateY(-32px)`,
              }}
            />
          ))}
        </div>

        {/* BPM Display */}
        <div className="relative z-10 text-center py-20">
          <div className="text-8xl font-black font-mono tracking-tighter text-slate-900 dark:text-white tabular-nums">
            {bpm}
          </div>
          <div className="text-sm font-black uppercase tracking-widest text-slate-400 mt-2">BPM</div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => adjustBpm(-1)}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300 active:scale-95"
            aria-label="Diminuer le BPM"
          >
            <Minus className="w-6 h-6" />
          </button>

          <div className="flex-grow flex justify-center">
            <button
              onClick={toggleMetronome}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl ${
                isPlaying
                  ? 'bg-rose-500 text-white shadow-rose-500/20'
                  : 'bg-indigo-600 text-white shadow-indigo-500/20'
              }`}
              aria-label={isPlaying ? "Arrêter" : "Démarrer"}
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
          </div>

          <button
            onClick={() => adjustBpm(1)}
            className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-300 active:scale-95"
            aria-label="Augmenter le BPM"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Slider & Mute */}
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-xl transition-colors ${isMuted ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800'}`}
              aria-label={isMuted ? "Réactiver le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="flex-grow h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Activity className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">À propos du métronome</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Un métronome précis utilisant l'API Web Audio pour une stabilité rythmique parfaite.
            Idéal pour pratiquer un instrument ou rester dans le tempo. Le premier temps est accentué pour faciliter le repérage.
          </p>
        </div>
      </div>
    </div>
  );
}
