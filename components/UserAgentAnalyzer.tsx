import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Globe, Cpu, Layout, Maximize, Move, Info, Copy, Check } from 'lucide-react';

interface BrowserInfo {
  name: string;
  version: string;
  ua: string;
  language: string;
  platform: string;
  engine: string;
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
  const [browser, setBrowser] = useState<BrowserInfo | null>(null);
  const [screen, setScreen] = useState<ScreenInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const analyzeInfo = () => {
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
      browserVersion = ua.indexOf("OPR") > -1 ? ua.split("OPR/")[1] : ua.split("Opera/")[1];
    } else if (ua.indexOf("Trident") > -1) {
      browserName = "Internet Explorer";
      browserVersion = ua.split("rv:")[1].split(")")[0];
    } else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) {
      browserName = "Microsoft Edge";
      browserVersion = ua.indexOf("Edg") > -1 ? ua.split("Edg/")[1] : ua.split("Edge/")[1];
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
      ua: ua,
      language: navigator.language,
      platform: (navigator as any).platform || "Inconnue",
      engine: navigator.product || "Inconnu",
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
    });

    setScreen({
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      orientation: window.screen.orientation ? window.screen.orientation.type : "Inconnue",
    });
  };

  useEffect(() => {
    analyzeInfo();
    window.addEventListener('resize', analyzeInfo);
    return () => window.removeEventListener('resize', analyzeInfo);
  }, []);

  const handleCopy = () => {
    if (!browser) return;
    navigator.clipboard.writeText(browser.ua);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!browser || !screen) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* UA Hero Section */}
      <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Globe className="w-32 h-32" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">User Agent Actuel</label>
              <h3 className="text-lg md:text-xl font-mono break-all leading-relaxed text-slate-300 max-w-4xl">
                {browser.ua}
              </h3>
            </div>
            <button
              onClick={handleCopy}
              className={`p-3 rounded-2xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              aria-label="Copier le User Agent"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex flex-wrap gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <div className={`w-2 h-2 rounded-full ${browser.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-xs font-bold uppercase tracking-wider">{browser.online ? 'En ligne' : 'Hors ligne'}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              {browser.language}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Browser Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Navigateur</h4>
              <p className="text-xs text-slate-500 font-bold">Détails du logiciel</p>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              { label: 'Nom', value: browser.name, icon: <Layout className="w-4 h-4" /> },
              { label: 'Version', value: browser.version, icon: <Info className="w-4 h-4" /> },
              { label: 'Moteur', value: browser.engine, icon: <Cpu className="w-4 h-4" /> },
              { label: 'Plateforme', value: browser.platform, icon: <Smartphone className="w-4 h-4" /> },
              { label: 'Cookies', value: browser.cookiesEnabled ? 'Activés' : 'Désactivés', icon: <Info className="w-4 h-4" /> },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-3 text-slate-400">
                  {item.icon}
                  <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                </div>
                <span className="text-sm font-black dark:text-slate-200">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Screen Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Écran & Fenêtre</h4>
              <p className="text-xs text-slate-500 font-bold">Dimensions & Affichage</p>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              { label: 'Résolution', value: `${screen.width} × ${screen.height}`, icon: <Maximize className="w-4 h-4" /> },
              { label: 'Disponible', value: `${screen.availWidth} × ${screen.availHeight}`, icon: <Move className="w-4 h-4" /> },
              { label: 'Pixel Ratio', value: `${screen.pixelRatio.toFixed(2)}x`, icon: <Layout className="w-4 h-4" /> },
              { label: 'Couleurs', value: `${screen.colorDepth}-bit`, icon: <Info className="w-4 h-4" /> },
              { label: 'Orientation', value: screen.orientation, icon: <Monitor className="w-4 h-4" /> },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-3 text-slate-400">
                  {item.icon}
                  <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                </div>
                <span className="text-sm font-black dark:text-slate-200">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4">À quoi sert l'analyse du User Agent ?</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Le "User Agent" est une chaîne de caractères envoyée par votre navigateur à chaque site web que vous visitez.
          Elle contient des informations sur votre navigateur, votre système d'exploitation et votre matériel.
          Les développeurs utilisent ces informations pour adapter l'affichage du site à votre appareil, diagnostiquer des bugs
          ou fournir des statistiques d'audience. Cet outil vous permet de voir exactement ce que les sites web apprennent sur votre configuration.
        </p>
      </div>
    </div>
  );
}
