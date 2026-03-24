import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Play, Square, Settings2, RotateCcw, Trash2, Info } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');

  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synth.current!.getVoices();
      setVoices(availableVoices);

      // Default to a French voice if available
      const frVoice = availableVoices.find(v => v.lang.startsWith('fr'));
      const enVoice = availableVoices.find(v => v.lang.startsWith('en'));
      if (frVoice) setSelectedVoice(frVoice.name);
      else if (enVoice) setSelectedVoice(enVoice.name);
      else if (availableVoices.length > 0) setSelectedVoice(availableVoices[0].name);
    };

    loadVoices();
    if (synth.current.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synth.current) synth.current.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if (!synth.current || !text) return;

    if (synth.current.speaking) {
      synth.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;

    utterance.pitch = pitch;
    utterance.rate = rate;
    utterance.volume = volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.current.speak(utterance);
  };

  const handleStop = () => {
    if (synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
  };

  const resetSettings = () => {
    setPitch(1);
    setRate(1);
    setVolume(1);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à convertir</label>
            <button
              onClick={() => setText('')}
              disabled={!text}
              className="text-xs font-bold text-rose-500 flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full hover:bg-rose-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrivez ou collez votre texte ici pour l'écouter..."
            className="w-full h-[400px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
          <button
            onClick={isSpeaking ? handleStop : handleSpeak}
            disabled={!text}
            className={`w-full py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 ${
              isSpeaking
                ? 'bg-rose-500 text-white shadow-rose-500/20'
                : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {isSpeaking ? (
              <>
                <Square className="w-6 h-6 fill-current" /> Arrêter la lecture
              </>
            ) : (
              <>
                <Volume2 className="w-6 h-6" /> Écouter le texte
              </>
            )}
          </button>
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Paramètres</h3>
              </div>
              <button
                onClick={resetSettings}
                className="text-xs font-bold text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Réinitialiser
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Voix</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white text-sm"
                >
                  {voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vitesse (Rate)</label>
                  <span className="text-xs font-mono font-bold text-indigo-500">{rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tonalité (Pitch)</label>
                  <span className="text-xs font-mono font-bold text-indigo-500">{pitch}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Volume</label>
                  <span className="text-xs font-mono font-bold text-indigo-500">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 space-y-4">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 opacity-50" />
              <h3 className="text-xl font-black">À savoir</h3>
            </div>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
              Cet outil utilise l'API de synthèse vocale intégrée à votre navigateur. Les voix disponibles peuvent varier selon votre système d'exploitation et votre navigateur. Tout le traitement est effectué localement sur votre appareil pour une confidentialité totale.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
