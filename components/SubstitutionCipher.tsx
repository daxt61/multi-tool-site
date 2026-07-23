import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Shield, Copy, Check, Trash2, Shuffle, Info, AlertCircle, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';
import { getSecureRandomInt } from './ui/crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function SubstitutionCipher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  const [key, setKey] = useState('QWERTYUIOPASDFGHJKLZXCVBNM');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>(initialData?.mode || 'encrypt');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateKey = useCallback((k: string) => {
    const upperKey = k.toUpperCase().replace(/[^A-Z]/g, '');
    if (upperKey.length !== 26) return false;
    const seen = new Set(upperKey);
    return seen.size === 26;
  }, []);

  const processText = useCallback((text: string, cipherKey: string, currentMode: 'encrypt' | 'decrypt') => {
    if (!validateKey(cipherKey)) {
      setError(t('substitution.error_invalid_key', 'Key must contain all 26 letters of the alphabet exactly once.'));
      return '';
    }
    setError(null);

    const upperKey = cipherKey.toUpperCase();
    const map = new Map<string, string>();

    for (let i = 0; i < 26; i++) {
      if (currentMode === 'encrypt') {
        map.set(ALPHABET[i], upperKey[i]);
      } else {
        map.set(upperKey[i], ALPHABET[i]);
      }
    }

    return text.split('').map(char => {
      const isUpper = char === char.toUpperCase();
      const upperChar = char.toUpperCase();
      if (map.has(upperChar)) {
        const substituted = map.get(upperChar)!;
        return isUpper ? substituted : substituted.toLowerCase();
      }
      return char;
    }).join('');
  }, [t, validateKey]);

  const output = useMemo(() => processText(input, key, mode), [input, key, mode, processText]);

  useEffect(() => {
    // Sentinel: Never share the input (plaintext) or secret key in the URL state.
    onStateChange?.({ mode });
  }, [mode, onStateChange]);

  const handleRandomizeKey = () => {
    const chars = ALPHABET.split('');
    // Sentinel: Use Fisher-Yates shuffle with CSPRNG for unbiased, secure randomization
    for (let i = chars.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    setKey(chars.join(''));
    toast.success(t('substitution.key_randomized', 'Key randomized!'));
  };

  const handleClear = useCallback(() => {
    setInput('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `substitution-${mode}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlersRef = useRef({ handleCopy, handleClear });
  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isEditable && e.key !== 'Escape') return;
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 w-full space-y-4">
           <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('substitution.key_label', 'Substitution Key (26 letters)')}</label>
            <button
              onClick={handleRandomizeKey}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all"
            >
              <Shuffle className="w-3.5 h-3.5" /> {t('common.random')}
            </button>
          </div>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 26))}
            className={`w-full p-4 bg-slate-50 dark:bg-slate-900 border ${!validateKey(key) ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-2xl outline-none focus:ring-2 transition-all font-mono text-xl tracking-[0.2em] text-center dark:text-white`}
            placeholder="QWERTYUIOP..."
          />
          <div className="flex justify-center gap-2">
            {ALPHABET.split('').map((char, i) => (
              <div key={char} className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400">{char}</span>
                <span className={`text-xs font-mono font-bold ${key[i] ? 'text-indigo-600' : 'text-rose-400'}`}>{key[i] || '?'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setMode('encrypt')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'encrypt' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                {t('common.encrypt')}
              </button>
              <button
                onClick={() => setMode('decrypt')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'decrypt' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                {t('common.decrypt')}
              </button>
            </div>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
              <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
            </button>
          </div>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('substitution.placeholder_input', 'Enter text here...')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.result')}</label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!output}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <button
                onClick={handleCopy}
                disabled={!output}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-slate-200 dark:border-slate-700">C</Kbd>}
              </button>
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder={t('common.waiting')}
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Shield className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('substitution.about_title', 'About Substitution Cipher')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('substitution.about_text', 'A monoalphabetic substitution cipher is a method of encryption where each letter in the plaintext is replaced by a letter from a fixed scrambled alphabet (the key). It is more secure than simple rotation ciphers (like Caesar) because there are 26! (factorial) possible keys, making brute-force attacks difficult.')}
          </p>
        </div>
      </div>
    </div>
  );
}
