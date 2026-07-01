import { useState, useEffect, useCallback } from 'react';
import { Globe, Copy, Check, Trash2, ArrowRightLeft, Info, AlertCircle, Hash, Binary } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function IPConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [ip, setIp] = useState(initialData?.ip || '192.168.1.1');
  const [decimal, setDecimal] = useState('');
  const [hex, setHex] = useState('');
  const [binary, setBinary] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const ipv4ToDecimal = (ip: string) => {
    const parts = ip.split('.');
    if (parts.length !== 4) return null;
    return parts.reduce((acc, part) => {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0 || num > 255) throw new Error('Invalid octet');
      return (acc << 8n) + BigInt(num);
    }, 0n);
  };

  const decimalToIpv4 = (num: bigint) => {
    if (num < 0n || num > 0xFFFFFFFFn) return null;
    const parts = [];
    for (let i = 0; i < 4; i++) {
      parts.unshift((num & 0xFFn).toString());
      num >>= 8n;
    }
    return parts.join('.');
  };

  const updateFromIp = useCallback((val: string) => {
    setIp(val);
    if (!val.trim()) {
      setDecimal('');
      setHex('');
      setBinary('');
      setError('');
      return;
    }
    try {
      const dec = ipv4ToDecimal(val);
      if (dec !== null) {
        setDecimal(dec.toString());
        setHex('0x' + dec.toString(16).toUpperCase().padStart(8, '0'));
        setBinary(dec.toString(2).padStart(32, '0').match(/.{8}/g)!.join('.'));
        setError('');
      } else {
        setDecimal('');
        setHex('');
        setBinary('');
      }
    } catch (e) {
      setError(t('ipconverter.invalid_ip', 'Invalid IPv4 address'));
      setDecimal('');
      setHex('');
      setBinary('');
    }
  }, [t]);

  const updateFromDecimal = (val: string) => {
    setDecimal(val);
    if (!val.trim()) {
      setIp('');
      setHex('');
      setBinary('');
      setError('');
      return;
    }
    try {
      const num = BigInt(val);
      const ipv4 = decimalToIpv4(num);
      if (ipv4) {
        setIp(ipv4);
        setHex('0x' + num.toString(16).toUpperCase().padStart(8, '0'));
        setBinary(num.toString(2).padStart(32, '0').match(/.{8}/g)!.join('.'));
        setError('');
      } else {
        setError(t('ipconverter.invalid_decimal', 'Invalid Decimal IP'));
        setIp('');
        setHex('');
        setBinary('');
      }
    } catch (e) {
      setError(t('ipconverter.invalid_decimal', 'Invalid Decimal IP'));
      setIp('');
      setHex('');
      setBinary('');
    }
  };

  useEffect(() => {
    updateFromIp(ip);
  }, []); // Initial load

  useEffect(() => {
    onStateChange?.({ ip, decimal, hex, binary });
  }, [ip, decimal, hex, binary, onStateChange]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setIp('');
    setDecimal('');
    setHex('');
    setBinary('');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* IPv4 Input */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              <label htmlFor="ip-input" className="text-xs font-black uppercase tracking-widest text-slate-400">IPv4 Address</label>
            </div>
            <button
              onClick={() => handleCopy(ip, 'ip')}
              className={`p-2 rounded-xl transition-all ${copied === 'ip' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-indigo-500'}`}
            >
              {copied === 'ip' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <input
            id="ip-input"
            type="text"
            value={ip}
            onChange={(e) => updateFromIp(e.target.value)}
            placeholder="192.168.1.1"
            className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
          />
        </div>

        {/* Decimal Input */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" />
              <label htmlFor="dec-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Decimal (Integer)</label>
            </div>
            <button
              onClick={() => handleCopy(decimal, 'dec')}
              className={`p-2 rounded-xl transition-all ${copied === 'dec' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-indigo-500'}`}
            >
              {copied === 'dec' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <input
            id="dec-input"
            type="text"
            value={decimal}
            onChange={(e) => updateFromDecimal(e.target.value)}
            placeholder="3232235777"
            className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
          />
        </div>

        {/* Hex Output */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Hexadecimal</label>
            </div>
            <button
              onClick={() => handleCopy(hex, 'hex')}
              className={`p-2 rounded-xl transition-all ${copied === 'hex' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-indigo-500'}`}
            >
              {copied === 'hex' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xl dark:text-indigo-400 text-indigo-600 truncate">
            {hex || '0x00000000'}
          </div>
        </div>

        {/* Binary Output */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Binary</label>
            </div>
            <button
              onClick={() => handleCopy(binary, 'bin')}
              className={`p-2 rounded-xl transition-all ${copied === 'bin' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-400 hover:text-indigo-500'}`}
            >
              {copied === 'bin' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-base dark:text-indigo-400 text-indigo-600 truncate">
            {binary || '00000000.00000000.00000000.00000000'}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
        >
          <Trash2 className="w-4 h-4" /> {t('common.clear')}
        </button>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 shrink-0 mt-1" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('ipconverter.about_title', 'About IP Conversion')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('ipconverter.about_text', 'An IPv4 address is essentially a 32-bit number. While we usually write it in dotted-decimal notation (e.g., 192.168.1.1) for human readability, computers often process it as a single integer, a hexadecimal value, or a raw binary string. This tool helps you convert between these different representations.')}
          </p>
        </div>
      </div>
    </div>
  );
}
