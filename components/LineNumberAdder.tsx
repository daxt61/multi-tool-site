import { useState, useEffect, useMemo, useCallback } from 'react';
import { ListOrdered, Copy, Check, Trash2, Download, Settings2, Hash, Type } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function LineNumberAdder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [start, setStart] = useState(initialData?.start ?? 1);
  const [step, setStep] = useState(initialData?.step ?? 1);
  const [separator, setSeparator] = useState(initialData?.separator || '. ');
  const [padding, setPadding] = useState(initialData?.padding ?? 0);
  const [align, setAlign] = useState<'left' | 'right'>(initialData?.align || 'left');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, start, step, separator, padding, align });
  }, [input, start, step, separator, padding, align, onStateChange]);

  const output = useMemo(() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) return t('error.max_length', { max: MAX_LENGTH.toLocaleString() });

    const lines = input.split('\n');
    return lines.map((line: string, index: number) => {
      const num = start + (index * step);
      let numStr = num.toString();

      if (padding > 0) {
        numStr = numStr.padStart(padding, '0');
      }

      if (align === 'right' && padding > 0) {
        numStr = numStr.padStart(padding, ' ');
      }

      return `${numStr}${separator}${line}`;
    }).join('\n');
  }, [input, start, step, separator, padding, align, t]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `numbered-text-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('linenumberadder.start', 'Start Number')}</label>
                <input
                  type="number"
                  value={start}
                  onChange={(e) => setStart(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('linenumberadder.step', 'Step')}</label>
                <input
                  type="number"
                  value={step}
                  onChange={(e) => setStep(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('linenumberadder.separator', 'Separator')}</label>
                <input
                  type="text"
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('linenumberadder.padding', 'Padding Width')}</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={padding}
                  onChange={(e) => setPadding(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('linenumberadder.align', 'Alignment')}</label>
                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setAlign('left')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${align === 'left' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    {t('common.align_left', 'Left')}
                  </button>
                  <button
                    onClick={() => setAlign('right')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${align === 'right' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'}`}
                  >
                    {t('common.align_right', 'Right')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="input-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-500" /> {t('common.input')}
              </label>
              <button
                onClick={() => setInput('')}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
            <textarea
              id="input-text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('linenumberadder.placeholder', 'Enter text to add line numbers...')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="output-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-indigo-500" /> {t('common.output')}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" /> {t('common.download')}
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}
