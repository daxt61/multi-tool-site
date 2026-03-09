import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, Settings2, Trash2 } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);

  const synth = window.speechSynthesis;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        // Try to find a French voice by default, otherwise use the first one
        const frenchVoice = availableVoices.find(v => v.lang.startsWith('fr')) || availableVoices[0];
        setSelectedVoice(frenchVoice.name);
      }
    };

    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleSpeak = () => {
    if (synth.speaking) {
      if (isPaused) {
        synth.resume();
        setIsPaused(false);
      }
      return;
    }

    if (text) {
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

      utteranceRef.current = utterance;
      synth.speak(utterance);
    }
  };

  const handlePause = () => {
    if (synth.speaking && !isPaused) {
      synth.pause();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    synth.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à lire</label>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez le texte que vous souhaitez entendre..."
          className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-2 p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-8">
          <div className="flex items-center gap-3">
            <Settings2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres de voix</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 block">Choisir une voix</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-indigo-500 transition-colors"
              >
                {voices.map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vitesse</label>
                  <span className="text-xs font-black text-indigo-500">{rate}x</span>
                </div>
                <input
                  type="range" min="0.5" max="2" step="0.1"
                  value={rate} onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tonalité</label>
                  <span className="text-xs font-black text-indigo-500">{pitch}</span>
                </div>
                <input
                  type="range" min="0" max="2" step="0.1"
                  value={pitch} onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Playback */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white flex flex-col justify-center items-center space-y-8 shadow-xl shadow-indigo-600/20">
          <Volume2 className="w-12 h-12 opacity-50" />

          <div className="flex gap-4">
            <button
              onClick={isPaused ? handleSpeak : handlePause}
              disabled={!text}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isSpeaking && !isPaused ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'
              } disabled:opacity-50`}
            >
              {isSpeaking && !isPaused ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button
              onClick={handleStop}
              disabled={!isSpeaking && !isPaused}
              className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90 disabled:opacity-50"
            >
              <Square className="w-6 h-6 fill-current" />
            </button>
          </div>

          <div className="text-center">
            <div className="text-sm font-black uppercase tracking-widest opacity-60 mb-1">Status</div>
            <div className="font-bold">
              {isSpeaking ? (isPaused ? 'En pause' : 'Lecture en cours...') : 'Prêt'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
