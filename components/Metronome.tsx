import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Minus, Plus, Volume2, Music } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [volume, setVolume] = useState(0.5);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);
  const currentBeat = useRef(0);
  const beatRef = useRef(0);
  const bpmRef = useRef(bpm);
  const beatsPerMeasureRef = useRef(parseInt(timeSignature.split('/')[0]));
  const volumeRef = useRef(volume);

  const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
  const scheduleAheadTime = 0.1; // How far ahead to schedule audio (in seconds)

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    beatsPerMeasureRef.current = parseInt(timeSignature.split('/')[0]);
  }, [timeSignature]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const playClick = useCallback((time: number, isFirstBeat: boolean) => {
    if (!audioContext.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    osc.frequency.value = isFirstBeat ? 880 : 440;
    envelope.gain.value = volumeRef.current;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;

    while (nextNoteTime.current < audioContext.current.currentTime + scheduleAheadTime) {
      const isFirstBeat = currentBeat.current === 0;
      playClick(nextNoteTime.current, isFirstBeat);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTime.current += secondsPerBeat;
      currentBeat.current = (currentBeat.current + 1) % beatsPerMeasureRef.current;
      beatRef.current = currentBeat.current;
    }
  }, [playClick]);

  useEffect(() => {
    if (isPlaying) {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }

      currentBeat.current = 0;
      nextNoteTime.current = audioContext.current.currentTime;
      timerID.current = window.setInterval(scheduler, lookahead);
    } else {
      if (timerID.current) {
        window.clearInterval(timerID.current);
        timerID.current = null;
      }
    }

    return () => {
      if (timerID.current) window.clearInterval(timerID.current);
    };
  }, [isPlaying, scheduler]);

  const handleBpmChange = (newBpm: number) => {
    setBpm(Math.max(40, Math.min(240, newBpm)));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 mb-4">
          <Music className="w-10 h-10" />
        </div>
        <h2 className="text-5xl font-black tracking-tighter dark:text-white">{bpm} <span className="text-xl text-slate-400">BPM</span></h2>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 space-y-10">
        <div className="space-y-6">
          <input
            type="range"
            min="40"
            max="240"
            value={bpm}
            onChange={(e) => handleBpmChange(parseInt(e.target.value))}
            className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between items-center px-2 text-xs font-black text-slate-400 uppercase tracking-widest">
            <span>40 BPM</span>
            <span>240 BPM</span>
          </div>
        </div>

        <div className="flex justify-center items-center gap-8">
          <button
            onClick={() => handleBpmChange(bpm - 1)}
            className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-500 transition-all active:scale-90"
          >
            <Minus className="w-6 h-6" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
              isPlaying
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            }`}
          >
            {isPlaying ? <Square className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current translate-x-1" />}
          </button>

          <button
            onClick={() => handleBpmChange(bpm + 1)}
            className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-indigo-500 transition-all active:scale-90"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Signature</label>
            <div className="flex gap-2">
              {['2/4', '3/4', '4/4', '6/8'].map((sig) => (
                <button
                  key={sig}
                  onClick={() => setTimeSignature(sig)}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border ${
                    timeSignature === sig
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-lg shadow-indigo-500/10'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {sig}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Volume2 className="w-3 h-3" /> Volume
            </label>
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

      <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2">Comment ça marche ?</h4>
        <p className="text-sm text-indigo-700 dark:text-indigo-400/80 leading-relaxed">
          Ce métronome utilise l'API Web Audio pour une précision rythmique parfaite, indépendamment de la charge du processeur. Le premier temps de chaque mesure est accentué par une fréquence plus haute.
        </p>
      </div>
    </div>
  );
}
