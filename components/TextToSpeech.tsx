import { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Square, RotateCcw, Trash2 } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;
    const loadVoices = () => {
      const availableVoices = synth.current?.getVoices() || [];
      setVoices(availableVoices);
      const frenchVoice = availableVoices.find(v => v.lang.startsWith('fr')) || availableVoices[0];
      if (frenchVoice) setSelectedVoice(frenchVoice.name);
    };

    loadVoices();
    if (synth.current) {
      synth.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synth.current) synth.current.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if (!synth.current || !text) return;
    if (isSpeaking) {
      synth.current.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onstart = () => setIsSpeaking(true);

    synth.current.speak(utterance);
  };

  const handleReset = () => {
    setPitch(1);
    setRate(1);
    setVolume(1);
  };

  const handleClear = () => {
    setText('');
    if (synth.current) synth.current.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="relative">
        <label htmlFor="tts-text" className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
          Texte à lire
        </label>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre texte ici pour l'écouter..."
          className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] resize-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-lg leading-relaxed"
        />
        {text && (
          <button
            onClick={handleClear}
            className="absolute top-10 right-4 p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
            aria-label="Effacer le texte"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label htmlFor="pitch" className="text-sm font-bold text-slate-700 dark:text-slate-300">Hauteur (Pitch): {pitch.toFixed(1)}</label>
            </div>
            <input
              id="pitch"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label htmlFor="rate" className="text-sm font-bold text-slate-700 dark:text-slate-300">Vitesse (Rate): {rate.toFixed(1)}</label>
            </div>
            <input
              id="rate"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label htmlFor="volume" className="text-sm font-bold text-slate-700 dark:text-slate-300">Volume: {(volume * 100).toFixed(0)}%</label>
            </div>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="voice-select" className="text-sm font-bold text-slate-700 dark:text-slate-300">Voix</label>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSpeak}
              disabled={!text}
              className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all shadow-xl ${
                isSpeaking
                  ? 'bg-rose-500 text-white shadow-rose-500/20 hover:bg-rose-600'
                  : 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none'
              }`}
            >
              {isSpeaking ? (
                <>
                  <Square className="w-5 h-5 fill-current" /> Arrêter
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> Écouter
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-4 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              aria-label="Réinitialiser les paramètres"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
