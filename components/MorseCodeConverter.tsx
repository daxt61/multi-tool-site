import { useState } from 'react';
import { Signal, Copy, Check, Trash2, Info, Type } from 'lucide-react';

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
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Text Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label htmlFor="morse-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Normal</label>
            </div>
          </div>
          <textarea
            id="morse-text"
            value={text}
            onChange={(e) => encode(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Morse Input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4 text-indigo-500" />
              <label htmlFor="morse-signal" className="text-xs font-black uppercase tracking-widest text-slate-400">Code Morse (. et -)</label>
            </div>
            <button
              onClick={handleCopy}
              disabled={!morse}
              className={`p-2 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 disabled:opacity-30'}`}
              aria-label="Copier le code morse"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="morse-signal"
            value={morse}
            onChange={(e) => decode(e.target.value)}
            placeholder="Ex: .... . .-.. .-.. ---"
            className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={clear}
          className="px-8 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl font-bold hover:bg-rose-100 transition-all flex items-center gap-2"
        >
          <Trash2 className="w-5 h-5" /> Effacer
        </button>
      </div>

      {/* Reference Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Signal className="w-4 h-4 text-orange-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Référence Morse</h3>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Object.entries(MORSE_CODE).filter(([k]) => k !== ' ').map(([char, code]) => (
            <div key={char} className="flex flex-col items-center p-3 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl group hover:border-indigo-500/30 transition-all">
              <span className="font-black text-slate-300 dark:text-slate-700 group-hover:text-indigo-500 transition-colors text-xs">{char}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{code}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">À propos du Code Morse</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le code Morse est un système de communication utilisant des séquences de points (.) et de traits (-).
            Chaque lettre, chiffre et caractère spécial possède sa propre combinaison unique.
            Utilisez cet outil pour encoder du texte en morse ou décoder du morse en texte clair.
          </p>
        </div>
      </div>
    </div>
  );
}
