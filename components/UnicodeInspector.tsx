import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Info, Trash2, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 1000;

export function UnicodeInspector({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || 'Hello 👋');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input });
  }, [input, onStateChange]);

  const handleClear = useCallback(() => {
    setInput('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, []);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(t('common.copied'));
    setTimeout(() => setCopiedId(null), 2000);
  }, [t]);

  const handlersRef = useRef({ handleClear, handleCopy });

  useEffect(() => {
    handlersRef.current = { handleClear, handleCopy };
  }, [handleClear, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        // If an editable element is focused, only clear if it's OUR textarea.
        // Otherwise, do nothing (let other elements handle Escape).
        if (isEditable && activeElement !== textareaRef.current) {
          return;
        }

        e.preventDefault();
        handlersRef.current.handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const characters = useMemo(() => {
    // Use Array.from first to correctly handle surrogate pairs, then slice
    const allChars = Array.from(input) as string[];
    const visibleChars = allChars.slice(0, MAX_LENGTH);

    return visibleChars.map((char: string, index: number) => {
      const codePoint = char.codePointAt(0) || 0;
      return {
        char,
        hex: 'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0'),
        decimal: codePoint.toString(),
        entity: `&#${codePoint};`,
        index
      };
    });
  }, [input]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="unicode-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-500" /> {t('common.input')}
          </label>
          <div className="flex items-center gap-2">
            <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
            <button
              onClick={handleClear}
              disabled={!input}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
        </div>
        <textarea
          id="unicode-input"
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('stringescaper.placeholder_input')}
          autoComplete="off"
          spellCheck={false}
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
        <div className="flex justify-between px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>{t(characters.length > 1 ? 'unicode.characters' : 'unicode.character', { count: characters.length })}</span>
          {input.length > MAX_LENGTH && <span className="text-amber-500">{t('unicode.limit_reached', { max: MAX_LENGTH })}</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {characters.map((item, idx) => (
          <div key={`${idx}-${item.char}`} data-testid="char-card" className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-3 hover:border-indigo-500/50 transition-all relative">
            <div className="text-4xl h-12 flex items-center justify-center dark:text-white mb-1">
              {item.char === ' ' ? <span className="text-slate-300 text-xs uppercase font-black">{t('unicode.space')}</span> : item.char}
            </div>

            <div className="w-full space-y-1.5">
              <button
                onClick={() => handleCopy(item.hex, `hex-${idx}`)}
                title={t('common.copy')}
                className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group/btn"
              >
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">HEX</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-indigo-500">{item.hex}</span>
                  {copiedId === `hex-${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover/btn:opacity-100 transition-opacity" />}
                </div>
              </button>

              <button
                onClick={() => handleCopy(item.decimal, `dec-${idx}`)}
                title={t('common.copy')}
                className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group/btn"
              >
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">DEC</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">{item.decimal}</span>
                  {copiedId === `dec-${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover/btn:opacity-100 transition-opacity" />}
                </div>
              </button>

              <button
                onClick={() => handleCopy(item.entity, `ent-${idx}`)}
                title={t('common.copy')}
                className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group/btn"
              >
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">HTML</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 truncate max-w-[60px]">{item.entity}</span>
                  {copiedId === `ent-${idx}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-300 opacity-0 group-hover/btn:opacity-100 transition-opacity" />}
                </div>
              </button>
            </div>

            <div className="absolute top-2 left-2 text-[8px] font-black text-slate-300 dark:text-slate-700">
              #{item.index + 1}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('unicode.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('unicode.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
