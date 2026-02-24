import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Globe, Maximize2, Cpu, Info } from 'lucide-react';

interface BrowserInfo {
  name: string;
  version: string;
  platform: string;
  userAgent: string;
  language: string;
  cookiesEnabled: boolean;
}

interface ScreenInfo {
  width: number;
  height: number;
  colorDepth: number;
  pixelRatio: number;
  viewportWidth: number;
  viewportHeight: number;
}

export function UserAgentAnalyzer() {
  const [browser, setBrowser] = useState<BrowserInfo | null>(null);
  const [screen, setScreen] = useState<ScreenInfo | null>(null);

  useEffect(() => {
    const updateInfo = () => {
      const ua = navigator.userAgent;
      let browserName = "Inconnu";

      if (ua.includes("Firefox")) browserName = "Mozilla Firefox";
      else if (ua.includes("SamsungBrowser")) browserName = "Samsung Internet";
      else if (ua.includes("Opera") || ua.includes("OPR")) browserName = "Opera";
      else if (ua.includes("Trident")) browserName = "Internet Explorer";
      else if (ua.includes("Edge")) browserName = "Microsoft Edge";
      else if (ua.includes("Chrome")) browserName = "Google Chrome";
      else if (ua.includes("Safari")) browserName = "Apple Safari";

      setBrowser({
        name: browserName,
        version: navigator.appVersion,
        platform: navigator.platform,
        userAgent: ua,
        language: navigator.language,
        cookiesEnabled: navigator.cookieEnabled
      });

      setScreen({
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      });
    };

    updateInfo();
    window.addEventListener('resize', updateInfo);
    return () => window.removeEventListener('resize', updateInfo);
  }, []);

  if (!browser || !screen) return null;

  const cards = [
    {
      title: "Navigateur",
      icon: Globe,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      items: [
        { label: "Nom", value: browser.name },
        { label: "Langue", value: browser.language },
        { label: "Cookies", value: browser.cookiesEnabled ? "Activés" : "Désactivés" }
      ]
    },
    {
      title: "Système",
      icon: Cpu,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      items: [
        { label: "Plateforme", value: browser.platform },
        { label: "Moteur", value: navigator.product },
        { label: "En ligne", value: navigator.onLine ? "Oui" : "Non" }
      ]
    },
    {
      title: "Écran",
      icon: Monitor,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      items: [
        { label: "Résolution", value: `${screen.width} × ${screen.height}` },
        { label: "Ratio pixel", value: screen.pixelRatio.toFixed(2) },
        { label: "Profondeur", value: `${screen.colorDepth} bits` }
      ]
    },
    {
      title: "Viewport",
      icon: Maximize2,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      items: [
        { label: "Largeur", value: `${screen.viewportWidth} px` },
        { label: "Hauteur", value: `${screen.viewportHeight} px` },
        { label: "Orientation", value: screen.viewportWidth > screen.viewportHeight ? "Paysage" : "Portrait" }
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-8 md:p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <Smartphone className="w-12 h-12 mb-6 opacity-50" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] opacity-60 mb-4">Votre User Agent</h2>
          <div className="bg-white/10 dark:bg-slate-900/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10 dark:border-slate-900/10 font-mono text-sm break-all leading-relaxed">
            {browser.userAgent}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 transition-all hover:shadow-lg">
            <div className={`w-10 h-10 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-6`}>
              <card.icon className="w-5 h-5" />
            </div>
            <h3 className="font-bold mb-4 dark:text-white">{card.title}</h3>
            <div className="space-y-3">
              {card.items.map((item, j) => (
                <div key={j} className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 flex gap-6 items-start">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 shadow-sm shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <p className="font-bold dark:text-white">À quoi ça sert ?</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'User Agent est une chaîne de caractères envoyée par votre navigateur à chaque site que vous visitez. Elle permet au site d'identifier votre système d'exploitation et votre navigateur afin d'adapter l'affichage. Cet outil vous permet de voir exactement quelles informations sont transmises.
          </p>
        </div>
      </div>
    </div>
  );
}
