import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Volume2, Info, Activity } from 'lucide-react';

export function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.5);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const currentBeatRef = useRef(currentBeat);
  const volumeRef = useRef(volume);

  useEffect(() => {
    bpmRef.current = bpm;
    beatsPerMeasureRef.current = beatsPerMeasure;
    volumeRef.current = volume;
  }, [bpm, beatsPerMeasure, volume]);

  const playClick = useCallback((time: number, isFirstBeat: boolean) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.frequency.value = isFirstBeat ? 880 : 440;
    envelope.gain.setValueAtTime(volumeRef.current, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    while (nextNoteTimeRef.current < audioContextRef.current!.currentTime + 0.1) {
      const isFirstBeat = currentBeatRef.current === 0;
      playClick(nextNoteTimeRef.current, isFirstBeat);

      // Update local state for visual feedback
      const nextBeat = (currentBeatRef.current + 1) % beatsPerMeasureRef.current;
      currentBeatRef.current = nextBeat;
      setCurrentBeat(nextBeat);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;
    }
    timerIDRef.current = window.setTimeout(scheduler, 25.0);
  }, [playClick]);

  const toggleMetronome = () => {
    if (!isPlaying) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      setIsPlaying(true);
      currentBeatRef.current = 0;
      setCurrentBeat(0);
      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
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
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex flex-col items-center space-y-12">
        {/* Visualizer */}
        <div className="flex gap-4">
          {[...Array(beatsPerMeasure)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === (i + 1) % beatsPerMeasure
                  ? 'bg-indigo-500 scale-150 shadow-lg shadow-indigo-500/50'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* BPM Display */}
        <div className="relative group">
          <div className="absolute -inset-8 bg-indigo-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="text-[8rem] md:text-[12rem] font-black leading-none tracking-tighter text-slate-900 dark:text-white flex items-baseline">
            {bpm}
            <span className="text-2xl md:text-4xl text-slate-400 ml-4">BPM</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="w-full max-w-lg space-y-8 bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-6">
            <button
              onClick={() => setBpm(Math.max(40, bpm - 1))}
              className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90"
            >
              <Minus className="w-6 h-6" />
            </button>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <button
              onClick={() => setBpm(Math.min(240, bpm + 1))}
              className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={toggleMetronome}
              className={`flex-1 h-20 rounded-3xl font-black text-xl transition-all flex items-center justify-center gap-3 ${
                isPlaying
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20'
              } active:scale-95`}
            >
              {isPlaying ? <Square className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              {isPlaying ? 'Arrêter' : 'Démarrer'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Mesure</label>
              <div className="flex bg-white dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
                {[2, 3, 4, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => setBeatsPerMeasure(num)}
                    className={`flex-1 py-2 rounded-xl text-sm font-black transition-all ${
                      beatsPerMeasure === num
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Volume</label>
                <Volume2 className="w-3 h-3 text-slate-400" />
              </div>
              <input
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
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
            <Activity className="w-5 h-5" />
          </div>
          <h4 className="font-bold dark:text-white">Précision Professionnelle</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilise l'horloge système de l'API Web Audio pour une précision à la milliseconde, essentielle pour la pratique musicale sérieuse.
          </p>
        </div>
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
            <Info className="w-5 h-5" />
          </div>
          <h4 className="font-bold dark:text-white">Pourquoi s'entraîner ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le métronome aide à développer un sens du rythme interne, améliore la synchronisation et permet de maîtriser des passages techniques complexes.
          </p>
        </div>
      </div>
    </div>
  );
}
