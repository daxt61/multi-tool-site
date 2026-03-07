import { useState } from 'react';
import { Signal, Copy, Check, Trash2, Type, ArrowRightLeft } from 'lucide-react';

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
  const [copied, setCopied] = useState<'text' | 'morse' | null>(null);

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

  const handleCopy = (val: string, type: 'text' | 'morse') => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const clear = () => {
    setText('');
    setMorse('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Text Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label htmlFor="normal-text" className="text-xs font-black uppercase tracking-widest text-slate-400">
                Texte Normal
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(text, 'text')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'text' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                }`}
                aria-label="Copier le texte"
              >
                {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'text' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={clear}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
                aria-label="Effacer tout"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            id="normal-text"
            value={text}
            onChange={(e) => encode(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Morse Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4 text-indigo-500" />
              <label htmlFor="morse-code" className="text-xs font-black uppercase tracking-widest text-slate-400">
                Code Morse (. et -)
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(morse, 'morse')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'morse' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                }`}
                aria-label="Copier le code morse"
              >
                {copied === 'morse' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'morse' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="morse-code"
            value={morse}
            onChange={(e) => decode(e.target.value)}
            placeholder="Ex: .... . .-.. .-.. ---"
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      {/* Reference Card */}
      <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
          <Signal className="w-4 h-4 text-indigo-500" />
          Référence Morse Rapide
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {Object.entries(MORSE_CODE).filter(([k]) => k !== ' ').map(([char, code]) => (
            <div key={char} className="flex flex-col items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:border-indigo-500/30">
              <span className="text-xs font-bold text-slate-400 mb-1">{char}</span>
              <span className="font-mono font-black text-slate-900 dark:text-white">{code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
