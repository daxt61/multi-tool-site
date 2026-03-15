import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Volume2, Trash2 } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthesisRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synthesisRef.current?.getVoices() || [];
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !voice) {
        const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
        setVoice(defaultVoice);
      }
    };

    loadVoices();
    if (synthesisRef.current?.onvoiceschanged !== undefined) {
      synthesisRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      synthesisRef.current?.cancel();
    };
  }, []);

  const speak = useCallback(() => {
    if (!synthesisRef.current || !text) return;

    synthesisRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesisRef.current.speak(utterance);
  }, [text, voice, rate, pitch, volume]);

  const stop = () => {
    synthesisRef.current?.cancel();
    setIsSpeaking(false);
  };

  const handleClear = () => {
    setText('');
    stop();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="relative group">
            <div className="flex justify-between items-center mb-2 px-1">
              <label htmlFor="tts-input" className="text-sm font-bold text-slate-600 dark:text-slate-400">
                Texte à lire
              </label>
              {text && (
                <button
                  onClick={handleClear}
                  className="text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                  aria-label="Effacer le texte"
                >
                  <Trash2 className="w-3 h-3" />
                  Effacer
                </button>
              )}
            </div>
            <textarea
              id="tts-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Entrez le texte que vous souhaitez faire lire à haute voix..."
              className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl resize-none h-64 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex gap-4">
            {!isSpeaking ? (
              <button
                onClick={speak}
                disabled={!text}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Play className="w-6 h-6 fill-current" />
                Lire le texte
              </button>
            ) : (
              <button
                onClick={stop}
                className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-rose-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Square className="w-6 h-6 fill-current" />
                Arrêter
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="space-y-4">
            <label htmlFor="voice-select" className="text-xs font-black uppercase tracking-widest text-slate-400 block px-1">
              Voix
            </label>
            <select
              id="voice-select"
              value={voice?.name || ''}
              onChange={(e) => setVoice(voices.find(v => v.name === e.target.value) || null)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-6">
            {[
              { label: 'Vitesse', value: rate, set: setRate, min: 0.5, max: 2, step: 0.1 },
              { label: 'Tonalité', value: pitch, set: setPitch, min: 0.5, max: 2, step: 0.1 },
              { label: 'Volume', value: volume, set: setVolume, min: 0, max: 1, step: 0.1 },
            ].map((control) => (
              <div key={control.label} className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor={`control-${control.label}`} className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {control.label}
                  </label>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{control.value}</span>
                </div>
                <input
                  id={`control-${control.label}`}
                  type="range"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={control.value}
                  onChange={(e) => control.set(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center gap-4 text-slate-400 dark:text-slate-500 italic text-sm border-t border-slate-200 dark:border-slate-800">
            <Volume2 className="w-5 h-5 flex-shrink-0" />
            <p>Utilise l'API Web Speech de votre navigateur pour une synthèse vocale instantanée et privée.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
