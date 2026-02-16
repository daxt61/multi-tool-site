import { useState, useEffect } from 'react';
import { Monitor, Cpu, Globe, Maximize, Copy, Check, Layout, Info } from 'lucide-react';

export function UserAgentAnalyzer() {
  const [copied, setCopied] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({
    userAgent: '',
    language: '',
    platform: '',
    screenWidth: 0,
    screenHeight: 0,
    windowWidth: 0,
    windowHeight: 0,
    pixelRatio: 0,
    colorDepth: 0,
    cookiesEnabled: false,
    doNotTrack: '',
  });

  useEffect(() => {
    const updateInfo = () => {
      setBrowserInfo({
        userAgent: navigator.userAgent,
        language: navigator.language,
        // @ts-ignore
        platform: navigator.platform || navigator.userAgentData?.platform || 'Unknown',
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio,
        colorDepth: window.screen.colorDepth,
        cookiesEnabled: navigator.cookieEnabled,
        doNotTrack: navigator.doNotTrack || 'Unknown',
      });
    };

    updateInfo();
    window.addEventListener('resize', updateInfo);
    return () => window.removeEventListener('resize', updateInfo);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const infoSections = [
    {
      title: "Navigateur & Système",
      icon: Globe,
      items: [
        { label: "Langue", value: browserInfo.language },
        { label: "Plateforme", value: browserInfo.platform },
        { label: "Cookies", value: browserInfo.cookiesEnabled ? "Activés" : "Désactivés" },
        { label: "Do Not Track", value: browserInfo.doNotTrack === "1" ? "Activé" : "Désactivé / Inconnu" },
      ]
    },
    {
      title: "Affichage & Écran",
      icon: Monitor,
      items: [
        { label: "Résolution Écran", value: `${browserInfo.screenWidth} x ${browserInfo.screenHeight}` },
        { label: "Fenêtre Browser", value: `${browserInfo.windowWidth} x ${browserInfo.windowHeight}` },
        { label: "Ratio de Pixels", value: browserInfo.pixelRatio.toFixed(2) },
        { label: "Profondeur Couleurs", value: `${browserInfo.colorDepth} bits` },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Main User Agent Card */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest">
              <Cpu className="w-4 h-4" /> User Agent String
            </div>
            <button
              onClick={() => handleCopy(browserInfo.userAgent)}
              className={`p-2 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              title="Copier le User Agent"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-white font-mono text-sm md:text-lg leading-relaxed break-all bg-white/5 p-6 rounded-2xl border border-white/10">
            {browserInfo.userAgent}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {infoSections.map((section, idx) => (
          <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
              <section.icon className="w-6 h-6 text-indigo-500" />
              {section.title}
            </h3>
            <div className="space-y-4">
              {section.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800 last:border-0">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                  <span className="font-black text-slate-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex flex-col md:flex-row gap-8 items-center">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-lg shadow-indigo-600/20">
          <Info className="w-8 h-8" />
        </div>
        <div>
          <h4 className="font-black text-indigo-900 dark:text-indigo-100 mb-2 text-lg">À quoi sert cette information ?</h4>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
            Ces données sont principalement utilisées par les développeurs pour diagnostiquer des bugs spécifiques à un navigateur ou à un système d'exploitation. Elles permettent également d'optimiser l'expérience utilisateur en fonction de la taille de l'écran et des capacités du dispositif.
          </p>
        </div>
      </div>
    </div>
  );
}
