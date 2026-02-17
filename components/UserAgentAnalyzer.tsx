import { useState, useEffect } from 'react';
import { Monitor, Cpu, Globe, Maximize, Copy, Check, Info, ShieldCheck } from 'lucide-react';

export function UserAgentAnalyzer() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    screenW: typeof window !== 'undefined' ? window.screen.width : 0,
    screenH: typeof window !== 'undefined' ? window.screen.height : 0,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
        screenW: window.screen.width,
        screenH: window.screen.height,
        pixelRatio: window.devicePixelRatio,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = typeof navigator !== 'undefined' ? (navigator as any).platform : '';
  const language = typeof navigator !== 'undefined' ? navigator.language : '';
  const cookiesEnabled = typeof navigator !== 'undefined' ? navigator.cookieEnabled : false;

  const handleCopy = () => {
    const data = `User Agent: ${ua}
Platform: ${platform}
Language: ${language}
Window: ${windowSize.width}x${windowSize.height}
Screen: ${windowSize.screenW}x${windowSize.screenH}
Pixel Ratio: ${windowSize.pixelRatio}`;
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* User Agent Banner */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Votre User Agent</label>
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center gap-2 font-bold text-xs ${
                copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Tout copier'}
            </button>
          </div>
          <div className="text-xl md:text-2xl font-mono text-indigo-400 break-all leading-relaxed">
            {ua}
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Monitor className="w-5 h-5" />, label: 'Fenêtre', value: `${windowSize.width} x ${windowSize.height}` },
          { icon: <Maximize className="w-5 h-5" />, label: 'Écran', value: `${windowSize.screenW} x ${windowSize.screenH}` },
          { icon: <Cpu className="w-5 h-5" />, label: 'Plateforme', value: platform || 'Inconnue' },
          { icon: <Globe className="w-5 h-5" />, label: 'Langue', value: language },
        ].map((stat) => (
          <div key={stat.label} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4 transition-all hover:border-indigo-500/30">
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-indigo-500 shadow-sm">
              {stat.icon}
            </div>
            <div>
              <div className="text-xl font-black font-mono tracking-tight dark:text-white">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
          <h4 className="font-black text-lg flex items-center gap-2 dark:text-white">
            <ShieldCheck className="w-5 h-5 text-indigo-500" /> Détails Navigateur
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <span className="text-sm font-bold text-slate-500">Cookies Activés</span>
              <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${cookiesEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                {cookiesEnabled ? 'Oui' : 'Non'}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <span className="text-sm font-bold text-slate-500">Pixel Ratio</span>
              <span className="text-sm font-black font-mono dark:text-white">
                {windowSize.pixelRatio}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <span className="text-sm font-bold text-slate-500">Do Not Track</span>
              <span className="text-xs font-black uppercase px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                {typeof navigator !== 'undefined' && (navigator as any).doNotTrack === '1' ? 'Activé' : 'Désactivé'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden flex flex-col justify-center">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
           <Info className="w-12 h-12 mb-6 opacity-50" />
           <h3 className="text-2xl font-black mb-4">À quoi ça sert ?</h3>
           <p className="text-indigo-100 font-medium leading-relaxed">
             L'User Agent est une chaîne de caractères envoyée par votre navigateur aux sites web pour s'identifier. Ces informations aident les développeurs à diagnostiquer des bugs ou à adapter l'interface à votre écran.
           </p>
        </div>
      </div>
    </div>
  );
}
