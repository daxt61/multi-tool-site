import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Square, Volume2, Settings2, Languages, Trash2, Copy, Check, Info } from 'lucide-react';

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [volume, setVolume] = useState(1);
  const [copied, setCopied] = useState(false);

  const synth = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synth.current?.getVoices() || [];
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoice) {
        const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
        setSelectedVoice(defaultVoice.name);
      }
    };

    loadVoices();
    if (synth.current?.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synth.current) {
        synth.current.cancel();
      }
    };
  }, [selectedVoice]);

  const speak = useCallback(() => {
    if (!synth.current || !text) return;

    if (isSpeaking) {
      synth.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synth.current.speak(utterance);
  }, [text, selectedVoice, rate, pitch, volume, voices, isSpeaking]);

  const stop = () => {
    if (synth.current) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="tts-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à synthétiser</label>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
            </button>
            <button
              onClick={() => setText('')}
              className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        </div>
        <textarea
          id="tts-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre texte ici pour l'écouter..."
          className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
            <div className="flex items-center gap-3 text-indigo-500 mb-2">
              <Languages className="w-5 h-5" />
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Voix et Langue</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="voice-select" className="text-xs font-bold text-slate-500 ml-1">Sélectionner une voix</label>
                <select
                  id="voice-select"
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                >
                  {voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end pb-1">
                <button
                  onClick={isSpeaking ? stop : speak}
                  disabled={!text}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 ${
                    isSpeaking
                      ? 'bg-rose-500 text-white shadow-rose-500/20'
                      : 'bg-indigo-600 text-white shadow-indigo-500/20 hover:scale-[1.02] active:scale-98'
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <Square className="w-5 h-5 fill-current" /> Arrêter
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" /> Lire le texte
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-2xl font-black mb-1 dark:text-white">{text.length}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Caractères</div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-2xl font-black mb-1 dark:text-white">{text.trim() ? text.trim().split(/\s+/).length : 0}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mots</div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div className="text-2xl font-black mb-1 dark:text-white">~{Math.ceil((text.trim() ? text.trim().split(/\s+/).length : 0) / 130)}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Min. Parole</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-8">
          <div className="flex items-center gap-3 text-indigo-500">
            <Settings2 className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Paramètres</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between px-1">
                <label className="text-xs font-bold text-slate-500">Vitesse</label>
                <span className="text-xs font-black font-mono text-indigo-500">{rate}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between px-1">
                <label className="text-xs font-bold text-slate-500">Tonalité</label>
                <span className="text-xs font-black font-mono text-indigo-500">{pitch}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between px-1">
                <label className="text-xs font-bold text-slate-500">Volume</label>
                <span className="text-xs font-black font-mono text-indigo-500">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-2 items-start text-xs text-slate-500 leading-relaxed">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p>Les voix disponibles dépendent de votre navigateur et de votre système d'exploitation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
