import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Music, Volume2, VolumeX } from 'lucide-react';

export function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);

  // ⚡ Bolt Optimization: Stable refs for scheduler to prevent interval restarts
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    bpmRef.current = bpm;
    beatsPerMeasureRef.current = beatsPerMeasure;
    volumeRef.current = volume;
    isMutedRef.current = isMuted;
  }, [bpm, beatsPerMeasure, volume, isMuted]);

  const playClick = useCallback((time: number, beat: number) => {
    if (!audioContextRef.current || isMutedRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    // High pitch for first beat of measure, lower for others
    osc.frequency.value = beat === 0 ? 1000 : 800;

    envelope.gain.value = volumeRef.current;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      const beat = currentBeat % beatsPerMeasureRef.current;
      playClick(nextNoteTimeRef.current, beat);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;

      setCurrentBeat(prev => (prev + 1) % beatsPerMeasureRef.current);
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [currentBeat, playClick]);

  const togglePlay = () => {
    if (isPlaying) {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
      setIsPlaying(true);
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleBpmChange = (newBpm: number) => {
    setBpm(Math.min(Math.max(newBpm, 40), 240));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="text-center space-y-8">
        {/* Visual Pulse */}
        <div className="flex justify-center items-center gap-4 h-12">
          {Array.from({ length: beatsPerMeasure }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === i
                  ? 'bg-indigo-500 scale-150 shadow-lg shadow-indigo-500/50'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        <div className="space-y-2">
          <div className="text-8xl font-black font-mono tracking-tighter dark:text-white">
            {bpm}
          </div>
          <div className="text-sm font-bold uppercase tracking-widest text-slate-400">BPM</div>
        </div>

        <div className="flex justify-center items-center gap-6">
          <button
            onClick={() => handleBpmChange(bpm - 1)}
            className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:border-indigo-500 transition-all active:scale-95"
            aria-label="Diminuer le BPM"
          >
            <Minus className="w-6 h-6" />
          </button>

          <button
            onClick={togglePlay}
            className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all shadow-xl active:scale-90 ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-indigo-600/20'
            }`}
            aria-label={isPlaying ? "Arrêter" : "Démarrer"}
          >
            {isPlaying ? <Square className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
          </button>

          <button
            onClick={() => handleBpmChange(bpm + 1)}
            className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center hover:border-indigo-500 transition-all active:scale-95"
            aria-label="Augmenter le BPM"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BPM Slider */}
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <label htmlFor="bpm-range" className="block text-xs font-black uppercase tracking-widest text-slate-400">Tempo</label>
          <input
            id="bpm-range"
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => handleBpmChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-xs font-bold text-slate-400">
            <span>Largo (40)</span>
            <span>Presto (240)</span>
          </div>
        </div>

        {/* Configuration */}
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="space-y-4">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Signature</label>
            <div className="flex gap-2">
              {[2, 3, 4, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => setBeatsPerMeasure(num)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${
                    beatsPerMeasure === num
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {num}/4
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label htmlFor="volume-range" className="text-xs font-black uppercase tracking-widest text-slate-400">Volume</label>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg transition-colors ${isMuted ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:bg-slate-100'}`}
                aria-label={isMuted ? "Activer le son" : "Couper le son"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
            <input
              id="volume-range"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-500" /> Web Audio API
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ce métronome utilise la précision temporelle de l'API Web Audio pour garantir un rythme stable, indépendant des ralentissements potentiels du navigateur.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" /> Signatures Temporelles
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le premier temps de chaque mesure est accentué par une fréquence plus haute (1000Hz contre 800Hz) pour vous aider à garder le compte.
          </p>
        </div>
      </div>
    </div>
  );
}
