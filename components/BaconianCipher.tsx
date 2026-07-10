import { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, Copy, Check, Trash2, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

const BACONIAN_STANDARD: Record<string, string> = {
  'A': 'AAAAA', 'B': 'AAAAB', 'C': 'AAABA', 'D': 'AAABB', 'E': 'AABAA',
  'F': 'AABAB', 'G': 'AABBA', 'H': 'AABBB', 'I': 'ABAAA', 'J': 'ABAAA',
  'K': 'ABAAB', 'L': 'ABABA', 'M': 'ABABB', 'N': 'ABBAA', 'O': 'ABBAB',
  'P': 'ABBBA', 'Q': 'ABBBB', 'R': 'BAAAA', 'S': 'BAAAB', 'T': 'BAABA',
  'U': 'BAABB', 'V': 'BAABB', 'W': 'BABAA', 'X': 'BABAB', 'Y': 'BABBA', 'Z': 'BABBB'
};

const BACONIAN_EXTENDED: Record<string, string> = {
  'A': 'AAAAA', 'B': 'AAAAB', 'C': 'AAABA', 'D': 'AAABB', 'E': 'AABAA',
  'F': 'AABAB', 'G': 'AABBA', 'H': 'AABBB', 'I': 'ABAAA', 'J': 'ABAAB',
  'K': 'ABABA', 'L': 'ABABB', 'M': 'ABBAA', 'N': 'ABBAB', 'O': 'ABBBA',
  'P': 'ABBBB', 'Q': 'BAAAA', 'R': 'BAAAB', 'S': 'BAABA', 'T': 'BAABB',
  'U': 'BABAA', 'V': 'BABAB', 'W': 'BABBA', 'X': 'BABBB', 'Y': 'BBAAA', 'Z': 'BBAAB'
};

export function BaconianCipher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(initialData?.text || '');
  const [cipher, setCipher] = useState(initialData?.cipher || '');
  const [mode, setMode] = useState<'standard' | 'extended'>(initialData?.mode || 'standard');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ text, cipher, mode });
  }, [text, cipher, mode, onStateChange]);

  const getMap = useCallback(() => mode === 'standard' ? BACONIAN_STANDARD : BACONIAN_EXTENDED, [mode]);

  const encode = (input: string) => {
    setText(input);
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    const map = getMap();
    const encoded = input.toUpperCase().split('').map(char => {
      if (/[A-Z]/.test(char)) return map[char];
      return char;
    }).join(' ');
    setCipher(encoded);
  };

  const decode = (input: string) => {
    setCipher(input);
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    const map = getMap();
    const reverseMap: Record<string, string> = Object.entries(map).reduce((acc, [k, v]) => {
      acc[v] = k;
      return acc;
    }, Object.create(null));

    // Cleanup input: only keep A/B and group into 5s
    const cleaned = input.toUpperCase().replace(/[^AB]/g, '');
    const groups = cleaned.match(/.{1,5}/g) || [];
    const decoded = groups.map(group => {
      if (group.length === 5) return reverseMap[group] || '?';
      return '';
    }).join('');
    setText(decoded);
  };

  const handleCopy = useCallback(() => {
    if (!cipher) return;
    navigator.clipboard.writeText(cipher);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [cipher]);

  const handleClear = useCallback(() => {
    setText('');
    setCipher('');
    setError(null);
    textareaRef.current?.focus();
  }, []);

  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && e.key !== 'Escape') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold dark:text-white">{t('baconian.mode_label', 'Baconian Variant')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('baconian.mode_desc', 'Choose between I/J=I and U/V=U (Standard) or full 26 letters (Extended)')}</p>
          </div>
        </div>
        <div className="flex gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          {(['standard', 'extended'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                // Trigger re-encode with new map
                const currentText = text;
                setText(currentText);
                const map = m === 'standard' ? BACONIAN_STANDARD : BACONIAN_EXTENDED;
                setCipher(currentText.toUpperCase().split('').map((char: string) => /[A-Z]/.test(char) ? map[char] : char).join(' '));
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                mode === m
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {t(`baconian.mode_${m}`, m.charAt(0).toUpperCase() + m.slice(1))}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="normal-text" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              {t('common.input')}
            </label>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!text && !cipher}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="normal-text"
            ref={textareaRef}
            value={text}
            onChange={(e) => encode(e.target.value)}
            placeholder={t('stringescaper.placeholder_input')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="cipher-text" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              {t('common.output')} (A/B)
            </label>
            <button
              onClick={handleCopy}
              disabled={!cipher}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1 border focus-visible:ring-2 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
              } disabled:opacity-50`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t('common.copied') : t('common.copy')}
              {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1 border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>}
            </button>
          </div>
          <textarea
            id="cipher-text"
            value={cipher}
            onChange={(e) => decode(e.target.value)}
            placeholder="AAAAA AAAAB ..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2 px-1">
          <Info className="w-4 h-4 text-indigo-500" /> {t('baconian.reference_title', 'Baconian Mapping')}
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3">
          {Object.entries(getMap()).map(([char, code]: [string, string]) => (
            <div key={char} className="flex flex-col items-center p-3 bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-indigo-500/30 transition-all">
              <span className="text-xs font-black text-slate-400 group-hover:text-indigo-500 transition-colors mb-1">{char}</span>
              <span className="text-[10px] font-black font-mono tracking-tighter dark:text-white">{code}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('baconian.about_title', 'About Baconian')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('baconian.about_text', 'The Baconian cipher is a method of steganography devised by Francis Bacon in 1605. It replaces each letter of the plaintext with a sequence of 5 characters, originally using different typefaces (A/B) to hide the message.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" /> {t('baconian.variants_title', 'Standard vs Extended')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('baconian.variants_text', 'The standard version uses the same code for I/J and U/V (as was common in 17th century Latin). The extended version provides unique 5-bit codes for all 26 letters of the modern English alphabet.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
