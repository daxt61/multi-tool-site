import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, Square, Volume2, Settings, Type, Trash2, Globe } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('Bonjour ! Bienvenue sur la Boîte à Outils. Entrez votre texte ici pour l\'entendre.');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);

  const synth = useRef<SpeechSynthesis | null>(null);

  const loadVoices = useCallback(() => {
    if (!synth.current) return;
    const availableVoices = synth.current.getVoices();
    setVoices(availableVoices);
    // Set default voice (prefer French)
    const frenchVoice = availableVoices.find(v => v.lang.startsWith('fr-')) || availableVoices[0];
    if (frenchVoice) setVoice(frenchVoice);
  }, []);

  useEffect(() => {
    synth.current = window.speechSynthesis;
    loadVoices();
    if (synth.current.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }
  }, [loadVoices]);

  const handleSpeak = () => {
    if (!synth.current) return;

    if (paused) {
      synth.current.resume();
      setPaused(false);
      setPlaying(true);
      return;
    }

    if (synth.current.speaking) {
      synth.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setPlaying(true);
      setPaused(false);
    };
    utterance.onend = () => {
      setPlaying(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };

    synth.current.speak(utterance);
  };

  const handlePause = () => {
    if (!synth.current) return;
    if (synth.current.speaking && !paused) {
      synth.current.pause();
      setPaused(true);
      setPlaying(false);
    }
  };

  const handleStop = () => {
    if (!synth.current) return;
    synth.current.cancel();
    setPlaying(false);
    setPaused(false);
  };

  const handleClear = () => {
    setText('');
    handleStop();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Type className="w-4 h-4" /> Texte à synthétiser
              </label>
              <button
                onClick={handleClear}
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
              placeholder="Entrez votre texte ici..."
              className="w-full h-[400px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          <div className="flex gap-4">
            {!playing || paused ? (
              <button
                onClick={handleSpeak}
                disabled={!text.trim()}
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play className="w-6 h-6 fill-current" /> {paused ? 'Reprendre' : 'Écouter'}
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-[2] py-4 bg-amber-500 text-white rounded-2xl font-black text-lg hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Pause className="w-6 h-6 fill-current" /> Pause
              </button>
            )}
            <button
              onClick={handleStop}
              className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Square className="w-6 h-6 fill-current" /> Stop
            </button>
          </div>
        </div>

        {/* Settings Area */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 shadow-sm">
            <div className="flex items-center gap-2 px-1">
              <Settings className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres de Voix</h3>
            </div>

            <div className="space-y-2">
              <label htmlFor="voice-select" className="text-xs font-bold text-slate-400 px-1 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3" /> Voix
              </label>
              <select
                id="voice-select"
                value={voice?.name || ''}
                onChange={(e) => setVoice(voices.find(v => v.name === e.target.value) || null)}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-indigo-500 transition-colors dark:text-white"
              >
                {voices.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vitesse (Rate)</label>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tonalité (Pitch)</label>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{pitch}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Volume</label>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{Math.round(volume * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 space-y-6 relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
            <Volume2 className="w-12 h-12 opacity-50 mb-4" />
            <h3 className="text-2xl font-black mb-2">Synthèse Vocale</h3>
            <p className="text-indigo-100 font-medium leading-relaxed">
              Ce système utilise l'API <strong>Web Speech</strong> intégrée à votre navigateur. La disponibilité des voix et leur qualité dépendent de votre système d'exploitation et de votre navigateur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
