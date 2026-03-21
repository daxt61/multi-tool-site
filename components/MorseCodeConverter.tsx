import { useState, useCallback } from 'react';
import { Signal, Type, Copy, Check, Trash2 } from 'lucide-react';

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

  const handleClear = () => {
    setText('');
    setMorse('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Text Input */}
        <div className="relative group">
          <label htmlFor="morse-text-input" className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
            <Type className="w-4 h-4 text-indigo-500" /> Texte Normal
          </label>
          <textarea
            id="morse-text-input"
            value={text}
            onChange={(e) => encode(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-56 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] resize-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-lg leading-relaxed shadow-sm"
          />
        </div>

        {/* Morse Input */}
        <div className="relative group">
          <label htmlFor="morse-code-input" className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
            <Signal className="w-4 h-4 text-orange-500" /> Code Morse (. et -)
          </label>
          <textarea
            id="morse-code-input"
            value={morse}
            onChange={(e) => decode(e.target.value)}
            placeholder="Ex: .... . .-.. .-.. ---"
            className="w-full h-56 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] resize-none font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-xl tracking-widest shadow-sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleCopy}
          disabled={!morse}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-3 disabled:opacity-50 disabled:shadow-none"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copié' : 'Copier le Code Morse'}
        </button>
        <button
          onClick={handleClear}
          className="px-8 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all rounded-2xl flex items-center gap-3"
        >
          <Trash2 className="w-5 h-5" /> Effacer
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/40 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-widest text-sm">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">
             <Signal className="w-4 h-4" />
          </div>
          Référence Morse Rapide
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {Object.entries(MORSE_CODE).filter(([k]) => k !== ' ').map(([char, code]) => (
            <div key={char} className="flex flex-col items-center p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:scale-105">
              <span className="font-black text-slate-400 dark:text-slate-500 text-xs mb-1">{char}</span>
              <span className="text-slate-900 dark:text-white font-mono text-sm tracking-tighter">{code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
