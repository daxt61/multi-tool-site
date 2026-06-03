import { useState, useEffect, useCallback } from 'react';
import { Network, Copy, Check, RefreshCw, Trash2, Download, Settings2, ShieldCheck, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

export function RandomIPGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [count, setCount] = useState(initialData?.count ?? 10);
  const [version, setVersion] = useState<'v4' | 'v6'>(initialData?.version || 'v4');
  const [ips, setIps] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ count, version });
  }, [count, version, onStateChange]);

  const generateIPv4 = () => {
    return Array.from({ length: 4 }, () => getSecureRandomInt(256)).join('.');
  };

  const generateIPv6 = () => {
    return Array.from({ length: 8 }, () =>
      getSecureRandomInt(65536).toString(16).padStart(4, '0')
    ).join(':');
  };

  const generateIps = useCallback(() => {
    const limit = Math.max(1, Math.min(1000, count));
    const newIps = Array.from({ length: limit }, () =>
      version === 'v4' ? generateIPv4() : generateIPv6()
    );
    setIps(newIps);
    setCopied(false);
  }, [count, version]);

  const handleCopy = () => {
    if (ips.length === 0) return;
    navigator.clipboard.writeText(ips.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (ips.length === 0) return;
    const blob = new Blob([ips.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `random-ips-${version}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('common.count')}</label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 0)))}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('randomip.version', 'Version')}</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setVersion('v4')}
                    className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${version === 'v4' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    IPv4
                  </button>
                  <button
                    onClick={() => setVersion('v6')}
                    className={`flex-1 py-3 rounded-lg text-xs font-black transition-all ${version === 'v6' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    IPv6
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={generateIps}
            className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> {t('random.generate')}
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Network className="w-4 h-4 text-indigo-500" /> {t('common.result')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={ips.length === 0}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleCopy}
                disabled={ips.length === 0}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                  copied
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent"
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
          </div>
          <textarea
            readOnly
            value={ips.join('\n')}
            placeholder={t('randomip.placeholder', 'Generated IP addresses will appear here...')}
            className="w-full h-80 p-8 bg-slate-900 text-indigo-300 border border-slate-800 rounded-[2.5rem] font-mono text-sm leading-relaxed resize-none outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0 text-indigo-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold dark:text-white">{t('randomip.about_ipv4_title', 'IPv4 Addresses')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('randomip.about_ipv4_text', 'IPv4 addresses are 32-bit numbers typically expressed in dotted-decimal notation, consisting of four octets ranging from 0 to 255.')}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center flex-shrink-0 text-indigo-600">
            <Globe className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold dark:text-white">{t('randomip.about_ipv6_title', 'IPv6 Addresses')}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t('randomip.about_ipv6_text', 'IPv6 addresses are 128-bit numbers expressed in hexadecimal notation, providing a much larger address space than IPv4.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
