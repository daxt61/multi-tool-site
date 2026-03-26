import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square, Volume2, Trash2 } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const synth = window.speechSynthesis;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const loadVoices = useCallback(() => {
    const availableVoices = synth.getVoices();
    // Prioritize French and English
    const filteredVoices = availableVoices.filter(v => v.lang.startsWith('fr') || v.lang.startsWith('en'));
    const sortedVoices = filteredVoices.sort((a, b) => {
      if (a.lang.startsWith('fr') && !b.lang.startsWith('fr')) return -1;
      if (!a.lang.startsWith('fr') && b.lang.startsWith('fr')) return 1;
      return 0;
    });
    setVoices(sortedVoices);
    if (sortedVoices.length > 0 && !selectedVoice) {
      setSelectedVoice(sortedVoices[0].name);
    }
  }, [synth, selectedVoice]);

  useEffect(() => {
    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }, [loadVoices, synth]);

  const handleSpeak = () => {
    if (synth.speaking) {
      synth.cancel();
    }

    if (text !== '') {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
      utterance.pitch = pitch;
      utterance.rate = rate;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      synth.speak(utterance);
    }
  };

  const handleStop = () => {
    synth.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="tts-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              Texte à lire
            </label>
            <button
              onClick={() => setText('')}
              disabled={!text}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Effacer le texte"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <textarea
            id="tts-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrivez quelque chose ici pour l'entendre..."
            className="w-full h-48 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label htmlFor="tts-voice" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              Voix
            </label>
            <select
              id="tts-voice"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white cursor-pointer"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between px-1">
              <label htmlFor="tts-pitch" className="text-xs font-black uppercase tracking-widest text-slate-400">
                Hauteur
              </label>
              <span className="text-xs font-bold text-indigo-500">{pitch}</span>
            </div>
            <input
              id="tts-pitch"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between px-1">
              <label htmlFor="tts-rate" className="text-xs font-black uppercase tracking-widest text-slate-400">
                Vitesse
              </label>
              <span className="text-xs font-bold text-indigo-500">{rate}</span>
            </div>
            <input
              id="tts-rate"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSpeak}
            disabled={!text || isSpeaking}
            className={`flex-1 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 font-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSpeaking
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            <Volume2 className="w-5 h-5" />
            Écouter
          </button>
          {isSpeaking && (
            <button
              onClick={handleStop}
              className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5 fill-current" />
              Arrêter
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4">À propos de cet outil</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          Cet outil utilise l'API <strong>Web Speech Synthesis</strong> intégrée à votre navigateur. Aucun texte n'est envoyé sur un serveur, tout le traitement est effectué localement sur votre appareil. Les voix disponibles dépendent de votre système d'exploitation et de votre navigateur.
        </p>
      </div>
    </div>
  );
}
