import { useState, useEffect } from 'react';
import { Monitor, Cpu, Laptop, Smartphone, Search, Copy, Check, Globe } from 'lucide-react';

interface BrowserInfo {
  name: string;
  version: string;
  os: string;
  platform: string;
  userAgent: string;
  language: string;
}

interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  pixelRatio: number;
  colorDepth: number;
}

export function UserAgentAnalyzer() {
  const [browser, setBrowser] = useState<BrowserInfo | null>(null);
  const [screen, setScreen] = useState<ScreenInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    let browserName = "Inconnu";
    let browserVersion = "Inconnue";

    if (ua.indexOf("Firefox") > -1) {
      browserName = "Mozilla Firefox";
      browserVersion = ua.split("Firefox/")[1];
    } else if (ua.indexOf("SamsungBrowser") > -1) {
      browserName = "Samsung Internet";
      browserVersion = ua.split("SamsungBrowser/")[1].split(" ")[0];
    } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
      browserName = "Opera";
      browserVersion = ua.indexOf("OPR") > -1 ? ua.split("OPR/")[1].split(" ")[0] : ua.split("Opera/")[1].split(" ")[0];
    } else if (ua.indexOf("Trident") > -1) {
      browserName = "Internet Explorer";
      browserVersion = ua.split("rv:")[1].split(")")[0];
    } else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) {
      browserName = "Microsoft Edge";
      browserVersion = ua.indexOf("Edg") > -1 ? ua.split("Edg/")[1].split(" ")[0] : ua.split("Edge/")[1].split(" ")[0];
    } else if (ua.indexOf("Chrome") > -1) {
      browserName = "Google Chrome";
      browserVersion = ua.split("Chrome/")[1].split(" ")[0];
    } else if (ua.indexOf("Safari") > -1) {
      browserName = "Safari";
      browserVersion = ua.split("Version/")[1].split(" ")[0];
    }

    setBrowser({
      name: browserName,
      version: browserVersion,
      os: navigator.platform,
      platform: (navigator as any).userAgentData?.platform || "Inconnue",
      userAgent: ua,
      language: navigator.language,
    });

    const updateScreen = () => {
      setScreen({
        width: window.screen.width,
        height: window.screen.height,
        availWidth: window.screen.availWidth,
        availHeight: window.screen.availHeight,
        pixelRatio: window.devicePixelRatio,
        colorDepth: window.screen.colorDepth,
      });
    };

    updateScreen();
    window.addEventListener('resize', updateScreen);
    return () => window.removeEventListener('resize', updateScreen);
  }, []);

  const handleCopy = () => {
    if (!browser) return;
    navigator.clipboard.writeText(browser.userAgent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getDeviceIcon = () => {
    if (!browser) return <Laptop className="w-8 h-8" />;
    const ua = browser.userAgent.toLowerCase();
    if (/mobi|android|iphone|ipad/.test(ua)) return <Smartphone className="w-8 h-8" />;
    return <Laptop className="w-8 h-8" />;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Hero Display */}
      <div className="bg-slate-900 dark:bg-black p-10 md:p-16 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
          <div className="w-24 h-24 rounded-3xl bg-white/10 flex items-center justify-center text-white border border-white/10 group-hover:scale-105 transition-transform duration-500">
            {getDeviceIcon()}
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              {browser?.name || "Analyse en cours..."}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-4 py-1.5 bg-white/10 rounded-full text-xs font-black uppercase tracking-widest text-white/70 border border-white/5">
                Version {browser?.version}
              </span>
              <span className="px-4 py-1.5 bg-indigo-500/20 rounded-full text-xs font-black uppercase tracking-widest text-indigo-300 border border-indigo-500/20">
                {browser?.os}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 relative z-10">
          <div className="flex justify-between items-center mb-4 px-1">
            <label className="text-xs font-black uppercase tracking-widest text-white/40">User Agent</label>
            <button onClick={handleCopy} className={`text-xs font-bold flex items-center gap-2 transition-all ${copied ? 'text-emerald-400' : 'text-white/60 hover:text-white'}`}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl font-mono text-sm text-white/80 break-all leading-relaxed backdrop-blur-sm">
            {browser?.userAgent}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Details */}
        <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 shadow-sm">
          <div className="flex items-center gap-2 px-1">
            <Cpu className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Détails Système</h3>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Plateforme', value: browser?.platform, icon: <Monitor className="w-4 h-4" /> },
              { label: 'Langue', value: browser?.language, icon: <Globe className="w-4 h-4" /> },
              { label: 'Fuseau Horaire', value: Intl.DateTimeFormat().resolvedOptions().timeZone, icon: <Search className="w-4 h-4" /> },
              { label: 'Cookies Activés', value: navigator.cookieEnabled ? "Oui" : "Non", icon: <Check className="w-4 h-4" /> },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 transition-all">
                    {item.icon}
                  </div>
                  <span className="font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                </div>
                <span className="font-black text-slate-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Screen Metrics */}
        <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 shadow-sm">
          <div className="flex items-center gap-2 px-1">
            <Monitor className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Affichage & Écran</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Résolution', value: `${screen?.width} x ${screen?.height}` },
              { label: 'Zone Disponible', value: `${screen?.availWidth} x ${screen?.availHeight}` },
              { label: 'Ratio Pixel', value: screen?.pixelRatio },
              { label: 'Couleurs', value: `${screen?.colorDepth} bit` },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl space-y-2 group hover:border-indigo-500/30 transition-all">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors">{item.label}</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-indigo-600 rounded-3xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <p className="text-sm font-bold opacity-80 mb-1">Fenêtre actuelle</p>
            <div className="text-3xl font-black font-mono">
              {typeof window !== 'undefined' ? `${window.innerWidth} x ${window.innerHeight}` : '...'}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
