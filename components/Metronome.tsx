import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Volume2 } from 'lucide-react';
import { Slider } from './ui/slider';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [volume, setVolume] = useState(0.5);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIDRef = useRef<number | null>(null);
  const beatRef = useRef(0);
  const bpmRef = useRef(bpm);
  const volumeRef = useRef(volume);
  const beatsPerMeasureRef = useRef(beatsPerMeasure);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    beatsPerMeasureRef.current = beatsPerMeasure;
  }, [beatsPerMeasure]);

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    if (!audioContextRef.current) return;

    const osc = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();

    osc.frequency.value = beatNumber === 0 ? 1000 : 800;
    envelope.gain.setValueAtTime(volumeRef.current, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContextRef.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    if (!audioContextRef.current) return;

    while (nextNoteTimeRef.current < audioContextRef.current.currentTime + 0.1) {
      scheduleNote(beatRef.current, nextNoteTimeRef.current);

      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;

      setCurrentBeat(beatRef.current);
      beatRef.current = (beatRef.current + 1) % beatsPerMeasureRef.current;
    }
    timerIDRef.current = window.setTimeout(scheduler, 25);
  }, [scheduleNote]);

  const toggleMetronome = () => {
    if (isPlaying) {
      if (timerIDRef.current) clearTimeout(timerIDRef.current);
      setIsPlaying(false);
      setCurrentBeat(0);
      beatRef.current = 0;
    } else {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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

  return (
    <div className="max-w-2xl mx-auto space-y-12">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 text-center space-y-10">
        <div className="space-y-4">
          <div className="text-8xl font-black tracking-tighter text-indigo-600 tabular-nums">
            {bpm}
          </div>
          <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">BPM - Battements par minute</div>
        </div>

        <div className="flex justify-center gap-4">
          {[...Array(beatsPerMeasure)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-100 ${
                isPlaying && currentBeat === i
                  ? 'bg-indigo-500 scale-150 shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setBpm(Math.max(40, bpm - 1))}
              className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
              aria-label="Diminuer le BPM"
            >
              <Minus className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <Slider
                value={[bpm]}
                onValueChange={(vals) => setBpm(vals[0])}
                min={40}
                max={240}
                step={1}
              />
            </div>
            <button
              onClick={() => setBpm(Math.min(240, bpm + 1))}
              className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
              aria-label="Augmenter le BPM"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <button
            onClick={toggleMetronome}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 mx-auto ${
              isPlaying
                ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30'
                : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-700'
            }`}
          >
            {isPlaying ? <Square className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Mesure</label>
            <div className="flex items-center justify-center gap-4">
              <button onClick={() => setBeatsPerMeasure(Math.max(1, beatsPerMeasure - 1))} className="text-slate-400 hover:text-indigo-500 transition-colors"><Minus className="w-4 h-4" /></button>
              <span className="text-xl font-bold w-8">{beatsPerMeasure}/4</span>
              <button onClick={() => setBeatsPerMeasure(Math.min(16, beatsPerMeasure + 1))} className="text-slate-400 hover:text-indigo-500 transition-colors"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 block flex items-center justify-center gap-2">
              <Volume2 className="w-3 h-3" /> Volume
            </label>
            <Slider
              value={[volume]}
              onValueChange={(vals) => setVolume(vals[0])}
              min={0}
              max={1}
              step={0.1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
