import { useState, useCallback, useEffect, useRef } from 'react';
import { Type, Copy, Check, Trash2, Info, ArrowLeftRight, HelpCircle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

const CAP_INDICATOR = '⠠';
const NUM_INDICATOR = '⠼';

export function BrailleTranslator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [braille, setBraille] = useState(initialData?.braille || '');
  const [copied, setCopied] = useState<'text' | 'braille' | null>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ text, braille });
  }, [text, braille, onStateChange]);

  const translateToBraille = useCallback((input: string) => {
    let result = '';
    for (let char of input) {
      const lowerChar = char.toLowerCase();
      if (/[A-Z]/.test(char)) {
        result += CAP_INDICATOR;
      }

      if (TEXT_TO_BRAILLE[lowerChar]) {
        result += TEXT_TO_BRAILLE[lowerChar];
      } else {
        result += char;
      }
    }
    setBraille(result);
    setText(input);
  }, []);

  const translateToText = useCallback((input: string) => {
    let result = '';
    let isNum = false;
    let isCap = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if (char === NUM_INDICATOR) {
        isNum = true;
        continue;
      }
      if (char === CAP_INDICATOR) {
        isCap = true;
        continue;
      }
      if (char === '⠀') {
        isNum = false;
        result += ' ';
        continue;
      }

      let translated = char;
      if (isNum && NUM_MAP[char]) {
        translated = NUM_MAP[char];
      } else if (BRAILLE_TO_TEXT[char]) {
        translated = BRAILLE_TO_TEXT[char];
      }

      if (isCap) {
        translated = translated.toUpperCase();
        isCap = false;
      }

      result += translated;
      if (!isNum) isNum = false; // Reset num if it wasn't a digit mapping (though Grade 1 is simpler)
    }
    setText(result);
    setBraille(input);
  }, []);

  const handleCopy = (content: string, type: 'text' | 'braille') => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = useCallback(() => {
    setText('');
    setBraille('');
    textInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleClear();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

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
                {t('braille.text_label')}
              </label>
            </div>
            <div className="flex gap-2 items-center">
              <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
              <button
                onClick={() => handleCopy(text, 'text')}
                disabled={!text}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'text' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none`}
              >
                {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'text' ? t('common.copied') : t('common.copy')}
              </button>
              <button
                onClick={handleClear}
                disabled={!text && !braille}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                aria-label={t('common.clear')}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            id="text-input"
            ref={textInputRef}
            value={text}
            onChange={(e) => translateToBraille(e.target.value)}
            placeholder={t('braille.placeholder_text')}
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Braille Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center text-indigo-500 font-bold text-lg">⠿</div>
              <label htmlFor="braille-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('braille.braille_label')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(braille, 'braille')}
                disabled={!braille}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'braille' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none`}
              >
                {copied === 'braille' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'braille' ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="braille-input"
            value={braille}
            onChange={(e) => translateToText(e.target.value)}
            placeholder={t('braille.placeholder_braille')}
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-4xl leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none font-serif"
          />
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('braille.about_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('braille.about_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-500" /> {t('braille.how_to_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('braille.how_to_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-500" /> {t('braille.numbers_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('braille.numbers_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
