import { useState } from 'react';
import { Signal, Copy, Check, Trash2, Type } from 'lucide-react';

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
  {}
);

export function MorseCodeConverter() {
  const [text, setText] = useState('');
  const [morse, setMorse] = useState('');
  const [copied, setCopied] = useState(false);

  const encode = (input: string) => {
    const encoded = input.toUpperCase().split('').map(char => MORSE_CODE[char] || char).join(' ');
    setMorse(encoded);
    setText(input);
  };

  const decode = (input: string) => {
    const decoded = input.trim().split(' ').map(code => REVERSE_MORSE[code] || code).join('');
    setText(decoded);
    setMorse(input);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(morse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => {
    setText('');
    setMorse('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Text Input */}
        <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex justify-between items-center px-2">
            <label htmlFor="normal-text" className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
              <Type className="w-4 h-4" /> Texte Normal
            </label>
          </div>
          <textarea
            id="normal-text"
            value={text}
            onChange={(e) => encode(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Morse Input */}
        <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex justify-between items-center px-2">
            <label htmlFor="morse-text" className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider">
              <Signal className="w-4 h-4" /> Signal Morse
            </label>
          </div>
          <textarea
            id="morse-text"
            value={morse}
            onChange={(e) => decode(e.target.value)}
            placeholder="Ex: .... . .-.. .-.. ---"
            className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl resize-none font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleCopy}
          disabled={!morse}
          className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? "Copié !" : "Copier le Code Morse"}
        </button>
        <button
          onClick={clear}
          disabled={!text && !morse}
          className="px-8 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          <Trash2 className="w-5 h-5" />
          Effacer
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wider text-sm">
          <Signal className="w-5 h-5 text-indigo-500" />
          Référence Morse
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 text-xs font-mono">
          {Object.entries(MORSE_CODE).filter(([k]) => k !== ' ').map(([char, code]) => (
            <div key={char} className="flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm group hover:border-indigo-500 transition-colors">
              <span className="font-black text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors text-base mb-1">{char}</span>
              <span className="text-slate-900 dark:text-white font-bold">{code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
