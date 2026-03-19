import React, { useState, useEffect, useMemo } from 'react';
import { Volume2, Play, Square, Settings2, Languages, Trash2, Info } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      // Default to first French voice if available
      const frenchVoice = availableVoices.find(v => v.lang.startsWith('fr-'));
      if (frenchVoice) setVoice(frenchVoice);
      else if (availableVoices.length > 0) setVoice(availableVoices[0]);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if (!text) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à synthétiser</label>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold text-rose-500 flex items-center gap-1 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-1 rounded-full transition-all"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre texte ici pour l'écouter..."
          className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                  <Languages className="w-4 h-4" /> Voix & Langue
                </label>
                <select
                  value={voice?.name || ''}
                  onChange={(e) => setVoice(voices.find(v => v.name === e.target.value) || null)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                >
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSpeak}
                  disabled={!text || isPlaying}
                  className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" /> Écouter
                </button>
                <button
                  onClick={handleStop}
                  disabled={!isPlaying}
                  className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-all"
                >
                  <Square className="w-6 h-6 fill-current" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Vitesse
                  </label>
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

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-500 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Tonalité
                  </label>
                  <span className="text-xs font-black font-mono text-indigo-500">{pitch}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 space-y-8">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2rem] space-y-4">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <Info className="w-4 h-4" /> Confidentialité
            </h4>
            <p className="text-sm text-indigo-700/70 dark:text-indigo-300/60 leading-relaxed">
              La synthèse vocale s'effectue entièrement sur votre appareil. Aucun texte n'est envoyé à nos serveurs.
            </p>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Statut</h4>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                {isPlaying ? 'Lecture en cours...' : 'Prêt à lire'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
