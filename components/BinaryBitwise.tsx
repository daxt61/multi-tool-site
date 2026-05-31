import { useState, useEffect, useMemo } from 'react';
import { Binary, Copy, Check, Trash2, RefreshCw, Hash, Info, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function BinaryBitwise({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [valA, setValA] = useState(initialData?.valA || '0');
  const [valB, setValB] = useState(initialData?.valB || '0');
  const [base, setBase] = useState<'bin' | 'dec' | 'hex'>(initialData?.base || 'bin');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ valA, valB, base });
  }, [valA, valB, base, onStateChange]);

  const parseValue = (val: string, b: 'bin' | 'dec' | 'hex') => {
    try {
      if (b === 'bin') return BigInt('0b' + val.replace(/[^01]/g, ''));
      if (b === 'hex') return BigInt('0x' + val.replace(/[^0-9a-fA-F]/g, ''));
      return BigInt(val.replace(/[^0-9]/g, ''));
    } catch {
      return 0n;
    }
  };

  const results = useMemo(() => {
    const a = parseValue(valA, base);
    const b = parseValue(valB, base);

    return {
      and: a & b,
      or: a | b,
      xor: a ^ b,
      notA: ~a,
      notB: ~b,
      lshift: a << 1n,
      rshift: a >> 1n
    };
  }, [valA, valB, base]);

  const formatResult = (val: bigint, b: 'bin' | 'dec' | 'hex') => {
    if (b === 'bin') return val.toString(2);
    if (b === 'hex') return val.toString(16).toUpperCase();
    return val.toString(10);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setValA('0');
    setValB('0');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Configuration & Inputs */}
      <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-2 px-1">
            <Binary className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('binarybitwise.title')}</h3>
          </div>
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            {(['bin', 'dec', 'hex'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBase(b)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${
                  base === b
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('binarybitwise.val_a')}</label>
            <input
              type="text"
              value={valA}
              onChange={(e) => setValA(e.target.value)}
              className="w-full p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('binarybitwise.val_b')}</label>
            <input
              type="text"
              value={valB}
              onChange={(e) => setValB(e.target.value)}
              className="w-full p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-center">
           <button
             onClick={handleClear}
             className="px-6 py-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
           >
             <Trash2 className="w-4 h-4" /> {t('common.clear')}
           </button>
        </div>
      </section>

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { id: 'and', label: 'AND (&)', value: results.and },
          { id: 'or', label: 'OR (|)', value: results.or },
          { id: 'xor', label: 'XOR (^)', value: results.xor },
          { id: 'notA', label: 'NOT A (~)', value: results.notA },
          { id: 'lshift', label: 'A << 1', value: results.lshift },
          { id: 'rshift', label: 'A >> 1', value: results.rshift },
        ].map((res) => {
          const formatted = formatResult(res.value, base);
          return (
            <div key={res.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 hover:border-indigo-500/30 transition-all group">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">{res.label}</span>
                <button
                  onClick={() => handleCopy(formatted, res.id)}
                  className={`p-2 rounded-xl transition-all ${
                    copied === res.id
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800'
                  }`}
                >
                  {copied === res.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="font-mono text-lg break-all dark:text-slate-200 min-h-[3rem]">
                {formatted}
              </div>
            </div>
          );
        })}
      </div>

      {/* Educational Content */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('binarybitwise.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('binarybitwise.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
