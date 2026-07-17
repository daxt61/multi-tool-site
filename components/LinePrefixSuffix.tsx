import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { WrapText, Copy, Check, Trash2, Download, Settings2, Type, Info, ListOrdered } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;

export function LinePrefixSuffix({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [input, setInput] = useState<string>(initialData?.input || '');
  const [prefix, setPrefix] = useState<string>(initialData?.prefix || '');
  const [suffix, setSuffix] = useState<string>(initialData?.suffix || '');
  const [trimLines, setTrimLines] = useState<boolean>(initialData?.trimLines ?? false);
  const [skipEmpty, setSkipEmpty] = useState<boolean>(initialData?.skipEmpty ?? false);

  // Line Numbering options
  const [enableNumbering, setEnableNumbering] = useState<boolean>(initialData?.enableNumbering ?? false);
  const [numPosition, setNumPosition] = useState<'prefix' | 'suffix'>(initialData?.numPosition || 'prefix');
  const [numStart, setNumStart] = useState<number>(initialData?.numStart ?? 1);
  const [numStep, setNumStep] = useState<number>(initialData?.numStep ?? 1);
  const [numSeparator, setNumSeparator] = useState<string>(initialData?.numSeparator || '. ');
  const [numPadding, setNumPadding] = useState<number>(initialData?.numPadding ?? 0);

  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    onStateChange?.({
      input,
      prefix,
      suffix,
      trimLines,
      skipEmpty,
      enableNumbering,
      numPosition,
      numStart,
      numStep,
      numSeparator,
      numPadding
    });
  }, [input, prefix, suffix, trimLines, skipEmpty, enableNumbering, numPosition, numStart, numStep, numSeparator, numPadding, onStateChange]);

  const output = useMemo(() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) {
      return t('error.max_length', { max: MAX_LENGTH.toLocaleString() });
    }

    const lines = input.split('\n');
    let lineIdx = 0;

    return lines
      .map((line) => {
        let processedLine = line;
        if (trimLines) {
          processedLine = processedLine.trim();
        }

        if (skipEmpty && processedLine === '') {
          return null; // Will filter out
        }

        // Apply numbering if enabled
        let numStr = '';
        if (enableNumbering) {
          const currentNum = numStart + lineIdx * numStep;
          numStr = currentNum.toString();
          if (numPadding > 0) {
            numStr = numStr.padStart(numPadding, '0');
          }
          lineIdx++;
        }

        let resultLine = processedLine;
        if (enableNumbering) {
          if (numPosition === 'prefix') {
            resultLine = `${numStr}${numSeparator}${resultLine}`;
          } else {
            resultLine = `${resultLine}${numSeparator}${numStr}`;
          }
        }

        // Apply general prefix and suffix
        resultLine = `${prefix}${resultLine}${suffix}`;

        return resultLine;
      })
      .filter((line) => line !== null)
      .join('\n');
  }, [input, prefix, suffix, trimLines, skipEmpty, enableNumbering, numPosition, numStart, numStep, numSeparator, numPadding, t]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [output, t]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `prefix-suffix-text-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.download_success'));
  }, [output, t]);

  const handleClear = useCallback(() => {
    setInput('');
    setPrefix('');
    setSuffix('');
    setTrimLines(false);
    setSkipEmpty(false);
    setEnableNumbering(false);
    setNumPosition('prefix');
    setNumStart(1);
    setNumStep(1);
    setNumSeparator('. ');
    setNumPadding(0);
    inputRef.current?.focus();
  }, []);

  const handlersRef = useRef({ handleClear });
  useEffect(() => {
    handlersRef.current = { handleClear };
  }, [handleClear]);

  // Local keydown handler to prevent global collision
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handlersRef.current.handleClear();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" onKeyDown={handleKeyDown}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Options */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-4">
              {/* Prefix Input */}
              <div className="space-y-2">
                <label htmlFor="pref-input" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('lineprefixsuffix.prefix_label', 'Prefix')}
                </label>
                <input
                  id="pref-input"
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder={t('lineprefixsuffix.prefix_placeholder', 'Prepend...')}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>

              {/* Suffix Input */}
              <div className="space-y-2">
                <label htmlFor="suff-input" className="text-[10px] font-bold text-slate-400 uppercase px-1">
                  {t('lineprefixsuffix.suffix_label', 'Suffix')}
                </label>
                <input
                  id="suff-input"
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder={t('lineprefixsuffix.suffix_placeholder', 'Append...')}
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>

              {/* Formatting Toggles */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={trimLines}
                    onChange={(e) => setTrimLines(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {t('lineprefixsuffix.trim_lines', 'Trim whitespace from lines')}
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={skipEmpty}
                    onChange={(e) => setSkipEmpty(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {t('lineprefixsuffix.skip_empty', 'Skip empty lines')}
                  </span>
                </label>
              </div>

              {/* Line Numbering Configuration */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableNumbering}
                    onChange={(e) => setEnableNumbering(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ListOrdered className="w-3.5 h-3.5 text-indigo-500" /> {t('lineprefixsuffix.enable_numbering', 'Add Line Numbers')}
                  </span>
                </label>

                {enableNumbering && (
                  <div className="space-y-4 pl-7 animate-in fade-in slide-in-from-top-1 duration-200">
                    {/* Position Selection */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase px-1">
                        {t('lineprefixsuffix.num_position', 'Numbering Position')}
                      </label>
                      <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setNumPosition('prefix')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${numPosition === 'prefix' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                        >
                          {t('lineprefixsuffix.as_prefix', 'As Prefix')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setNumPosition('suffix')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${numPosition === 'suffix' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                        >
                          {t('lineprefixsuffix.as_suffix', 'As Suffix')}
                        </button>
                      </div>
                    </div>

                    {/* Numeric parameters */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label htmlFor="num-start" className="text-[10px] font-bold text-slate-400 uppercase">
                          {t('linenumberadder.start', 'Start')}
                        </label>
                        <input
                          id="num-start"
                          type="number"
                          value={numStart}
                          onChange={(e) => setNumStart(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="num-step" className="text-[10px] font-bold text-slate-400 uppercase">
                          {t('linenumberadder.step', 'Step')}
                        </label>
                        <input
                          id="num-step"
                          type="number"
                          value={numStep}
                          onChange={(e) => setNumStep(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label htmlFor="num-sep" className="text-[10px] font-bold text-slate-400 uppercase">
                          {t('linenumberadder.separator', 'Separator')}
                        </label>
                        <input
                          id="num-sep"
                          type="text"
                          value={numSeparator}
                          onChange={(e) => setNumSeparator(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="num-padding" className="text-[10px] font-bold text-slate-400 uppercase">
                          {t('linenumberadder.padding', 'Padding')}
                        </label>
                        <input
                          id="num-padding"
                          type="number"
                          min="0"
                          max="10"
                          value={numPadding}
                          onChange={(e) => setNumPadding(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Input/Output */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input Text Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="input-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-500" /> {t('common.input')}
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none rounded-lg px-2 py-1"
                aria-label={t('common.clear')}
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
                <Kbd modifier={null} className="ml-1 border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
              </button>
            </div>
            <textarea
              id="input-text"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('lineprefixsuffix.placeholder', 'Enter text to add prefixes/suffixes...')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          {/* Output Text Area */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="output-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <WrapText className="w-4 h-4 text-indigo-500" /> {t('common.output')}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                  aria-label={t('common.download')}
                >
                  <Download className="w-3.5 h-3.5" /> {t('common.download')}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200'
                      : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  } disabled:opacity-50`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              id="output-text"
              value={output}
              readOnly
              className="w-full h-64 p-6 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2rem] outline-none font-mono text-sm leading-relaxed resize-none"
              placeholder={t('common.waiting')}
            />
          </div>
        </div>
      </div>

      {/* Educational Block */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('lineprefixsuffix.about_title', 'About Line Prefix & Suffix')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t(
              'lineprefixsuffix.about_text',
              'This tool allows you to easily format a list of items by adding characters or numbers to the start and end of every single line. It is highly valued for wrapping SQL arrays, converting lists of words into quotes with trailing commas, adding code indentation, or prefixing sequences with custom formatting.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
