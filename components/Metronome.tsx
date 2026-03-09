import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, Music, VolumeX } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const beatRef = useRef(0);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);

  // Sync refs with state
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { beatsPerMeasureRef.current = beatsPerMeasure; }, [beatsPerMeasure]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  const playClick = useCallback((time: number, beatNumber: number) => {
    if (!audioContextRef.current || isMutedRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    // High pitch for the first beat of the measure
    osc.frequency.value = beatNumber === 0 ? 1000 : 800;

    envelope.gain.value = volumeRef.current;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);

    // Visual feedback sync (approximate)
    setTimeout(() => {
      setCurrentBeat(beatNumber);
    }, (time - audioContextRef.current.currentTime) * 1000);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      playClick(nextNoteTimeRef.current, beatRef.current);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;
      beatRef.current = (beatRef.current + 1) % beatsPerMeasureRef.current;
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const toggleMetronome = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    } else {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      setIsPlaying(true);
      beatRef.current = 0;
      setCurrentBeat(0);
      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
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
      <div className="text-center space-y-8">
        {/* Main Display */}
        <div className="relative inline-block">
          <div className="text-[10rem] md:text-[12rem] font-black font-mono leading-none tracking-tighter text-slate-900 dark:text-white transition-all">
            {bpm}
          </div>
          <div className="text-sm font-black uppercase tracking-[0.3em] text-indigo-500 mt-2">
            Beats Per Minute
          </div>
        </div>

        {/* Visual Pulse */}
        <div className="flex justify-center gap-4">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === i
                  ? (i === 0 ? 'bg-indigo-600 scale-150' : 'bg-indigo-400 scale-125')
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Play/Pause */}
        <div className="flex justify-center">
          <button
            onClick={toggleMetronome}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-indigo-600/20'
            }`}
          >
            {isPlaying ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        {/* BPM Slider */}
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Tempo</h3>
            <div className="flex gap-2">
              <button onClick={() => setBpm(Math.max(40, bpm - 1))} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-50 transition-colors">-</button>
              <button onClick={() => setBpm(Math.min(240, bpm + 1))} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-50 transition-colors">+</button>
            </div>
          </div>
          <input
            type="range" min="40" max="240" step="1"
            value={bpm} onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
            <span>40 LARGO</span>
            <span>120 MODERATO</span>
            <span>240 PRESTO</span>
          </div>
        </div>

        {/* Settings */}
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Mesure</label>
            <select
              value={beatsPerMeasure}
              onChange={(e) => setBeatsPerMeasure(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer"
            >
              {[2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}/4</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Volume</label>
            <div className="flex items-center gap-4 h-14">
              <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-indigo-500 transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range" min="0" max="1" step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setIsMuted(false);
                }}
                className="flex-grow accent-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
