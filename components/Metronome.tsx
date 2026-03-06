import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Music, Settings2 } from 'lucide-react';

export function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);
  const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
  const scheduleAheadTime = 0.1; // How far ahead to schedule audio (in seconds)
  const beatRef = useRef(0);

  const timeSignatures = [
    { label: '2/4', value: '2/4', beats: 2 },
    { label: '3/4', value: '3/4', beats: 3 },
    { label: '4/4', value: '4/4', beats: 4 },
    { label: '6/8', value: '6/8', beats: 6 },
  ];

  const currentBeats = timeSignatures.find(ts => ts.value === timeSignature)?.beats || 4;

  const nextNote = () => {
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTime.current += secondsPerBeat;
    beatRef.current++;
    if (beatRef.current >= currentBeats) {
      beatRef.current = 0;
    }
  };

  const scheduleNote = (beatNumber: number, time: number) => {
    if (!audioContext.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    // High pitch for first beat, lower for others
    osc.frequency.value = beatNumber === 0 ? 1000 : 800;

    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);

    // Sync UI beat indicator
    setTimeout(() => {
        setCurrentBeat(beatNumber);
    }, (time - audioContext.current.currentTime) * 1000);
  };

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;

    while (nextNoteTime.current < audioContext.current.currentTime + scheduleAheadTime) {
      scheduleNote(beatRef.current, nextNoteTime.current);
      nextNote();
    }
    timerID.current = window.setTimeout(scheduler, lookahead);
  }, [bpm, currentBeats]);

  const toggleMetronome = () => {
    if (!isPlaying) {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }

      setIsPlaying(true);
      beatRef.current = 0;
      setCurrentBeat(0);
      nextNoteTime.current = audioContext.current.currentTime;
      scheduler();
    } else {
      setIsPlaying(false);
      if (timerID.current) {
        window.clearTimeout(timerID.current);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerID.current) {
        window.clearTimeout(timerID.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  const adjustBpm = (val: number) => {
    setBpm(prev => {
      const next = prev + val;
      return Math.min(Math.max(next, 40), 240);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="bg-slate-900 dark:bg-black p-8 md:p-16 rounded-[3rem] shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
        {/* Animated Background Decor */}
        <div className={`absolute inset-0 bg-indigo-600/5 transition-opacity duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />

        <div className="relative z-10 flex flex-col items-center gap-12">
          {/* BPM Display */}
          <div className="text-center space-y-2">
            <div className="text-indigo-400 font-black uppercase tracking-[0.3em] text-xs">Beats Per Minute</div>
            <div className="text-8xl md:text-9xl font-black text-white font-mono tracking-tighter tabular-nums flex items-baseline gap-2">
              {bpm}
              <span className="text-2xl text-white/20 tracking-normal">BPM</span>
            </div>
          </div>

          {/* Visual Beat Indicator */}
          <div className="flex gap-4">
            {Array.from({ length: currentBeats }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-100 ${
                  isPlaying && currentBeat === i
                    ? 'bg-indigo-500 scale-150 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Main Controls */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => adjustBpm(-1)}
              className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90 flex items-center justify-center border border-white/10"
              aria-label="Diminuer le BPM"
            >
              <Minus className="w-6 h-6" />
            </button>

            <button
              onClick={toggleMetronome}
              className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all active:scale-95 shadow-xl ${
                isPlaying
                  ? 'bg-rose-500 text-white shadow-rose-500/20'
                  : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
              }`}
              aria-label={isPlaying ? "Arrêter" : "Démarrer"}
            >
              {isPlaying ? <Square className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
            </button>

            <button
              onClick={() => adjustBpm(1)}
              className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90 flex items-center justify-center border border-white/10"
              aria-label="Augmenter le BPM"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex items-center gap-2 px-1">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Réglages</h3>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="bpm-range" className="text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Vitesse</label>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{bpm} BPM</span>
            </div>
            <input
              id="bpm-range"
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-400 px-1">Signature rythmique</label>
            <div className="grid grid-cols-2 gap-3">
              {timeSignatures.map((ts) => (
                <button
                  key={ts.value}
                  onClick={() => setTimeSignature(ts.value)}
                  className={`px-4 py-3 rounded-xl font-bold text-sm transition-all border ${
                    timeSignature === ts.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {ts.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
          <Music className="w-12 h-12 mb-6 opacity-50" />
          <h3 className="text-2xl font-black mb-4">Timing de précision</h3>
          <p className="text-indigo-100 font-medium leading-relaxed">
            Ce métronome utilise la <code>Web Audio API</code> pour garantir une précision rythmique absolue, indépendamment de la charge processeur ou des ralentissements de l'interface graphique.
          </p>
        </div>
      </div>
    </div>
  );
}
