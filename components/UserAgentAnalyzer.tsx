import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Globe, Maximize, Copy, Check } from 'lucide-react';

export function UserAgentAnalyzer() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  const getBrowser = () => {
    if (ua.includes('Firefox/')) return 'Mozilla Firefox';
    if (ua.includes('Edg/')) return 'Microsoft Edge';
    if (ua.includes('Chrome/')) return 'Google Chrome';
    if (ua.includes('Safari/')) return 'Apple Safari';
    return 'Inconnu';
  };

  const getOS = () => {
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('like Mac')) return 'iOS';
    return 'Inconnu';
  };

  const info = [
    { label: 'Navigateur', value: getBrowser(), icon: Globe },
    { label: 'Système d\'exploitation', value: getOS(), icon: Monitor },
    { label: 'Plateforme', value: navigator.platform, icon: Smartphone },
    { label: 'Langue', value: navigator.language, icon: Globe },
    { label: 'Résolution Écran', value: `${window.screen.width} x ${window.screen.height}`, icon: Maximize },
    { label: 'Fenêtre Actuelle', value: `${windowSize.width} x ${windowSize.height}`, icon: Maximize },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(ua);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">User Agent String</label>
          <button
            onClick={handleCopy}
            className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 font-mono text-sm break-all leading-relaxed dark:text-slate-300">
          {ua}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {info.map((item) => (
          <div key={item.label} className="p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</div>
              <div className="font-bold dark:text-white">{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
