import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Volume2, Mic, Info, Trash2, Download, Settings2, Sliders } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synth.current?.getVoices() || [];
      // Prioritize French voices
      const sortedVoices = availableVoices.sort((a, b) => {
        if (a.lang.startsWith('fr') && !b.lang.startsWith('fr')) return -1;
        if (!a.lang.startsWith('fr') && b.lang.startsWith('fr')) return 1;
        return 0;
      });
      setVoices(sortedVoices);
      if (sortedVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(sortedVoices[0].name);
      }
    };

    loadVoices();
    if (synth.current?.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synth.current) synth.current.cancel();
    };
  }, []);

  const handleSpeak = useCallback(() => {
    if (!synth.current || !text) return;

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

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    setIsSpeaking(true);
    synth.current.speak(utterance);
  }, [text, selectedVoice, rate, pitch, volume, voices, isPaused]);

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
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à lire</label>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            aria-label="Effacer le texte"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez le texte que vous souhaitez faire lire à haute voix..."
          className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Contrôles de lecture */}
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex items-center gap-3 text-indigo-500 mb-2">
            <Play className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Lecture</h3>
          </div>

          <div className="flex flex-wrap gap-4">
            {!isSpeaking || isPaused ? (
              <button
                onClick={handleSpeak}
                disabled={!text}
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-5 h-5 fill-current" /> {isPaused ? 'Reprendre' : 'Lire'}
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all active:scale-95"
              >
                <Pause className="w-5 h-5 fill-current" /> Pause
              </button>
            )}
            <button
              onClick={handleStop}
              disabled={!isSpeaking && !isPaused}
              className="flex items-center justify-center gap-2 py-4 px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-30"
            >
              <Square className="w-5 h-5 fill-current" /> Arrêter
            </button>
          </div>

          <div className="space-y-4">
            <label htmlFor="voice-select" className="block text-xs font-black uppercase tracking-widest text-slate-400">Voix</label>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-sm outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Paramètres audio */}
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex items-center gap-3 text-indigo-500 mb-2">
            <Settings2 className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Paramètres</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                <label htmlFor="rate-range">Vitesse</label>
                <span className="text-indigo-500 font-mono">{rate}x</span>
              </div>
              <input
                id="rate-range"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                <label htmlFor="pitch-range">Tonalité</label>
                <span className="text-indigo-500 font-mono">{pitch}</span>
              </div>
              <input
                id="pitch-range"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                <label htmlFor="volume-range">Volume</label>
                <span className="text-indigo-500 font-mono">{Math.round(volume * 100)}%</span>
              </div>
              <input
                id="volume-range"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-500" /> Web Speech API
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilise le moteur de synthèse vocale intégré à votre système via l'API standard du navigateur pour une performance optimale et sans serveur.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-500" /> Personnalisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ajustez finement la vitesse (rate) et la tonalité (pitch) pour adapter la lecture à vos besoins, qu'il s'agisse de correction de texte ou d'accessibilité.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Confidentialité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Tout le traitement vocal est effectué en local par votre système d'exploitation. Aucun texte n'est transmis à des tiers.
          </p>
        </div>
      </div>
    </div>
  );
}
