import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Volume2, Settings2, FileText, Trash2, Copy, Check } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function TextToSpeech() {
  const [text, setText] = useState('Bonjour ! Bienvenue dans notre outil de synthèse vocale. Collez votre texte ici pour l\'écouter.');
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [copied, setCopied] = useState(false);

  const synth = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = synth.current?.getVoices() || [];
      // Filter voices to show fr and en by default, but keep others
      const sortedVoices = [...availableVoices].sort((a, b) => {
        const aIsFr = a.lang.startsWith('fr');
        const bIsFr = b.lang.startsWith('fr');
        if (aIsFr && !bIsFr) return -1;
        if (!aIsFr && bIsFr) return 1;
        return 0;
      });
      setVoices(sortedVoices);
      if (sortedVoices.length > 0 && !selectedVoice) {
        setSelectedVoice(sortedVoices.find(v => v.lang.startsWith('fr')) || sortedVoices[0]);
      }
    };

    loadVoices();
    if (synth.current?.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synth.current) synth.current.cancel();
    };
  }, []);

  const handleSpeak = () => {
    if (!synth.current) return;

    if (isPlaying) {
      synth.current.pause();
      setIsPlaying(false);
      return;
    }

    if (synth.current.paused) {
      synth.current.resume();
      setIsPlaying(true);
      return;
    }

    synth.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    synth.current.speak(utterance);
    setIsPlaying(true);
  };

  const handleStop = () => {
    if (synth.current) {
      synth.current.cancel();
      setIsPlaying(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-2" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <label htmlFor="tts-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte à transformer</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!text}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => setText('')}
                disabled={!text}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
            placeholder="Écrivez ou collez votre texte ici..."
          />
        </div>

        {/* Controls */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Réglages Voix</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Choisir une voix</label>
                <select
                  value={selectedVoice?.name || ''}
                  onChange={(e) => setSelectedVoice(voices.find(v => v.name === e.target.value) || null)}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm outline-none focus:border-indigo-500"
                >
                  {voices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vitesse</label>
                  <span className="text-xs font-black font-mono text-indigo-500">{rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tonalité</label>
                  <span className="text-xs font-black font-mono text-indigo-500">{pitch}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSpeak}
              disabled={!text}
              className={`flex-1 h-20 rounded-3xl flex items-center justify-center gap-3 font-black text-lg transition-all active:scale-95 shadow-xl disabled:opacity-50 ${
                isPlaying
                  ? 'bg-amber-500 text-white shadow-amber-500/20'
                  : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-700'
              }`}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
              {isPlaying ? 'Pause' : 'Écouter'}
            </button>
            <button
              onClick={handleStop}
              disabled={!isPlaying && (!synth.current || !synth.current.paused)}
              className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-3xl flex items-center justify-center text-rose-500 hover:bg-rose-100 transition-all active:scale-95 disabled:opacity-50"
              title="Arrêter"
              aria-label="Arrêter la lecture"
            >
              <Square className="w-6 h-6 fill-current" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 mt-12">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Volume2 className="w-8 h-8" />
        </div>
        <div className="space-y-4 text-center md:text-left">
          <h4 className="font-black text-xl dark:text-white uppercase tracking-tight">Audio Local & Privé</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Toute la synthèse vocale est effectuée directement par votre navigateur. Votre texte n'est jamais envoyé à un serveur, ce qui garantit une confidentialité totale pour vos documents.
          </p>
        </div>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
