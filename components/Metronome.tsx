import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Music, Info } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState(4); // Beats per measure
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);
  const beatRef = useRef(0);

  const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
  const scheduleAheadTime = 0.1; // How far ahead to schedule audio (in seconds)

  const playClick = useCallback((time: number, isFirstBeat: boolean) => {
    if (!audioContext.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    osc.frequency.value = isFirstBeat ? 1000 : 800;
    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    while (nextNoteTime.current < audioContext.current!.currentTime + scheduleAheadTime) {
      const isFirstBeat = beatRef.current % timeSignature === 0;
      playClick(nextNoteTime.current, isFirstBeat);

      const secondsPerBeat = 60.0 / bpm;
      nextNoteTime.current += secondsPerBeat;

      const nextBeat = beatRef.current % timeSignature;
      // We use a small timeout to sync the UI beat indicator with the audio
      const delay = (nextNoteTime.current - audioContext.current!.currentTime) * 1000;
      setTimeout(() => {
        setCurrentBeat(nextBeat);
      }, Math.max(0, delay - 50));

      beatRef.current++;
    }
    timerID.current = window.setTimeout(scheduler, lookahead);
  }, [bpm, timeSignature, playClick]);

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
      nextNoteTime.current = audioContext.current.currentTime;
      scheduler();
    } else {
      setIsPlaying(false);
      if (timerID.current) {
        clearTimeout(timerID.current);
      }
      setCurrentBeat(0);
    }
  };

  useEffect(() => {
    return () => {
      if (timerID.current) clearTimeout(timerID.current);
      if (audioContext.current) audioContext.current.close();
    };
  }, []);

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(240, Math.max(40, prev + delta)));
  };

  const timeSignatures = [
    { label: '2/4', value: 2 },
    { label: '3/4', value: 3 },
    { label: '4/4', value: 4 },
    { label: '6/8', value: 6 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Visual Metronome */}
        <div className="flex gap-4 h-4 items-center justify-center">
          {Array.from({ length: timeSignature }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === i
                  ? i === 0 ? 'bg-indigo-600 scale-150' : 'bg-indigo-400 scale-125'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-500/5 flex flex-col items-center space-y-10 w-full max-w-md relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>

           <div className="flex flex-col items-center">
             <span className="text-8xl font-black font-mono tracking-tighter text-slate-900 dark:text-white">
               {bpm}
             </span>
             <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mt-2">BPM</span>
           </div>

           <div className="w-full space-y-6">
             <div className="flex items-center gap-4">
               <button
                 onClick={() => adjustBpm(-1)}
                 className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95"
               >
                 <Minus className="w-6 h-6" />
               </button>
               <input
                 type="range"
                 min="40"
                 max="240"
                 value={bpm}
                 onChange={(e) => setBpm(Number(e.target.value))}
                 className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
               />
               <button
                 onClick={() => adjustBpm(1)}
                 className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition-all active:scale-95"
               >
                 <Plus className="w-6 h-6" />
               </button>
             </div>

             <div className="grid grid-cols-4 gap-2">
               {timeSignatures.map((sig) => (
                 <button
                   key={sig.value}
                   onClick={() => setTimeSignature(sig.value)}
                   className={`py-2 rounded-xl text-xs font-black transition-all border ${
                     timeSignature === sig.value
                       ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950'
                       : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                   }`}
                 >
                   {sig.label}
                 </button>
               ))}
             </div>
           </div>

           <button
             onClick={toggleMetronome}
             className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl ${
               isPlaying
                 ? 'bg-rose-500 text-white shadow-rose-500/20'
                 : 'bg-indigo-600 text-white shadow-indigo-600/20'
             }`}
           >
             {isPlaying ? <Square className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Music className="w-5 h-5" />
          </div>
          <h3 className="font-bold dark:text-white">Pourquoi utiliser un métronome ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Un métronome est un outil essentiel pour tout musicien souhaitant améliorer son sens du rythme et sa précision. Il aide à maintenir un tempo constant pendant la pratique, ce qui est crucial pour l'apprentissage de nouveaux morceaux.
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="font-bold dark:text-white">Précision Web Audio</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cet outil utilise l'API Web Audio pour une précision millimétrée, indépendamment des ralentissements éventuels du navigateur. Le son est généré en temps réel pour garantir une latence minimale.
          </p>
        </div>
      </div>
    </div>
  );
}
