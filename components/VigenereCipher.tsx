import { useState, useEffect, useCallback } from 'react';
import { Lock, Unlock, Copy, Check, Trash2, Key, Info, AlertCircle } from 'lucide-react';

const MAX_LENGTH = 10000;

export function VigenereCipher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
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
      setError(`Le texte est trop long (max ${MAX_LENGTH.toLocaleString()} caractères).`);
      setResult('');
      return;
    }
    setError(null);
    setResult(processText(text, key, mode === 'encrypt'));
    onStateChange?.({ text, key, mode });
  }, [text, key, mode, processText]);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
    setKey('');
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode('encrypt')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === 'encrypt'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Lock className="w-4 h-4" /> Chiffrer
          </button>
          <button
            onClick={() => setMode('decrypt')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === 'decrypt'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Unlock className="w-4 h-4" /> Déchiffrer
          </button>
        </div>
        <button
          onClick={handleClear}
          disabled={!text && !key}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" /> Effacer tout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <label htmlFor="vigenere-key" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Key className="w-3 h-3" /> Clé Secrète
            </label>
            <input
              id="vigenere-key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.replace(/[^A-Za-z]/g, ''))}
              placeholder="Ex: SECRET"
              className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>

          <div className="space-y-4">
            <label htmlFor="vigenere-input" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              Texte à {mode === 'encrypt' ? 'chiffrer' : 'déchiffrer'}
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
              Résultat
            </label>
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
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <div
            id="vigenere-output"
            className="w-full h-[calc(100%-2rem)] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] font-mono text-lg leading-relaxed text-indigo-600 dark:text-indigo-400 break-all overflow-y-auto min-h-[300px]"
          >
            {result || <span className="text-slate-300 dark:text-slate-700 italic">Le résultat apparaîtra ici...</span>}
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
