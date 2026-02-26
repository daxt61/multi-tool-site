import React, { useState, useEffect } from 'react';
import { Monitor, Globe, Cpu, Maximize, Copy, Check, Info } from 'lucide-react';

interface BrowserInfo {
  userAgent: string;
  name: string;
  version: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
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
  const [copied, setCopied] = useState<string | null>(null);

  const analyzeUA = () => {
    const ua = navigator.userAgent;
    let name = "Inconnu";
    let version = "Inconnue";

    if (ua.indexOf("Firefox") > -1) {
      name = "Firefox";
      version = ua.match(/Firefox\/([\d.]+)/)?.[1] || version;
    } else if (ua.indexOf("SamsungBrowser") > -1) {
      name = "Samsung Internet";
      version = ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] || version;
    } else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) {
      name = "Opera";
      version = ua.match(/(?:Opera|OPR)\/([\d.]+)/)?.[1] || version;
    } else if (ua.indexOf("Trident") > -1) {
      name = "Internet Explorer";
      version = ua.match(/rv:([\d.]+)/)?.[1] || version;
    } else if (ua.indexOf("Edge") > -1) {
      name = "Edge (Legacy)";
      version = ua.match(/Edge\/([\d.]+)/)?.[1] || version;
    } else if (ua.indexOf("Edg") > -1) {
      name = "Edge (Chromium)";
      version = ua.match(/Edg\/([\d.]+)/)?.[1] || version;
    } else if (ua.indexOf("Chrome") > -1) {
      name = "Chrome";
      version = ua.match(/Chrome\/([\d.]+)/)?.[1] || version;
    } else if (ua.indexOf("Safari") > -1) {
      name = "Safari";
      version = ua.match(/Version\/([\d.]+)/)?.[1] || version;
    }

    setBrowserInfo({
      userAgent: ua,
      name,
      version,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
    });
  };

  const analyzeScreen = () => {
    setScreenInfo({
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      orientation: window.screen.orientation?.type || "Inconnue",
    });
  };

  useEffect(() => {
    analyzeUA();
    analyzeScreen();

    const handleResize = () => analyzeScreen();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!browserInfo || !screenInfo) return null;

  const dataGroups = [
    {
      title: "Navigateur",
      icon: Globe,
      items: [
        { label: "Nom", value: browserInfo.name },
        { label: "Version", value: browserInfo.version },
        { label: "Langue", value: browserInfo.language },
        { label: "Cookies", value: browserInfo.cookieEnabled ? "Activés" : "Désactivés" },
        { label: "Do Not Track", value: browserInfo.doNotTrack || "Non défini" },
      ]
    },
    {
      title: "Système",
      icon: Cpu,
      items: [
        { label: "Plateforme", value: browserInfo.platform },
        { label: "Moteur", value: navigator.product || "Inconnu" },
        { label: "Vendeur", value: navigator.vendor || "Inconnu" },
      ]
    },
    {
      title: "Écran",
      icon: Monitor,
      items: [
        { label: "Résolution", value: `${screenInfo.width} x ${screenInfo.height}` },
        { label: "Disponible", value: `${screenInfo.availWidth} x ${screenInfo.availHeight}` },
        { label: "Ratio pixel", value: screenInfo.pixelRatio.toString() },
        { label: "Profondeur", value: `${screenInfo.colorDepth} bits` },
        { label: "Orientation", value: screenInfo.orientation },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Main UA Display */}
      <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">Votre User Agent</h3>
            <button
              onClick={() => handleCopy(browserInfo.userAgent, 'ua')}
              className={`p-2 rounded-xl transition-all ${copied === 'ua' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}
            >
              {copied === 'ua' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-lg md:text-xl font-mono text-white leading-relaxed break-all">
            {browserInfo.userAgent}
          </p>
        </div>
      </div>

      {/* Info Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dataGroups.map((group, idx) => (
          <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <group.icon className="w-5 h-5" />
              </div>
              <h4 className="font-bold dark:text-white">{group.title}</h4>
            </div>
            <div className="space-y-4">
              {group.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{item.label}</span>
                  <span className="font-bold dark:text-white text-right ml-2">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Window Info */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mb-24 -mr-24"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-2">
            <h3 className="text-2xl font-black flex items-center gap-3">
              <Maximize className="w-8 h-8 opacity-50" /> Fenêtre active
            </h3>
            <p className="text-indigo-100 font-medium">Dimensions actuelles de votre navigateur en temps réel.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Largeur</div>
              <div className="text-3xl font-black font-mono">{window.innerWidth}px</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Hauteur</div>
              <div className="text-3xl font-black font-mono">{window.innerHeight}px</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">À quoi ça sert ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le User Agent est une chaîne de caractères envoyée par votre navigateur à chaque site web que vous visitez.
            Il permet aux serveurs d'identifier votre système d'exploitation, votre navigateur et sa version afin de vous proposer
            une expérience optimisée. Ces informations sont également précieuses pour le débogage et le développement web.
          </p>
        </div>
      </div>
    </div>
  );
}
