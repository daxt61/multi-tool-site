import { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Play, Pause, Square, Trash2, Settings, Download } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;

    const loadVoices = () => {
      const voices = synth.current?.getVoices() || [];
      // Filter for French and English by default
      setAvailableVoices(voices.sort((a, b) => a.lang.localeCompare(b.lang)));
      if (voices.length > 0) {
        const preferred = voices.find(v => v.lang.startsWith('fr')) || voices[0];
        setVoice(preferred);
      }
    };

    loadVoices();
    if (synth.current?.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }

    return () => {
      synth.current?.cancel();
    };
  }, []);

  const speak = () => {
    if (!synth.current || !text) return;

    if (isPaused) {
      synth.current.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    synth.current.speak(utterance);
  };

  const pause = () => {
    if (synth.current && isSpeaking) {
      synth.current.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  };

  const stop = () => {
    if (synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à lire</label>
          <button
            onClick={() => { setText(''); stop(); }}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full hover:bg-rose-100 transition-all flex items-center gap-1"
            aria-label="Effacer"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Saisissez votre texte ici pour l'écouter..."
          className="w-full h-48 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white resize-none text-lg leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex items-center justify-center gap-6 shadow-xl shadow-indigo-500/5">
          <button
            onClick={stop}
            disabled={!isSpeaking && !isPaused}
            className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 flex items-center justify-center transition-all disabled:opacity-30 active:scale-95 border border-slate-200 dark:border-slate-700"
            aria-label="Arrêter"
          >
            <Square className="w-6 h-6 fill-current" />
          </button>
          <button
            onClick={isSpeaking ? pause : speak}
            disabled={!text}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-2xl ${
              isSpeaking
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
            } disabled:opacity-50`}
            aria-label={isSpeaking ? "Pause" : "Lire"}
          >
            {isSpeaking ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </button>
          <div className="w-14 h-14 flex items-center justify-center">
            {isSpeaking && <Volume2 className="w-8 h-8 text-indigo-500 animate-pulse" />}
          </div>
        </div>

        <div className="md:col-span-4 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Settings className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="voice-select" className="text-xs font-bold text-slate-500 px-1">Voix</label>
              <select
                id="voice-select"
                value={voice?.name || ''}
                onChange={(e) => setVoice(availableVoices.find(v => v.name === e.target.value) || null)}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {availableVoices.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between px-1">
                <label htmlFor="rate-range" className="text-xs font-bold text-slate-500">Vitesse</label>
                <span className="text-xs font-mono font-bold text-indigo-500">{rate}x</span>
              </div>
              <input
                id="rate-range"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between px-1">
                <label htmlFor="pitch-range" className="text-xs font-bold text-slate-500">Tonalité</label>
                <span className="text-xs font-mono font-bold text-indigo-500">{pitch}x</span>
              </div>
              <input
                id="pitch-range"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
