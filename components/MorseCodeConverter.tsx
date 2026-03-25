import { useState, useCallback } from 'react';
import { Signal, Copy, Check, Trash2, Type, FileText } from 'lucide-react';

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
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {} as Record<string, string>
);

export function MorseCodeConverter() {
  const [text, setText] = useState('');
  const [morse, setMorse] = useState('');
  const [copied, setCopied] = useState(false);

  const encode = useCallback((input: string) => {
    const encoded = input.toUpperCase().split('').map(char => MORSE_CODE[char] || char).join(' ');
    setMorse(encoded);
    setText(input);
  }, []);

  const decode = useCallback((input: string) => {
    const decoded = input.trim().split(' ').map(code => REVERSE_MORSE[code] || code).join('');
    setText(decoded);
    setMorse(input);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(morse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
    setMorse('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Text Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="morse-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Type className="w-3 h-3" /> Texte Normal
            </label>
            <button
              onClick={handleClear}
              disabled={!text && !morse}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            id="morse-text"
            value={text}
            onChange={(e) => encode(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 shadow-sm resize-none"
          />
        </div>

        {/* Morse Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="morse-code" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Signal className="w-3 h-3" /> Signal Morse (. et -)
            </label>
            <button
              onClick={handleCopy}
              disabled={!morse}
              className={`text-xs font-bold px-4 py-1 rounded-full transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier Morse'}
            </button>
          </div>
          <textarea
            id="morse-code"
            value={morse}
            onChange={(e) => decode(e.target.value)}
            placeholder="Ex: .... . .-.. .-.. ---"
            className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-2xl font-mono leading-relaxed dark:text-slate-300 shadow-sm resize-none"
          />
        </div>
      </div>

      <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Dictionnaire Morse
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Object.entries(MORSE_CODE).filter(([k]) => k !== ' ').map(([char, code]) => (
            <div key={char} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center gap-1 shadow-sm transition-all hover:border-indigo-500/30">
              <span className="text-xs font-black text-slate-400">{char}</span>
              <span className="font-mono text-indigo-500 font-bold tracking-widest">{code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
