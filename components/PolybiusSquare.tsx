import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Grid3X3, Copy, Check, Trash2, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 50000;

export function PolybiusSquare({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(initialData?.text || '');
  const [cipher, setCipher] = useState(initialData?.cipher || '');
  const [size, setSize] = useState<5 | 6>(initialData?.size || 5);
  const [key, setKey] = useState(initialData?.key || '');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ text, cipher, size, key });
  }, [text, cipher, size, key, onStateChange]);

  const square = useMemo(() => {
    const alphabet = size === 5
      ? "ABCDEFGHIKLMNOPQRSTUVWXYZ" // No J
      : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let combined = (key.toUpperCase() + alphabet).replace(/[^A-Z0-9]/g, '');
    if (size === 5) combined = combined.replace(/J/g, 'I');

    const unique = Array.from(new Set(combined.split(''))).slice(0, size * size);
    const grid: string[][] = [];
    for (let i = 0; i < size; i++) {
      grid.push(unique.slice(i * size, (i + 1) * size));
    }
    return grid;
  }, [size, key]);

  const map = useMemo(() => {
    const charToCoord: Record<string, string> = Object.create(null);
    const coordToChar: Record<string, string> = Object.create(null);

    square.forEach((row, r) => {
      row.forEach((char, c) => {
        const coord = `${r + 1}${c + 1}`;
        charToCoord[char] = coord;
        coordToChar[coord] = char;
      });
    });

    return { charToCoord, coordToChar };
  }, [square]);

  const encode = (input: string) => {
    setText(input);
    if (input.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    const encoded = input.toUpperCase().split('').map(char => {
      let lookup = char;
      if (size === 5 && char === 'J') lookup = 'I';
      return map.charToCoord[lookup] || char;
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
    // Cleanup: keep digits and spaces
    const parts = input.trim().split(/\s+/);
    const decoded = parts.map(part => {
      if (/^[1-6]{2}$/.test(part)) return map.coordToChar[part] || '?';
      return part.length === 1 ? part : '?';
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
    <div className="max-w-6xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
              <Grid3X3 className="w-4 h-4 text-indigo-500" /> {t('polybius.config', 'Square Configuration')}
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('polybius.size', 'Grid Size')}</label>
                <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  {([5, 6] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                        size === s
                          ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {s}x{s} {s === 5 ? '(A-Z)' : '(A-Z, 0-9)'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="poly-key" className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('common.key', 'Key / Keyword')}</label>
                <input
                  id="poly-key"
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder={t('polybius.key_placeholder', 'OPTIONAL KEYWORD...')}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${size + 1}, minmax(0, 1fr))` }}>
                <div />
                {Array.from({ length: size }).map((_, i) => (
                  <div key={i} className="text-center text-[10px] font-black text-indigo-500/50">{i + 1}</div>
                ))}
                {square.map((row, r) => (
                  <div key={r} className="contents">
                    <div className="text-right pr-2 text-[10px] font-black text-indigo-500/50 flex items-center justify-end">{r + 1}</div>
                    {row.map((char, c) => (
                      <div key={c} className="aspect-square bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md flex items-center justify-center text-xs font-bold dark:text-slate-300">
                        {char}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
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
              className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="cipher-text" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                {t('common.output')} (Coordinates)
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
              placeholder="11 12 13 ..."
              className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('polybius.about_title', 'About Polybius Square')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('polybius.about_text', 'The Polybius Square is a device invented by the ancient Greek historian Polybius. It works by replacing each letter with its coordinates in a grid (usually 5x5 for the English alphabet, combining I and J).')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-indigo-500" /> {t('polybius.variants_title', 'Custom Grids')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('polybius.variants_text', 'While the 5x5 grid is standard, a 6x6 grid can include both letters and numbers. Adding a keyword shuffles the grid, making it much harder to crack without knowing the secret key.')}
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
