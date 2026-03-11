import { useState, useEffect, useCallback } from 'react';
import { Play, Square, Volume2, Trash2, Settings2, Languages } from 'lucide-react';
import { Slider } from './ui/slider';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);

  const updateVoices = useCallback(() => {
    const availableVoices = window.speechSynthesis.getVoices();
    setVoices(availableVoices);
    if (availableVoices.length > 0 && !selectedVoice) {
      const frenchVoice = availableVoices.find(v => v.lang.startsWith('fr-')) || availableVoices[0];
      setSelectedVoice(frenchVoice.name);
    }
  }, [selectedVoice]);

  useEffect(() => {
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [updateVoices]);

  const speak = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à lire</label>
            <button
              onClick={() => setText('')}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              aria-label="Effacer le texte"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Entrez le texte que vous souhaitez faire lire à haute voix..."
            className="w-full h-[400px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none shadow-inner"
          />
          <div className="flex gap-4">
            {!isPlaying ? (
              <button
                onClick={speak}
                disabled={!text}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-6 h-6 fill-current" />
                Lire le texte
              </button>
            ) : (
              <button
                onClick={stop}
                className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Square className="w-6 h-6 fill-current" />
                Arrêter
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Languages className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold">Voix & Langue</h3>
            </div>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
            >
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold">Paramètres audio</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vitesse</label>
                <span className="text-xs font-mono font-bold text-indigo-600">{rate}x</span>
              </div>
              <Slider value={[rate]} onValueChange={(v) => setRate(v[0])} min={0.5} max={2} step={0.1} />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tonalité</label>
                <span className="text-xs font-mono font-bold text-indigo-600">{pitch}</span>
              </div>
              <Slider value={[pitch]} onValueChange={(v) => setPitch(v[0])} min={0} max={2} step={0.1} />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Volume
                </label>
                <span className="text-xs font-mono font-bold text-indigo-600">{Math.round(volume * 100)}%</span>
              </div>
              <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} min={0} max={1} step={0.1} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
