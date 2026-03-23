import { useState } from 'react';
import { Copy, Check, Hash, Binary, Octagon, Hexagon, Info, Trash2 } from 'lucide-react';

export function NumberConverter() {
  const [decimal, setDecimal] = useState('42');
  const [binary, setBinary] = useState('101010');
  const [octal, setOctal] = useState('52');
  const [hexadecimal, setHexadecimal] = useState('2A');
  const [copied, setCopied] = useState<string | null>(null);

  const BASE_CONFIGS = [
    { label: 'Décimal (Base 10)', value: decimal, onChange: (v: string) => updateFromDecimal(v), placeholder: '0-9', id: 'dec', icon: Hash },
    { label: 'Binaire (Base 2)', value: binary, onChange: (v: string) => updateFromBinary(v), placeholder: '0-1', id: 'bin', icon: Binary },
    { label: 'Octal (Base 8)', value: octal, onChange: (v: string) => updateFromOctal(v), placeholder: '0-7', id: 'oct', icon: Octagon },
    { label: 'Hexadécimal (Base 16)', value: hexadecimal, onChange: (v: string) => updateFromHexadecimal(v.toUpperCase()), placeholder: '0-9, A-F', id: 'hex', icon: Hexagon },
  ];

  const isValidNumber = (value: string, base: number): boolean => {
    if (!value) return false;
    const re = base === 2 ? /^[01]+$/ : base === 8 ? /^[0-7]+$/ : base === 10 ? /^[0-9]+$/ : /^[0-9A-Fa-f]+$/;
    return re.test(value);
  };

  const updateFromDecimal = (value: string) => {
    setDecimal(value);
    if (isValidNumber(value, 10)) {
      const num = parseInt(value, 10);
      setBinary(num.toString(2));
      setOctal(num.toString(8));
      setHexadecimal(num.toString(16).toUpperCase());
    } else if (value === '') {
      clearAll();
    }
  };

  const updateFromBinary = (value: string) => {
    setBinary(value);
    if (isValidNumber(value, 2)) {
      const num = parseInt(value, 2);
      setDecimal(num.toString(10));
      setOctal(num.toString(8));
      setHexadecimal(num.toString(16).toUpperCase());
    } else if (value === '') {
      clearAll();
    }
  };

  const updateFromOctal = (value: string) => {
    setOctal(value);
    if (isValidNumber(value, 8)) {
      const num = parseInt(value, 8);
      setDecimal(num.toString(10));
      setBinary(num.toString(2));
      setHexadecimal(num.toString(16).toUpperCase());
    } else if (value === '') {
      clearAll();
    }
  };

  const updateFromHexadecimal = (value: string) => {
    setHexadecimal(value);
    if (isValidNumber(value, 16)) {
      const num = parseInt(value, 16);
      setDecimal(num.toString(10));
      setBinary(num.toString(2));
      setOctal(num.toString(8));
    } else if (value === '') {
      clearAll();
    }
  };

  const clearAll = () => {
    setDecimal('');
    setBinary('');
    setOctal('');
    setHexadecimal('');
  };

  const copyToClipboard = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end px-1">
        {(decimal || binary || octal || hexadecimal) && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-4 py-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl"
            aria-label="Effacer tout"
          >
            <Trash2 className="w-4 h-4" /> Effacer
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BASE_CONFIGS.map((base) => (
          <div key={base.id} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm group hover:border-indigo-500/50 transition-all">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <div className="text-indigo-500"><base.icon className="w-4 h-4" /></div>
                <label htmlFor={`input-${base.id}`} className="text-xs font-black uppercase tracking-widest text-slate-400">{base.label}</label>
              </div>
              <button
                onClick={() => copyToClipboard(base.value, base.id)}
                disabled={!base.value}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                  copied === base.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 border border-slate-100 dark:border-slate-700 shadow-sm disabled:opacity-50'
                }`}
              >
                {copied === base.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === base.id ? 'Copié' : 'Copier'}
              </button>
            </div>
            <input
              id={`input-${base.id}`}
              type="text"
              value={base.value}
              onChange={(e) => base.onChange(e.target.value)}
              className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder={base.placeholder}
            />
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">À propos des bases numériques</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
              <li className="flex gap-2">
                <span className="font-bold text-indigo-500">•</span>
                <span><span className="font-bold">Binaire :</span> Système de base 2 (0 et 1), langage fondamental des processeurs.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-500">•</span>
                <span><span className="font-bold">Octal :</span> Système de base 8, utilisé pour les permissions Unix par exemple.</span>
              </li>
            </ul>
            <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
              <li className="flex gap-2">
                <span className="font-bold text-indigo-500">•</span>
                <span><span className="font-bold">Décimal :</span> Système de base 10, le standard universel pour le comptage.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-500">•</span>
                <span><span className="font-bold">Hexadécimal :</span> Système de base 16, idéal pour condenser le binaire.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
