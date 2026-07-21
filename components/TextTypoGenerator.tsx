import { useState, useEffect, useCallback, useRef } from 'react';
import { Type, Copy, Check, Trash2, RefreshCw, Info, Download, AlertCircle, Keyboard, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_LENGTH = 50000;

// Proximity keyboard maps for fat-finger typos
const NEIGHBORS_QWERTY: Record<string, string[]> = {
  'a': ['q', 'w', 's', 'z'],
  'b': ['v', 'g', 'h', 'n'],
  'c': ['x', 'd', 'f', 'v'],
  'd': ['s', 'e', 'r', 'f', 'v', 'c', 'x'],
  'e': ['w', 's', 'd', 'f', 'r'],
  'f': ['d', 'r', 't', 'g', 'b', 'v', 'c'],
  'g': ['f', 't', 'y', 'h', 'n', 'b', 'v'],
  'h': ['g', 'y', 'u', 'j', 'm', 'n', 'b'],
  'i': ['u', 'j', 'k', 'l', 'o'],
  'j': ['h', 'u', 'i', 'k', 'm', 'n'],
  'k': ['j', 'i', 'o', 'l', 'm'],
  'l': ['k', 'o', 'p'],
  'm': ['n', 'h', 'j', 'k'],
  'n': ['b', 'h', 'j', 'm'],
  'o': ['i', 'k', 'l', 'p'],
  'p': ['o', 'l'],
  'q': ['a', 'w'],
  'r': ['e', 'd', 'f', 'g', 't'],
  's': ['a', 'w', 'e', 'd', 'x', 'z'],
  't': ['r', 'f', 'g', 'h', 'y'],
  'u': ['y', 'h', 'j', 'k', 'i'],
  'v': ['c', 'f', 'g', 'b'],
  'w': ['q', 'a', 's', 'e'],
  'x': ['z', 's', 'd', 'c'],
  'y': ['t', 'g', 'h', 'u'],
  'z': ['a', 's', 'x']
};

const NEIGHBORS_AZERTY: Record<string, string[]> = {
  'a': ['q', 'z', 's'],
  'b': ['v', 'g', 'h', 'n'],
  'c': ['x', 'd', 'f', 'v'],
  'd': ['s', 'e', 'r', 'f', 'v', 'c', 'x'],
  'e': ['z', 'q', 's', 'd', 'r'],
  'f': ['d', 'r', 't', 'g', 'b', 'v', 'c'],
  'g': ['f', 't', 'y', 'h', 'n', 'b', 'v'],
  'h': ['g', 'y', 'u', 'j', 'm', 'n', 'b'],
  'i': ['u', 'j', 'k', 'l', 'o'],
  'j': ['h', 'u', 'i', 'k', 'm', 'n'],
  'k': ['j', 'i', 'o', 'l', 'm'],
  'l': ['k', 'o', 'p', 'm'],
  'm': ['l', 'p'],
  'n': ['h', 'j', 'b'],
  'o': ['i', 'k', 'l', 'p'],
  'p': ['o', 'l', 'm'],
  'q': ['a', 'z', 'w', 's'],
  'r': ['e', 'd', 'f', 'g', 't'],
  's': ['q', 'z', 'd', 'x', 'w', 'a'],
  't': ['r', 'f', 'g', 'h', 'y'],
  'u': ['y', 'h', 'j', 'k', 'i'],
  'v': ['c', 'f', 'g', 'b'],
  'w': ['q', 's', 'x'],
  'x': ['w', 's', 'd', 'c'],
  'y': ['t', 'g', 'h', 'u'],
  'z': ['a', 'q', 's', 'e', 'd']
};

const NEIGHBORS_QWERTZ: Record<string, string[]> = {
  'a': ['q', 'w', 's', 'y'],
  'b': ['v', 'g', 'h', 'n'],
  'c': ['x', 'd', 'f', 'v'],
  'd': ['s', 'e', 'r', 'f', 'v', 'c', 'x'],
  'e': ['w', 's', 'd', 'f', 'r'],
  'f': ['d', 'r', 't', 'g', 'b', 'v', 'c'],
  'g': ['f', 't', 'z', 'h', 'n', 'b', 'v'],
  'h': ['g', 'z', 'u', 'j', 'm', 'n', 'b'],
  'i': ['u', 'j', 'k', 'l', 'o'],
  'j': ['h', 'u', 'i', 'k', 'm', 'n'],
  'k': ['j', 'i', 'o', 'l', 'm'],
  'l': ['k', 'o', 'p'],
  'm': ['n', 'h', 'j', 'k'],
  'n': ['b', 'h', 'j', 'm'],
  'o': ['i', 'k', 'l', 'p'],
  'p': ['o', 'l'],
  'q': ['a', 'w'],
  'r': ['e', 'd', 'f', 'g', 't'],
  's': ['a', 'w', 'e', 'd', 'x', 'y'],
  't': ['r', 'f', 'g', 'h', 'z'],
  'u': ['z', 'h', 'j', 'k', 'i'],
  'v': ['c', 'f', 'g', 'b'],
  'w': ['q', 'a', 's', 'e'],
  'x': ['y', 's', 'd', 'c'],
  'y': ['a', 's', 'x'],
  'z': ['t', 'g', 'h', 'u']
};

type LayoutType = 'QWERTY' | 'AZERTY' | 'QWERTZ';

export function TextTypoGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState(initialData?.input || '');
  const [rate, setRate] = useState<number>(initialData?.rate ?? 10); // typo rate %
  const [layout, setLayout] = useState<LayoutType>(initialData?.layout || 'QWERTY');

  // Typo types toggles
  const [useFatFinger, setUseFatFinger] = useState<boolean>(initialData?.useFatFinger ?? true);
  const [useSkip, setUseSkip] = useState<boolean>(initialData?.useSkip ?? true);
  const [useDouble, setUseDouble] = useState<boolean>(initialData?.useDouble ?? true);
  const [useTranspose, setUseTranspose] = useState<boolean>(initialData?.useTranspose ?? true);
  const [useCase, setUseCase] = useState<boolean>(initialData?.useCase ?? true);

  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, rate, layout, useFatFinger, useSkip, useDouble, useTranspose, useCase });
  }, [input, rate, layout, useFatFinger, useSkip, useDouble, useTranspose, useCase, onStateChange]);

  const generateTypos = useCallback((text: string) => {
    if (!text) return '';

    const charArray = Array.from(text);
    const result: string[] = [];

    // Choose proximity map based on selected layout
    const map = layout === 'AZERTY' ? NEIGHBORS_AZERTY : layout === 'QWERTZ' ? NEIGHBORS_QWERTZ : NEIGHBORS_QWERTY;

    // Collect active typo types
    const activeTypes: string[] = [];
    if (useFatFinger) activeTypes.push('fatFinger');
    if (useSkip) activeTypes.push('skip');
    if (useDouble) activeTypes.push('double');
    if (useTranspose) activeTypes.push('transpose');
    if (useCase) activeTypes.push('case');

    if (activeTypes.length === 0) return text;

    let i = 0;
    while (i < charArray.length) {
      const char = charArray[i];
      const isLetter = /\p{L}/u.test(char);

      // Only introduce typos at the specified rate, and only for letter characters
      if (isLetter && getSecureRandomInt(100) < rate) {
        const typoType = activeTypes[getSecureRandomInt(activeTypes.length)];

        switch (typoType) {
          case 'fatFinger': {
            const lowerChar = char.toLowerCase();
            const neighbors = map[lowerChar];
            if (neighbors && neighbors.length > 0) {
              const replacement = neighbors[getSecureRandomInt(neighbors.length)];
              // Preserve original case if possible
              const isUpper = char === char.toUpperCase();
              result.push(isUpper ? replacement.toUpperCase() : replacement);
            } else {
              result.push(char);
            }
            i++;
            break;
          }
          case 'skip': {
            // Delete letter (do nothing)
            i++;
            break;
          }
          case 'double': {
            // Duplicate the letter
            result.push(char);
            result.push(char);
            i++;
            break;
          }
          case 'transpose': {
            // Swap with next letter if next exists and is a letter
            if (i + 1 < charArray.length && /\p{L}/u.test(charArray[i + 1])) {
              result.push(charArray[i + 1]);
              result.push(char);
              i += 2;
            } else {
              result.push(char);
              i++;
            }
            break;
          }
          case 'case': {
            // Invert case of the character
            const isUpper = char === char.toUpperCase();
            result.push(isUpper ? char.toLowerCase() : char.toUpperCase());
            i++;
            break;
          }
          default:
            result.push(char);
            i++;
        }
      } else {
        result.push(char);
        i++;
      }
    }

    return result.join('');
  }, [layout, rate, useFatFinger, useSkip, useDouble, useTranspose, useCase]);

  const performGeneration = useCallback(() => {
    if (!input) {
      setOutput('');
      return;
    }
    setOutput(generateTypos(input));
  }, [input, generateTypos]);

  useEffect(() => {
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setOutput('');
    } else {
      setError(null);
      performGeneration();
    }
  }, [input, rate, layout, useFatFinger, useSkip, useDouble, useTranspose, useCase, performGeneration, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
    textareaRef.current?.focus();
  }, []);

  const handlersRef = useRef({ handleClear, performGeneration });
  useEffect(() => {
    handlersRef.current = { handleClear, performGeneration };
  }, [handleClear, performGeneration]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      const { handleClear, performGeneration } = handlersRef.current;

      if (isEditable && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        performGeneration();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `text-typo-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded'));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Inputs controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="typo-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" /> {t('typogenerator.input_label', 'Input text')}
            </label>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!input}
                title={`${t('common.clear')} (Esc)`}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="typo-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('typogenerator.placeholder', 'Type or paste your text to introduce realistic typos...')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Options & Sliders */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-4">
              {/* Typo Rate Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="typo-rate" className="text-xs font-bold text-slate-400">{t('typogenerator.rate_label', 'Typo Rate')}</label>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{rate}%</span>
                </div>
                <input
                  id="typo-rate"
                  type="range"
                  min="1"
                  max="50"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Keyboard Layout */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 px-1">{t('typogenerator.layout_label', 'Keyboard Layout')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['QWERTY', 'AZERTY', 'QWERTZ'] as LayoutType[]).map((lay) => (
                    <button
                      key={lay}
                      onClick={() => setLayout(lay)}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition-all border ${layout === lay ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
                    >
                      {lay}
                    </button>
                  ))}
                </div>
              </div>

              {/* Typo Types Toggles */}
              <div className="space-y-3 pt-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                  {t('typogenerator.typo_types', 'Typo Types')}
                </div>

                {[
                  { id: 'fat', label: t('typogenerator.type_fat_finger', 'Fat-finger (proximity)'), state: useFatFinger, set: setUseFatFinger },
                  { id: 'skip', label: t('typogenerator.type_skip', 'Skipped letters'), state: useSkip, set: setUseSkip },
                  { id: 'double', label: t('typogenerator.type_double', 'Double letters'), state: useDouble, set: setUseDouble },
                  { id: 'transpose', label: t('typogenerator.type_transpose', 'Transposed letters'), state: useTranspose, set: setUseTranspose },
                  { id: 'case', label: t('typogenerator.type_case', 'Case mishaps'), state: useCase, set: setUseCase }
                ].map((type) => (
                  <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-10 h-5 rounded-full p-1 transition-colors ${type.state ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${type.state ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <input type="checkbox" className="hidden" checked={type.state} onChange={() => type.set(!type.state)} />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={performGeneration}
              disabled={!input}
              className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed group"
              title={`${t('typogenerator.regenerate', 'Regenerate')} (R)`}
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              {t('typogenerator.regenerate', 'Regenerate')}
              <Kbd modifier={null} className="ml-2 hidden sm:inline-flex border-white/20 bg-white/10 text-white">R</Kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Output Results */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="typo-output" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.result')}</label>
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
          id="typo-output"
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
          <h4 className="font-bold dark:text-white">{t('typogenerator.about_title', 'About Typo Generator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('typogenerator.about_text', 'This utility generates realistic keyboard slip-ups, omitted characters, duplicated letters, transpositions, and case shift issues in your text. Perfect for educational, testing, SEO keyword variation analysis, or visual simulations.')}
          </p>
        </div>
      </div>
    </div>
  );
}
