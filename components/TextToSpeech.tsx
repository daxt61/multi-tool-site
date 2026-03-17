import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, Volume2, Trash2, Settings2, Info } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
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
        // Prefer French voice if available
        const frenchVoice = availableVoices.find(v => v.lang.startsWith('fr'));
        setSelectedVoice(frenchVoice ? frenchVoice.name : availableVoices[0].name);
      }
    };

    loadVoices();
    if (synth.current?.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synth.current) synth.current.cancel();
    };
  }, [selectedVoice]);

  const handleSpeak = () => {
    if (!synth.current || !text) return;

    if (synth.current.speaking) {
      synth.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.current.speak(utterance);
  };

  const handleStop = () => {
    if (synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleClear = () => {
    setText('');
    handleStop();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">
            Texte à lire
          </label>
          <button
            onClick={handleClear}
            className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
            aria-label="Effacer le texte"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre texte ici..."
          className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres de Voix</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="voice-select" className="block text-sm font-bold text-slate-600 dark:text-slate-400">
                  Sélectionner la voix
                </label>
                <select
                  id="voice-select"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                >
                  {voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <span>Vitesse</span>
                    <span className="text-indigo-500">{rate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    aria-label="Vitesse de lecture"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <span>Hauteur</span>
                    <span className="text-indigo-500">{pitch}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    aria-label="Hauteur de la voix"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <span>Volume</span>
                    <span className="text-indigo-500">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    aria-label="Volume de lecture"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleSpeak}
            disabled={!text || isSpeaking}
            className="flex-1 flex flex-col items-center justify-center gap-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-[2rem] p-8 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 group"
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 fill-current" />
            </div>
            <div className="text-center">
              <span className="block text-xl font-black">Lire le texte</span>
              <span className="text-sm font-bold opacity-60">Speech Synthesis</span>
            </div>
          </button>

          {isSpeaking && (
            <button
              onClick={handleStop}
              className="flex items-center justify-center gap-2 py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl font-bold hover:bg-rose-100 transition-all border border-rose-100 dark:border-rose-900/30"
            >
              <Square className="w-4 h-4 fill-current" /> Arrêter la lecture
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> À propos de cette technologie
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cet outil utilise l'API Web Speech de votre navigateur. La qualité et le nombre de voix disponibles dépendent de votre système d'exploitation et de votre navigateur.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-500" /> Confidentialité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La synthèse vocale est effectuée localement sur votre appareil. Aucun texte n'est envoyé à nos serveurs pour le traitement audio.
          </p>
        </div>
      </div>
    </div>
  );
}
