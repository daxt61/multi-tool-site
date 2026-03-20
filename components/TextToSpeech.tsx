import React, { useState, useEffect } from 'react';
import { Volume2, Play, Square, Settings, RefreshCcw, Trash2 } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices.filter(voice => voice.lang.includes('fr') || voice.lang.includes('en')));

      // Default to first French voice if available
      const frVoice = availableVoices.find(v => v.lang.startsWith('fr'));
      if (frVoice) setSelectedVoice(frVoice.name);
    };

    window.speechSynthesis.onvoiceschanged = updateVoices;
    updateVoices();

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.pitch = pitch;
    utterance.rate = rate;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const clearText = () => {
    setText('');
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="tts-text" className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Texte à lire
            </label>
            {text && (
              <button
                onClick={clearText}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg transition-all"
                aria-label="Effacer le texte"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Effacer
              </button>
            )}
          </div>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Entrez votre texte ici pour l'écouter..."
            className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-lg leading-relaxed resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label htmlFor="voice-select" className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Voix
                </label>
              </div>
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
              >
                {voices.map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSpeak}
              disabled={!text}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${
                isSpeaking
                  ? 'bg-rose-500 text-white shadow-rose-500/25'
                  : 'bg-indigo-600 text-white shadow-indigo-500/25 hover:bg-indigo-700'
              }`}
            >
              {isSpeaking ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  Arrêter la lecture
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Lire le texte
                </>
              )}
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="pitch" className="font-bold text-slate-600 dark:text-slate-400 uppercase">Tonalité: {pitch.toFixed(1)}</label>
                <button onClick={() => setPitch(1)} className="text-indigo-600 hover:text-indigo-700 transition-colors" aria-label="Réinitialiser la tonalité">
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
              <input
                id="pitch"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="rate" className="font-bold text-slate-600 dark:text-slate-400 uppercase">Vitesse: {rate.toFixed(1)}</label>
                <button onClick={() => setRate(1)} className="text-indigo-600 hover:text-indigo-700 transition-colors" aria-label="Réinitialiser la vitesse">
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
              <input
                id="rate"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
