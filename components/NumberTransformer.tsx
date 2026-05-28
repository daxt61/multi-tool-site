import { useState, useMemo, useEffect, useCallback } from 'react';
import { Hash, RefreshCw, Copy, Check, Trash2, Download, AlertCircle, Settings2, Info, ArrowRightLeft, Plus, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function NumberTransformer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [copied, setCopied] = useState(false);
  const [increment, setIncrement] = useState(initialData?.increment || 1);
  const [separator, setSeparator] = useState(initialData?.separator || ',');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, increment, separator });
  }, [input, increment, separator, onStateChange]);

  const processNumbers = useCallback((fn: (n: string) => string) => {
    if (!input || input.length > MAX_LENGTH) return;
    const lines = input.split('\n');
    const processed = lines.map((line: string) => {
      // Find all numbers in the line
      return line.replace(/-?\d+(\.\d+)?/g, (match: string) => fn(match));
    });
    setInput(processed.join('\n'));
  }, [input]);

  const reverseDigits = () => {
    processNumbers(n => {
      const isNegative = n.startsWith('-');
      const absN = isNegative ? n.slice(1) : n;
      const reversed = absN.split('').reverse().join('');
      return isNegative ? `-${reversed}` : reversed;
    });
  };

  const handleIncrement = (val: number) => {
    processNumbers(n => {
      const num = parseFloat(n);
      if (isNaN(num)) return n;
      const result = num + val;
      return Number.isInteger(result) ? result.toString() : result.toFixed(2).replace(/\.?0+$/, '');
    });
  };

  const addSeparators = () => {
    processNumbers(n => {
      const parts = n.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
      return parts.join('.');
    });
  };

  const removeSeparators = () => {
    const lines = input.split('\n');
    const processed = lines.map((line: string) => {
      // Remove specific separator from within digit sequences
      const regex = new RegExp(`(\\d)\\${separator}(\\d)`, 'g');
      let newLine = line;
      while (regex.test(newLine)) {
        newLine = newLine.replace(regex, '$1$2');
      }
      return newLine;
    });
    setInput(processed.join('\n'));
  };

  const handleCopy = useCallback(() => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [input]);

  const handleDownload = useCallback(() => {
    if (!input) return;
    const blob = new Blob([input], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.body.appendChild(document.createElement('a'));
    a.href = url;
    a.download = `numbers-transformed-${Date.now()}.txt`;
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [input]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="num-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" /> {t('numstats.input_label')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!input}
                className="text-xs font-bold px-3 py-1.5 rounded-xl text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setInput('')}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleCopy}
                disabled={!input}
                className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            id="num-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="12345&#10;67.89&#10;1000000"
            className="w-full h-[500px] p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg dark:text-slate-300 resize-none"
          />
        </div>

        {/* Tools Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
             <div className="flex items-center gap-2 text-indigo-500 px-1">
              <Settings2 className="w-4 h-4" />
              <h3 className="font-black uppercase tracking-widest text-[10px] text-slate-400">{t('common.options')}</h3>
            </div>

            {/* Transform Actions */}
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={reverseDigits}
                disabled={!input}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all group disabled:opacity-50"
              >
                <span className="font-bold text-sm">Reverse Digits</span>
                <ArrowRightLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              </button>

              {/* Increment/Decrement */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="font-bold text-sm">Add / Subtract</span>
                  <input
                    type="number"
                    value={increment}
                    onChange={(e) => setIncrement(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-center outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleIncrement(increment)}
                    disabled={!input}
                    className="flex items-center justify-center gap-2 p-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                  <button
                    onClick={() => handleIncrement(-increment)}
                    disabled={!input}
                    className="flex items-center justify-center gap-2 p-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black hover:bg-slate-300 dark:hover:bg-slate-600 transition-all disabled:opacity-50"
                  >
                    <Minus className="w-3 h-3" /> Sub
                  </button>
                </div>
              </div>

              {/* Separators */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3">
                <div className="flex justify-between items-center px-1">
                  <span className="font-bold text-sm">Separators</span>
                  <select
                    value={separator}
                    onChange={(e) => setSeparator(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none px-2 py-1"
                  >
                    <option value=",">Comma (,)</option>
                    <option value=".">Dot (.)</option>
                    <option value=" ">Space</option>
                    <option value="_">Underscore (_)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={addSeparators}
                    disabled={!input}
                    className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-all disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={removeSeparators}
                    disabled={!input}
                    className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-100 transition-all disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('numtransformer.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('numtransformer.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
