import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Music, Volume2, VolumeX } from 'lucide-react';

const TIME_SIGNATURES = [
  { id: '2/4', beats: 2, name: '2/4' },
  { id: '3/4', beats: 3, name: '3/4' },
  { id: '4/4', beats: 4, name: '4/4' },
  { id: '6/8', beats: 6, name: '6/8' },
];

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState(TIME_SIGNATURES[2]);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [muted, setMuted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const beatRef = useRef(0);

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    if (muted || !audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.frequency.value = beatNumber === 0 ? 1000 : 800;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, [muted]);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      scheduleNote(beatRef.current, nextNoteTimeRef.current);

      const secondsPerBeat = 60.0 / bpm;
      nextNoteTimeRef.current += secondsPerBeat;

      const nextBeat = (beatRef.current + 1) % timeSignature.beats;
      beatRef.current = nextBeat;

      // Update UI state - use a timeout to sync with audio roughly
      const delay = (nextNoteTimeRef.current - audioContextRef.current.currentTime) * 1000;
      setTimeout(() => {
        setCurrentBeat(prev => (prev + 1) % timeSignature.beats);
      }, Math.max(0, delay));
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [bpm, scheduleNote, timeSignature.beats]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      beatRef.current = 0;
      setCurrentBeat(0);
      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
      setIsPlaying(true);
      scheduler();
    } else {
      setIsPlaying(false);
      if (timerIDRef.current) {
        clearTimeout(timerIDRef.current);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerIDRef.current) {
        clearTimeout(timerIDRef.current);
      }
    };
  }, []);

  const handleBpmChange = (newBpm: number) => {
    setBpm(Math.max(40, Math.min(240, newBpm)));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="text-center space-y-8">
        {/* Visual Pulse Display */}
        <div className="flex justify-center gap-4">
          {Array.from({ length: timeSignature.beats }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === i
                  ? i === 0
                    ? 'bg-indigo-600 scale-150 shadow-lg shadow-indigo-500/50'
                    : 'bg-indigo-400 scale-125'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* BPM Display */}
        <div className="space-y-2">
          <div className="text-8xl font-black font-mono tracking-tighter dark:text-white">
            {bpm}
          </div>
          <div className="text-sm font-bold uppercase tracking-widest text-slate-400">BPM</div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-8">
          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleBpmChange(bpm - 1)}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              -1
            </button>
            <button
              onClick={togglePlay}
              className={`w-20 h-20 flex items-center justify-center rounded-[2rem] text-white shadow-xl transition-all active:scale-95 ${
                isPlaying
                  ? 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600'
                  : 'bg-indigo-600 shadow-indigo-600/20 hover:bg-indigo-700'
              }`}
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
            <button
              onClick={() => handleBpmChange(bpm + 1)}
              className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              +1
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time Signature */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Signature rythmique</h4>
          <div className="grid grid-cols-2 gap-2">
            {TIME_SIGNATURES.map((sig) => (
              <button
                key={sig.id}
                onClick={() => {
                  setTimeSignature(sig);
                  if (isPlaying) {
                    beatRef.current = 0;
                    setCurrentBeat(0);
                  }
                }}
                className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                  timeSignature.id === sig.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {sig.name}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Settings */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-indigo-500">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold dark:text-white">Audio</div>
                <div className="text-xs text-slate-500">Activer/Désactiver le son</div>
              </div>
            </div>
            <button
              onClick={() => setMuted(!muted)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                muted
                  ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20'
                  : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20'
              }`}
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
