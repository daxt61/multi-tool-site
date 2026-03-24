import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square, Volume2, VolumeX, Trash2, Info, Languages, Sparkles } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synth.current = window.speechSynthesis;

      const loadVoices = () => {
        const availableVoices = synth.current?.getVoices() || [];
        // Prioritize French and English voices
        const filteredVoices = availableVoices.filter(v => v.lang.startsWith('fr') || v.lang.startsWith('en'));
        setVoices(filteredVoices);
        if (filteredVoices.length > 0 && !selectedVoice) {
          const frVoice = filteredVoices.find(v => v.lang.startsWith('fr'));
          setSelectedVoice(frVoice?.name || filteredVoices[0].name);
        }
      };

      loadVoices();
      if (synth.current?.onvoiceschanged !== undefined) {
        synth.current.onvoiceschanged = loadVoices;
      }
    }
  }, [selectedVoice]);

  const stop = useCallback(() => {
    if (synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(() => {
    if (!synth.current || !text) return;

    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = isMuted ? 0 : 1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    synth.current.speak(utterance);
  }, [text, selectedVoice, rate, pitch, isMuted, voices, stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="tts-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à convertir</label>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
            aria-label="Effacer le texte"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="tts-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre texte ici pour l'écouter..."
          className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Languages className="w-4 h-4" /> Voix
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
            aria-label="Sélectionner la voix"
          >
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex justify-between">
            <span>Vitesse</span>
            <span>{rate}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
            aria-label="Réglage de la vitesse"
          />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex justify-between">
            <span>Tonalité</span>
            <span>{pitch}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full accent-indigo-500"
            aria-label="Réglage de la tonalité"
          />
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={isSpeaking ? stop : speak}
          disabled={!text}
          className={`px-8 py-4 rounded-full font-bold transition-all flex items-center gap-3 text-lg ${
            isSpeaking
              ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20'
              : 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none'
          }`}
          aria-label={isSpeaking ? "Arrêter la lecture" : "Démarrer la lecture"}
        >
          {isSpeaking ? (
            <>
              <Square className="w-6 h-6 fill-current" />
              Arrêter
            </>
          ) : (
            <>
              <Play className="w-6 h-6 fill-current" />
              Écouter
            </>
          )}
        </button>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full border-2 transition-all ${
            isMuted
              ? 'border-rose-500 text-rose-500 bg-rose-50 dark:bg-rose-500/10'
              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
          }`}
          aria-label={isMuted ? "Réactiver le son" : "Couper le son"}
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-8">
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <h4 className="font-bold flex items-center gap-2 mb-2 dark:text-white">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Synthèse Native
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilise les voix intégrées à votre système d'exploitation pour une expérience fluide et privée. Aucun texte n'est envoyé à des serveurs externes.
          </p>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <h4 className="font-bold flex items-center gap-2 mb-2 dark:text-white">
            <Info className="w-4 h-4 text-indigo-500" /> Accessibilité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Un outil idéal pour vérifier la lecture de vos contenus ou pour aider les personnes ayant des difficultés de lecture.
          </p>
        </div>
      </div>
    </div>
  );
}
