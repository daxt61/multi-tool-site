import { useState, useEffect } from 'react';
import { Monitor, Cpu, Globe, Maximize, Smartphone, Laptop, Trash2, Copy, Check } from 'lucide-react';

interface BrowserInfo {
  name: string;
  version: string;
  os: string;
  platform: string;
  isMobile: boolean;
}

interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelRatio: number;
  windowWidth: number;
  windowHeight: number;
  language: string;
  timezone: string;
}

export function UserAgentAnalyzer() {
  const [userAgent, setUserAgent] = useState('');
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    name: 'Inconnu',
    version: 'Inconnue',
    os: 'Inconnu',
    platform: 'Inconnue',
    isMobile: false,
  });
  const [screenInfo, setScreenInfo] = useState<ScreenInfo>({
    width: 0,
    height: 0,
    availWidth: 0,
    availHeight: 0,
    colorDepth: 0,
    pixelRatio: 0,
    windowWidth: 0,
    windowHeight: 0,
    language: 'Inconnue',
    timezone: 'UTC',
  });
  const [copied, setCopied] = useState(false);

  const analyzeUA = (ua: string): BrowserInfo => {
    const browser: BrowserInfo = {
      name: 'Inconnu',
      version: 'Inconnue',
      os: 'Inconnu',
      platform: 'Inconnue',
      isMobile: /Mobi|Android/i.test(ua),
    };

    if (ua.includes('Firefox/')) {
      browser.name = 'Firefox';
      browser.version = ua.split('Firefox/')[1];
    } else if (ua.includes('Edg/')) {
      browser.name = 'Edge';
      browser.version = ua.split('Edg/')[1];
    } else if (ua.includes('Chrome/')) {
      browser.name = 'Chrome';
      browser.version = ua.split('Chrome/')[1].split(' ')[0];
    } else if (ua.includes('Safari/')) {
      browser.name = 'Safari';
      browser.version = ua.split('Version/')[1]?.split(' ')[0] || 'Inconnue';
    }

    if (ua.includes('Windows')) browser.os = 'Windows';
    else if (ua.includes('Mac OS')) browser.os = 'macOS';
    else if (ua.includes('Android')) browser.os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) browser.os = 'iOS';
    else if (ua.includes('Linux')) browser.os = 'Linux';

    return browser;
  };

  const updateMetrics = () => {
    setScreenInfo({
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  };

  useEffect(() => {
    const ua = navigator.userAgent;
    setUserAgent(ua);
    setBrowserInfo(analyzeUA(ua));
    updateMetrics();

    window.addEventListener('resize', updateMetrics);
    return () => window.removeEventListener('resize', updateMetrics);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(userAgent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const metrics = [
    { label: 'Navigateur', value: browserInfo.name, icon: Globe },
    { label: 'Version', value: browserInfo.version, icon: Cpu },
    { label: 'Système', value: browserInfo.os, icon: Laptop },
    { label: 'Appareil', value: browserInfo.isMobile ? 'Mobile' : 'Ordinateur', icon: browserInfo.isMobile ? Smartphone : Monitor },
    { label: 'Résolution', value: `${screenInfo.width}x${screenInfo.height}`, icon: Maximize },
    { label: 'Fenêtre', value: `${screenInfo.windowWidth}x${screenInfo.windowHeight}`, icon: Maximize },
    { label: 'Langue', value: screenInfo.language, icon: Globe },
    { label: 'Fuseau horaire', value: screenInfo.timezone, icon: Globe },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">User Agent String</label>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
            <button
              onClick={() => setUserAgent('')}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        </div>
        <textarea
          value={userAgent}
          onChange={(e) => {
            setUserAgent(e.target.value);
            setBrowserInfo(analyzeUA(e.target.value));
          }}
          className="w-full h-32 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 font-mono text-sm resize-none focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          placeholder="Collez un User Agent ici pour l'analyser..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, i) => (
          <div key={i} className="p-6 bg-white dark:bg-slate-900/40 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <metric.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{metric.label}</p>
              <p className="font-bold truncate dark:text-white">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20">
        <h3 className="text-indigo-900 dark:text-indigo-300 font-bold mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5" /> À quoi ça sert ?
        </h3>
        <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed">
          Le "User Agent" est une chaîne de caractères envoyée par votre navigateur à chaque site web que vous visitez. Elle contient des informations sur votre navigateur, votre système d'exploitation et votre matériel. Cet outil vous permet de décoder ces informations et de voir les caractéristiques techniques de votre environnement actuel.
        </p>
      </div>
    </div>
  );
}
