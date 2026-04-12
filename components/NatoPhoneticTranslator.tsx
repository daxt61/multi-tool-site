import { useState, useMemo, useDeferredValue } from 'react';
import { Copy, Check, Trash2, Type, Info, MessageSquare, Volume2 } from 'lucide-react';

const NATO_ALPHABET: Record<string, string> = {
  'A': 'Alfa', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 'E': 'Echo',
  'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel', 'I': 'India', 'J': 'Juliett',
  'K': 'Kilo', 'L': 'Lima', 'M': 'Mike', 'N': 'November', 'O': 'Oscar',
  'P': 'Papa', 'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
  'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray', 'Y': 'Yankee',
  'Z': 'Zulu',
  '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
  '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine',
  '.': 'Stop', ',': 'Comma', '?': 'Interrogative', '!': 'Exclamation',
  '-': 'Dash', '/': 'Slant', '(': 'Brackets on', ')': 'Brackets off',
  '@': 'At', '&': 'And', '+': 'Plus', '=': 'Equals'
};

export function NatoPhoneticTranslator() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const deferredText = useDeferredValue(text);

  const phoneticOutput = useMemo(() => {
    return deferredText
      .toUpperCase()
      .split('')
      .map(char => NATO_ALPHABET[char] || (char === ' ' ? '•' : char))
      .filter(val => val !== '')
      .join(' ');
  }, [deferredText]);

  const handleCopy = () => {
    if (!phoneticOutput) return;
    navigator.clipboard.writeText(phoneticOutput.replace(/•/g, ' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
    setCopied(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="nato-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
            Texte à traduire
          </label>
          <button
            onClick={handleClear}
            disabled={!text}
            className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          id="nato-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez votre texte ici (ex: SOS)..."
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl font-bold dark:text-slate-300"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-500" /> Alphabet Phonétique de l'OTAN
          </h3>
          {phoneticOutput && (
            <button
              onClick={handleCopy}
              className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          )}
        </div>

        <div className="min-h-48 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm flex flex-wrap gap-x-4 gap-y-3 items-center justify-center text-center">
          {text.trim() === '' ? (
            <div className="text-slate-300 dark:text-slate-700 font-black italic text-xl">
              La traduction apparaîtra ici mot par mot
            </div>
          ) : (
            phoneticOutput.split(' ').map((word, i) => (
              <span
                key={i}
                className={`text-xl md:text-2xl font-black transition-all animate-in zoom-in-95 duration-300 ${
                  word === '•'
                    ? 'text-slate-200 dark:text-slate-800 px-4'
                    : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-900/30'
                }`}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                {word}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">C'est quoi ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'alphabet phonétique de l'OTAN est un code utilisé par les armées et les services d'urgence pour épeler des mots sans erreur de compréhension, notamment lors de transmissions radio difficiles.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Type className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Universalité</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Aussi appelé Alphabet Phonétique International (API), il utilise des mots choisis pour être intelligibles quel que soit l'accent de l'émetteur ou du récepteur.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Usage courant</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            On l'utilise aujourd'hui dans l'aviation civile, la marine, les télécommunications et même au téléphone pour épeler un nom ou une adresse e-mail complexe.
          </p>
        </div>
      </div>
    </div>
  );
}
