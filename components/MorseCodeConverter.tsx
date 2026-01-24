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
  const [isPlaying, setIsPlaying] = useState(false);

  const playMorse = async () => {
    if (!morse || isPlaying) return;
    setIsPlaying(true);

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();

      let time = audioCtx.currentTime + 0.1;
      const dot = 0.1;
      const dash = 0.3;

      for (const char of morse) {
        if (char === '.') {
          gainNode.gain.setValueAtTime(0.2, time);
          time += dot;
          gainNode.gain.setValueAtTime(0, time);
          time += dot;
        } else if (char === '-') {
          gainNode.gain.setValueAtTime(0.2, time);
          time += dash;
          gainNode.gain.setValueAtTime(0, time);
          time += dot;
        } else if (char === ' ') {
          time += dot * 2;
        } else if (char === '/') {
          time += dot * 4;
        }
      }

      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
        setIsPlaying(false);
      }, (time - audioCtx.currentTime + 0.5) * 1000);
    } catch (e) {
      console.error('Audio context error:', e);
      setIsPlaying(false);
    }
  };

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

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={handleCopy}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          Copier le Code Morse
        </button>
        <button
          onClick={playMorse}
          disabled={!morse || isPlaying}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Volume2 className={isPlaying ? 'animate-pulse' : ''} />
          {isPlaying ? 'Lecture...' : 'Écouter'}
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

      {/* SEO Content Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-200 pt-12 text-left">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Le Code Morse : Un langage universel</h2>
          <p className="text-gray-600 mb-4">
            Inventé au 19ème siècle, le code Morse utilise des impulsions courtes (points) et longues (traits) pour représenter des lettres et des chiffres. Bien qu'il soit moins utilisé aujourd'hui pour les communications officielles, il reste passionnant pour les amateurs de radio, les scouts et comme méthode de communication de secours.
          </p>
          <p className="text-gray-600">
            Notre traducteur Morse en ligne vous permet de convertir instantanément du texte en Morse et vice-versa.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Fonctionnalités de notre traducteur</h2>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li><strong>Traduction bidirectionnelle :</strong> Tapez du texte pour obtenir du Morse, ou collez du Morse pour le décoder.</li>
            <li><strong>Lecture audio :</strong> Utilisez le bouton "Écouter" pour entendre le code Morse généré via votre haut-parleur.</li>
            <li><strong>Référence rapide :</strong> Consultez notre tableau alphabétique Morse en bas de page pour apprendre les bases.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
