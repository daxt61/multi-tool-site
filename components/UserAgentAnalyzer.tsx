import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Globe, Maximize, Layout, Cpu, Shield, User, Search, RefreshCw } from 'lucide-react';

export function UserAgentAnalyzer() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: window.devicePixelRatio
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        pixelRatio: window.devicePixelRatio
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const ua = navigator.userAgent;

  const getBrowser = () => {
    if (ua.includes('Firefox')) return 'Mozilla Firefox';
    if (ua.includes('Edg')) return 'Microsoft Edge';
    if (ua.includes('Chrome')) return 'Google Chrome';
    if (ua.includes('Safari')) return 'Apple Safari';
    return 'Inconnu';
  };

  const getOS = () => {
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('like Mac')) return 'iOS';
    return 'Inconnu';
  };

  const dataGroups = [
    {
      title: "Navigateur",
      icon: Globe,
      color: "text-blue-500",
      items: [
        { label: "Nom", value: getBrowser() },
        { label: "Moteur", value: navigator.product || 'WebKit / Blink' },
        { label: "Langue", value: navigator.language },
        { label: "Cookies", value: navigator.cookieEnabled ? 'Activés' : 'Désactivés' }
      ]
    },
    {
      title: "Système d'exploitation",
      icon: Cpu,
      color: "text-indigo-500",
      items: [
        { label: "OS", value: getOS() },
        { label: "Plateforme", value: navigator.platform },
        { label: "Cœurs CPU", value: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency}` : 'N/A' },
        { label: "Mémoire", value: (navigator as any).deviceMemory ? `~${(navigator as any).deviceMemory} Go` : 'N/A' }
      ]
    },
    {
      title: "Écran & Fenêtre",
      icon: Layout,
      color: "text-emerald-500",
      items: [
        { label: "Résolution Écran", value: `${window.screen.width} x ${window.screen.height}` },
        { label: "Fenêtre Actuelle", value: `${windowSize.width} x ${windowSize.height}` },
        { label: "Ratio Pixels", value: `${windowSize.pixelRatio}` },
        { label: "Profondeur Couleurs", value: `${window.screen.colorDepth}-bit` }
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Monitor className="w-48 h-48 -mr-12 -mt-12" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
            <User className="w-3 h-3" /> Analyse Client
          </div>
          <h2 className="text-3xl font-black">Votre configuration système</h2>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 text-sm font-bold bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
              <Globe className="w-4 h-4 text-indigo-200" /> {getBrowser()}
            </div>
            <div className="flex items-center gap-2 text-sm font-bold bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
              <Shield className="w-4 h-4 text-indigo-200" /> {getOS()}
            </div>
            <div className="flex items-center gap-2 text-sm font-bold bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
              <Maximize className="w-4 h-4 text-indigo-200" /> {windowSize.width} x {windowSize.height}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dataGroups.map((group, idx) => (
          <div key={idx} className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800 ${group.color}`}>
                <group.icon className="w-5 h-5" />
              </div>
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">{group.title}</h3>
            </div>
            <div className="space-y-4">
              {group.items.map((item, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{item.label}</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[150px]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Raw User Agent */}
      <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-slate-400">
            <Search className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs">User Agent Brut</h3>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-xs leading-relaxed break-all text-slate-600 dark:text-slate-400">
          {ua}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-900/30">
        <h4 className="font-bold text-emerald-900 dark:text-emerald-300 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Confidentialité & Sécurité
        </h4>
        <p className="text-xs text-emerald-700 dark:text-emerald-500/80 leading-relaxed">
          Ces informations sont accessibles par n'importe quel site web via des APIs standards du navigateur.
          Elles sont principalement utilisées par les développeurs pour assurer la compatibilité, optimiser l'affichage
          ou pour des raisons de sécurité et d'analyse. Nous ne stockons aucune de ces données sur nos serveurs.
        </p>
      </div>
    </div>
  );
}
