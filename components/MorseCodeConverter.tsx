import React, { useState } from 'react';
import { Signal, Volume2, Copy, Check, Trash2, Type } from 'lucide-react';

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
    if (!morse) return;
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Text Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Normal</label>
            </div>
            <button
              onClick={handleClear}
              disabled={!text && !morse}
              className="text-xs font-bold text-rose-500 flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full hover:bg-rose-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => encode(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Morse Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4 text-indigo-500" />
              <label htmlFor="morse-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Signal Morse</label>
            </div>
            <button
              onClick={handleCopy}
              disabled={!morse}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            id="morse-input"
            value={morse}
            onChange={(e) => decode(e.target.value)}
            placeholder="Ex: .... . .-.. .-.. ---"
            className="w-full h-64 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xl tracking-widest leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
          <Signal className="w-4 h-4 text-orange-500" /> Référence Morse
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(MORSE_CODE).filter(([k]) => k !== ' ').map(([char, code]) => (
            <div key={char} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-indigo-500/30 transition-all">
              <span className="font-black text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 transition-colors">{char}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white tracking-tighter">{code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
