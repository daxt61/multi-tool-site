import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Volume2, VolumeX, Music } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const timerId = useRef<number | null>(null);
  const nextNoteTime = useRef(0);
  const beatRef = useRef(0);
  const bpmRef = useRef(bpm);
  const isMutedRef = useRef(isMuted);

  // Keep refs in sync with state for the audio scheduler
  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const playClick = useCallback((time: number) => {
    if (!audioContext.current || isMutedRef.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    // Accented beat for the first beat of the measure (4/4)
    const isAccented = beatRef.current % 4 === 0;
    osc.frequency.value = isAccented ? 1000 : 800;

    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);

    // Visual feedback synchronization
    const delay = (time - audioContext.current.currentTime) * 1000;
    setTimeout(() => {
      setCurrentBeat(beatRef.current % 4);
    }, Math.max(0, delay));
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;

    while (nextNoteTime.current < audioContext.current.currentTime + 0.1) {
      playClick(nextNoteTime.current);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTime.current += secondsPerBeat;
      beatRef.current++;
    }

    timerId.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const toggleMetronome = () => {
    if (!isPlaying) {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }

      beatRef.current = 0;
      nextNoteTime.current = audioContext.current.currentTime;
      setIsPlaying(true);
      scheduler();
    } else {
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
      setIsPlaying(false);
      setCurrentBeat(0);
    }
  };

  useEffect(() => {
    return () => {
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(Math.max(prev + delta, 40), 240));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Control Side */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="bpm-range" className="text-xs font-black uppercase tracking-widest text-slate-400">Tempo (BPM)</label>
              <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{bpm}</div>
            </div>

            <input
              id="bpm-range"
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <div className="flex gap-4">
              <button
                onClick={() => adjustBpm(-1)}
                className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                aria-label="Diminuer le tempo de 1"
              >
                <Minus className="w-6 h-6 mx-auto text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={() => adjustBpm(1)}
                className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
                aria-label="Augmenter le tempo de 1"
              >
                <Plus className="w-6 h-6 mx-auto text-slate-600 dark:text-slate-400" />
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={toggleMetronome}
              className={`flex-[2] py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 ${
                isPlaying
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-indigo-600/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-6 h-6 fill-current" /> ARRÊTER
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-current ml-1" /> DÉMARRER
                </>
              )}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`flex-1 rounded-3xl border-2 flex items-center justify-center transition-all ${
                isMuted
                ? 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-500/10 dark:border-rose-500/20'
                : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800'
              }`}
              aria-label={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
            </button>
          </div>
        </div>

        {/* Visualizer Side */}
        <div className="bg-slate-900 dark:bg-black p-12 rounded-[2.5rem] flex flex-col items-center justify-center space-y-12 shadow-2xl shadow-indigo-500/10 min-h-[400px]">
          <div className="flex gap-6">
            {[0, 1, 2, 3].map((beat) => (
              <div
                key={beat}
                className={`w-6 h-6 rounded-full transition-all duration-75 ${
                  isPlaying && currentBeat === beat
                  ? (beat === 0 ? 'bg-indigo-400 scale-150 shadow-[0_0_20px_rgba(129,140,248,0.5)]' : 'bg-white scale-125')
                  : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          <div className="text-center space-y-2">
            <div className="text-white/20 font-black text-8xl md:text-9xl font-mono tracking-tighter">
              {isPlaying ? currentBeat + 1 : '—'}
            </div>
            <div className="text-indigo-400 font-black text-sm uppercase tracking-[0.3em]">Temps</div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm">
          <Music className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-100">Précision Professionnelle</h4>
          <p className="text-sm text-indigo-800/70 dark:text-indigo-400/70 font-medium leading-relaxed">
            Ce métronome utilise l'API Web Audio pour une précision au millième de seconde, garantissant un tempo stable même lors de charges processeur élevées. Le premier temps de chaque mesure est accentué pour vous aider à garder le rythme.
          </p>
        </div>
      </div>
    </div>
  );
}
