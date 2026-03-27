import { useState, useEffect, useCallback } from 'react';
import { Play, Square, Volume2, Trash2, Info, MessageSquare, Languages } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);

  const loadVoices = useCallback(() => {
    const availableVoices = window.speechSynthesis.getVoices();
    // Filter for French and English by default
    const filteredVoices = availableVoices.filter(v => v.lang.startsWith('fr') || v.lang.startsWith('en'));
    setVoices(filteredVoices.length > 0 ? filteredVoices : availableVoices);
    if (filteredVoices.length > 0 && !selectedVoice) {
      const frVoice = filteredVoices.find(v => v.lang.startsWith('fr'));
      setSelectedVoice((frVoice || filteredVoices[0]).voiceURI);
    }
  }, [selectedVoice]);

  useEffect(() => {
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [loadVoices]);

  const speak = () => {
    if (!text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.voiceURI === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleClear = () => {
    setText('');
    stop();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à lire</label>
            <button
              onClick={handleClear}
              disabled={!text}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-full transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrivez ou collez le texte que vous souhaitez faire lire à haute voix..."
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Configuration */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="space-y-4">
            <label htmlFor="voice-select" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Voix</label>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer"
            >
              {voices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span>Vitesse</span>
                <span className="text-indigo-500">{rate}x</span>
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

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span>Tonalité</span>
                <span className="text-indigo-500">{pitch}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            {!isSpeaking ? (
              <button
                onClick={speak}
                disabled={!text}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play className="w-6 h-6 fill-current" /> Lire le texte
              </button>
            ) : (
              <button
                onClick={stop}
                className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Square className="w-6 h-6 fill-current" /> Arrêter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Tapez ou collez votre texte dans l'éditeur, choisissez une voix parmi celles disponibles sur votre système, et ajustez la vitesse ou la tonalité selon vos besoins.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Languages className="w-4 h-4 text-indigo-500" /> Voix Système
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les voix proposées dépendent de votre navigateur et de votre système d'exploitation. Nous privilégions l'affichage des voix françaises et anglaises par défaut.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" /> Accessibilité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cet outil peut aider à la relecture de documents, à l'apprentissage des langues ou à rendre le contenu textuel plus accessible aux personnes malvoyantes.
          </p>
        </div>
      </div>
    </div>
  );
}
