import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Volume2, Settings2, Trash2, Info } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, [synth, selectedVoice]);

  const speak = () => {
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

      synth.speak(utterance);
    }
  };

  const stop = () => {
    synth.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-600">Texte à lire</label>
          <button
            onClick={() => setText('')}
            className={`text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 ${!text ? 'opacity-0' : 'opacity-100'}`}
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrivez quelque chose ici pour l'entendre..."
          className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <label htmlFor="voice-select" className="text-xs font-black uppercase tracking-widest text-slate-600">Voix</label>
            </div>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer dark:text-white"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-600">Vitesse</label>
                <span className="text-sm font-bold text-indigo-500">{rate}x</span>
              </div>
              <input
                type="range" min="0.5" max="2" step="0.1" value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-600">Tonalité</label>
                <span className="text-sm font-bold text-indigo-500">{pitch}</span>
              </div>
              <input
                type="range" min="0" max="2" step="0.1" value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-600">Volume</label>
                <span className="text-sm font-bold text-indigo-500">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.1" value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={speak}
            disabled={!text || isSpeaking}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-xl flex flex-col items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-600/20"
          >
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <Play className="w-8 h-8 fill-current" />
            </div>
            Lire le texte
          </button>
          <button
            onClick={stop}
            disabled={!isSpeaking}
            className="py-6 bg-slate-900 dark:bg-slate-800 text-white rounded-[2rem] font-bold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
          >
            <RotateCcw className="w-5 h-5" /> Arrêter
          </button>
        </div>
      </div>

      <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-bold dark:text-white">À propos de la synthèse vocale</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Cet outil utilise l'API Web Speech de votre navigateur. Les voix disponibles dépendent de votre système d'exploitation et de votre navigateur. Tout le traitement est effectué localement, aucune donnée audio n'est envoyée à un serveur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
