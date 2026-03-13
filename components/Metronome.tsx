import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Volume2, Music, Activity, Info, Clock, Heart } from 'lucide-react';

export function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [volume, setVolume] = useState(0.5);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);

  // Refs for scheduler to access latest state without re-triggering effects
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);
  const volumeRef = useRef(volume);
  const currentBeatRef = useRef(currentBeat);

  useEffect(() => {
    bpmRef.current = bpm;
    beatsPerMeasureRef.current = beatsPerMeasure;
    volumeRef.current = volume;
    currentBeatRef.current = currentBeat;
  }, [bpm, beatsPerMeasure, volume, currentBeat]);

  const playClick = useCallback((time: number, beat: number) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    // High pitch for the first beat of the measure, lower for others
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
      playClick(nextNoteTimeRef.current, currentBeatRef.current);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;

      const nextBeat = (currentBeatRef.current + 1) % beatsPerMeasureRef.current;
      setCurrentBeat(nextBeat);
      currentBeatRef.current = nextBeat;
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [playClick]);

  const startStop = () => {
    if (isPlaying) {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      setIsPlaying(false);
      setCurrentBeat(0);
      currentBeatRef.current = 0;
    } else {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      setIsPlaying(true);
      nextNoteTimeRef.current = audioContextRef.current.currentTime + 0.05;
      scheduler();
    }
  };

  useEffect(() => {
    return () => {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(240, Math.max(40, prev + delta)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Main Controls */}
        <div className="space-y-8">
          <div className="text-center space-y-4 bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
            <div className="text-sm font-black text-slate-400 uppercase tracking-widest">Tempo</div>
            <div className="text-8xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
              {bpm}
            </div>
            <div className="text-indigo-500 font-bold tracking-widest uppercase">BPM</div>

            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => adjustBpm(-1)}
                className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90"
              >
                <Minus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={() => adjustBpm(-5)}
                className="px-4 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all active:scale-90"
              >
                -5
              </button>
              <button
                onClick={() => adjustBpm(5)}
                className="px-4 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-all active:scale-90"
              >
                +5
              </button>
              <button
                onClick={() => adjustBpm(1)}
                className="w-12 h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90"
              >
                <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full mt-8 h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-indigo-600"
            />
          </div>

          <button
            onClick={startStop}
            className={`w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
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
        </div>

        {/* Settings & Visualizer */}
        <div className="space-y-8">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[300px] space-y-8 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-50"></div>

            {/* Visual Beat Indicators */}
            <div className="flex gap-4">
              {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-2xl transition-all duration-75 border-4 ${
                    isPlaying && currentBeat === i
                      ? (i === 0 ? 'bg-indigo-500 border-indigo-400 scale-125 shadow-lg shadow-indigo-500/40' : 'bg-white border-slate-200 scale-110 shadow-lg shadow-white/20')
                      : 'bg-slate-800 border-slate-700'
                  }`}
                />
              ))}
            </div>

            <div className="w-full space-y-6 pt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Music className="w-3 h-3" /> Signature rythmique
                  </label>
                  <span className="text-white font-mono font-bold">{beatsPerMeasure}/4</span>
                </div>
                <div className="flex gap-2">
                  {[2, 3, 4, 6].map(num => (
                    <button
                      key={num}
                      onClick={() => setBeatsPerMeasure(num)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                        beatsPerMeasure === num
                          ? 'bg-white text-black'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Volume2 className="w-3 h-3" /> Volume
                  </label>
                  <span className="text-white font-mono font-bold">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Précision Musicale
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ce métronome utilise l'API Web Audio pour une précision temporelle de niveau professionnel. Contrairement aux timers standards, il garantit un rythme stable sans décalage.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" /> Guide des Tempos
          </h4>
          <div className="space-y-2">
             {[
               { name: 'Adagio', bpm: '66-76' },
               { name: 'Andante', bpm: '76-108' },
               { name: 'Moderato', bpm: '108-120' },
               { name: 'Allegro', bpm: '120-168' },
             ].map(t => (
               <div key={t.name} className="flex justify-between text-xs border-b border-slate-50 dark:border-slate-800 pb-1">
                 <span className="font-bold text-slate-600 dark:text-slate-400">{t.name}</span>
                 <span className="font-mono text-indigo-500">{t.bpm}</span>
               </div>
             ))}
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Heart className="w-4 h-4 text-indigo-500" /> Pratique
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Conseil : Travaillez vos gammes ou vos morceaux à un tempo lent (60-80 BPM) avant d'augmenter progressivement la vitesse pour une exécution parfaite.
          </p>
        </div>
      </div>
    </div>
  );
}
