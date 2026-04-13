import { useState, useCallback } from 'react';
import { Type, Copy, Check, Trash2, Info, ArrowLeftRight, HelpCircle } from 'lucide-react';

const TEXT_TO_BRAILLE: Record<string, string> = {
  'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑', 'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
  'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕', 'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
  'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽', 'z': '⠵',
  '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙', '5': '⠼⠑', '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊', '0': '⠼⠚',
  ' ': '⠀', '.': '⠲', ',': '⠂', ';': '⠆', ':': '⠒', '?': '⠦', '!': '⠖', '-': '⠤', '(': '⠶', ')': '⠶', '/': '⠸'
};

const BRAILLE_TO_TEXT: Record<string, string> = {
  '⠁': 'a', '⠃': 'b', '⠉': 'c', '⠙': 'd', '⠑': 'e', '⠋': 'f', '⠛': 'g', '⠓': 'h', '⠊': 'i', '⠚': 'j',
  '⠅': 'k', '⠇': 'l', '⠍': 'm', '⠝': 'n', '⠕': 'o', '⠏': 'p', '⠟': 'q', '⠗': 'r', '⠎': 's', '⠞': 't',
  '⠥': 'u', '⠧': 'v', '⠺': 'w', '⠭': 'x', '⠽': 'y', '⠵': 'z',
  '⠀': ' ', '⠲': '.', '⠂': ',', '⠆': ';', '⠒': ':', '⠦': '?', '⠖': '!', '⠤': '-', '⠶': '(', '⠸': '/'
};

const NUM_MAP: Record<string, string> = {
  '⠁': '1', '⠃': '2', '⠉': '3', '⠙': '4', '⠑': '5', '⠋': '6', '⠛': '7', '⠓': '8', '⠊': '9', '⠚': '0'
};

export function BrailleTranslator() {
  const [text, setText] = useState('');
  const [braille, setBraille] = useState('');
  const [copied, setCopied] = useState<'text' | 'braille' | null>(null);

  const translateToBraille = (input: string) => {
    let result = '';
    for (let char of input.toLowerCase()) {
      if (TEXT_TO_BRAILLE[char]) {
        if (/[A-Z]/.test(input[input.indexOf(char)])) {
          // Simplification: just handle individual caps for Grade 1
          // result += '⠠' + TEXT_TO_BRAILLE[char];
        }
        result += TEXT_TO_BRAILLE[char];
      } else {
        result += char;
      }
    }
    setBraille(result);
    setText(input);
  };

  const translateToText = (input: string) => {
    let result = '';
    let isNum = false;
    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '⠼') {
        isNum = true;
        continue;
      }
      if (char === '⠀') {
        isNum = false;
        result += ' ';
        continue;
      }

      if (isNum && NUM_MAP[char]) {
        result += NUM_MAP[char];
      } else if (BRAILLE_TO_TEXT[char]) {
        result += BRAILLE_TO_TEXT[char];
        isNum = false;
      } else {
        result += char;
      }
    }
    setText(result);
    setBraille(input);
  };

  const handleCopy = (content: string, type: 'text' | 'braille') => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setText('');
    setBraille('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                Texte Normal
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(text, 'text')}
                disabled={!text}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'text' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'text' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={handleClear}
                disabled={!text && !braille}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => translateToBraille(e.target.value)}
            placeholder="Tapez votre texte ici..."
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Braille Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center text-indigo-500 font-bold text-lg">⠿</div>
              <label htmlFor="braille-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                Braille (Grade 1)
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(braille, 'braille')}
                disabled={!braille}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'braille' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied === 'braille' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'braille' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="braille-input"
            value={braille}
            onChange={(e) => translateToText(e.target.value)}
            placeholder="⠃⠗⠁⠊⠇⠇⠑"
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-4xl leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none font-serif"
          />
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Qu'est-ce que le Braille Grade 1 ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le Braille Grade 1 (ou Braille intégral) est une transcription lettre par lettre du texte. Chaque caractère alphabétique, chiffre et signe de ponctuation possède son propre symbole Braille unique.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500" /> Comment l'utiliser ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Tapez du texte normal dans le champ de gauche pour obtenir sa version Braille. Vous pouvez aussi coller du Braille dans le champ de droite pour le traduire en texte lisible.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-500" /> Support des chiffres
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les chiffres en Braille sont représentés par les lettres 'a' à 'j' précédées du signe numérique <code>⠼</code>. L'outil gère automatiquement cette conversion bidirectionnelle.
          </p>
        </div>
      </div>
    </div>
  );
}
