import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Plus, Minus, Music, Clock } from 'lucide-react';

export function Metronome() {
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioContext = useRef<AudioContext | null>(null);
  const nextNoteTime = useRef(0);
  const timerID = useRef<number | null>(null);
  const beatRef = useRef(0); // Use beatRef to maintain rhythmic stability across renders

  const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
  const lookahead = 25.0; // How frequently to call scheduling function (in milliseconds)
  const scheduleAheadTime = 0.1; // How far ahead to schedule audio (in seconds)

  const nextNote = () => {
    const secondsPerBeat = 60.0 / bpm;
    nextNoteTime.current += secondsPerBeat;

    beatRef.current++;
    if (beatRef.current >= beatsPerMeasure) {
      beatRef.current = 0;
    }
  };

  const scheduleNote = (beatNumber: number, time: number) => {
    if (!audioContext.current) return;

    const osc = audioContext.current.createOscillator();
    const envelope = audioContext.current.createGain();

    // Higher pitch for the first beat of each measure
    osc.frequency.value = beatNumber === 0 ? 1000 : 800;

    envelope.gain.value = 1;
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    osc.connect(envelope);
    envelope.connect(audioContext.current.destination);

    osc.start(time);
    osc.stop(time + 0.1);

    // Update the visual state
    // We use setTimeout to sync the visual beat with the audio
    const delay = (time - audioContext.current.currentTime) * 1000;
    setTimeout(() => {
      setCurrentBeat(beatNumber);
    }, Math.max(0, delay));
  };

  const scheduler = useCallback(() => {
    if (!audioContext.current) return;

    while (nextNoteTime.current < audioContext.current.currentTime + scheduleAheadTime) {
      scheduleNote(beatRef.current, nextNoteTime.current);
      nextNote();
    }
    timerID.current = window.setTimeout(scheduler, lookahead);
  }, [bpm, beatsPerMeasure]);

  const toggleMetronome = () => {
    if (!playing) {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      setPlaying(true);
      beatRef.current = 0;
      setCurrentBeat(0);
      nextNoteTime.current = audioContext.current.currentTime;
      scheduler();
    } else {
      setPlaying(false);
      if (timerID.current) {
        clearTimeout(timerID.current);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (timerID.current) {
        clearTimeout(timerID.current);
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  // Update scheduler if BPM or Time Signature changes while playing
  useEffect(() => {
    if (playing) {
      if (timerID.current) {
        clearTimeout(timerID.current);
      }
      scheduler();
    }
  }, [bpm, timeSignature, playing, scheduler]);

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.min(240, Math.max(40, prev + delta)));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Main Control Area */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Tempo
            </h3>
            <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{bpm} BPM</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => adjustBpm(-1)}
              className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-90"
              aria-label="Diminuer le BPM de 1"
            >
              <Minus className="w-6 h-6" />
            </button>
            <input
              type="range"
              min="40"
              max="240"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="flex-1 h-3 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              aria-label="Ajuster le tempo"
            />
            <button
              onClick={() => adjustBpm(1)}
              className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-90"
              aria-label="Augmenter le BPM de 1"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="time-signature" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest">Signature</label>
              <select
                id="time-signature"
                value={timeSignature}
                onChange={(e) => setTimeSignature(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-indigo-500 transition-colors dark:text-white"
              >
                <option value="2/4">2/4</option>
                <option value="3/4">3/4</option>
                <option value="4/4">4/4</option>
                <option value="6/8">6/8</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={toggleMetronome}
                className={`w-full h-[52px] rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                  playing
                    ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600'
                    : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
                }`}
              >
                {playing ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                {playing ? 'Stop' : 'Start'}
              </button>
            </div>
          </div>
        </div>

        {/* Visual Feedback Area */}
        <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-8 shadow-2xl shadow-indigo-500/10 min-h-[350px] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-50"></div>

          <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase tracking-widest text-xs">
            <Music className="w-4 h-4" /> Visualisation
          </div>

          <div className="flex gap-4 items-center justify-center h-24">
            {Array.from({ length: beatsPerMeasure }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 md:w-12 md:h-12 rounded-full transition-all duration-75 ${
                  currentBeat === i && playing
                    ? i === 0
                      ? 'bg-indigo-400 scale-125 shadow-[0_0_20px_rgba(129,140,248,0.5)]'
                      : 'bg-white scale-110'
                    : 'bg-slate-800 scale-100'
                }`}
              />
            ))}
          </div>

          <div className="text-white/40 font-bold text-sm tracking-widest uppercase">
            Mesure: {timeSignature}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2.5rem] space-y-4">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
           À propos du Métronome
        </h4>
        <p className="text-sm text-indigo-800 dark:text-indigo-400 font-medium leading-relaxed">
          Ce métronome utilise l'API <strong>Web Audio</strong> pour garantir une précision rythmique absolue, indépendamment de la charge du processeur ou des cycles de rendu de React. Le premier temps de chaque mesure est accentué visuellement et auditivement pour vous aider à garder le rythme.
        </p>
      </div>
    </div>
  );
}
