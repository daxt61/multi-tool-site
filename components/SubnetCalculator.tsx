import { useState, useMemo } from 'react';
import { Network, Info, Hash, Globe, Server, ShieldCheck, Copy, Check } from 'lucide-react';

export function SubnetCalculator() {
  const [ip, setIp] = useState('192.168.1.1');
  const [cidr, setCidr] = useState(24);
  const [copied, setCopied] = useState<string | null>(null);

  const calculateSubnet = (ipStr: string, prefix: number) => {
    try {
      const parts = ipStr.split('.').map(Number);
      if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
        return null;
      }

      const ipNum = (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
      const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;

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

      return {
        network: toIp(networkNum),
        broadcast: toIp(broadcastNum),
        mask: toIp(mask),
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Input Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-2 px-1">
                <Globe className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Configuration IP</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="ip-input" className="text-xs font-bold text-slate-500 px-1">Adresse IP (v4)</label>
                  <input
                    id="ip-input"
                    type="text"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    placeholder="ex: 192.168.1.1"
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor="cidr-input" className="text-xs font-bold text-slate-500">Masque CIDR</label>
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

          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/10 space-y-6">
             <div className="flex items-center gap-3">
              <Info className="w-6 h-6 opacity-50" />
              <h4 className="text-xl font-black">Qu'est-ce que le CIDR ?</h4>
            </div>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
              Le CIDR (Classless Inter-Domain Routing) est une méthode d'allocation d'adresses IP. Le nombre après le "/" indique combien de bits sont utilisés pour le réseau, le reste servant aux hôtes.
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-7 space-y-6">
          {!results ? (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-8 rounded-[2.5rem] text-center space-y-4">
              <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-rose-500 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <p className="text-rose-600 dark:text-rose-400 font-bold">Adresse IP invalide. Veuillez vérifier le format (ex: 192.168.1.1).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Adresse Réseau', value: results.network, icon: <Network className="w-4 h-4" /> },
                { label: 'Adresse Broadcast', value: results.broadcast, icon: <Globe className="w-4 h-4" /> },
                { label: 'Masque de sous-réseau', value: results.mask, icon: <ShieldCheck className="w-4 h-4" /> },
                { label: 'Total des hôtes', value: results.totalHosts.toLocaleString(), icon: <Server className="w-4 h-4" /> },
                { label: 'Premier Hôte', value: results.firstHost, icon: <Hash className="w-4 h-4" /> },
                { label: 'Dernier Hôte', value: results.lastHost, icon: <Hash className="w-4 h-4" /> },
              ].map((item, i) => (
                <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-3 group transition-all hover:border-indigo-500/30">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-indigo-500 transition-colors">
                        {item.icon}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                    </div>
                    <button
                      onClick={() => handleCopy(item.value, item.label)}
                      className={`p-1.5 rounded-lg transition-all ${copied === item.label ? 'bg-emerald-50 text-emerald-600' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'}`}
                    >
                      {copied === item.label ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="text-xl font-black font-mono dark:text-white truncate">
                    {item.value}
                  </div>
                </div>
              ))}

              <div className="md:col-span-2 bg-slate-900 dark:bg-slate-800 p-8 rounded-[2rem] text-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Nombre d'hôtes utilisables</p>
                  <h4 className="text-4xl font-black font-mono text-indigo-400">{results.numHosts.toLocaleString()}</h4>
                </div>
                <div className="h-12 w-px bg-white/10 hidden md:block" />
                <div className="text-right hidden md:block">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Notation CIDR</p>
                  <h4 className="text-2xl font-black font-mono">{ip}/{results.cidr}</h4>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Saisissez une adresse IPv4 et ajustez le masque à l'aide du curseur CIDR. Les résultats se mettent à jour instantanément pour afficher toutes les informations du sous-réseau.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-500" /> Adresse Réseau
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'adresse réseau est la première adresse du sous-réseau. Elle identifie le réseau lui-même et ne peut pas être attribuée à un hôte individuel.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" /> Adresse Broadcast
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'adresse de diffusion (broadcast) est la dernière adresse du sous-réseau. Elle permet d'envoyer des données à tous les hôtes du même réseau simultanément.
          </p>
        </div>
      </div>
    </div>
  );
}
