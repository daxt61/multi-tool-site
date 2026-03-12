import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, Settings2, Trash2, Languages, Type } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const synth = window.speechSynthesis;

  useEffect(() => {
    const updateVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        // Prefer French voice if available, otherwise first one
        const frVoice = availableVoices.find(v => v.lang.startsWith('fr'));
        setSelectedVoice(frVoice ? frVoice.name : availableVoices[0].name);
      }
    };

    updateVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = updateVoices;
    }
  }, [selectedVoice]);

  const handleSpeak = () => {
    if (synth.speaking) {
      if (synth.paused) {
        synth.resume();
        setIsSpeaking(true);
      } else {
        synth.pause();
        setIsSpeaking(false);
      }
      return;
    }

    if (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      setIsSpeaking(true);
      synth.speak(utterance);
    }
  };

  const handleStop = () => {
    synth.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à convertir</label>
          <button
            onClick={() => { setText(''); handleStop(); }}
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
          placeholder="Saisissez le texte que vous souhaitez entendre..."
          className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main Controls */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <button
            onClick={handleSpeak}
            disabled={!text}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 ${
              isSpeaking
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {isSpeaking ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            {isSpeaking ? 'Pause / Reprendre' : 'Lire le texte'}
          </button>
          <button
            onClick={handleStop}
            disabled={!isSpeaking && !synth.speaking}
            className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
            aria-label="Arrêter la lecture"
          >
            <Square className="w-6 h-6 fill-current" />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-4 rounded-2xl transition-all ${
              showSettings
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
            aria-label="Paramètres de voix"
          >
            <Settings2 className="w-6 h-6" />
          </button>
        </div>

        {/* Voice Selection (Quick access) */}
        <div className="md:col-span-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col justify-center gap-2">
          <label htmlFor="voice-select" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
            <Languages className="w-3 h-3" /> Voix
          </label>
          <select
            id="voice-select"
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full bg-transparent border-none font-bold text-sm focus:ring-0 outline-none cursor-pointer dark:text-white"
          >
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name} className="dark:bg-slate-900">
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Settings */}
      {showSettings && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
          {[
            { id: 'rate', label: 'Vitesse', value: rate, setter: setRate, min: 0.5, max: 2, step: 0.1, icon: <Type className="w-4 h-4" /> },
            { id: 'pitch', label: 'Hauteur', value: pitch, setter: setPitch, min: 0, max: 2, step: 0.1, icon: <Settings2 className="w-4 h-4" /> },
            { id: 'volume', label: 'Volume', value: volume, setter: setVolume, min: 0, max: 1, step: 0.1, icon: <Volume2 className="w-4 h-4" /> },
          ].map((param) => (
            <div key={param.id} className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <label htmlFor={param.id} className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  {param.icon} {param.label}
                </label>
                <span className="text-sm font-mono font-bold text-indigo-500">{param.value}</span>
              </div>
              <input
                id={param.id}
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={param.value}
                onChange={(e) => param.setter(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
