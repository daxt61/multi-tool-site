import React, { useState, useEffect, useMemo } from 'react';
import { Monitor, Smartphone, Globe, Layers, Maximize, Copy, Check, Info, Cpu, MousePointer2 } from 'lucide-react';

export function UserAgentAnalyzer() {
  const [metrics, setMetrics] = useState({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenWidth: typeof window !== 'undefined' ? window.screen.width : 0,
    screenHeight: typeof window !== 'undefined' ? window.screen.height : 0,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    windowHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    colorDepth: typeof window !== 'undefined' ? window.screen.colorDepth : 0,
    cookiesEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
    hardwareConcurrency: typeof navigator !== 'undefined' ? (navigator as any).hardwareConcurrency || 'N/A' : 'N/A',
    touchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setMetrics(prev => ({
        ...prev,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(metrics, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parsedUA = useMemo(() => {
    const ua = metrics.userAgent;
    let browser = "Inconnu";
    let os = "Inconnu";

    if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("MSIE") || ua.includes("Trident")) browser = "Internet Explorer";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    return { browser, os };
  }, [metrics.userAgent]);

  const cards = [
    {
      title: "Navigateur",
      icon: Globe,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      value: parsedUA.browser,
      detail: metrics.language
    },
    {
      title: "Système",
      icon: Layers,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
      value: parsedUA.os,
      detail: metrics.platform
    },
    {
      title: "Écran",
      icon: Monitor,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      value: `${metrics.screenWidth} × ${metrics.screenHeight}`,
      detail: `${metrics.colorDepth}-bit color depth`
    },
    {
      title: "Fenêtre",
      icon: Maximize,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      value: `${metrics.windowWidth} × ${metrics.windowHeight}`,
      detail: `Pixel ratio: ${metrics.pixelRatio}`
    },
    {
      title: "Hardware",
      icon: Cpu,
      color: "text-rose-500",
      bg: "bg-rose-50 dark:bg-rose-500/10",
      value: `${metrics.hardwareConcurrency} cœurs logiques`,
      detail: metrics.touchPoints > 0 ? "Écran tactile détecté" : "Pas de tactile"
    },
    {
      title: "Capacités",
      icon: MousePointer2,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-500/10",
      value: metrics.cookiesEnabled ? "Cookies activés" : "Cookies désactivés",
      detail: `JavaScript activé`
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* User Agent Header */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400">Votre User Agent</h3>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Copier JSON'}
            </button>
          </div>
          <p className="text-lg md:text-xl font-mono text-white/90 break-all leading-relaxed">
            {metrics.userAgent}
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Globe className="w-64 h-64 text-white -mr-20 -mt-20" />
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all group">
            <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{card.title}</div>
            <div className="text-xl font-black mb-1 dark:text-white">{card.value}</div>
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.detail}</div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-950/20 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex flex-col md:flex-row gap-8 items-center">
        <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
          <Info className="w-8 h-8" />
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h4 className="font-black text-indigo-900 dark:text-indigo-300">À quoi ça sert ?</h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-400 font-medium leading-relaxed">
            Ces informations sont envoyées par votre navigateur à chaque site que vous visitez. Elles permettent aux développeurs d'adapter l'expérience à votre appareil, mais peuvent aussi être utilisées pour le "fingerprinting". Toutes ces données sont lues localement via les APIs Web de votre navigateur.
          </p>
        </div>
      </div>
    </div>
  );
}
