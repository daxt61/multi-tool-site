import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Volume2, RotateCcw, Trash2, Settings2, Info } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      // Filter to prioritize French and English
      const filteredVoices = availableVoices.filter(v => v.lang.startsWith('fr') || v.lang.startsWith('en'));
      setVoices(filteredVoices.length > 0 ? filteredVoices : availableVoices);

      // Default to first French voice if available
      const frVoice = filteredVoices.find(v => v.lang.startsWith('fr'));
      if (frVoice) setSelectedVoice(frVoice.name);
      else if (availableVoices.length > 0) setSelectedVoice(availableVoices[0].name);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.pitch = pitch;
    utterance.rate = rate;

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handlePause = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsSpeaking(false);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à lire</label>
          <button
            onClick={() => setText('')}
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
          placeholder="Entrez le texte que vous souhaitez entendre..."
          className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSpeak}
              disabled={!text}
              className={`flex-grow h-16 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
                !text ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-indigo-600 shadow-indigo-500/20 hover:bg-indigo-700'
              }`}
            >
              <Play className="w-6 h-6 fill-current" /> {isPaused ? 'Reprendre' : 'Lire le texte'}
            </button>
            <button
              onClick={handlePause}
              disabled={!isSpeaking}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200 dark:border-slate-700 ${
                !isSpeaking ? 'bg-slate-50 text-slate-300' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              aria-label="Pause"
            >
              <Pause className="w-6 h-6 fill-current" />
            </button>
            <button
              onClick={handleStop}
              disabled={!isSpeaking && !isPaused}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200 dark:border-slate-700 ${
                !isSpeaking && !isPaused ? 'bg-slate-50 text-slate-300' : 'bg-white dark:bg-slate-800 text-rose-500'
              }`}
              aria-label="Arrêter"
            >
              <Square className="w-6 h-6 fill-current" />
            </button>
          </div>

          <div className="space-y-4">
            <label htmlFor="voice-select" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Voix</label>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex items-center gap-2 px-1">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Vitesse</span>
                <span className="text-indigo-600">{rate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-white dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Hauteur</span>
                <span className="text-indigo-600">{pitch}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full h-2 bg-white dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <button
              onClick={() => { setPitch(1); setRate(1); }}
              className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3 h-3" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Volume2 className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">À propos de la synthèse vocale</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cet outil utilise l'API `Web Speech` de votre navigateur pour convertir du texte en parole.
            Les voix disponibles dépendent de votre système d'exploitation et de votre navigateur.
            Tout le traitement est effectué localement, aucune donnée n'est envoyée sur le cloud.
          </p>
        </div>
      </div>
    </div>
  );
}
