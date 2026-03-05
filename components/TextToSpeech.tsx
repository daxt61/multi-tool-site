import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, Settings2, Trash2, Download } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const synth = window.speechSynthesis;

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        const frenchVoice = availableVoices.find(v => v.lang.startsWith('fr')) || availableVoices[0];
        setSelectedVoice(frenchVoice.name);
      }
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice, synth]);

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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à synthétiser</label>
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
              placeholder="Écrivez ou collez votre texte ici..."
              className="w-full h-[300px] p-6 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed resize-none"
            />

            <div className="flex flex-wrap gap-3 pt-4">
              <button
                onClick={handleSpeak}
                disabled={!text}
                className={`flex-1 px-8 py-4 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 ${
                  isSpeaking && !isPaused ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
                }`}
              >
                {isSpeaking && !isPaused ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                {isSpeaking && !isPaused ? 'Lecture...' : isPaused ? 'Reprendre' : 'Lire le texte'}
              </button>

              {isSpeaking && (
                <>
                  <button
                    onClick={handlePause}
                    className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    title="Pause"
                  >
                    <Pause className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleStop}
                    className="px-6 py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
                    title="Arrêter"
                  >
                    <Square className="w-6 h-6 fill-current" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres de voix</h3>
            </div>

            <div className="space-y-4">
              <label htmlFor="voice-select" className="text-sm font-bold text-slate-700 dark:text-slate-300">Voix</label>
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Vitesse ({rate}x)</label>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tonalité ({pitch})</label>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Volume ({Math.round(volume * 100)}%)</label>
                <Volume2 className="w-4 h-4 text-slate-400" />
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-6 text-white flex items-center gap-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold">Web Speech API</h5>
              <p className="text-indigo-100 text-sm">Utilise les voix natives de votre système pour une synthèse fluide et privée.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
