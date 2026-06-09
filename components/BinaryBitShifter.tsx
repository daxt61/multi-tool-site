import { useState, useEffect, useCallback, useMemo } from 'react';
import { Binary, Copy, Check, Trash2, Download, Info, AlertCircle, RefreshCw, Settings2, ArrowLeftRight, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_BITS = 10000;

type ShiftType = 'lsl' | 'lsr' | 'asr' | 'rol' | 'ror';

export function BinaryBitShifter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [input, setInput] = useState(initialData?.input || '');
  const [shiftAmount, setShiftAmount] = useState(initialData?.shiftAmount ?? 1);
  const [shiftType, setShiftType] = useState<ShiftType>(initialData?.shiftType || 'lsl');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ input, shiftAmount, shiftType });
  }, [input, shiftAmount, shiftType, onStateChange]);

  const processShift = useCallback(() => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    const cleanInput = input.replace(/[^01]/g, '');
    if (cleanInput.length > MAX_BITS) {
      setError(t('error.max_length', { max: MAX_BITS }));
      return;
    }
    if (cleanInput.length === 0) return;

    setError(null);
    const len = cleanInput.length;
    const amount = ((shiftAmount % len) + len) % len;
    let result = '';

    switch (shiftType) {
      case 'lsl': // Logical Shift Left
        result = cleanInput.slice(amount).padEnd(len, '0');
        break;
      case 'lsr': // Logical Shift Right
        result = cleanInput.slice(0, len - amount).padStart(len, '0');
        break;
      case 'asr': // Arithmetic Shift Right (preserves MSB)
        const msb = cleanInput[0];
        result = cleanInput.slice(0, len - amount).padStart(len, msb);
        break;
      case 'rol': // Rotate Left
        result = cleanInput.slice(amount) + cleanInput.slice(0, amount);
        break;
      case 'ror': // Rotate Right
        result = cleanInput.slice(len - amount) + cleanInput.slice(0, len - amount);
        break;
    }

    setOutput(result);
  }, [input, shiftAmount, shiftType, t]);

  useEffect(() => {
    processShift();
  }, [processShift]);

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
    const a = document.createElement('a');
    a.href = url;
    a.download = `bit-shift-${shiftType}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('bitshifter.shift_type')}</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'lsl', label: 'Logical Left Shift (<<)' },
                    { id: 'lsr', label: 'Logical Right Shift (>>)' },
                    { id: 'asr', label: 'Arithmetic Right Shift' },
                    { id: 'rol', label: 'Rotate Left (ROL)' },
                    { id: 'ror', label: 'Rotate Right (ROR)' }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setShiftType(type.id as ShiftType)}
                      className={`px-4 py-3 rounded-xl text-xs font-bold text-left transition-all border ${shiftType === type.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 hover:border-indigo-500'}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="shift-amount" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('bitshifter.amount')}</label>
                <div className="flex items-center gap-4">
                   <input
                     id="shift-amount"
                     type="number"
                     min="0"
                     max={input.length || 64}
                     value={shiftAmount}
                     onChange={(e) => setShiftAmount(parseInt(e.target.value) || 0)}
                     className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                   />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inputs/Outputs */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="bit-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Binary className="w-4 h-4 text-indigo-500" /> {t('common.input')} (Binary)
              </label>
              <button
                onClick={() => setInput('')}
                disabled={!input}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
              </button>
            </div>
            <textarea
              id="bit-input"
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/[^01\s\n]/g, ''))}
              placeholder="10110011..."
              className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          <div className="flex justify-center py-2">
             <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500">
                <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0" />
             </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</label>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  className={`text-xs font-bold px-4 py-1.5 rounded-xl transition-all border flex items-center gap-2 ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-indigo-600 hover:border-indigo-500/50'
                  } disabled:opacity-50`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? t('common.copied') : t('common.copy')}
                </button>
              </div>
            </div>
            <div className="w-full min-h-[160px] p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-lg leading-relaxed text-indigo-600 dark:text-indigo-400 break-all whitespace-pre-wrap shadow-inner">
              {output || <span className="text-slate-300 dark:text-slate-700 italic">{t('bitcounter.waiting')}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('bitshifter.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bitshifter.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
