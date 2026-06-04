import { useState, useEffect, useCallback, useMemo } from 'react';
import { Binary, Copy, Check, Trash2, ArrowLeftRight, Download, Info, AlertCircle, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 100000;

export function BinaryReverser({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [padBits, setPadBits] = useState<number>(initialData?.padBits || 0);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ input, padBits });
  }, [input, padBits, onStateChange]);

  const reversed = useMemo(() => {
    if (!input) return '';

    const lines = input.split('\n');
    return lines.map((line: string) => {
      // Remove spaces and validate binary
      let clean = line.replace(/[^01]/g, '');
      if (!clean) return '';

      // Reverse bits
      let rev = clean.split('').reverse().join('');

      // Apply padding if requested
      if (padBits > 0 && rev.length < padBits) {
        rev = rev.padEnd(padBits, '0');
      }

      return rev;
    }).join('\n');
  }, [input, padBits]);

  const handleCopy = () => {
    if (!reversed) return;
    navigator.clipboard.writeText(reversed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!reversed) return;
    const blob = new Blob([reversed], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reversed-binary-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setInput('');
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Input */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="bin-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Binary className="w-4 h-4 text-indigo-500" /> {t('binaryreverser.input_label', 'Binary Input')}
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            id="bin-input"
            value={input}
            onChange={(e) => {
              if (e.target.value.length <= MAX_LENGTH) {
                setInput(e.target.value);
                setError(null);
              } else {
                setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
              }
            }}
            placeholder="01011010..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg dark:text-slate-300 resize-none"
          />
        </div>

        {/* Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 text-center">
            <div className="flex flex-col items-center gap-2 text-indigo-500">
               <Settings2 className="w-6 h-6" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('common.settings')}</span>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">{t('binaryreverser.padding', 'Bit Padding')}</label>
              <div className="grid grid-cols-2 gap-2">
                {[0, 8, 16, 32].map(bits => (
                  <button
                    key={bits}
                    onClick={() => setPadBits(bits)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                      padBits === bits
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {bits === 0 ? 'None' : bits}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                <ArrowLeftRight className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('binaryreverser.output_label', 'Reversed Bits')}
            </label>
            <div className="flex gap-2">
               <button
                 onClick={handleDownload}
                 disabled={!reversed}
                 className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
               >
                 <Download className="w-3.5 h-3.5" />
               </button>
               <button
                 onClick={handleCopy}
                 disabled={!reversed}
                 className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'} disabled:opacity-50`}
               >
                 {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
               </button>
            </div>
          </div>
          <textarea
            readOnly
            value={reversed}
            placeholder="Result will appear here..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-lg dark:text-slate-300 resize-none shadow-inner"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
         <Info className="w-6 h-6 text-indigo-600 mt-1 shrink-0" />
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">{t('binaryreverser.about_title', 'About Binary Reverser')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('binaryreverser.about_text', 'This tool reverses the order of bits in a binary number. You can provide multiple binary numbers, one per line. It also supports padding the output to standard bit widths like 8, 16, or 32 bits, which is useful for aligning data to byte boundaries.')}
            </p>
         </div>
      </div>
    </div>
  );
}
