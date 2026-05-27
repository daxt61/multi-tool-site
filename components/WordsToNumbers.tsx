import { useState, useMemo, useEffect } from 'react';
import { Type, Copy, Check, RotateCcw, Info, Hash, FileText, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UNITS: Record<string, number> = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9,
  'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16,
  'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
  'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
};

const SCALES: Record<string, number> = {
  'hundred': 100,
  'thousand': 1000,
  'million': 1000000,
  'billion': 1000000000,
  'trillion': 1000000000000
};

function parseWordsToNumber(text: string): number | null {
  const words = text.toLowerCase().replace(/-/g, ' ').replace(/ and /g, ' ').split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return null;

  let total = 0;
  let current = 0;

  for (const word of words) {
    if (UNITS[word] !== undefined) {
      current += UNITS[word];
    } else if (SCALES[word] !== undefined) {
      if (word === 'hundred') {
        current *= SCALES[word];
      } else {
        total += current * SCALES[word];
        current = 0;
      }
    } else {
      // Unknown word, handle as error or skip
      return null;
    }
  }

  return total + current;
}

export function WordsToNumbers({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>(initialData?.input || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const result = useMemo(() => {
    if (!input.trim()) return null;
    return parseWordsToNumber(input);
  }, [input]);

  const handleClear = () => {
    setInput('');
  };

  const handleCopy = () => {
    if (result === null) return;
    navigator.clipboard.writeText(result.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="words-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Type className="w-3 h-3" /> {t('wordstonumbers.input_label', 'Number in words (English)')}
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <RotateCcw className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <div className="relative">
            <textarea
              id="words-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white resize-none"
              placeholder="e.g., one hundred twenty-three"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-3 h-3" /> {t('common.result')}
            </label>
            <button
              onClick={handleCopy}
              disabled={result === null}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                copied ? 'bg-emerald-50 text-emerald-600' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100'
              } disabled:opacity-50`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 min-h-[192px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full -ml-16 -mt-16 blur-3xl"></div>
            {input && result === null ? (
              <div className="flex flex-col items-center gap-2 text-rose-400">
                <AlertCircle className="w-8 h-8" />
                <p className="font-bold">{t('wordstonumbers.error_invalid', 'Invalid number words')}</p>
              </div>
            ) : (
              <p className="text-4xl md:text-5xl font-black text-white text-center leading-relaxed font-mono tracking-tighter">
                {result !== null ? result.toLocaleString() : '...'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('wordstonumbers.about_title', 'About English Words to Numbers')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('wordstonumbers.about_text', 'This tool converts English written numbers into their digital representation. It handles units, tens, hundreds, and scales up to trillions. You can use hyphens or spaces, and the word "and" is optional.')}
          </p>
        </div>
      </div>
    </div>
  );
}
