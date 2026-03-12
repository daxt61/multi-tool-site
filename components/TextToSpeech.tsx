import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, Settings2, Trash2, Languages, MessageSquare } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const synth = window.speechSynthesis;

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        // Prefer French voice if available
        const frenchVoice = availableVoices.find(v => v.lang.startsWith('fr')) || availableVoices[0];
        setSelectedVoice(frenchVoice.name);
      }
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice, synth]);

  const handleSpeak = () => {
    if (synth.speaking) {
      synth.cancel();
    }

    if (text) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synth.speak(utterance);
    }
  };

  const handleStop = () => {
    synth.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="tts-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à lire</label>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="tts-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez le texte que vous souhaitez entendre..."
          className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex items-center gap-3 text-indigo-500 mb-2">
            <Settings2 className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Paramètres de voix</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="voice-select" className="text-sm font-bold text-slate-500 flex items-center gap-2">
                <Languages className="w-4 h-4" /> Sélectionner une voix
              </label>
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vitesse</label>
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

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tonalité</label>
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

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Volume</label>
                  <span className="text-xs font-black font-mono text-indigo-500">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <button
            onClick={isSpeaking ? handleStop : handleSpeak}
            disabled={!text}
            className={`flex-grow flex flex-col items-center justify-center gap-4 rounded-[2.5rem] transition-all border-b-4 active:border-b-0 active:translate-y-1 ${
              isSpeaking
                ? 'bg-rose-500 border-rose-700 text-white hover:bg-rose-600'
                : 'bg-indigo-600 border-indigo-800 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:grayscale'
            }`}
          >
            <div className={`p-6 rounded-full ${isSpeaking ? 'bg-white/20' : 'bg-white/10'}`}>
              {isSpeaking ? <Square className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-1" />}
            </div>
            <span className="text-xl font-black uppercase tracking-widest">
              {isSpeaking ? 'Arrêter' : 'Écouter'}
            </span>
          </button>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-500" /> Technologie Web Speech
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cet outil utilise l'API Web Speech native de votre navigateur. Les voix disponibles dépendent de votre système d'exploitation et de votre navigateur (Chrome, Firefox, Safari proposent des voix différentes).
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" /> Accessibilité & Usage
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Idéal pour vérifier la prononciation d'un texte, écouter de longs articles ou simplement tester les capacités de synthèse vocale pour vos propres projets web.
          </p>
        </div>
      </div>
    </div>
  );
}
