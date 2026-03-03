import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Volume2, Info, MessageCircle, Settings2, Trash2, Copy, Check } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [copied, setCopied] = useState(false);

  const synth = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synth.current!.getVoices();
      setVoices(availableVoices);

      // Default to first French voice if available, otherwise first overall
      const frenchVoice = availableVoices.find(v => v.lang.startsWith('fr'));
      if (frenchVoice) {
        setSelectedVoice(frenchVoice.name);
      } else if (availableVoices.length > 0) {
        setSelectedVoice(availableVoices[0].name);
      }
    };

    loadVoices();
    if (synth.current.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synth.current) {
        synth.current.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!text || !synth.current) return;

    if (isPaused) {
      synth.current.resume();
      setIsPaused(false);
      setIsPlaying(true);
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
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synth.current.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (synth.current && isPlaying) {
      synth.current.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (synth.current) {
      synth.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à lire</label>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!text}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => setText('')}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>

          <div className="relative group">
            <textarea
              id="tts-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Écrivez ou collez votre texte ici pour l'écouter..."
              className="w-full h-[400px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl leading-relaxed dark:text-slate-300 resize-none"
            />

            <div className="absolute bottom-6 right-6 flex gap-3">
              {isPlaying ? (
                <button
                  onClick={handlePause}
                  className="w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                  title="Pause"
                >
                  <Pause className="w-8 h-8 fill-current" />
                </button>
              ) : (
                <button
                  onClick={handlePlay}
                  className={`w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all ${!text && 'opacity-50 cursor-not-allowed'}`}
                  title="Play"
                >
                  <Play className="w-8 h-8 fill-current ml-1" />
                </button>
              )}
              <button
                onClick={handleStop}
                className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-700 active:scale-95 transition-all"
                title="Stop"
              >
                <Square className="w-6 h-6 fill-current" />
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-8">
            <div className="flex items-center gap-3 text-slate-900 dark:text-white">
              <Settings2 className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold">Paramètres</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Voix</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold text-sm outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                >
                  {voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Vitesse</label>
                  <span className="text-xs font-black font-mono text-indigo-500">{rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tonalité</label>
                  <span className="text-xs font-black font-mono text-indigo-500">{pitch}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Volume</label>
                  <span className="text-xs font-black font-mono text-indigo-500">{Math.round(volume * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-indigo-100" />
              </div>
              <h4 className="font-bold text-lg">Synthèse vocale locale</h4>
              <p className="text-sm text-indigo-100/80 leading-relaxed">
                Le traitement vocal est effectué directement par votre navigateur. Vos textes ne sont jamais envoyés à un serveur externe, garantissant une confidentialité totale.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Saisissez votre texte, choisissez une voix parmi celles disponibles sur votre système et ajustez les paramètres de lecture. Cliquez sur Play pour démarrer la synthèse vocale.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-500" /> Voix Disponibles
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La liste des voix dépend de votre système d'exploitation et de votre navigateur. Sur Windows, macOS et mobile, vous trouverez des voix de haute qualité intégrées.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> Accessibilité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cet outil peut aider à la relecture de textes longs, à l'apprentissage des langues ou simplement à écouter du contenu pendant que vous faites autre chose.
          </p>
        </div>
      </div>
    </div>
  );
}
