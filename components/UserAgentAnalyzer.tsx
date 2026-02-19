import { useState, useEffect } from 'react';
import { Monitor, Smartphone, Globe, Layers, Maximize } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function UserAgentAnalyzer() {
  const [uaInfo, setUaInfo] = useState({
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    language: typeof navigator !== 'undefined' ? navigator.language : '',
    platform: typeof navigator !== 'undefined' ? (navigator as any).platform : '',
    screenWidth: typeof window !== 'undefined' ? window.screen.width : 0,
    screenHeight: typeof window !== 'undefined' ? window.screen.height : 0,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    windowHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    colorDepth: typeof window !== 'undefined' ? window.screen.colorDepth : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setUaInfo(prev => ({
        ...prev,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getBrowser = () => {
    const ua = uaInfo.userAgent;
    if (ua.includes('Firefox')) return 'Mozilla Firefox';
    if (ua.includes('SamsungBrowser')) return 'Samsung Internet';
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
    if (ua.includes('Trident')) return 'Internet Explorer';
    if (ua.includes('Edge')) return 'Microsoft Edge';
    if (ua.includes('Chrome')) return 'Google Chrome';
    if (ua.includes('Safari')) return 'Apple Safari';
    return 'Navigateur Inconnu';
  };

  const getOS = () => {
    const ua = uaInfo.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac OS')) return 'macOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'OS Inconnu';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6" />

      {/* Hero Section */}
      <div className="bg-indigo-600 text-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 group overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="p-6 bg-white/10 rounded-[2rem] backdrop-blur-md inline-block">
            {getOS() === 'Android' || getOS() === 'iOS' ? <Smartphone className="w-12 h-12" /> : <Monitor className="w-12 h-12" />}
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black mb-2">{getBrowser()}</h2>
            <p className="text-indigo-100 font-bold text-lg">{getOS()} • {uaInfo.language}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Screen Metrics */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <Maximize className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Écran & Fenêtre</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Résolution Écran</div>
              <div className="text-xl font-black font-mono">{uaInfo.screenWidth} × {uaInfo.screenHeight}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Taille Fenêtre</div>
              <div className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{uaInfo.windowWidth} × {uaInfo.windowHeight}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Pixel Ratio</div>
              <div className="text-xl font-black font-mono">{uaInfo.devicePixelRatio}x</div>
            </div>
          </div>
        </div>

        {/* Browser Details */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
          <div className="flex items-center gap-3 text-indigo-500">
            <Globe className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Navigateur</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Langue</div>
              <div className="text-xl font-black">{uaInfo.language}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Plateforme</div>
              <div className="text-xl font-black">{uaInfo.platform || 'N/A'}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase mb-1 tracking-wider">Profondeur couleur</div>
              <div className="text-xl font-black">{uaInfo.colorDepth} bits</div>
            </div>
          </div>
        </div>

        {/* Full UA string */}
        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6 md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 text-indigo-500">
            <Layers className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">User Agent</h3>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700">
            <p className="text-xs font-mono break-all leading-relaxed text-slate-600 dark:text-slate-400">
              {uaInfo.userAgent}
            </p>
          </div>
        </div>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
