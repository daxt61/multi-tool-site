import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Globe, Cpu, Maximize, MousePointer, Info, Shield } from 'lucide-react';

interface BrowserInfo {
  name: string;
  version: string;
  os: string;
  platform: string;
  language: string;
  userAgent: string;
  cookiesEnabled: boolean;
  online: boolean;
}

interface ScreenInfo {
  width: number;
  height: number;
  colorDepth: number;
  pixelRatio: number;
  orientation: string;
}

export function UserAgentAnalyzer() {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [screenInfo, setScreenInfo] = useState<ScreenInfo | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    let browserName = "Inconnu";
    let fullVersion = "Inconnu";

    if (ua.indexOf("Firefox") !== -1) browserName = "Mozilla Firefox";
    else if (ua.indexOf("SamsungBrowser") !== -1) browserName = "Samsung Internet";
    else if (ua.indexOf("Opera") !== -1 || ua.indexOf("OPR") !== -1) browserName = "Opera";
    else if (ua.indexOf("Edge") !== -1 || ua.indexOf("Edg") !== -1) browserName = "Microsoft Edge";
    else if (ua.indexOf("Chrome") !== -1) browserName = "Google Chrome";
    else if (ua.indexOf("Safari") !== -1) browserName = "Apple Safari";

    // Simple OS detection
    let os = "Inconnu";
    if (ua.indexOf("Win") !== -1) os = "Windows";
    else if (ua.indexOf("Mac") !== -1) os = "macOS";
    else if (ua.indexOf("Linux") !== -1) os = "Linux";
    else if (ua.indexOf("Android") !== -1) os = "Android";
    else if (ua.indexOf("like Mac") !== -1) os = "iOS";

    setBrowserInfo({
      name: browserName,
      version: navigator.appVersion,
      os: os,
      platform: navigator.platform,
      language: navigator.language,
      userAgent: ua,
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine
    });

    const updateScreen = () => {
      setScreenInfo({
        width: window.screen.width,
        height: window.screen.height,
        colorDepth: window.screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        orientation: window.screen.orientation ? window.screen.orientation.type : 'Inconnu'
      });
    };

    updateScreen();
    window.addEventListener('resize', updateScreen);
    return () => window.removeEventListener('resize', updateScreen);
  }, []);

  if (!browserInfo || !screenInfo) return null;

  const dataCards = [
    { label: "Navigateur", value: browserInfo.name, icon: Globe, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Système d'exploitation", value: browserInfo.os, icon: Cpu, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
    { label: "Plateforme", value: browserInfo.platform, icon: Monitor, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { label: "Langue", value: browserInfo.language, icon: Info, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero User Agent Card */}
      <div className="bg-slate-900 dark:bg-white p-8 md:p-12 rounded-[2.5rem] text-white dark:text-slate-900 shadow-xl shadow-indigo-500/10">
        <div className="flex items-center gap-3 mb-6 opacity-60">
          <Shield className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest">Votre User Agent</span>
        </div>
        <p className="text-lg md:text-2xl font-mono leading-relaxed break-all font-medium">
          {browserInfo.userAgent}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dataCards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center ${card.color} mb-4`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{card.label}</div>
            <div className="text-lg font-bold truncate">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Screen Details */}
        <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 text-indigo-500 mb-8">
            <Maximize className="w-5 h-5" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Écran & Affichage</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase">Résolution</div>
              <div className="text-2xl font-black font-mono">{screenInfo.width} × {screenInfo.height}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase">Ratio Pixel</div>
              <div className="text-2xl font-black font-mono">{screenInfo.pixelRatio.toFixed(1)}x</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase">Profondeur</div>
              <div className="text-2xl font-black font-mono">{screenInfo.colorDepth} bits</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase">Orientation</div>
              <div className="text-xl font-bold">{screenInfo.orientation}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-400 uppercase">Fenêtre (Viewport)</div>
              <div className="text-xl font-black font-mono text-indigo-500">{window.innerWidth} × {window.innerHeight}</div>
            </div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 text-indigo-500 mb-8">
            <MousePointer className="w-5 h-5" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Capacités</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold">Cookies</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${browserInfo.cookiesEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {browserInfo.cookiesEnabled ? 'Activés' : 'Désactivés'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold">Connexion</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${browserInfo.online ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {browserInfo.online ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold">Tactile</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${('ontouchstart' in window) ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                {('ontouchstart' in window) ? 'Oui' : 'Non'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold">DNT (Privacy)</span>
              <span className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase">
                {navigator.doNotTrack === "1" ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/20 p-6 rounded-2xl flex gap-4 items-start">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-amber-500">
          <Info className="w-5 h-5" />
        </div>
        <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">
          Le <strong>User Agent</strong> est une chaîne de caractères envoyée par votre navigateur à chaque site web que vous visitez. Il permet au serveur d'identifier votre navigateur et votre système d'exploitation pour adapter le contenu.
        </p>
      </div>
    </div>
  );
}
