import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, Volume2, Languages, Info, Trash2 } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  const updateVoices = useCallback(() => {
    const availableVoices = window.speechSynthesis.getVoices();
    // Prioritize French and English
    const filteredVoices = availableVoices.filter(v => v.lang.startsWith('fr') || v.lang.startsWith('en'));
    setVoices(filteredVoices.length > 0 ? filteredVoices : availableVoices);

    if (filteredVoices.length > 0 && !selectedVoice) {
      const frVoice = filteredVoices.find(v => v.lang.startsWith('fr'));
      setSelectedVoice(frVoice?.name || filteredVoices[0].name);
    }
  }, [selectedVoice]);

  useEffect(() => {
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
  }, [updateVoices]);

  const speak = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.pitch = pitch;
    utterance.rate = rate;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const clearText = () => {
    setText('');
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à convertir</label>
          {text && (
            <button
              onClick={clearText}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg"
              aria-label="Effacer le texte"
            >
              <Trash2 className="w-3.5 h-3.5" /> Effacer
            </button>
          )}
        </div>
        <textarea
          id="tts-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez le texte que vous souhaitez entendre..."
          className="w-full h-48 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white text-lg leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1 text-slate-400">
              <Languages className="w-4 h-4" />
              <label htmlFor="voice-select" className="text-xs font-black uppercase tracking-widest">Voix et Langue</label>
            </div>
            <select
              id="voice-select"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white appearance-none cursor-pointer"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-2">
              <div className="space-y-4">
                <div className="flex justify-between px-1">
                  <label htmlFor="pitch" className="text-xs font-bold text-slate-500 uppercase">Tonalité</label>
                  <span className="text-xs font-black text-indigo-500">{pitch.toFixed(1)}</span>
                </div>
                <input
                  id="pitch"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between px-1">
                  <label htmlFor="rate" className="text-xs font-bold text-slate-500 uppercase">Vitesse</label>
                  <span className="text-xs font-black text-indigo-500">{rate.toFixed(1)}</span>
                </div>
                <input
                  id="rate"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <button
            onClick={speak}
            disabled={!text}
            className={`flex-grow rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all active:scale-95 shadow-xl disabled:opacity-50 disabled:active:scale-100 ${
              isPlaying
              ? 'bg-rose-500 text-white shadow-rose-500/20'
              : 'bg-indigo-600 text-white shadow-indigo-600/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-12 h-12 fill-current" />
                <span className="font-black uppercase tracking-widest text-sm">Arrêter</span>
              </>
            ) : (
              <>
                <Play className="w-12 h-12 fill-current ml-1" />
                <span className="font-black uppercase tracking-widest text-sm">Écouter</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">Accessibilité et Usages</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La synthèse vocale (TTS) permet de transformer n'importe quel texte en parole. C'est un outil précieux pour l'accessibilité, l'apprentissage des langues ou simplement pour écouter un contenu pendant que vous faites autre chose.
          </p>
        </div>
      </div>
    </div>
  );
}
