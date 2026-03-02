import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, RotateCcw, Settings2 } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);

  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synth.current?.getVoices() || [];
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        // Try to find a French voice by default
        const frenchVoice = availableVoices.find(v => v.lang.startsWith('fr'));
        setSelectedVoice(frenchVoice ? frenchVoice.name : availableVoices[0].name);
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

  const handleSpeak = () => {
    if (!text || !synth.current) return;

    if (isPaused) {
      synth.current.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

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

  const handlePause = () => {
    if (synth.current && isSpeaking) {
      synth.current.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  };

  const handleStop = () => {
    if (synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Input Area */}
      <div className="space-y-4">
        <label htmlFor="tts-text" className="block text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          Texte à lire
        </label>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez le texte que vous souhaitez entendre..."
          className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none dark:text-white text-lg leading-relaxed"
        />
      </div>

      {/* Main Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={handleSpeak}
          disabled={!text}
          className={`px-8 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center gap-2 shadow-lg ${
            !text
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
          }`}
        >
          {isPaused ? <Play className="w-5 h-5 fill-current" /> : <Volume2 className="w-5 h-5" />}
          {isPaused ? 'Reprendre' : 'Lire le texte'}
        </button>

        {isSpeaking && (
          <button
            onClick={handlePause}
            className="px-8 py-4 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <Pause className="w-5 h-5 fill-current" /> Pause
          </button>
        )}

        {(isSpeaking || isPaused) && (
          <button
            onClick={handleStop}
            className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <Square className="w-5 h-5 fill-current" /> Arrêter
          </button>
        )}

        <button
          onClick={() => setText('')}
          className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-500 hover:border-slate-300 transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" /> Effacer
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voice Selection */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <Settings2 className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Voix & Langue</span>
          </div>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-indigo-500 transition-all"
          >
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        {/* Audio Parameters */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-slate-500">Vitesse</label>
              <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">{rate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-slate-500">Tonalité</label>
              <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">{pitch}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
