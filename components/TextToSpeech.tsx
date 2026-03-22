import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Square, Volume2, Trash2, Settings2, Globe } from "lucide-react";

export function TextToSpeech() {
  const [text, setText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    const loadVoices = () => {
      const availableVoices = synthRef.current?.getVoices() || [];
      // Prioritize fr and en voices
      const filteredVoices = availableVoices.filter(v =>
        v.lang.startsWith('fr') || v.lang.startsWith('en')
      ).sort((a, b) => {
        if (a.lang.startsWith('fr') && !b.lang.startsWith('fr')) return -1;
        if (!a.lang.startsWith('fr') && b.lang.startsWith('fr')) return 1;
        return 0;
      });
      setVoices(filteredVoices);
      if (filteredVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(filteredVoices[0].name);
      }
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [selectedVoice]);

  const speak = () => {
    if (!synthRef.current || !text) return;

    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    synthRef.current.speak(utterance);
  };

  const clear = () => {
    setText("");
    if (synthRef.current) synthRef.current.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-1 overflow-hidden">
        <div className="p-6 pb-0 flex justify-between items-center">
          <label htmlFor="tts-text" className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2">
            Votre texte
          </label>
          {text && (
            <button
              onClick={clear}
              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
              aria-label="Effacer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez le texte que vous souhaitez faire lire à haute voix..."
          className="w-full h-64 p-8 bg-transparent text-xl leading-relaxed outline-none resize-none placeholder:text-slate-300 dark:placeholder:text-slate-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Settings Card */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Settings2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Paramètres</span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label htmlFor="rate" className="text-xs font-bold text-slate-500 uppercase">Vitesse</label>
                  <span className="text-xs font-mono font-bold text-indigo-600">{rate}x</span>
                </div>
                <input
                  id="rate"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label htmlFor="pitch" className="text-xs font-bold text-slate-500 uppercase">Tonalité</label>
                  <span className="text-xs font-mono font-bold text-indigo-600">{pitch}</span>
                </div>
                <input
                  id="pitch"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Voice Selection Card */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Globe className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Voix</span>
            </div>

            <div>
              <label htmlFor="voice-select" className="sr-only">Choisir une voix</label>
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[10px] text-slate-400 font-medium italic">
              Les voix disponibles dépendent de votre navigateur et de votre système d'exploitation.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={speak}
          disabled={!text}
          className={`h-full min-h-[140px] flex flex-col items-center justify-center gap-4 rounded-3xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${
            isSpeaking
              ? "bg-rose-500 text-white shadow-xl shadow-rose-500/20"
              : "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 hover:bg-indigo-700"
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            {isSpeaking ? <Square className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
          </div>
          <span className="font-bold tracking-wide uppercase text-sm">
            {isSpeaking ? "Arrêter la lecture" : "Lancer la lecture"}
          </span>
        </button>
      </div>
    </div>
  );
}
