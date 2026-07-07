import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Network, Info, Globe, Server, ShieldCheck, Copy, Check, Binary, Zap, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';

export function SubnetCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const [ip, setIp] = useState(initialData?.ip || '192.168.1.1');
  const [cidr, setCidr] = useState(initialData?.cidr ?? 24);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    onStateChange?.({ ip, cidr });
  }, [ip, cidr, onStateChange]);

  const handleReset = useCallback(() => {
    setIp('192.168.1.1');
    setCidr(24);
    inputRef.current?.focus();
  }, []);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused) {
        // Local Escape handler on input will be added in JSX
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleReset();
      } else if (e.key.toLowerCase() === "c") {
        const results = calculateSubnet(ip, cidr);
        if (results) {
          e.preventDefault();
          handleCopy(results.network, t('subnet.network_address'));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleReset, handleCopy, ip, cidr, t]);

  const calculateSubnet = (ipStr: string, prefix: number) => {
    try {
      const parts = ipStr.split('.').map(Number);
      if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
        return null;
      }

      const ipNum = ((parts[0] << 24) >>> 0) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
      const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      const wildcard = ~mask >>> 0;

      const networkNum = (ipNum & mask) >>> 0;
      const broadcastNum = (networkNum | ~mask) >>> 0;

      // RFC 3021: /31 subnets have 2 usable hosts
      const numHosts = prefix === 31 ? 2 : (prefix === 32 ? 1 : Math.max(0, broadcastNum - networkNum - 1));
      const totalHosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : (broadcastNum - networkNum + 1);

      const toIp = (num: number) => [
        (num >>> 24) & 255,
        (num >>> 16) & 255,
        (num >>> 8) & 255,
        num & 255
      ].join('.');

      const toBinary = (num: number) => {
        return (num >>> 0).toString(2).padStart(32, '0').match(/.{8}/g)!.join('.');
      };

      return {
        network: toIp(networkNum),
        networkBin: toBinary(networkNum),
        broadcast: toIp(broadcastNum),
        broadcastBin: toBinary(broadcastNum),
        mask: toIp(mask),
        maskBin: toBinary(mask),
        wildcard: toIp(wildcard),
        wildcardBin: toBinary(wildcard),
        cidr: prefix,
        firstHost: prefix === 31 ? toIp(networkNum) : (prefix === 32 ? toIp(networkNum) : toIp(networkNum + 1)),
        lastHost: prefix === 31 ? toIp(broadcastNum) : (prefix === 32 ? toIp(networkNum) : toIp(broadcastNum - 1)),
        numHosts: Math.max(0, numHosts),
        totalHosts
      };
    } catch (e) {
      return null;
    }
  };

  const results = useMemo(() => calculateSubnet(ip, cidr), [ip, cidr]);


  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 shadow-sm">
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('subnet.config_title')}</h3>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 outline-none"
                  aria-label={t('common.reset')}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t('common.reset')}
                  <Kbd modifier={null} className="ml-1 hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="ip-input" className="text-xs font-bold text-slate-500 px-1">{t('subnet.ip_address')}</label>
                  <input
                    id="ip-input"
                    ref={inputRef}
                    type="text"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        handleReset();
                      }
                    }}
                    placeholder="e.g. 192.168.1.1"
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor="cidr-input" className="text-xs font-bold text-slate-500">{t('subnet.cidr_mask')}</label>
                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">/{cidr}</span>
                  </div>
                  <input
                    id="cidr-input"
                    type="range"
                    min="0"
                    max="32"
                    value={cidr}
                    onChange={(e) => setCidr(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                    <span>/0</span>
                    <span>/16</span>
                    <span>/32</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/10 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="flex items-center gap-3 relative z-10">
              <Info className="w-5 h-5 opacity-50" />
              <h4 className="text-lg font-black">{t('subnet.what_is_cidr')}</h4>
            </div>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed relative z-10">
              {t('subnet.cidr_desc')}
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-8 space-y-6">
          {!results ? (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-8 rounded-[2.5rem] text-center space-y-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-rose-600 dark:text-rose-400 font-bold">{t('subnet.error_invalid_ip')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: t('subnet.network_address'), value: results.network, bin: results.networkBin, icon: <Network className="w-4 h-4" /> },
                  { label: t('subnet.broadcast_address'), value: results.broadcast, bin: results.broadcastBin, icon: <Globe className="w-4 h-4" /> },
                  { label: t('subnet.subnet_mask'), value: results.mask, bin: results.maskBin, icon: <ShieldCheck className="w-4 h-4" /> },
                  { label: t('subnet.wildcard_mask'), value: results.wildcard, bin: results.wildcardBin, icon: <Zap className="w-4 h-4" /> },
                ].map((item, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-3 group transition-all hover:border-indigo-500/30 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-indigo-500 transition-colors">
                          {item.icon}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(item.value, item.label)}
                        className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${copied === item.label ? 'bg-emerald-50 text-emerald-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'} focus-visible:ring-2 focus-visible:ring-indigo-500 outline-none`}
                        title={item.label === t('subnet.network_address') ? `${t('common.copy')} (C)` : t('common.copy')}
                      >
                        {copied === item.label ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {item.label === t('subnet.network_address') && !copied && (
                          <Kbd modifier={null} className="hidden sm:inline-flex ml-0.5 border-slate-200 dark:border-slate-700 text-slate-400">C</Kbd>
                        )}
                      </button>
                    </div>
                    <div>
                      <div className="text-xl font-black font-mono dark:text-white truncate">
                        {item.value}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                        <Binary className="w-3 h-3" /> {item.bin}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 dark:bg-black p-8 rounded-[2rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mb-32 -mr-32"></div>

                <div className="grid grid-cols-2 gap-8 w-full md:w-auto relative z-10">
                   <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{t('subnet.usable_hosts')}</p>
                    <h4 className="text-3xl font-black font-mono text-indigo-400">{results.numHosts.toLocaleString()}</h4>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{t('subnet.total_hosts')}</p>
                    <h4 className="text-3xl font-black font-mono text-slate-400">{results.totalHosts.toLocaleString()}</h4>
                  </div>
                </div>

                <div className="h-px w-full bg-white/10 md:h-12 md:w-px relative z-10" />

                <div className="w-full md:w-auto space-y-4 relative z-10">
                   <div className="flex justify-between items-center gap-4">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('subnet.first_host')}</span>
                     <span className="font-mono font-bold">{results.firstHost}</span>
                   </div>
                   <div className="flex justify-between items-center gap-4">
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('subnet.last_host')}</span>
                     <span className="font-mono font-bold">{results.lastHost}</span>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('subnet.guide_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('subnet.guide_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" /> {t('subnet.wildcard_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('subnet.wildcard_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Binary className="w-4 h-4 text-indigo-500" /> {t('subnet.binary_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('subnet.binary_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
