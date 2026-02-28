import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Globe, Cpu, Layout, Copy, Check, Info } from 'lucide-react';

interface BrowserInfo {
  name: string;
  version: string;
  ua: string;
  platform: string;
  language: string;
  cookiesEnabled: boolean;
  onLine: boolean;
}

interface ScreenInfo {
  width: number;
  height: number;
  colorDepth: number;
  pixelRatio: number;
}

export function UserAgentAnalyzer() {
  const [browser, setBrowser] = useState<BrowserInfo | null>(null);
  const [screen, setScreen] = useState<ScreenInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    let name = "Inconnu";
    let version = "Inconnue";

    if (ua.includes("Firefox/")) {
      name = "Firefox";
      version = ua.split("Firefox/")[1];
    } else if (ua.includes("Edg/")) {
      name = "Edge";
      version = ua.split("Edg/")[1];
    } else if (ua.includes("Chrome/")) {
      name = "Chrome";
      version = ua.split("Chrome/")[1].split(" ")[0];
    } else if (ua.includes("Safari/")) {
      name = "Safari";
      version = ua.split("Version/")[1]?.split(" ")[0] || "Inconnue";
    }

    setBrowser({
      name,
      version,
      ua,
      platform: navigator.platform,
      language: navigator.language,
      cookiesEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    });

    const updateScreen = () => {
      setScreen({
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio
      });
    };

    updateScreen();
    window.addEventListener('resize', updateScreen);
    return () => window.removeEventListener('resize', updateScreen);
  }, []);

  const handleCopy = () => {
    if (browser) {
      navigator.clipboard.writeText(browser.ua);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!browser || !screen) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero UA Section */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">Votre User Agent</h3>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <p className="text-lg md:text-2xl font-mono text-white/90 leading-relaxed break-all">
            {browser.ua}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Browser Card */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm">
              <Globe className="w-5 h-5" />
            </div>
            <h4 className="font-bold dark:text-white">Navigateur</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Nom</span>
              <span className="font-black dark:text-white">{browser.name}</span>
            </div>
            <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Version</span>
              <span className="font-bold text-sm dark:text-slate-300 truncate max-w-[150px]">{browser.version}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-400 uppercase">Langue</span>
              <span className="font-black dark:text-white">{browser.language}</span>
            </div>
          </div>
        </div>

        {/* System Card */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="font-bold dark:text-white">Système</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Plateforme</span>
              <span className="font-black dark:text-white">{browser.platform}</span>
            </div>
            <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Cookies</span>
              <span className={`font-black ${browser.cookiesEnabled ? 'text-emerald-500' : 'text-rose-500'}`}>
                {browser.cookiesEnabled ? 'Activés' : 'Désactivés'}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-400 uppercase">Connexion</span>
              <span className={`font-black ${browser.onLine ? 'text-emerald-500' : 'text-rose-500'}`}>
                {browser.onLine ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </div>

        {/* Screen Card */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm">
              <Layout className="w-5 h-5" />
            </div>
            <h4 className="font-bold dark:text-white">Écran</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Résolution</span>
              <span className="font-black dark:text-white">{screen.width} × {screen.height}</span>
            </div>
            <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Ratio Pixel</span>
              <span className="font-black dark:text-white">{screen.pixelRatio.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-400 uppercase">Profondeur</span>
              <span className="font-black dark:text-white">{screen.colorDepth}-bit</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-500/10 p-8 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 flex gap-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex-shrink-0 flex items-center justify-center text-white">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-indigo-900 dark:text-indigo-100">À quoi ça sert ?</h4>
          <p className="text-sm text-indigo-700/70 dark:text-indigo-300/70 leading-relaxed">
            Le User Agent est une chaîne de caractères envoyée par votre navigateur à chaque site web que vous visitez. Elle contient des informations sur votre navigateur, votre système d'exploitation et votre appareil, permettant aux sites de s'adapter au mieux à votre configuration.
          </p>
        </div>
      </div>
    </div>
  );
}
