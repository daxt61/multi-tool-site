import { useState, useEffect, useMemo } from 'react';
import { Monitor, Globe, Laptop, Smartphone, Maximize, Copy, Check, Info } from 'lucide-react';

interface BrowserInfo {
  name: string;
  version: string;
  os: string;
  platform: string;
  userAgent: string;
  language: string;
  cookiesEnabled: boolean;
  online: boolean;
}

interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelRatio: number;
  orientation: string;
}

export function UserAgentAnalyzer() {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [screenInfo, setScreenInfo] = useState<ScreenInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const analyzeUA = (ua: string) => {
    let name = "Inconnu";
    let version = "Inconnu";
    let os = "Inconnu";

    if (ua.includes("Firefox")) { name = "Firefox"; version = ua.split("Firefox/")[1]; }
    else if (ua.includes("Edg")) { name = "Edge"; version = ua.split("Edg/")[1]; }
    else if (ua.includes("Chrome")) { name = "Chrome"; version = ua.split("Chrome/")[1].split(" ")[0]; }
    else if (ua.includes("Safari")) { name = "Safari"; version = ua.split("Version/")[1]?.split(" ")[0] || "Inconnu"; }

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    return { name, version, os };
  };

  const updateInfos = () => {
    const ua = navigator.userAgent;
    const { name, version, os } = analyzeUA(ua);

    setBrowserInfo({
      name,
      version,
      os,
      platform: navigator.platform,
      userAgent: ua,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine
    });

    setScreenInfo({
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      orientation: window.screen.orientation?.type || "Inconnu"
    });
  };

  useEffect(() => {
    updateInfos();
    window.addEventListener('resize', updateInfos);
    return () => window.removeEventListener('resize', updateInfos);
  }, []);

  const handleCopy = () => {
    const text = JSON.stringify({ browser: browserInfo, screen: screenInfo }, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!browserInfo || !screenInfo) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Analyse de l'environnement</h2>
        <button
          onClick={handleCopy}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copié' : 'Copier tout'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Browser Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg dark:text-white">Navigateur & OS</h3>
              <p className="text-sm text-slate-500">Détails de votre logiciel</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Navigateur', value: browserInfo.name, sub: browserInfo.version },
              { label: 'Système', value: browserInfo.os, sub: browserInfo.platform },
              { label: 'Langue', value: browserInfo.language },
              { label: 'Cookies', value: browserInfo.cookiesEnabled ? 'Activés' : 'Désactivés' },
              { label: 'Statut', value: browserInfo.online ? 'En ligne' : 'Hors ligne' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <div className="text-right">
                  <div className="font-bold dark:text-white">{item.value}</div>
                  {item.sub && <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{item.sub}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Screen Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg dark:text-white">Écran & Affichage</h3>
              <p className="text-sm text-slate-500">Résolution et capacités</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Résolution', value: `${screenInfo.width} × ${screenInfo.height}`, sub: 'Taille totale' },
              { label: 'Disponible', value: `${screenInfo.availWidth} × ${screenInfo.availHeight}`, sub: 'Zone utile' },
              { label: 'Pixel Ratio', value: screenInfo.pixelRatio.toFixed(2), sub: 'Densité' },
              { label: 'Couleurs', value: `${screenInfo.colorDepth} bits`, sub: 'Profondeur' },
              { label: 'Orientation', value: screenInfo.orientation, sub: 'Position' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800 last:border-0">
                <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                <div className="text-right">
                  <div className="font-bold dark:text-white">{item.value}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Agent String */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Info className="w-4 h-4" /> User Agent String
        </h3>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 font-mono text-xs text-slate-500 dark:text-slate-400 break-all leading-relaxed">
          {browserInfo.userAgent}
        </div>
      </div>
    </div>
  );
}
