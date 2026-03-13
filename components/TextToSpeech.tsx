import { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, RotateCcw, Settings2, Trash2, Headphones, MessageSquare, Globe, Info } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
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
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        // Try to find a French voice by default
        const frVoice = availableVoices.find(v => v.lang.startsWith('fr-FR')) || availableVoices[0];
        setSelectedVoice(frVoice.name);
      }
    };

    loadVoices();
    if (synth.current?.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synth.current) {
        synth.current.cancel();
      }
    };
  }, [selectedVoice]);

  const handleSpeak = () => {
    if (!synth.current || !text) return;

    if (isSpeaking) {
      synth.current.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    synth.current.speak(utterance);
  };

  const handleClear = () => {
    setText('');
    if (synth.current) synth.current.cancel();
    setIsSpeaking(false);
  };

  const handleReset = () => {
    setRate(1);
    setPitch(1);
    setVolume(1);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Text Input Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Texte à lire
            </label>
            <button
              onClick={handleClear}
              disabled={!text}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 disabled:opacity-0 flex items-center gap-1 transition-all"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>

          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Collez ou tapez votre texte ici..."
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />

          <button
            onClick={handleSpeak}
            disabled={!text}
            className={`w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${
              isSpeaking
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none'
            }`}
          >
            {isSpeaking ? (
              <>
                <Square className="w-6 h-6 fill-current" /> Arrêter la lecture
              </>
            ) : (
              <>
                <Play className="w-6 h-6 fill-current" /> Commencer la lecture
              </>
            )}
          </button>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] border border-slate-800 space-y-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-50"></div>

            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Paramètres
              </h3>
              <button
                onClick={handleReset}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Réinitialiser
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="voice-select" className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Voix
                </label>
                <select
                  id="voice-select"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-white text-xs font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {voices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Vitesse</label>
                  <span className="text-white font-mono font-bold text-xs">{rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-indigo-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hauteur</label>
                  <span className="text-white font-mono font-bold text-xs">{pitch}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-indigo-500"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Volume2 className="w-3 h-3" /> Volume
                  </label>
                  <span className="text-white font-mono font-bold text-xs">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Headphones className="w-4 h-4" /> Qualité Audio
            </h4>
            <p className="text-[11px] text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
              La qualité des voix dépend de votre navigateur et de votre système d'exploitation. Chrome et Edge offrent généralement des voix plus naturelles grâce à leurs services cloud intégrés.
            </p>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Idéal pour vérifier la prononciation, écouter vos articles tout en faisant autre chose, ou aider à la lecture pour les personnes malvoyantes.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Headphones className="w-4 h-4 text-indigo-500" /> Accessibilité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cette synthèse vocale est effectuée entièrement dans votre navigateur. Aucun fichier audio n'est transféré, garantissant une confidentialité totale de vos textes.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" /> Multi-langue
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Vous pouvez changer de langue en sélectionnant une voix différente dans les paramètres. Le système supporte toutes les langues installées sur votre machine.
          </p>
        </div>
      </div>
    </div>
  );
}
