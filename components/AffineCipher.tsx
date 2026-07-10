import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Key, Copy, Check, Trash2, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function AffineCipher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(initialData?.text || '');
  const [cipher, setCipher] = useState(initialData?.cipher || '');
  const [a, setA] = useState<number>(initialData?.a || 5);
  const [b, setB] = useState<number>(initialData?.b || 8);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ text, cipher, a, b });
  }, [text, cipher, a, b, onStateChange]);

  const gcd = (x: number, y: number): number => {
    while (y) {
      x %= y;
      [x, y] = [y, x];
    }
    return x;
  };

  const modInverse = (a: number, m: number): number | null => {
    a = ((a % m) + m) % m;
    for (let x = 1; x < m; x++) {
      if ((a * x) % m === 1) return x;
    }
    return null;
  };

  const isValidA = useMemo(() => gcd(a, 26) === 1, [a]);

  const encode = useCallback((input: string) => {
    setText(input);
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    if (!isValidA) {
      setError(t('affine.error_invalid_a', 'Key "a" must be coprime to 26.'));
      setCipher('');
      return;
    }
    setError(null);
    const encoded = input.split('').map(char => {
      if (/[a-zA-Z]/.test(char)) {
        const isUpper = char === char.toUpperCase();
        const x = char.toUpperCase().charCodeAt(0) - 65;
        const res = (a * x + b) % 26;
        const final = String.fromCharCode(((res + 26) % 26) + 65);
        return isUpper ? final : final.toLowerCase();
      }
      return char;
    }).join('');
    setCipher(encoded);
  }, [a, b, isValidA, t]);

  const decode = useCallback((input: string) => {
    setCipher(input);
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    if (!isValidA) {
      setError(t('affine.error_invalid_a', 'Key "a" must be coprime to 26.'));
      setText('');
      return;
    }
    setError(null);
    const aInv = modInverse(a, 26);
    if (aInv === null) return;

    const decoded = input.split('').map(char => {
      if (/[a-zA-Z]/.test(char)) {
        const isUpper = char === char.toUpperCase();
        const y = char.toUpperCase().charCodeAt(0) - 65;
        const res = (aInv * (y - b)) % 26;
        const final = String.fromCharCode(((res + 26) % 26) + 65);
        return isUpper ? final : final.toLowerCase();
      }
      return char;
    }).join('');
    setText(decoded);
  }, [a, b, isValidA, t]);

  // Handle value changes
  useEffect(() => {
    if (text) encode(text);
  }, [a, b, text, encode]);

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

      <div className="flex flex-col md:flex-row gap-8 items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black dark:text-white uppercase tracking-tight">{t('affine.keys_title', 'Cipher Keys')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('affine.formula', 'Formula: E(x) = (ax + b) mod 26')}</p>
          </div>
        </div>
        <div className="flex gap-6">
          <div className="space-y-2">
            <label htmlFor="affine-a" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Key A (Multiplier)</label>
            <input
              id="affine-a"
              type="number"
              value={a}
              onChange={(e) => setA(parseInt(e.target.value) || 0)}
              className={`w-24 p-3 bg-white dark:bg-slate-800 border ${isValidA ? 'border-slate-200 dark:border-slate-700' : 'border-rose-500'} rounded-xl font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white`}
            />
            {!isValidA && <p className="text-[9px] text-rose-500 font-bold text-center">GCD(A,26) must be 1</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="affine-b" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Key B (Shift)</label>
            <input
              id="affine-b"
              type="number"
              value={b}
              onChange={(e) => setB(parseInt(e.target.value) || 0)}
              className="w-24 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-center outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>
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
              {t('common.output')}
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
            placeholder={t('common.waiting')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('affine.about_title', 'About Affine Cipher')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('affine.about_text', 'The Affine cipher is a type of monoalphabetic substitution cipher, where each letter in an alphabet is mapped to its numeric equivalent, encrypted using a simple mathematical function, and converted back to a letter.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-500" /> {t('affine.security_title', 'Security Requirement')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('affine.security_text', 'For the cipher to be reversible, the key "a" must be coprime to the size of the alphabet (26). This means GCD(a, 26) must equal 1. Key "b" can be any integer.')}
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
