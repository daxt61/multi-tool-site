import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Plus, Minus, Music, Volume2, VolumeX } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const beatRef = useRef(0);
  const timerID = useRef<number | null>(null);
  const lookahead = 25.0; // How frequently to call scheduler (in ms)
  const scheduleAheadTime = 0.1; // How far ahead to schedule audio (in s)

  const playClick = useCallback((time: number, isFirstBeat: boolean) => {
    if (!audioContext.current || isMuted) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    osc.frequency.value = isFirstBeat ? 880 : 440;
    envelope.gain.value = volume;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, [isMuted, volume]);

  const scheduler = useCallback(() => {
    while (nextNoteTime.current < (audioContext.current?.currentTime || 0) + scheduleAheadTime) {
      playClick(nextNoteTime.current, beatRef.current === 0);

      const secondsPerBeat = 60.0 / bpm;
      nextNoteTime.current += secondsPerBeat;

      const nextBeat = (beatRef.current + 1) % timeSignature;
      beatRef.current = nextBeat;
      setCurrentBeat(nextBeat);
    }
  }, [bpm, timeSignature, playClick]);

  useEffect(() => {
    if (isPlaying) {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      nextNoteTime.current = audioContext.current.currentTime;
      beatRef.current = 0;
      setCurrentBeat(0);
      timerID.current = window.setInterval(scheduler, lookahead);
    } else {
      if (timerID.current) {
        clearInterval(timerID.current);
      }
    }
    return () => {
      if (timerID.current) {
        clearInterval(timerID.current);
      }
    };
  }, [isPlaying, bpm, timeSignature, scheduler]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const adjustBpm = (delta: number) => {
    setBpm((prev) => Math.max(40, Math.min(240, prev + delta)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-8">
        <div className="relative inline-block">
          <div className={`absolute -inset-8 bg-indigo-500/10 rounded-full blur-3xl transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}></div>
          <div className="text-[10rem] md:text-[12rem] font-black font-mono tracking-tighter leading-none text-slate-900 dark:text-white relative z-10">
            {bpm}
          </div>
          <div className="text-xl font-bold text-slate-400 uppercase tracking-widest mt-2">Beats Per Minute</div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => adjustBpm(-5)}
            className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
          >
            <Minus className="w-8 h-8" />
          </button>

          <button
            onClick={togglePlay}
            className={`w-24 h-24 rounded-[2rem] flex items-center justify-center transition-all active:scale-95 shadow-2xl ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
          </button>

          <button
            onClick={() => adjustBpm(5)}
            className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-90"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="space-y-6">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Signature Rythmique</label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setTimeSignature(num)}
                  className={`py-4 rounded-2xl font-black text-lg transition-all border ${
                    timeSignature === num
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                      : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {num}/4
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Volume</label>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-400 hover:text-indigo-500 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              disabled={isMuted}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-30"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center overflow-hidden">
          <div className="flex gap-4">
            {Array.from({ length: timeSignature }).map((_, i) => (
              <div
                key={i}
                className={`w-12 h-12 rounded-2xl transition-all duration-100 flex items-center justify-center font-black ${
                  isPlaying && currentBeat === i
                    ? i === 0
                      ? 'bg-rose-500 text-white scale-125 shadow-lg shadow-rose-500/20'
                      : 'bg-indigo-500 text-white scale-110 shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Music className="w-4 h-4" /> Visualiseur de Rythme
          </p>
        </div>
      </div>
    </div>
  );
}
