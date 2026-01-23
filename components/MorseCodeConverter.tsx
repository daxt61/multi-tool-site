import { useState } from 'react';
import { Signal, Volume2, Copy, Check } from 'lucide-react';

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Text Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Texte Normal
          </label>
          <textarea
            value={text}
            onChange={(e) => encode(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Morse Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Code Morse (. et -)
          </label>
          <textarea
            value={morse}
            onChange={(e) => decode(e.target.value)}
            placeholder="Ex: .... . .-.. .-.. ---"
            className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={handleCopy}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          Copier le Code Morse
        </button>
        <button
          onClick={() => { setText(''); setMorse(''); }}
          className="px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
        >
          Effacer
        </button>
      </div>

      <div className="mt-12 bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Signal className="w-5 h-5 text-orange-500" />
          Référence Morse Rapide
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4 text-xs font-mono">
          {Object.entries(MORSE_CODE).filter(([k]) => k !== ' ').map(([char, code]) => (
            <div key={char} className="flex flex-col items-center p-2 bg-white rounded shadow-sm">
              <span className="font-bold text-gray-400">{char}</span>
              <span className="text-gray-900">{code}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
