import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Volume2, VolumeX, Activity, Info } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);
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

    // High pitch for the first beat of the measure (4/4)
    osc.frequency.value = beat === 0 ? 1000 : 800;

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
      const time = nextNoteTime.current;
      const beat = beatRef.current;

      playClick(time, beat);

      // Update UI beat indicator
      const delay = (time - audioContext.current.currentTime) * 1000;
      setTimeout(() => {
        setCurrentBeat(beat);
      }, Math.max(0, delay));

      // Advance to next note
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
      nextNoteTime.current = audioContext.current.currentTime;
      setIsPlaying(true);
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerID.current) clearTimeout(timerID.current);
      if (audioContext.current) audioContext.current.close();
    };
  }, []);

  const handleBpmChange = (newBpm: number) => {
    setBpm(Math.min(Math.max(newBpm, 40), 240));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Control Card */}
        <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-10">
          <div className="flex items-center justify-center gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-100 ${
                  isPlaying && currentBeat === i
                    ? 'bg-indigo-500 scale-150 shadow-lg shadow-indigo-500/50'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="text-center space-y-2">
            <div className="text-8xl font-black font-mono tracking-tighter dark:text-white">
              {bpm}
            </div>
            <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              BPM - Battements par minute
            </div>
          </div>

          <div className="w-full max-w-md space-y-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleBpmChange(bpm - 1)}
                className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-90"
                aria-label="Diminuer le BPM"
              >
                <Minus className="w-6 h-6" />
              </button>
              <input
                type="range"
                min="40"
                max="240"
                value={bpm}
                onChange={(e) => handleBpmChange(parseInt(e.target.value))}
                className="flex-1 accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <button
                onClick={() => handleBpmChange(bpm + 1)}
                className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-90"
                aria-label="Augmenter le BPM"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={toggleMetronome}
                className={`flex-[3] py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
                  isPlaying
                    ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20'
                    : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Square className="w-6 h-6 fill-current" /> Arrêter
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current" /> Démarrer
                  </>
                )}
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex-1 py-5 rounded-[2rem] border font-black flex items-center justify-center transition-all active:scale-95 ${
                  isMuted
                    ? 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-500/10 dark:border-rose-500/20'
                    : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500'
                }`}
                aria-label={isMuted ? "Réactiver le son" : "Couper le son"}
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
            <h3 className="font-bold flex items-center gap-2 dark:text-white">
              <Activity className="w-5 h-5 text-indigo-500" /> Rythme
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[60, 90, 120, 140, 160, 200].map((t) => (
                <button
                  key={t}
                  onClick={() => handleBpmChange(t)}
                  className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                    bpm === t
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-500/30'
                      : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'
                  }`}
                >
                  {t} BPM
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl space-y-3">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Info className="w-4 h-4" /> Conseils
            </h4>
            <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed">
              Utilisez le métronome pour travailler votre précision. Commencez lentement (60-80 BPM) puis augmentez progressivement la vitesse.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
