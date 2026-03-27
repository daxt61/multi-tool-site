import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Plus, Minus, Music, Info, Volume2, VolumeX } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextTickTimeRef = useRef<number>(0);
  const timerIDRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const isMutedRef = useRef(isMuted);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const beatRef = useRef(0);

  // Update refs when state changes to avoid stale closures in the scheduler
  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { beatsPerMeasureRef.current = beatsPerMeasure; }, [beatsPerMeasure]);

  const playClick = useCallback((time: number, isFirstBeat: boolean) => {
    if (!audioContextRef.current || isMutedRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.frequency.value = isFirstBeat ? 1000 : 800;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    while (nextTickTimeRef.current < (audioContextRef.current?.currentTime || 0) + 0.1) {
      const isFirstBeat = beatRef.current % beatsPerMeasureRef.current === 0;
      playClick(nextTickTimeRef.current, isFirstBeat);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextTickTimeRef.current += secondsPerBeat;

      beatRef.current = (beatRef.current + 1) % beatsPerMeasureRef.current;
      setCurrentBeat(beatRef.current);
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const togglePlay = () => {
    if (!isPlaying) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      beatRef.current = 0;
      setCurrentBeat(0);
      nextTickTimeRef.current = audioContextRef.current.currentTime + 0.05;
      setIsPlaying(true);
      scheduler();
    } else {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      setIsPlaying(false);
    }
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(Math.max(30, Math.min(280, newBpm)));
  };

  useEffect(() => {
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex flex-col items-center justify-center space-y-12 py-12 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[3rem]">
        {/* Visualizer */}
        <div className="flex gap-4" data-testid="metronome-visualizer">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && (currentBeat - 1 + beatsPerMeasure) % beatsPerMeasure === i
                  ? i === 0 ? 'bg-indigo-500 scale-125 shadow-lg shadow-indigo-500/50' : 'bg-slate-400 scale-110'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* BPM Display */}
        <div className="text-center space-y-2">
          <div className="text-8xl md:text-9xl font-black font-mono tracking-tighter dark:text-white tabular-nums">
            {bpm}
          </div>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Beats Per Minute</div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-8 w-full max-w-sm px-8">
          <div className="flex items-center gap-6 w-full">
            <button
              onClick={() => handleBpmChange(bpm - 1)}
              className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all active:scale-90"
              aria-label="Diminuer le BPM"
            >
              <Minus className="w-6 h-6" />
            </button>
            <input
              type="range"
              min="30"
              max="280"
              value={bpm}
              onChange={(e) => handleBpmChange(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              aria-label="Ajuster le BPM"
            />
            <button
              onClick={() => handleBpmChange(bpm + 1)}
              className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 transition-all active:scale-90"
              aria-label="Augmenter le BPM"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4 w-full">
            <button
              onClick={togglePlay}
              className={`flex-1 py-6 rounded-[2rem] font-black text-2xl transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl ${
                isPlaying
                  ? 'bg-rose-500 text-white shadow-rose-500/20'
                  : 'bg-indigo-600 text-white shadow-indigo-600/20'
              }`}
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
              {isPlaying ? 'STOP' : 'START'}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-6 rounded-[2rem] border-2 transition-all ${
                isMuted
                  ? 'bg-rose-50 border-rose-200 text-rose-500 dark:bg-rose-500/10 dark:border-rose-500/20'
                  : 'bg-white border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700'
              }`}
              aria-label={isMuted ? "Réactiver le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl">
          {[2, 3, 4, 6].map((num) => (
            <button
              key={num}
              onClick={() => {
                setBeatsPerMeasure(num);
                beatRef.current = 0;
                setCurrentBeat(0);
              }}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                beatsPerMeasure === num
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {num}/4
            </button>
          ))}
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilisez le curseur ou les boutons +/- pour régler le tempo (BPM). Le premier temps de chaque mesure est accentué par un son plus aigu et une animation visuelle distincte.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-500" /> Signature Rythmique
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Vous pouvez changer la signature rythmique (2/4, 3/4, 4/4 ou 6/4) pour l'adapter à votre morceau. La signature par défaut est le 4/4 standard.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-500" /> Précision Audio
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ce métronome utilise l'API Web Audio pour garantir une précision temporelle millimétrée, indispensable pour la pratique musicale sérieuse.
          </p>
        </div>
      </div>
    </div>
  );
}
