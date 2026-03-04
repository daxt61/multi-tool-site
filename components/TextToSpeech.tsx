import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, Settings2, Trash2, Copy, Check, MessageSquare } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;

    const updateVoices = () => {
      const availableVoices = synth.current?.getVoices() || [];
      setVoices(availableVoices);

      // Try to find a French voice by default, otherwise use the first one
      if (availableVoices.length > 0 && !selectedVoice) {
        const frVoice = availableVoices.find(v => v.lang.startsWith('fr'));
        setSelectedVoice(frVoice ? frVoice.name : availableVoices[0].name);
      }
    };

    updateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (synth.current) {
        synth.current.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (!synth.current || !text) return;

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

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    synth.current.speak(utterance);
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à convertir</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!text}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => { setText(''); handleStop(); }}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Entrez le texte que vous souhaitez faire lire..."
            className="w-full h-[400px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            {!isPlaying || isPaused ? (
              <button
                onClick={handlePlay}
                disabled={!text}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-6 h-6 fill-current" /> {isPaused ? 'Reprendre' : 'Lire le texte'}
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="px-10 py-4 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 flex items-center gap-2"
              >
                <Pause className="w-6 h-6 fill-current" /> Pause
              </button>
            )}
            <button
              onClick={handleStop}
              disabled={!isPlaying && !isPaused}
              className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="w-6 h-6 fill-current" /> Arrêter
            </button>
          </div>
        </div>

        {/* Settings Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres de Voix</h4>
            </div>

            <div className="space-y-4">
              <label htmlFor="voice-select" className="text-xs font-bold text-slate-400 px-1">Voix</label>
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="vitesse" className="text-xs font-bold text-slate-400">Vitesse</label>
                <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">{rate}x</span>
              </div>
              <input
                id="vitesse"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="tonalite" className="text-xs font-bold text-slate-400">Tonalité</label>
                <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">{pitch}</span>
              </div>
              <input
                id="tonalite"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="volume" className="text-xs font-bold text-slate-400">Volume</label>
                <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-4">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input
                  id="volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden flex flex-col justify-center">
             <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
             <Volume2 className="w-12 h-12 mb-6 opacity-50" />
             <h3 className="text-2xl font-black mb-4">Lecture Vocale</h3>
             <p className="text-indigo-100 font-medium leading-relaxed text-sm">
               Utilisez cette interface pour convertir n'importe quel texte en parole. Les voix disponibles dépendent de votre navigateur et de votre système d'exploitation.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
