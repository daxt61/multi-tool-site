import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Globe, Layers, Maximize, Cpu } from 'lucide-react';

export function UserAgentAnalyzer() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getUAInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Inconnu";
    let os = "Inconnu";

    if (ua.includes("Firefox")) browser = "Mozilla Firefox";
    else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
    else if (ua.includes("Trident")) browser = "Internet Explorer";
    else if (ua.includes("Edge")) browser = "Microsoft Edge";
    else if (ua.includes("Chrome")) browser = "Google Chrome";
    else if (ua.includes("Safari")) browser = "Safari";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")) os = "iOS";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";

    return {
      ua,
      browser,
      os,
      language: navigator.language,
      platform: (navigator as any).platform,
      cookiesEnabled: navigator.cookieEnabled ? "Activés" : "Désactivés",
      doNotTrack: navigator.doNotTrack === "1" ? "Activé" : "Désactivé",
      cores: navigator.hardwareConcurrency || "Inconnu",
    };
  };

  const info = getUAInfo();

  const dataCards = [
    { icon: Globe, label: "Navigateur", value: info.browser, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { icon: Layers, label: "Système d'exploitation", value: info.os, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { icon: Cpu, label: "Cœurs Processeur", value: info.cores, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { icon: Maximize, label: "Résolution Écran", value: `${window.screen.width} x ${window.screen.height}`, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { icon: Monitor, label: "Fenêtre (Viewport)", value: `${windowSize.width} x ${windowSize.height}`, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
    { icon: Smartphone, label: "Densité de pixels", value: `${windowSize.pixelRatio.toFixed(2)}x`, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* UA Hero */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="relative z-10 space-y-4">
          <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Votre User Agent</div>
          <p className="text-white font-mono text-sm md:text-lg break-all leading-relaxed opacity-90">
            {info.ua}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dataCards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm transition-all hover:shadow-md group">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 ${card.bg} rounded-xl transition-transform group-hover:scale-110`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{card.label}</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-500" /> Informations Supplémentaires
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Langue</div>
            <div className="font-bold text-slate-700 dark:text-slate-300">{info.language}</div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Plateforme</div>
            <div className="font-bold text-slate-700 dark:text-slate-300">{info.platform}</div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Cookies</div>
            <div className="font-bold text-slate-700 dark:text-slate-300">{info.cookiesEnabled}</div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Do Not Track</div>
            <div className="font-bold text-slate-700 dark:text-slate-300">{info.doNotTrack}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
