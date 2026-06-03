import { useState, useEffect, useMemo } from 'react';
import { WrapText, Copy, Check, Trash2, Download, Settings2, Type, Scissors } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function TextWrapper({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [width, setWidth] = useState(initialData?.width ?? 80);
  const [breakWords, setBreakWords] = useState(initialData?.breakWords ?? false);
  const [wrapChar, setWrapChar] = useState(initialData?.wrapChar || '\n');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, width, breakWords, wrapChar });
  }, [input, width, breakWords, wrapChar, onStateChange]);

  const output = useMemo(() => {
    if (!input) return '';
    if (input.length > MAX_LENGTH) return t('error.max_length', { max: MAX_LENGTH.toLocaleString() });

    const wrap = (text: string, limit: number) => {
      if (breakWords) {
        const regex = new RegExp(`.{1,${limit}}`, 'g');
        return text.match(regex)?.join(wrapChar) || text;
      }

      const words = text.split(/\s+/);
      let result = '';
      let currentLine = '';

      words.forEach((word) => {
        if ((currentLine + word).length > limit) {
          result += (result ? wrapChar : '') + currentLine.trim();
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      });

      if (currentLine) {
        result += (result ? wrapChar : '') + currentLine.trim();
      }

      return result;
    };

    return input.split('\n').map((line: string) => wrap(line, width)).join('\n');
  }, [input, width, breakWords, wrapChar, t]);

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
    link.download = `wrapped-text-${Date.now()}.txt`;
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
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">{t('textwrapper.width', 'Wrap Width')}</label>
                  <span className="text-xs font-bold text-indigo-500 font-mono">{width}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">{t('textwrapper.break_words', 'Break Words')}</label>
                <button
                  onClick={() => setBreakWords(!breakWords)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${breakWords ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${breakWords ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('textwrapper.wrap_char', 'Wrap Character')}</label>
                <select
                  value={wrapChar}
                  onChange={(e) => setWrapChar(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="\n">New Line (\n)</option>
                  <option value=" ">Space</option>
                  <option value=", ">Comma</option>
                  <option value="|">Pipe (|)</option>
                </select>
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
              placeholder={t('textwrapper.placeholder', 'Enter text to wrap...')}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="output-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <WrapText className="w-4 h-4 text-indigo-500" /> {t('common.output')}
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
