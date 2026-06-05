import { useState, useEffect, useCallback, useRef } from 'react';
import { Type, Copy, Check, Trash2, RefreshCw, Info, Download, AlertCircle, Shuffle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

const MAX_LENGTH = 50000;

export function LetterShuffler({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '');
  const [keepFirst, setKeepFirst] = useState(initialData?.keepFirst ?? true);
  const [keepLast, setKeepLast] = useState(initialData?.keepLast ?? true);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, keepFirst, keepLast });
  }, [input, keepFirst, keepLast, onStateChange]);

  const shuffleArray = useCallback((array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  const shuffleWord = useCallback((word: string, kFirst: boolean, kLast: boolean) => {
    if (word.length <= 1) return word;

    // Only shuffle if it has letters
    if (!/\p{L}/u.test(word)) return word;

    const chars = Array.from(word);

    // Find first and last letters if we need to keep them
    // This handles cases with punctuation attached to words
    let firstLetterIdx = -1;
    let lastLetterIdx = -1;

    for (let i = 0; i < chars.length; i++) {
      if (/\p{L}/u.test(chars[i])) {
        if (firstLetterIdx === -1) firstLetterIdx = i;
        lastLetterIdx = i;
      }
    }

    if (firstLetterIdx === -1) return word; // No letters found

    let prefix = chars.slice(0, firstLetterIdx);
    let suffix = chars.slice(lastLetterIdx + 1);

    let letters = chars.slice(firstLetterIdx, lastLetterIdx + 1);

    let actualStart = 0;
    let actualEnd = letters.length - 1;

    let keptFirst = '';
    let keptLast = '';

    if (kFirst && letters.length > 0) {
      keptFirst = letters[0];
      actualStart = 1;
    }

    if (kLast && letters.length > 1) {
      keptLast = letters[letters.length - 1];
      actualEnd = letters.length - 2;
    }

    if (actualStart <= actualEnd) {
      const middle = letters.slice(actualStart, actualEnd + 1);
      const shuffledMiddle = shuffleArray(middle);
      return prefix.join('') + keptFirst + shuffledMiddle.join('') + keptLast + suffix.join('');
    } else {
      return word;
    }
  }, [shuffleArray]);

  const performShuffle = useCallback(() => {
    if (!input) {
      setOutput('');
      return;
    }

    // Split by whitespace but keep the whitespace
    const parts = input.split(/(\s+)/);
    const shuffledParts = parts.map((part: string) => {
      if (/\s+/.test(part)) return part;
      return shuffleWord(part, keepFirst, keepLast);
    });

    setOutput(shuffledParts.join(''));
  }, [input, keepFirst, keepLast, shuffleWord]);

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
    } else {
      setError(null);
      performShuffle();
    }
  }, [input, keepFirst, keepLast, performShuffle, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    textareaRef.current?.focus();
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shuffled-text-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="shuffler-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-500" /> {t('lettershuffler.input_label')}
          </label>
          <button
            onClick={handleClear}
            disabled={!input}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <Trash2 className="w-3 h-3" /> {t('common.clear')}
          </button>
        </div>
        <textarea
          id="shuffler-input"
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('wordcounter.placeholder')}
          className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${keepFirst ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${keepFirst ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
          <input type="checkbox" className="hidden" checked={keepFirst} onChange={() => setKeepFirst(!keepFirst)} />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
            {t('lettershuffler.keep_first')}
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer group">
          <div className={`w-12 h-6 rounded-full p-1 transition-colors ${keepLast ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${keepLast ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
          <input type="checkbox" className="hidden" checked={keepLast} onChange={() => setKeepLast(!keepLast)} />
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
            {t('lettershuffler.keep_last')}
          </span>
        </label>

        <button
          onClick={performShuffle}
          className="flex items-center gap-2 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg"
        >
          <Shuffle className="w-4 h-4" /> {t('random.shuffle')}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="shuffler-output" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.result')}</label>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={!output}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Download className="w-3 h-3" /> {t('common.download')}
            </button>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
          </div>
        </div>
        <div
          id="shuffler-output"
          className="w-full min-h-[160px] p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-lg leading-relaxed dark:text-white break-all whitespace-pre-wrap font-mono"
        >
          {output || <span className="text-slate-400 italic">{t('caseconverter.result_placeholder')}</span>}
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('lettershuffler.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('lettershuffler.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
