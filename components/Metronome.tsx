import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Plus, Minus, Music, Info, Volume2, VolumeX, Fingerprint, RotateCcw } from 'lucide-react';

export function Metronome({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [bpm, setBpm] = useState(initialData?.bpm || 120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(initialData?.isMuted ?? false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(initialData?.beatsPerMeasure || 4);

  useEffect(() => {
    onStateChange?.({ bpm, isMuted, beatsPerMeasure });
  }, [bpm, isMuted, beatsPerMeasure, onStateChange]);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [taps, setTaps] = useState<number[]>([]);

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

  const togglePlay = useCallback(() => {
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
  }, [isPlaying, scheduler]);

  const handleBpmChange = useCallback((newBpm: number) => {
    setBpm(Math.max(30, Math.min(280, newBpm)));
  }, []);

  const handleReset = useCallback(() => {
    setBpm(120);
    setBeatsPerMeasure(4);
    setIsPlaying(false);
    setIsMuted(false);
    beatRef.current = 0;
    setCurrentBeat(0);
    if (timerIDRef.current) clearTimeout(timerIDRef.current);
  }, []);

  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    setTaps(prev => {
      const newTaps = [...prev, now].slice(-4); // Use last 4 taps for average
      if (newTaps.length >= 2) {
        const intervals = [];
        for (let i = 1; i < newTaps.length; i++) {
          intervals.push(newTaps[i] - newTaps[i - 1]);
        }
        const averageInterval = intervals.reduce((a, b) => a + b) / intervals.length;
        const newBpm = Math.round(60000 / averageInterval);
        if (newBpm >= 30 && newBpm <= 280) {
          setBpm(newBpm);
        }
      }
      return newTaps;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleBpmChange(bpm + 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleBpmChange(bpm - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleBpmChange(bpm + 5);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBpmChange(bpm - 5);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setIsMuted((prev: boolean) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [bpm, togglePlay, handleBpmChange]);

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
              title="Diminuer le BPM (Flèche Bas)"
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
              title="Augmenter le BPM (Flèche Haut)"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4 w-full">
            <button
              onClick={handleTapTempo}
              className="flex-1 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-500/50 transition-all active:scale-95 flex items-center justify-center gap-2"
              title="Taper le tempo"
            >
              <Fingerprint className="w-5 h-5" /> TAP TEMPO
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
              title={isPlaying ? "Arrêter (Espace)" : "Démarrer (Espace)"}
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
              title={isMuted ? "Réactiver le son (M)" : "Couper le son (M)"}
            >
              {isMuted ? <VolumeX className="w-8 h-8" /> : <Volume2 className="w-8 h-8" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
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
        <button
          onClick={handleReset}
          className="px-6 py-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilisez le curseur ou les boutons +/- pour régler le tempo (BPM), ou utilisez le bouton <strong>TAP TEMPO</strong> pour définir le tempo en tapant au rythme. Vous pouvez aussi utiliser les flèches du clavier (±1 ou ±5 avec Gauche/Droite), <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded">Espace</kbd> pour Start/Stop et <kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded">M</kbd> pour le mode muet.
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
