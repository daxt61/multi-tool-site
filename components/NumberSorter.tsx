import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SortAsc, SortDesc, Trash2, Copy, Check, Hash, Info, Download, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NumberSorter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [order, setOrder] = useState<'asc' | 'desc'>(initialData?.order || 'asc');
  const [criterion, setCriterion] = useState<'value' | 'abs' | 'digitSum' | 'digitCount'>(initialData?.criterion || 'value');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, order, criterion });
  }, [input, order, criterion, onStateChange]);

  const getDigitSum = (n: number) => {
    return Math.abs(Math.floor(n)).toString().split('').reduce((sum, d) => sum + (parseInt(d) || 0), 0);
  };

  const getDigitCount = (n: number) => {
    return Math.abs(Math.floor(n)).toString().length;
  };

  const sortedNumbers = useMemo(() => {
    const nums = input
      .split(/[,\s;\n]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s !== '' && !isNaN(Number(s)))
      .map(Number);

    return nums.sort((a: number, b: number) => {
      let comparison = 0;
      switch (criterion) {
        case 'value':
          comparison = a - b;
          break;
        case 'abs':
          comparison = Math.abs(a) - Math.abs(b);
          break;
        case 'digitSum':
          comparison = getDigitSum(a) - getDigitSum(b);
          break;
        case 'digitCount':
          comparison = getDigitCount(a) - getDigitCount(b);
          break;
      }
      return order === 'asc' ? comparison : -comparison;
    });
  }, [input, order, criterion]);

  const output = useMemo(() => sortedNumbers.join('\n'), [sortedNumbers]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sorted-numbers-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [output]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-slate-400">
              <Hash className="w-4 h-4 text-indigo-500" />
              <label htmlFor="number-input" className="text-xs font-black uppercase tracking-widest">{t('common.input')}</label>
            </div>
            <button
              onClick={() => setInput('')}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> {t('common.clear')}
            </button>
          </div>
          <textarea
            id="number-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="10, -5, 42, 3.14..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Options & Output Section */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('numsorter.criterion', 'Sort Criterion')}</label>
                <select
                  value={criterion}
                  onChange={(e) => setCriterion(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                >
                  <option value="value">{t('numsorter.crit_value', 'Numerical Value')}</option>
                  <option value="abs">{t('numsorter.crit_abs', 'Absolute Value')}</option>
                  <option value="digitSum">{t('numsorter.crit_digit_sum', 'Sum of Digits')}</option>
                  <option value="digitCount">{t('numsorter.crit_digit_count', 'Number of Digits')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{t('numsorter.order', 'Order')}</label>
                <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setOrder('asc')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${order === 'asc' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    <SortAsc className="w-3.5 h-3.5" /> {t('numsorter.asc', 'Ascending')}
                  </button>
                  <button
                    onClick={() => setOrder('desc')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${order === 'desc' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    <SortDesc className="w-3.5 h-3.5" /> {t('numsorter.desc', 'Descending')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2 text-slate-400">
                <ArrowUpDown className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-black uppercase tracking-widest">{t('common.result')}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="text-xs font-bold px-3 py-1 rounded-full text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Download className="w-3 h-3" /> {t('common.download')}
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 border focus:visible:ring-2 focus:visible:ring-indigo-500 focus-visible:outline-none ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              className="w-full h-[250px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('numsorter.about_title', 'About Number Sorter')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('numsorter.about_text', 'This tool allows you to sort lists of numbers using various mathematical criteria. You can sort by standard numerical value, absolute value (ignoring signs), the sum of their individual digits, or by the number of digits they contain. It handles multiple separators such as commas, spaces, or semicolons.')}
          </p>
        </div>
      </div>
    </div>
  );
}
