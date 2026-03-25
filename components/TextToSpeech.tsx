import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, VolumeX, Play, RotateCcw, Sliders, Info, Languages, Trash2 } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const synthesis = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synthesis.current = window.speechSynthesis;
    const loadVoices = () => {
      const allVoices = synthesis.current?.getVoices() || [];
      // Priority: French and English
      const filtered = allVoices.sort((a, b) => {
        if (a.lang.startsWith('fr') && !b.lang.startsWith('fr')) return -1;
        if (!a.lang.startsWith('fr') && b.lang.startsWith('fr')) return 1;
        if (a.lang.startsWith('en') && !b.lang.startsWith('en')) return -1;
        if (!a.lang.startsWith('en') && b.lang.startsWith('en')) return 1;
        return 0;
      });
      setVoices(filtered);
      if (filtered.length > 0 && !selectedVoice) {
        const frVoice = filtered.find(v => v.lang.startsWith('fr'));
        setSelectedVoice(frVoice ? frVoice.name : filtered[0].name);
      }
    };

    loadVoices();
    if (synthesis.current?.onvoiceschanged !== undefined) {
      synthesis.current.onvoiceschanged = loadVoices;
    }
  }, [selectedVoice]);

  const handleSpeak = useCallback(() => {
    if (!synthesis.current || !text) return;

    synthesis.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthesis.current.speak(utterance);
  }, [text, rate, pitch, volume, selectedVoice, voices]);

  const handleStop = () => {
    synthesis.current?.cancel();
    setIsSpeaking(false);
  };

  const reset = () => {
    setRate(1);
    setPitch(1);
    setVolume(1);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à lire</label>
            <button
              onClick={() => setText('')}
              disabled={!text}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tapez le texte que vous souhaitez entendre..."
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />

          <div className="flex gap-4">
            <button
              onClick={isSpeaking ? handleStop : handleSpeak}
              disabled={!text}
              className={`flex-[3] py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isSpeaking
                  ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20'
                  : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-6 h-6" /> Arrêter
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 fill-current" /> Écouter
                </>
              )}
            </button>
          </div>
        </div>

        {/* Controls Sidebar */}
        <div className="space-y-6">
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-8 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 dark:text-white uppercase tracking-wider text-sm">
              <Sliders className="w-5 h-5 text-indigo-500" /> Paramètres
            </h3>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>Vitesse</span>
                  <span className="text-indigo-500">{rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>Tonalité</span>
                  <span className="text-indigo-500">{pitch}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span>Volume</span>
                  <span className="text-indigo-500">{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={reset}
                className="w-full py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-bold text-slate-500 dark:text-slate-400 text-sm transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Réinitialiser
              </button>
            </div>
          </div>

          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-sm">
            <h3 className="font-bold flex items-center gap-2 dark:text-white uppercase tracking-wider text-sm">
              <Languages className="w-5 h-5 text-indigo-500" /> Voix
            </h3>
            <div className="space-y-2">
              <label htmlFor="voice-select" className="sr-only">Choisir une voix</label>
              <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl font-bold text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-slate-300"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl space-y-3 border border-indigo-100 dark:border-indigo-900/30">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" /> Confidentialité
            </h4>
            <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed">
              La synthèse vocale est traitée directement par votre navigateur. Votre texte n'est jamais envoyé à nos serveurs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
