import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Laptop, Globe, Cpu, Maximize, Copy, Check } from 'lucide-react';

export function UserAgentAnalyzer() {
  const [copied, setCopied] = useState(false);
  const [screenMetrics, setScreenMetrics] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio,
    colorDepth: window.screen.colorDepth
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenMetrics(prev => ({
        ...prev,
        width: window.innerWidth,
        height: window.innerHeight
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const ua = navigator.userAgent;

  const getDeviceType = () => {
    if (/tablet|ipad|playbook|silk/i.test(ua)) return { type: 'Tablette', icon: Smartphone };
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return { type: 'Mobile', icon: Smartphone };
    }
    return { type: 'Desktop', icon: Laptop };
  };

  const device = getDeviceType();

  const handleCopy = () => {
    navigator.clipboard.writeText(ua);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = [
    {
      title: 'Navigateur & OS',
      icon: Globe,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      items: [
        { label: 'Plateforme', value: navigator.platform },
        { label: 'Langue', value: navigator.language },
        { label: 'Cookies', value: navigator.cookieEnabled ? 'Activés' : 'Désactivés' },
        { label: 'Do Not Track', value: navigator.doNotTrack || 'Non défini' }
      ]
    },
    {
      title: 'Matériel',
      icon: Cpu,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      items: [
        { label: 'Cœurs CPU', value: navigator.hardwareConcurrency || 'Inconnu' },
        { label: 'Mémoire RAM', value: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'Inconnu' },
        { label: 'Type Appareil', value: device.type }
      ]
    },
    {
      title: 'Écran & Fenêtre',
      icon: Maximize,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      items: [
        { label: 'Fenêtre', value: `${screenMetrics.width} x ${screenMetrics.height}` },
        { label: 'Écran total', value: `${screenMetrics.screenWidth} x ${screenMetrics.screenHeight}` },
        { label: 'Ratio Pixel', value: screenMetrics.pixelRatio },
        { label: 'Profondeur couleur', value: `${screenMetrics.colorDepth} bits` }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* UA Hero */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="flex flex-col gap-6 relative z-10">
          <div className="flex justify-between items-start">
            <div className="text-xs font-black uppercase tracking-widest text-indigo-400">Votre User Agent</div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'}`}
              aria-label="Copier le User Agent"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <div className="text-xl md:text-2xl font-mono text-white/90 leading-relaxed break-all bg-white/5 p-6 rounded-2xl border border-white/10">
            {ua}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 ${section.bg} rounded-xl`}>
                <section.icon className={`w-5 h-5 ${section.color}`} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{section.title}</span>
            </div>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.label}>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">{item.label}</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
          <device.icon className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-xl font-black mb-2 text-indigo-900 dark:text-indigo-300">Analyse de l'appareil</h3>
          <p className="text-slate-600 dark:text-indigo-400/60 leading-relaxed">
            Votre navigateur s'identifie comme un appareil de type <span className="font-bold text-indigo-600 dark:text-indigo-400">{device.type}</span>. Cette information est utilisée par les sites web pour adapter leur affichage et leurs fonctionnalités.
          </p>
        </div>
      </div>
    </div>
  );
}
