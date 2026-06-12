import { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, Unlock, Copy, Check, Trash2, Key, Info, AlertCircle, RotateCcw, Shuffle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

const MAX_LENGTH = 10000;

export function VigenereCipher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [key, setKey] = useState(initialData?.key || '');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>(initialData?.mode || 'encrypt');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processText = useCallback((input: string, cipherKey: string, isEncrypt: boolean) => {
    if (!input || !cipherKey) return '';

    const k = cipherKey.toUpperCase().replace(/[^A-Z]/g, '');
    if (k.length === 0) return '';

    let output = '';
    let j = 0;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char.match(/[a-z]/i)) {
        const isUpperCase = char === char.toUpperCase();
        const charCode = char.toUpperCase().charCodeAt(0) - 65;
        const keyCode = k[j % k.length].charCodeAt(0) - 65;

        let newCode;
        if (isEncrypt) {
          newCode = (charCode + keyCode) % 26;
        } else {
          newCode = (charCode - keyCode + 26) % 26;
        }

        const newChar = String.fromCharCode(newCode + 65);
        output += isUpperCase ? newChar : newChar.toLowerCase();
        j++;
      } else {
        output += char;
      }
    }
    return output;
  }, []);

  useEffect(() => {
    if (text.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      setResult('');
      return;
    }
    setError(null);
    setResult(processText(text, key, mode === 'encrypt'));
    // Sentinel: Never share the text or secret key in the URL state.
    onStateChange?.({ mode });
  }, [text, key, mode, processText, onStateChange]);

  const handleCopy = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleReset = useCallback(() => {
    setText('');
    setKey('');
    setError(null);
  }, []);

  const handleRandomizeKey = useCallback(() => {
    const length = 8 + getSecureRandomInt(5); // 8-12 chars
    let newKey = '';
    for (let i = 0; i < length; i++) {
      newKey += String.fromCharCode(65 + getSecureRandomInt(26));
    }
    setKey(newKey);
  }, []);

  // Keyboard Shortcuts
  const handlersRef = useRef({ handleReset, handleCopy, handleRandomizeKey });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy, handleRandomizeKey };
  }, [handleReset, handleCopy, handleRandomizeKey]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) {
        if (e.key === 'Escape') {
          handlersRef.current.handleReset();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handlersRef.current.handleRandomizeKey();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode('encrypt')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === 'encrypt'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Lock className="w-4 h-4" /> {t('common.encrypt')}
          </button>
          <button
            onClick={() => setMode('decrypt')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === 'decrypt'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Unlock className="w-4 h-4" /> {t('common.decrypt')}
          </button>
        </div>
        <div className="flex gap-2 items-center">
          <kbd className="hidden md:inline-flex items-center justify-center w-6 h-6 border rounded text-xs font-bold ml-1 transition-all bg-black/10 border-white/20 text-white/70 group-hover:bg-black/20 dark:bg-slate-100 dark:border-slate-200 dark:text-slate-400">Esc</kbd>
          <button
            onClick={handleReset}
            disabled={!text && !key}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">{t('common.reset')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="vigenere-key" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Key className="w-3 h-3" /> {t('hmac.secret_key')}
              </label>
              <div className="flex gap-2 items-center">
                <kbd className="hidden md:inline-flex items-center justify-center w-6 h-6 border rounded text-xs font-bold ml-1 transition-all bg-black/10 border-white/20 text-white/70 group-hover:bg-black/20 dark:bg-slate-100 dark:border-slate-200 dark:text-slate-400">R</kbd>
                <button
                  onClick={handleRandomizeKey}
                  className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <Shuffle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">{t('passwordgenerator.regenerate')}</span>
                </button>
              </div>
            </div>
            <input
              id="vigenere-key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.replace(/[^A-Za-z]/g, ''))}
              placeholder="Ex: SECRET"
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>

          <div className="space-y-4">
            <label htmlFor="vigenere-input" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              {mode === 'encrypt' ? t('common.encrypt') : t('common.decrypt')}
            </label>
            <textarea
              id="vigenere-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Entrez votre message ici..."
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="vigenere-output" className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('common.result')}
            </label>
            <div className="flex gap-2 items-center">
              <kbd className="hidden md:inline-flex items-center justify-center w-6 h-6 border rounded text-xs font-bold ml-1 transition-all bg-black/10 border-white/20 text-white/70 group-hover:bg-black/20 dark:bg-slate-100 dark:border-slate-200 dark:text-slate-400">C</kbd>
              <button
                onClick={handleCopy}
                disabled={!result}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <div
            id="vigenere-output"
            className="w-full h-[calc(100%-2rem)] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] font-mono text-lg leading-relaxed text-indigo-600 dark:text-indigo-400 break-all overflow-y-auto min-h-[300px] shadow-xl shadow-indigo-500/5"
          >
            {result || <span className="text-slate-300 dark:text-slate-700 italic">{t('base64.placeholder_base64')}</span>}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 space-y-4">
        <h4 className="font-bold dark:text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" /> C'est quoi le chiffre de Vigenère ?
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Le chiffre de Vigenère est une méthode de chiffrement polyalphabétique. Contrairement au Chiffre de César qui utilise un décalage fixe, Vigenère utilise une <strong>clé</strong> dont chaque lettre définit un décalage différent. C'est en quelque sorte plusieurs chiffres de César appliqués successivement.
        </p>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest">
          Sécurité : Cet outil est destiné à l'apprentissage et à l'amusement. Pour des données sensibles, utilisez des méthodes de chiffrement modernes comme AES.
        </p>
      </div>
    </div>
  );
}
