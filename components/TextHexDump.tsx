import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Binary, Copy, Check, Trash2, Download, Info, Settings2, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 50000;

export function TextHexDump({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || '');
  const [bytesPerLine, setBytesPerLine] = useState<number>(initialData?.bytesPerLine || 16);
  const [showOffset, setShowOffset] = useState(initialData?.showOffset ?? true);
  const [showAscii, setShowAscii] = useState(initialData?.showAscii ?? true);
  const [uppercase, setUppercase] = useState(initialData?.uppercase ?? true);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    onStateChange?.({ text, bytesPerLine, showOffset, showAscii, uppercase });
  }, [text, bytesPerLine, showOffset, showAscii, uppercase, onStateChange]);

  const hexDump = useMemo(() => {
    if (!text) return '';

    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    let result = '';

    for (let i = 0; i < bytes.length; i += bytesPerLine) {
      // Offset
      if (showOffset) {
        let offset = i.toString(16).padStart(8, '0');
        if (uppercase) offset = offset.toUpperCase();
        result += `${offset}  `;
      }

      // Hex bytes
      const chunk = bytes.slice(i, i + bytesPerLine);
      let hexPart = '';
      for (let j = 0; j < bytesPerLine; j++) {
        if (j < chunk.length) {
          let hex = chunk[j].toString(16).padStart(2, '0');
          if (uppercase) hex = hex.toUpperCase();
          hexPart += hex + ' ';
        } else {
          hexPart += '   ';
        }
        if (j === (bytesPerLine / 2) - 1) hexPart += ' ';
      }
      result += hexPart + ' ';

      // ASCII
      if (showAscii) {
        result += '|';
        for (let j = 0; j < chunk.length; j++) {
          const charCode = chunk[j];
          // Printable ASCII range
          if (charCode >= 32 && charCode <= 126) {
            result += String.fromCharCode(charCode);
          } else {
            result += '.';
          }
        }
        result += '|';
      }
      result += '\n';
    }

    return result;
  }, [text, bytesPerLine, showOffset, showAscii, uppercase]);

  const handleCopy = useCallback(() => {
    if (!hexDump) return;
    navigator.clipboard.writeText(hexDump);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [hexDump, t]);

  const handleClear = useCallback(() => {
    setText('');
    textareaRef.current?.focus();
  }, []);

  const handleDownload = () => {
    if (!hexDump) return;
    const blob = new Blob([hexDump], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hexdump-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
        handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClear, handleCopy]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="hexdump-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" /> {t('common.input')}
            </label>
            <div className="flex gap-2 items-center">
              <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!text}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={`${t('common.clear')} (Esc)`}
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
          </div>
          <textarea
            id="hexdump-input"
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
            placeholder={t('hexdump.placeholder')}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
          <div className="flex justify-between px-1">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               {text.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()} {t('common.characters')}
             </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-6">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
              </label>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-bold dark:text-slate-300">{t('hexdump.bytes_per_line')}</span>
                  <span className="text-sm font-mono font-black text-indigo-600">{bytesPerLine}</span>
                </div>
                <div className="flex gap-2">
                  {[8, 16, 24, 32].map(val => (
                    <button
                      key={val}
                      onClick={() => setBytesPerLine(val)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                        bytesPerLine === val
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: t('hexdump.show_offset'), state: showOffset, setState: setShowOffset },
                  { label: t('hexdump.show_ascii'), state: showAscii, setState: setShowAscii },
                  { label: t('hexdump.uppercase'), state: uppercase, setState: setUppercase },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => opt.setState(!opt.state)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      opt.state
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="font-bold text-xs">{opt.label}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      opt.state ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {opt.state && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Binary className="w-4 h-4 text-indigo-500" /> Hex Dump
          </h3>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={!hexDump}
              className="text-xs font-bold px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> {t('common.download')}
            </button>
            <button
              onClick={handleCopy}
              disabled={!hexDump}
              className={`text-xs font-bold px-6 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-indigo-600 text-white border-transparent shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
              } disabled:opacity-50`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? t('common.copied') : t('common.copy')}
              {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/20 border-white/20">C</Kbd>}
            </button>
          </div>
        </div>
        <div className="bg-slate-900 dark:bg-black rounded-[2.5rem] p-8 overflow-auto border border-slate-800 shadow-inner min-h-[400px]">
          <pre className="text-xs sm:text-sm font-mono text-emerald-500 leading-relaxed whitespace-pre selection:bg-emerald-500/20 selection:text-emerald-200">
            {hexDump || <span className="text-slate-700 italic">{t('hexdump.waiting')}</span>}
          </pre>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('hexdump.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('hexdump.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
