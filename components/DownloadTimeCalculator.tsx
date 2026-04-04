import { useState, useMemo } from 'react';
import { Download, Clock, Trash2, Info, ArrowRight, Signal } from 'lucide-react';

type SizeUnit = 'MB' | 'GB' | 'TB';
type SpeedUnit = 'Mbps' | 'Gbps';

export function DownloadTimeCalculator() {
  const [fileSize, setFileSize] = useState<string>('1');
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>('GB');
  const [speed, setSpeed] = useState<string>('100');
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>('Mbps');

  const result = useMemo(() => {
    const size = parseFloat(fileSize);
    const connectionSpeed = parseFloat(speed);

    if (isNaN(size) || isNaN(connectionSpeed) || size <= 0 || connectionSpeed <= 0) {
      return null;
    }

    // Convert file size to Megabits
    let sizeInMegabits = size * 8; // Assuming size is in MegaBytes for now
    if (sizeUnit === 'GB') sizeInMegabits *= 1024;
    if (sizeUnit === 'TB') sizeInMegabits *= 1024 * 1024;

    // Convert speed to Mbps
    let speedInMbps = connectionSpeed;
    if (speedUnit === 'Gbps') speedInMbps *= 1000;

    const totalSeconds = sizeInMegabits / speedInMbps;

    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return { days, hours, minutes, seconds, totalSeconds };
  }, [fileSize, sizeUnit, speed, speedUnit]);

  const handleClear = () => {
    setFileSize('');
    setSpeed('');
  };

  const formatTime = () => {
    if (!result) return 'En attente...';
    const parts = [];
    if (result.days > 0) parts.push(`${result.days}j`);
    if (result.hours > 0) parts.push(`${result.hours}h`);
    if (result.minutes > 0) parts.push(`${result.minutes}m`);
    if (result.seconds > 0 || parts.length === 0) parts.push(`${result.seconds}s`);
    return parts.join(' ');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* File Size */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="fileSize" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Taille du fichier</label>
            <button
              onClick={handleClear}
              disabled={!fileSize && !speed}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <div className="flex flex-col gap-3 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <input
              id="fileSize"
              type="number"
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
              className="bg-transparent text-4xl font-black font-mono outline-none dark:text-white"
              placeholder="0"
              aria-label="Taille du fichier"
            />
            <select
              id="sizeUnit"
              value={sizeUnit}
              onChange={(e) => setSizeUnit(e.target.value as SizeUnit)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none cursor-pointer"
              aria-label="Unité de taille"
            >
              <option value="MB">Mega-octets (Mo)</option>
              <option value="GB">Giga-octets (Go)</option>
              <option value="TB">Tera-octets (To)</option>
            </select>
          </div>
        </div>

        {/* Connection Speed */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="speed" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Vitesse de connexion</label>
            <div className="flex items-center gap-2 text-indigo-500">
              <Signal className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-col gap-3 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <input
              id="speed"
              type="number"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              className="bg-transparent text-4xl font-black font-mono outline-none dark:text-white"
              placeholder="0"
              aria-label="Vitesse de connexion"
            />
            <select
              id="speedUnit"
              value={speedUnit}
              onChange={(e) => setSpeedUnit(e.target.value as SpeedUnit)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none cursor-pointer"
              aria-label="Unité de vitesse"
            >
              <option value="Mbps">Megabits par seconde (Mbps)</option>
              <option value="Gbps">Gigabits par seconde (Gbps)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Result Display */}
      <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
          <Clock className="w-3 h-3" /> Temps estimé
        </div>
        <div className="text-4xl md:text-6xl font-mono font-black text-white tracking-wider break-all">
          {formatTime()}
        </div>
        {result && (
           <p className="text-indigo-300/60 font-bold text-sm uppercase tracking-widest">
             Soit environ {Math.ceil(result.totalSeconds)} secondes au total
           </p>
        )}
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Octets vs Bits
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Notez que la taille des fichiers est généralement mesurée en <strong>Octets</strong> (B/o), alors que les vitesses de connexion sont mesurées en <strong>Bits</strong> (b). 1 Octet = 8 Bits.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Signal className="w-4 h-4 text-indigo-500" /> Vitesse réelle
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les estimations sont basées sur une vitesse constante. En réalité, le débit peut varier selon le trafic réseau, la qualité de votre matériel ou les limitations du serveur.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-indigo-500" /> Usage pratique
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilisez cet outil pour prévoir le temps nécessaire au téléchargement d'un gros fichier (comme un jeu vidéo ou une vidéo HD) ou à la mise en ligne d'une sauvegarde complète.
          </p>
        </div>
      </div>
    </div>
  );
}
