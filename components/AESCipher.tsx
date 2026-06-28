import { useState, useEffect, useCallback, useRef } from 'react';
import { Key, Lock, Unlock, Copy, Check, Trash2, Download, Info, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function AESCipher({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(true);

  useEffect(() => {
    onStateChange?.({ input, isEncrypting });
  }, [input, isEncrypting, onStateChange]);

  const deriveKey = async (pass: string, salt: Uint8Array) => {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(pass),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      } as Pbkdf2Params,
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  };

  const handleEncrypt = async () => {
    if (!input || !password) return;
    try {
      setError(null);
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt);
      const enc = new TextEncoder();
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(input)
      );

      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);

      const base64 = btoa(String.fromCharCode(...combined));
      setOutput(base64);
    } catch (e: any) {
      setError(t('aes.error_encrypt', 'Encryption failed: ') + e.message);
    }
  };

  const handleDecrypt = async () => {
    if (!input || !password) return;
    try {
      setError(null);
      const combined = new Uint8Array(atob(input).split('').map(c => c.charCodeAt(0)));
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encrypted = combined.slice(28);

      const key = await deriveKey(password, salt);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      const dec = new TextDecoder();
      setOutput(dec.decode(decrypted));
    } catch (e: any) {
      setError(t('aes.error_decrypt', 'Decryption failed. Please check your password and input data.'));
    }
  };

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
  }, []);

  const handlersRef = useRef({
    handleCopy,
    handleClear
  });

  useEffect(() => {
    handlersRef.current = { handleCopy, handleClear };
  }, [handleCopy, handleClear]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
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

      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => { setIsEncrypting(true); setOutput(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              isEncrypting
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" /> {t('common.encrypt')}
          </button>
          <button
            onClick={() => { setIsEncrypting(false); setOutput(''); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              !isEncrypting
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Unlock className="w-4 h-4" /> {t('common.decrypt')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="aes-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {isEncrypting ? t('common.input') : t('aes.encrypted_text', 'Encrypted Text (Base64)')}
              </label>
              <div className="flex items-center gap-2">
                <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
                <button
                  onClick={handleClear}
                  disabled={!input}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                >
                  <Trash2 className="w-3 h-3" /> {t('common.clear')}
                </button>
              </div>
            </div>
            <textarea
              id="aes-input"
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
              placeholder={isEncrypting ? t('aes.input_placeholder', 'Enter text to encrypt...') : t('aes.input_placeholder_dec', 'Enter Base64 data to decrypt...')}
              className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
            />
          </div>

          <div className="space-y-4">
            <label htmlFor="aes-password" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-500" /> {t('aes.password', 'Master Password')}
            </label>
            <div className="relative">
              <input
                id="aes-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('aes.pass_placeholder', 'Strong key for encryption...')}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white pr-12"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            onClick={isEncrypting ? handleEncrypt : handleDecrypt}
            disabled={!input || !password}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {isEncrypting ? t('common.encrypt') : t('common.decrypt')}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.result')}</label>
            <button
              onClick={handleCopy}
              disabled={!output}
              className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent'
              } disabled:opacity-50`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? t('common.copied') : t('common.copy')}
              {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/20 border-white/30 text-white/70 ml-1">C</Kbd>}
            </button>
          </div>
          <div className="w-full h-[360px] p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2.5rem] font-mono text-sm leading-relaxed overflow-y-auto break-all whitespace-pre-wrap">
            {output || <span className="text-slate-600 italic">{t('aes.waiting', 'Encryption/Decryption result will appear here...')}</span>}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('aes.about_title', 'Secure Encryption')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('aes.about_text', 'This tool uses AES-256-GCM (Galois/Counter Mode), a modern and highly secure authenticated encryption algorithm. Keys are derived from your password using PBKDF2 with 100,000 iterations and a random salt.')}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
            {t('common.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
