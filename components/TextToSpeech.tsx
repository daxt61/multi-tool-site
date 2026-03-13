import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square, Volume2, RotateCcw, Trash2, Languages, Activity, FastForward } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);

  const synth = window.speechSynthesis;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const loadVoices = useCallback(() => {
    const availableVoices = synth.getVoices();
    setVoices(availableVoices);
    if (availableVoices.length > 0 && !selectedVoice) {
      // Prioritize French voices if available, otherwise first one
      const frVoice = availableVoices.find(v => v.lang.startsWith('fr'));
      setSelectedVoice(frVoice ? frVoice.name : availableVoices[0].name);
    }
  }, [synth, selectedVoice]);

  useEffect(() => {
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      synth.cancel();
    };
  }, [loadVoices, synth]);

  const handleSpeak = () => {
    if (synth.speaking) {
      synth.cancel();
    }

    if (text !== '') {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      synth.speak(utterance);
    }
  };

  const handleStop = () => {
    synth.cancel();
    setIsSpeaking(false);
  };

  const handleClear = () => {
    setText('');
    handleStop();
  };

  const handleResetSettings = () => {
    setRate(1);
    setPitch(1);
    setVolume(1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="tts-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à lire</label>
          <button
            onClick={handleClear}
            disabled={!text}
            className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="tts-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez le texte que vous souhaitez faire lire par l'ordinateur..."
          className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Languages className="w-4 h-4" /> Voix
                </h3>
              </div>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> Volume
                </h3>
                <span className="text-sm font-bold text-indigo-600">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <FastForward className="w-4 h-4" /> Vitesse
                </h3>
                <span className="text-sm font-bold text-indigo-600">{rate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Tonalité
                </h3>
                <span className="text-sm font-bold text-indigo-600">{pitch}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <button
            onClick={isSpeaking ? handleStop : handleSpeak}
            disabled={!text && !isSpeaking}
            className={`flex-grow flex flex-col items-center justify-center gap-4 rounded-[2.5rem] p-8 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSpeaking
                ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {isSpeaking ? (
              <>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <Square className="w-8 h-8 fill-current" />
                </div>
                <span className="font-black uppercase tracking-widest">Arrêter</span>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
                <span className="font-black uppercase tracking-widest">Écouter</span>
              </>
            )}
          </button>

          <button
            onClick={handleResetSettings}
            className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Réinitialiser les paramètres
          </button>
        </div>
      </div>
    </div>
  );
}
