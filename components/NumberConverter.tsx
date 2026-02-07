import { useState } from 'react';
import { Copy, Check, Hash, Binary, Octagon, Hexagon, Info } from 'lucide-react';

const BASE_CONFIGS = [
  { label: 'Décimal (Base 10)', getter: (s: any) => s.decimal, onChange: (v: string, s: any) => s.updateFromDecimal(v), placeholder: '0-9', id: 'dec' },
  { label: 'Binaire (Base 2)', getter: (s: any) => s.binary, onChange: (v: string, s: any) => s.updateFromBinary(v), placeholder: '0-1', id: 'bin' },
  { label: 'Octal (Base 8)', getter: (s: any) => s.octal, onChange: (v: string, s: any) => s.updateFromOctal(v), placeholder: '0-7', id: 'oct' },
  { label: 'Hexadécimal (Base 16)', getter: (s: any) => s.hexadecimal, onChange: (v: string, s: any) => s.updateFromHexadecimal(v.toUpperCase()), placeholder: '0-9, A-F', id: 'hex' },
];

export function NumberConverter() {
  const [decimal, setDecimal] = useState('42');
  const [binary, setBinary] = useState('101010');
  const [octal, setOctal] = useState('52');
  const [hexadecimal, setHexadecimal] = useState('2A');
  const [copied, setCopied] = useState<string | null>(null);

  const isValidNumber = (value: string, base: number): boolean => {
    if (!value) return false;
    try {
      parseInt(value, base);
      return true;
    } catch {
      return false;
    }
  };

  const updateFromDecimal = (value: string) => {
    setDecimal(value);
    try {
      const num = BigInt(value);
      setBinary(num.toString(2));
      setOctal(num.toString(8));
      setHexadecimal(num.toString(16).toUpperCase());
    } catch {
      // Fallback for non-numeric input
    }
  };

  const updateFromBinary = (value: string) => {
    setBinary(value);
    try {
      const num = BigInt('0b' + value);
      setDecimal(num.toString(10));
      setOctal(num.toString(8));
      setHexadecimal(num.toString(16).toUpperCase());
    } catch {
    }
  };

  const updateFromOctal = (value: string) => {
    setOctal(value);
    try {
      const num = BigInt('0o' + value);
      setDecimal(num.toString(10));
      setBinary(num.toString(2));
      setHexadecimal(num.toString(16).toUpperCase());
    } catch {
    }
  };

  const updateFromHexadecimal = (value: string) => {
    setHexadecimal(value);
    try {
      const num = BigInt('0x' + value);
      setDecimal(num.toString(10));
      setBinary(num.toString(2));
      setOctal(num.toString(8));
    } catch {
    }
  };

  const copyToClipboard = (val: string, id: string) => {
    navigator.clipboard.writeText(val);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getIcon = (id: string) => {
    switch(id) {
      case 'dec': return <Hash className="w-4 h-4" />;
      case 'bin': return <Binary className="w-4 h-4" />;
      case 'oct': return <Octagon className="w-4 h-4" />;
      case 'hex': return <Hexagon className="w-4 h-4" />;
      default: return <Hash className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {BASE_CONFIGS.map((base) => (
          <div key={base.id} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                <div className="text-indigo-500">{getIcon(base.id)}</div>
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">{base.label}</label>
              </div>
              <button
                onClick={() => copyToClipboard(base.getter({decimal, binary, octal, hexadecimal}), base.id)}
                className={`p-2 rounded-xl transition-all ${copied === base.id ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700'}`}
              >
                {copied === base.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <input
              type="text"
              value={base.getter({decimal, binary, octal, hexadecimal})}
              onChange={(e) => base.onChange(e.target.value, {updateFromDecimal, updateFromBinary, updateFromOctal, updateFromHexadecimal})}
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
                <span><span className="font-bold">Binaire :</span> Système de base 2, utilisé par les ordinateurs au niveau le plus bas.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-500">•</span>
                <span><span className="font-bold">Octal :</span> Système de base 8, utilisé parfois en informatique pour grouper les bits par trois.</span>
              </li>
            </ul>
            <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2">
              <li className="flex gap-2">
                <span className="font-bold text-indigo-500">•</span>
                <span><span className="font-bold">Décimal :</span> Système de base 10, le système standard utilisé par les humains.</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-indigo-500">•</span>
                <span><span className="font-bold">Hexadécimal :</span> Système de base 16, largement utilisé en programmation et pour les couleurs.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
