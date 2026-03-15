import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Activity, Volume2, VolumeX } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  const audioContext = useRef<AudioContext | null>(null);
  const timerID = useRef<number | null>(null);
  const nextNoteTime = useRef(0);
  const scheduleAheadTime = 0.1;
  const lookahead = 25.0;

  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const currentBeatRef = useRef(0);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    bpmRef.current = bpm;
    beatsPerMeasureRef.current = beatsPerMeasure;
    volumeRef.current = isMuted ? 0 : volume;
    isMutedRef.current = isMuted;
  }, [bpm, beatsPerMeasure, volume, isMuted]);

  const playClick = useCallback((time: number, isFirstBeat: boolean) => {
    if (!audioContext.current || isMutedRef.current) return;

    const osc = audioContext.current.createOscillator();
    const gain = audioContext.current.createGain();

    osc.connect(gain);
    gain.connect(audioContext.current.destination);

    osc.frequency.setValueAtTime(isFirstBeat ? 880 : 440, time);
    gain.gain.setValueAtTime(volumeRef.current, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    while (nextNoteTime.current < (audioContext.current?.currentTime || 0) + scheduleAheadTime) {
      const isFirstBeat = currentBeatRef.current === 0;
      playClick(nextNoteTime.current, isFirstBeat);

      const timeToNextNote = 60.0 / bpmRef.current;
      nextNoteTime.current += timeToNextNote;

      const beatToUpdate = currentBeatRef.current;
      setTimeout(() => {
        setCurrentBeat(beatToUpdate);
      }, (nextNoteTime.current - (audioContext.current?.currentTime || 0)) * 1000);

      currentBeatRef.current = (currentBeatRef.current + 1) % beatsPerMeasureRef.current;
    }
    timerID.current = window.setTimeout(scheduler, lookahead);
  }, [playClick]);

  const togglePlay = () => {
    if (isPlaying) {
      if (timerID.current) clearTimeout(timerID.current);
      setIsPlaying(false);
      setCurrentBeat(0);
      currentBeatRef.current = 0;
    } else {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      setIsPlaying(true);
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

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 dark:bg-black rounded-[3rem] shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
        {/* Animated Background Rings */}
        {isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border border-indigo-500/20 rounded-full animate-ping"></div>
            <div className="w-96 h-96 border border-indigo-500/10 rounded-full animate-ping [animation-delay:0.5s]"></div>
          </div>
        )}

        <div className="relative z-10 text-center space-y-8">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setBpm(Math.max(40, bpm - 1))}
              className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all font-black text-2xl"
            >
              -
            </button>
            <div className="flex flex-col items-center">
              <span className="text-8xl font-black text-white font-mono tracking-tighter leading-none">{bpm}</span>
              <span className="text-indigo-400 font-bold uppercase tracking-[0.3em] text-xs mt-2">BPM</span>
            </div>
            <button
              onClick={() => setBpm(Math.min(240, bpm + 1))}
              className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all font-black text-2xl"
            >
              +
            </button>
          </div>

          <div className="flex justify-center gap-3">
            {Array.from({ length: beatsPerMeasure }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-100 ${
                  isPlaying && currentBeat === i
                    ? i === 0 ? 'bg-indigo-400 scale-125 shadow-lg shadow-indigo-400/50' : 'bg-white scale-110'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          <button
            onClick={togglePlay}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-xl ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
            }`}
          >
            {isPlaying ? (
              <Square className="w-10 h-10 text-white fill-current" />
            ) : (
              <Play className="w-10 h-10 text-white fill-current ml-2" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="bpm-slider" className="text-xs font-black uppercase tracking-widest text-slate-400">Réglage fin</label>
              <Activity className="w-4 h-4 text-indigo-500" />
            </div>
            <input
              id="bpm-slider"
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Mesure</label>
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {[2, 3, 4, 6].map(val => (
                    <button
                      key={val}
                      onClick={() => setBeatsPerMeasure(val)}
                      className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                        beatsPerMeasure === val
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="volume-slider" className="text-xs font-black uppercase tracking-widest text-slate-400">Volume</label>
                  <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-indigo-500">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
                <input
                  id="volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
             </div>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col justify-center">
          <h3 className="text-xl font-black mb-4 flex items-center gap-3">
            <Activity className="w-6 h-6" />
            Audio Haute Précision
          </h3>
          <p className="text-indigo-100 font-medium leading-relaxed">
            Notre métronome utilise l'API Web Audio pour garantir un timing parfait, indépendant de la charge processeur ou des ralentissements de l'interface graphique.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[60, 90, 120, 140].map(val => (
              <button
                key={val}
                onClick={() => setBpm(val)}
                className="py-3 px-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-sm transition-all border border-white/10"
              >
                {val} BPM
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
