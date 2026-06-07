import { useState, useEffect, useMemo, useCallback } from 'react';
import { Copy, Check, Hash, Binary, Octagon, Hexagon, Info, Trash2, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function NumberConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  const [decimal, setDecimal] = useState(initialData?.decimal || '42');
  const [binary, setBinary] = useState(initialData?.binary || '101010');
  const [octal, setOctal] = useState(initialData?.octal || '52');
  const [hexadecimal, setHexadecimal] = useState(initialData?.hexadecimal || '2A');

  const [customBase, setCustomBase] = useState(initialData?.customBase || 12);
  const [customValue, setCustomValue] = useState(initialData?.customValue || '36');

  useEffect(() => {
    onStateChange?.({ decimal, binary, octal, hexadecimal, customBase, customValue });
  }, [decimal, binary, octal, hexadecimal, customBase, customValue]);

  const [copied, setCopied] = useState<string | null>(null);

  const isValidForBase = (value: string, base: number): boolean => {
    if (!value) return true;
    const regex = new RegExp(`^[${ALPHABET.slice(0, base)}]+$`, 'i');
    return regex.test(value);
  };

  const convertFromBase = (value: string, fromBase: number) => {
    if (!value) return BigInt(0);
    return value.split('').reduce((acc, char) => {
      return acc * BigInt(fromBase) + BigInt(ALPHABET.indexOf(char.toUpperCase()));
    }, BigInt(0));
  };

  const convertToBase = (num: bigint, toBase: number) => {
    if (num === BigInt(0)) return '0';
    let result = '';
    let temp = num;
    while (num > BigInt(0)) {
      result = ALPHABET[Number(num % BigInt(toBase))] + result;
      num = num / BigInt(toBase);
    }
    return result || '0';
  };

  const updateAllFromValue = (value: string, base: number) => {
    if (!value) {
      setDecimal('');
      setBinary('');
      setOctal('');
      setHexadecimal('');
      setCustomValue('');
      return;
    }

    if (!isValidForBase(value, base)) return;

    try {
      const num = convertFromBase(value, base);
      setDecimal(num.toString(10));
      setBinary(num.toString(2));
      setOctal(num.toString(8));
      setHexadecimal(num.toString(16).toUpperCase());
      setCustomValue(convertToBase(num, customBase));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCustomBaseChange = (newBase: number) => {
    const base = Math.max(2, Math.min(36, newBase));
    setCustomBase(base);
    if (decimal) {
      try {
        const num = BigInt(decimal);
        setCustomValue(convertToBase(num, base));
      } catch (e) {}
    }
  };

  const copyToClipboard = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setDecimal('');
    setBinary('');
    setOctal('');
    setHexadecimal('');
    setCustomValue('');
  };

  const BASE_CONFIGS = [
    { label: t('numberconverter.dec'), value: decimal, onChange: (v: string) => { setDecimal(v); updateAllFromValue(v, 10); }, placeholder: '0-9', id: 'dec', icon: <Hash className="w-4 h-4" /> },
    { label: t('numberconverter.bin'), value: binary, onChange: (v: string) => { setBinary(v); updateAllFromValue(v, 2); }, placeholder: '0-1', id: 'bin', icon: <Binary className="w-4 h-4" /> },
    { label: t('numberconverter.oct'), value: octal, onChange: (v: string) => { setOctal(v); updateAllFromValue(v, 8); }, placeholder: '0-7', id: 'oct', icon: <Octagon className="w-4 h-4" /> },
    { label: t('numberconverter.hex'), value: hexadecimal, onChange: (v: string) => { setHexadecimal(v); updateAllFromValue(v, 16); }, placeholder: '0-9, A-F', id: 'hex', icon: <Hexagon className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-end px-1">
        <button
          onClick={handleClear}
          disabled={!decimal && !binary && !octal && !hexadecimal && !customValue}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3.5 h-3.5" /> {t('common.clear')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BASE_CONFIGS.map((base) => (
          <div key={base.id} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <div className="text-indigo-500">{base.icon}</div>
                <label htmlFor={base.id} className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{base.label}</label>
              </div>
              <button
                onClick={() => copyToClipboard(base.value, base.id)}
                className={`p-2 rounded-xl transition-all border ${
                  copied === base.id
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 shadow-sm border-slate-100 dark:border-slate-700'
                }`}
                aria-label={t('numberconverter.copy', { label: base.label })}
              >
                {copied === base.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <input
              id={base.id}
              type="text"
              value={base.value}
              onChange={(e) => base.onChange(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder={base.placeholder}
            />
          </div>
        ))}
      </div>

      {/* Custom Base Section */}
      <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30 space-y-6">
         <div className="flex items-center gap-3 px-1">
            <Settings2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
               {t('numberconverter.custom_base', 'Custom Base Conversion')}
            </h3>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
            <div className="space-y-3">
               <label htmlFor="base-slider" className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                  {t('numberconverter.base_label', 'Base')}: <span className="text-indigo-600 dark:text-indigo-400 font-black font-mono">{customBase}</span>
               </label>
               <input
                 id="base-slider"
                 type="range"
                 min="2"
                 max="36"
                 value={customBase}
                 onChange={(e) => handleCustomBaseChange(Number(e.target.value))}
                 className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
               />
               <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                  <span>2</span>
                  <span>10</span>
                  <span>16</span>
                  <span>36</span>
               </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
               <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {t('numberconverter.value_in_base', 'Value in base {{base}}', { base: customBase })}
                  </span>
                  <button
                    onClick={() => copyToClipboard(customValue, 'custom')}
                    className={`p-2 rounded-xl transition-all border ${
                      copied === 'custom'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                        : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 shadow-sm border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    {copied === 'custom' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
               </div>
               <input
                 type="text"
                 value={customValue}
                 onChange={(e) => {
                    const v = e.target.value.toUpperCase();
                    setCustomValue(v);
                    updateAllFromValue(v, customBase);
                 }}
                 className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                 placeholder={t('numberconverter.custom_placeholder', 'Enter value...')}
               />
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">{t('numberconverter.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('numberconverter.about_text_extended', 'This tool supports conversion between any base from 2 to 36. It uses BigInt for arbitrary-precision arithmetic, allowing you to convert extremely large numbers without losing a single bit of information.')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
              <li className="flex gap-2">
                <span className="font-bold text-indigo-500">•</span>
                <span><span className="font-bold">Base 2 (Binary):</span> {t('numberconverter.bin_desc')}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-500">•</span>
                <span><span className="font-bold">Base 8 (Octal):</span> {t('numberconverter.oct_desc')}</span>
              </li>
            </ul>
            <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
              <li className="flex gap-2">
                <span className="font-bold text-indigo-500">•</span>
                <span><span className="font-bold">Base 10 (Decimal):</span> {t('numberconverter.dec_desc')}</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-500">•</span>
                <span><span className="font-bold">Base 16 (Hex):</span> {t('numberconverter.hex_desc')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
