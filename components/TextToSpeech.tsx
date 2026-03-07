import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, Settings2, Trash2, Copy, Check } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const synth = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synth.current?.getVoices() || [];
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        const defaultVoice = availableVoices.find(v => v.lang.startsWith('fr')) || availableVoices[0];
        setSelectedVoice(defaultVoice.name);
      }
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
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
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="tts-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à lire</label>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => { setText(''); handleStop(); }}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
                aria-label="Effacer le texte"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            id="tts-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrivez ou collez le texte que vous souhaitez entendre..."
            className="w-full h-[400px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />

          <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <button
              onClick={handlePlay}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              <Play className="w-5 h-5 fill-current" /> {isPaused ? 'Reprendre' : 'Lire'}
            </button>
            <button
              onClick={handlePause}
              disabled={!isPlaying}
              className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
              aria-label="Pause"
            >
              <Pause className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={handleStop}
              disabled={!isPlaying && !isPaused}
              className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl font-bold hover:bg-rose-100 transition-all disabled:opacity-50"
              aria-label="Stop"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="space-y-6">
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Paramètres</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold flex justify-between">
                  Vitesse <span className="text-indigo-500">{rate}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold flex justify-between">
                  Tonalité <span className="text-indigo-500">{pitch}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold flex justify-between">
                  Volume <span className="text-indigo-500">{Math.round(volume * 100)}%</span>
                </label>
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <label className="text-sm font-bold">Voix</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
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

          <AdPlaceholder size="medium" />
        </div>
      </div>
    </div>
  );
}
