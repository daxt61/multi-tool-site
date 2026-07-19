import { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, Copy, Check, Trash2, Download, AlertCircle, Info, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100000;

export function AnsiEscapeStripper({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState(initialData?.input || '\\x1b[31mHello\\x1b[0m \\x1b[4mWorld\\x1b[0m');
  const [mode, setMode] = useState<'all' | 'color'>(initialData?.mode || 'all');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, mode });
  }, [input, mode, onStateChange]);

  const parseInputWithEscapes = (str: string) => {
    // Converts literal \x1b or \u001b to actual escape characters for convenience
    return str
      .replace(/\\x1b/gi, '\x1B')
      .replace(/\\u001b/gi, '\x1B')
      .replace(/\\e/gi, '\x1B')
      .replace(/\\033/g, '\x1B');
  };

  const processedOutput = (() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) return '';

    const actualString = parseInputWithEscapes(input);

    if (mode === 'color') {
      // SGR (Select Graphic Rendition) colors and styles only: \x1b[...m
      const sgrRegex = /[\u001b\u009b]\[[0-9;]*m/g;
      return actualString.replace(sgrRegex, '');
    } else {
      // General ANSI escape sequences
      const generalRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
      return actualString.replace(generalRegex, '');
    }
  })();

  const handleCopy = () => {
    if (!processedOutput) return;
    navigator.clipboard.writeText(processedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('common.copied', 'Copied to clipboard!'));
  };

  const handleClear = useCallback(() => {
    setInput('');
    setError(null);
    inputRef.current?.focus();
  }, []);

  const handleDownload = () => {
    if (!processedOutput) return;
    const blob = new Blob([processedOutput], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `stripped-ansi-${Date.now()}.txt`);
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'File downloaded'));
  };

  const handleInputChange = (val: string) => {
    if (val.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }
    setError(null);
    setInput(val);
  };

  // Local Keyboard Shortcuts (Escape to clear on input)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="ansi-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-500" /> {t('ansiescapestripper.input_label', 'Text with ANSI codes')}
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                disabled={!input}
                className="text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('common.clear', 'Clear')}
                <Kbd modifier={null}>Esc</Kbd>
              </button>
            </div>
          </div>
          <textarea
            id="ansi-input"
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('ansiescapestripper.placeholder_input', 'e.g., \\x1b[31mHello\\x1b[0m')}
            spellCheck={false}
            className="w-full h-96 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm resize-none dark:text-slate-300"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" /> {t('ansiescapestripper.output_label', 'Stripped output')}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                disabled={!processedOutput}
                className="p-2 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-30"
                aria-label={t('common.copy', 'Copy')}
                title={t('common.copy', 'Copy')}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleDownload}
                disabled={!processedOutput}
                className="p-2 text-slate-400 hover:text-emerald-500 transition-colors disabled:opacity-30"
                aria-label={t('common.download', 'Download')}
                title={t('common.download', 'Download')}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            id="ansi-output"
            value={processedOutput}
            readOnly
            placeholder={t('ansiescapestripper.placeholder_output', 'Clean output will appear here...')}
            className="w-full h-96 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none font-mono text-sm resize-none dark:text-slate-300"
          />
        </div>
      </div>

      {/* Options & Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
          <div className="flex items-center gap-2 text-indigo-500 px-1">
            <Settings2 className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options', 'Options')}</h3>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('ansiescapestripper.mode_label', 'Stripping Mode')}</label>
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setMode('all')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t('ansiescapestripper.mode_all', 'Strip All (Colors & Control)')}
              </button>
              <button
                onClick={() => setMode('color')}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'color' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t('ansiescapestripper.mode_color', 'Colors/Styling Only')}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
          <Info className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="font-bold dark:text-white">{t('ansiescapestripper.about_title', 'About ANSI Escape Stripper')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('ansiescapestripper.about_text', 'ANSI escape sequences are used to control formatting, color, and other output options on text terminals. This utility extracts clean plain text from log files, terminal outputs, or code by stripping those sequences.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
