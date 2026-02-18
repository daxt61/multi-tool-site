import React, { useState, useEffect } from 'react';
import { Monitor, Globe, Cpu, Maximize, Copy, Check, Info } from 'lucide-react';

export function UserAgentAnalyzer() {
  const [ua, setUa] = useState('');
  const [screen, setScreen] = useState({ width: 0, height: 0, colorDepth: 0, pixelRatio: 1 });
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setUa(navigator.userAgent);
    setScreen({
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio
    });
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCopyUA = () => {
    navigator.clipboard?.writeText(ua);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getBrowser = () => {
    const userAgent = ua;
    if (userAgent.includes('Firefox')) return 'Mozilla Firefox';
    if (userAgent.includes('SamsungBrowser')) return 'Samsung Internet';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
    if (userAgent.includes('Trident')) return 'Internet Explorer';
    if (userAgent.includes('Edge')) return 'Microsoft Edge';
    if (userAgent.includes('Chrome')) return 'Google Chrome';
    if (userAgent.includes('Safari')) return 'Apple Safari';
    return 'Inconnu';
  };

  const getOS = () => {
    const userAgent = ua;
    if (userAgent.includes('Win')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('X11')) return 'UNIX';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('like Mac')) return 'iOS';
    return 'Inconnu';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Votre User Agent</label>
          <button
            onClick={handleCopyUA}
            className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-sm break-all leading-relaxed text-slate-600 dark:text-slate-300">
          {ua}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Navigateur</p>
              <h3 className="text-lg font-bold">{getBrowser()}</h3>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Système</p>
              <h3 className="text-lg font-bold">{getOS()}</h3>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Écran</p>
              <h3 className="text-lg font-bold">{screen.width} × {screen.height} px</h3>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Maximize className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fenêtre</p>
              <h3 className="text-lg font-bold">{windowSize.width} × {windowSize.height} px</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
        <h4 className="font-bold flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" /> Autres détails techniques
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Plateforme</p>
            <p className="font-mono text-sm">{(navigator as any).platform || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Langue</p>
            <p className="font-mono text-sm">{navigator.language}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pixel Ratio</p>
            <p className="font-mono text-sm">{screen.pixelRatio}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Cookies</p>
            <p className="font-mono text-sm">{navigator.cookieEnabled ? 'Activés' : 'Désactivés'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
