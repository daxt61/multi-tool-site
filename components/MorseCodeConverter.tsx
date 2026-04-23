import { useState, useEffect } from 'react';
import { Signal, Copy, Check, Trash2, Info, AlertCircle } from 'lucide-react';

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

// Sentinel: Use Object.create(null) for the reverse mapping to prevent Prototype Pollution.
// This ensures that user-provided "Morse codes" (like "toString" or "__proto__") do not
// resolve to native object properties during the decoding process.
const REVERSE_MORSE: Record<string, string> = Object.entries(MORSE_CODE).reduce(
  (acc: Record<string, string>, [key, value]) => {
    acc[value] = key;
    return acc;
  },
  Object.create(null)
);

export function MorseCodeConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [text, setText] = useState(initialData?.text || '');
  const [morse, setMorse] = useState(initialData?.morse || '');

  useEffect(() => {
    onStateChange?.({ text, morse });
  }, [text, morse, onStateChange]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encode = (input: string) => {
    setText(input);
    // Sentinel: Implement input length limit to mitigate client-side Denial of Service (DoS)
    // by preventing expensive string operations on excessively large inputs.
    if (input.length > MAX_LENGTH) {
      setError(`L'entrée est trop longue. Limite de ${MAX_LENGTH.toLocaleString()} caractères.`);
      return;
    }
    setError(null);
    const encoded = input.toUpperCase().split('').map(char => MORSE_CODE[char] || char).join(' ');
    setMorse(encoded);
  };

  const decode = (input: string) => {
    setMorse(input);
    // Sentinel: Implement input length limit to mitigate client-side Denial of Service (DoS).
    if (input.length > MAX_LENGTH) {
      setError(`L'entrée est trop longue. Limite de ${MAX_LENGTH.toLocaleString()} caractères.`);
      return;
    }
    setError(null);
    const decoded = input.trim().split(' ').map(code => REVERSE_MORSE[code] || code).join('');
    setText(decoded);
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
    setError(null);
  };

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
              Texte Normal
            </label>
            <button
              onClick={handleClear}
              disabled={!text && !morse}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-full transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Effacer le texte"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            id="normal-text"
            value={text}
            onChange={(e) => encode(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Morse Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="morse-text" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              Code Morse (. et -)
            </label>
            <button
              onClick={handleCopy}
              disabled={!morse}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Copier le code Morse"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            id="morse-text"
            value={morse}
            onChange={(e) => decode(e.target.value)}
            placeholder="Ex: .... . .-.. .-.. ---"
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {/* Morse Reference Card */}
      <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2 px-1">
          <Signal className="w-4 h-4 text-indigo-500" /> Référence Morse Rapide
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
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Saisissez votre texte dans le champ de gauche pour obtenir sa traduction en Morse, ou tapez du Morse dans le champ de droite pour le décoder en texte clair.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Signal className="w-4 h-4 text-indigo-500" /> Le Code Morse
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le code Morse utilise des séquences de points (.) et de tirets (-) pour représenter des lettres et des chiffres. C'est l'un des premiers systèmes de communication numérique.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> Confidentialité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Comme pour tous nos outils, la conversion s'effectue localement sur votre navigateur. Aucune donnée n'est envoyée ou stockée sur nos serveurs.
          </p>
        </div>
      </div>
    </div>
  );
}
