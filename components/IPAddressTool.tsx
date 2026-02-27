import { useState, useEffect } from 'react';
import { Globe, MapPin, Wifi, Info, Copy, Check } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function IPAddressTool() {
  const [ipInfo, setIpInfo] = useState({
    ip: '123.456.789.012',
    city: 'Paris',
    region: 'Île-de-France',
    country: 'FR',
    timezone: 'Europe/Paris',
    isp: 'Fournisseur d\'accès Internet'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => {
        if (!res.ok) throw new Error('Échec du chargement des données');
        return res.json();
      })
      .then(data => {
        if (data.ip) {
          setIpInfo({
            ip: data.ip,
            city: data.city || 'Inconnu',
            region: data.region || 'Inconnu',
            country: data.country_name || 'Inconnu',
            timezone: data.timezone || 'Inconnu',
            isp: data.org || 'Inconnu'
          });
        }
      })
      .catch(err => {
        console.error('Erreur IP:', err);
        setError('Impossible de récupérer vos informations de connexion. Veuillez vérifier votre connexion ou désactiver votre bloqueur de publicités.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = () => {
    if (loading || error) return;
    navigator.clipboard.writeText(ipInfo.ip);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className={`bg-gradient-to-br ${error ? 'from-rose-500 to-rose-600' : 'from-indigo-600 to-blue-500'} text-white p-8 md:p-12 rounded-[2.5rem] mb-8 text-center transition-all duration-500 shadow-xl shadow-indigo-500/10 relative overflow-hidden group`}>
        <Globe className="w-16 h-16 mx-auto mb-6 opacity-80" />
        <div className="text-xs font-black uppercase tracking-widest opacity-70 mb-3">Votre adresse IP publique</div>
        {loading ? (
          <div className="h-16 w-64 bg-white/20 animate-pulse rounded-2xl mx-auto mb-4"></div>
        ) : error ? (
          <div className="text-lg font-bold mb-4">{error}</div>
        ) : (
          <div className="relative inline-block group">
            <div className="text-4xl md:text-6xl font-black mb-4 break-all font-mono tracking-tighter">{ipInfo.ip}</div>
            <button
              onClick={handleCopy}
              className={`absolute -right-12 top-1/2 -translate-y-1/2 p-3 rounded-2xl transition-all active:scale-95 ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100'}`}
              aria-label="Copier l'adresse IP"
            >
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
            </button>
          </div>
        )}
        <div className="text-xs font-bold opacity-60">
          {loading ? 'Chargement des données...' : error ? 'Erreur de détection' : 'Données détectées automatiquement'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Localisation</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{ipInfo.city}, {ipInfo.region}</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{ipInfo.country}</p>
        </div>

        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
              <Globe className="w-5 h-5 text-indigo-500" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Fuseau horaire</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{ipInfo.timezone}</p>
        </div>

        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm transition-all hover:shadow-md md:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <Wifi className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Fournisseur d'accès (ISP)</span>
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{ipInfo.isp}</p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 rounded-2xl p-6 text-sm text-amber-800 dark:text-amber-400 flex gap-4 items-start">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-amber-500">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <p className="font-bold mb-1">Note importante</p>
          <p className="opacity-80">
            Ces informations sont basées sur votre adresse IP publique. La localisation peut varier selon votre fournisseur d'accès ou l'utilisation d'un VPN.
          </p>
        </div>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
