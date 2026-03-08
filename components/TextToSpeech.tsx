import { useState, useEffect, useRef } from 'react';
import { Play, Square, Pause, Volume2, RotateCcw, Settings2, Languages, MessageSquare } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  const synth = window.speechSynthesis;

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        const frenchVoice = availableVoices.find(v => v.lang.startsWith('fr')) || availableVoices[0];
        setSelectedVoice(frenchVoice.name);
      }
    };

    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }, [synth, selectedVoice]);

  const handlePlay = () => {
    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    if (text) {
      synth.cancel();
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

      synth.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    synth.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    synth.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Texte à lire
          </label>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Réinitialiser
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre texte ici pour qu'il soit lu à haute voix..."
          className="w-full h-48 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-2 p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-8 shadow-sm">
          <div className="flex items-center gap-2 px-1">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres de lecture</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label className="text-xs font-bold text-slate-500">Vitesse</label>
                <span className="text-xs font-black font-mono dark:text-indigo-400">x{rate.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label className="text-xs font-bold text-slate-500">Tonalité</label>
                <span className="text-xs font-black font-mono dark:text-indigo-400">{pitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label className="text-xs font-bold text-slate-500">Volume</label>
                <span className="text-xs font-black font-mono dark:text-indigo-400">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-500 px-1 flex items-center gap-2">
                <Languages className="w-3 h-3" /> Voix
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none cursor-pointer truncate"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Playback Button */}
        <div className="flex flex-col gap-4">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              disabled={!text}
              className="flex-1 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:grayscale flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-current translate-x-1" />
              </div>
              {isPaused ? 'Reprendre' : 'Lire le texte'}
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex-1 bg-amber-500 text-white rounded-[2.5rem] font-black text-xl hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex flex-col items-center justify-center gap-4 group"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Pause className="w-8 h-8 fill-current" />
              </div>
              Pause
            </button>
          )}

          <button
            onClick={handleStop}
            disabled={!isPlaying && !isPaused}
            className="h-20 bg-slate-900 dark:bg-slate-800 text-white rounded-[1.5rem] font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <Square className="w-5 h-5 fill-current" /> Arrêter
          </button>
        </div>
      </div>

      <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 flex gap-6 items-start">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30">
          <Volume2 className="w-6 h-6 text-indigo-500" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-300">À propos de la synthèse vocale</h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-400/80 leading-relaxed">
            Cet outil utilise l'API Web Speech intégrée à votre navigateur. La qualité et la disponibilité des voix dépendent de votre système d'exploitation et de votre navigateur. Aucune donnée audio n'est envoyée à un serveur, tout est traité localement.
          </p>
        </div>
      </div>
    </div>
  );
}
