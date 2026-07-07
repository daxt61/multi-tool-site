import { useState, useEffect, useCallback, useRef } from 'react';
import { Signal, Copy, Check, Trash2, Info, AlertCircle, Play, Square, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const MORSE_CODE: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
  '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.', ' ': '/'
};

const REVERSE_MORSE: Record<string, string> = Object.entries(MORSE_CODE).reduce(
  (acc: Record<string, string>, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  Object.create(null)
);

export function MorseCodeConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(initialData?.text || '');
  const [morse, setMorse] = useState(initialData?.morse || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSignaling, setIsSignaling] = useState(false);
  const [volume, setVolume] = useState(initialData?.volume ?? 0.5);
  const [frequency, setFrequency] = useState(initialData?.frequency ?? 600);
  const stopPlaybackRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    onStateChange?.({ text, morse, volume, frequency });
  }, [text, morse, volume, frequency, onStateChange]);

  useEffect(() => {
    return () => {
      stopPlaybackRef.current = true;
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const encode = (input: string) => {
    setText(input);
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    const encoded = input.toUpperCase().split('').map(char => MORSE_CODE[char] || char).join(' ');
    setMorse(encoded);
  };

  const decode = (input: string) => {
    setMorse(input);
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    const decoded = input.trim().split(' ').map(code => REVERSE_MORSE[code] || code).join('');
    setText(decoded);
  };

  const handleCopy = useCallback(() => {
    if (!morse) return;
    navigator.clipboard.writeText(morse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [morse]);

  const handleClear = useCallback(() => {
    setText('');
    setMorse('');
    setError(null);
    if (stopPlaybackRef.current === false && isPlaying) {
      stopPlaybackRef.current = true;
    }
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [isPlaying]);

  const playMorse = async () => {
    if (!morse) return;

    if (isPlaying) {
      stopPlaybackRef.current = true;
      return;
    }

    stopPlaybackRef.current = false;
    setIsPlaying(true);
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const dot = 0.1; // dot duration

    const playTone = (duration: number) => {
      return new Promise<void>((resolve) => {
        setIsSignaling(true);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = frequency;

        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * 0.2, now + 0.01);
        gain.gain.linearRampToValueAtTime(0, now + duration - 0.01);

        osc.start(now);
        osc.stop(now + duration);
        osc.onended = () => {
          setIsSignaling(false);
          resolve();
        };
      });
    };

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (const char of morse) {
      if (stopPlaybackRef.current) break;
      if (char === '.') {
        await playTone(dot);
        await sleep(dot * 1000);
      } else if (char === '-') {
        await playTone(dot * 3);
        await sleep(dot * 1000);
      } else if (char === ' ') {
        await sleep(dot * 2000);
      } else if (char === '/') {
        await sleep(dot * 4000);
      }
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      } else if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        playMorse();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClear, handleCopy, morse, isPlaying]);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Normal Text Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="normal-text" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              {t('morse.normal_text')}
            </label>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!text && !morse}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                title={`${t('common.clear')} (Esc)`}
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="normal-text"
            ref={textareaRef}
            value={text}
            onChange={(e) => encode(e.target.value)}
            placeholder={t('stringescaper.placeholder_input')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Morse Input */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6 mb-4">
            <div className="flex items-center gap-2 px-1">
              <Signal className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.audio_settings', 'Audio Settings')}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('common.volume', 'Volume')} ({Math.round(volume * 100)}%)</label>
                <input
                  type="range" min="0" max="1" step="0.01" value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('common.frequency', 'Frequency')} ({frequency}Hz)</label>
                <input
                  type="range" min="200" max="2000" step="10" value={frequency}
                  onChange={(e) => setFrequency(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <label htmlFor="morse-text" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              {t('morse.code_label')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={playMorse}
                disabled={!morse}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:outline-none ${
                  isPlaying
                    ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 border-rose-200 hover:bg-rose-100 focus-visible:ring-rose-500 shadow-lg shadow-rose-500/10'
                    : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-transparent hover:bg-indigo-100 focus-visible:ring-indigo-500'
                } disabled:opacity-50`}
                title={(isPlaying ? t('common.stop') : t('common.play')) + ' (P)'}
              >
                {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                {isPlaying ? t('common.stop') : t('common.play')}
                <Kbd modifier={null} className={`hidden sm:inline-flex ml-1 ${
                  isPlaying ? 'border-rose-200/50 text-rose-200' : 'border-indigo-200/50 text-indigo-200'
                }`}>P</Kbd>
              </button>
              <button
                onClick={handleCopy}
                disabled={!morse}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={`${t('common.copy')} (C)`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1 border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            id="morse-text"
            value={morse}
            onChange={(e) => decode(e.target.value)}
            placeholder={t('morse.placeholder_morse')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {/* Visual Signaling */}
      <div className="flex justify-center">
        <div className={`p-12 rounded-full transition-all duration-75 border-4 ${
          isSignaling
            ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_50px_rgba(99,102,241,0.5)] scale-110'
            : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-50 scale-100'
        }`}>
          <Circle className={`w-12 h-12 transition-all ${isSignaling ? 'text-white fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
        </div>
      </div>

      {/* Morse Reference Card */}
      <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2 px-1">
          <Signal className="w-4 h-4 text-indigo-500" /> {t('morse.reference_title')}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Object.entries(MORSE_CODE).filter(([k]) => k !== ' ').map(([char, code]) => (
            <div key={char} className="flex flex-col items-center p-4 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-indigo-500/30 transition-all">
              <span className="text-xs font-black text-slate-400 group-hover:text-indigo-500 transition-colors mb-1">{char}</span>
              <span className="text-lg font-black font-mono tracking-tighter dark:text-white">{code}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('common.options')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('morse.guide_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Signal className="w-4 h-4 text-indigo-500" /> {t('morse.about_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('morse.about_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
