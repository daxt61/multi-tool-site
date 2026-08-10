import { useState, useMemo, useEffect, useRef } from 'react';
import { Clock, Trash2, Info, ArrowRight, Signal, Copy, Check } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

type SizeUnit = 'MB' | 'GB' | 'TB';
type SpeedUnit = 'Mbps' | 'Gbps';

interface DownloadTimeCalculatorProps {
  initialData?: any;
  onStateChange?: (state: any) => void;
}

export function DownloadTimeCalculator({ initialData, onStateChange }: DownloadTimeCalculatorProps) {
  const { t } = useTranslation();
  const fileSizeRef = useRef<HTMLInputElement>(null);

  const [fileSize, setFileSize] = useState<string>(initialData?.fileSize ?? '1');
  const [sizeUnit, setSizeUnit] = useState<SizeUnit>(initialData?.sizeUnit ?? 'GB');
  const [speed, setSpeed] = useState<string>(initialData?.speed ?? '100');
  const [speedUnit, setSpeedUnit] = useState<SpeedUnit>(initialData?.speedUnit ?? 'Mbps');
  const [copied, setCopied] = useState(false);

  // Synchronize state via onStateChange
  useEffect(() => {
    onStateChange?.({ fileSize, sizeUnit, speed, speedUnit });
  }, [fileSize, sizeUnit, speed, speedUnit, onStateChange]);

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

  const formatTime = () => {
    if (!result) return t("downloadtime.waiting");
    const parts = [];
    if (result.days > 0) parts.push(`${result.days}d`);
    if (result.hours > 0) parts.push(`${result.hours}h`);
    if (result.minutes > 0) parts.push(`${result.minutes}m`);
    if (result.seconds > 0 || parts.length === 0) parts.push(`${result.seconds}s`);
    return parts.join(' ');
  };

  const handleCopy = () => {
    if (!result) return;
    const summary = `${t("downloadtime.file_size")}: ${fileSize} ${sizeUnit}\n${t("downloadtime.connection_speed")}: ${speed} ${speedUnit}\n${t("downloadtime.estimated_time")}: ${formatTime()}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success(t("downloadtime.copy_success"));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setFileSize('');
    setSpeed('');
    fileSizeRef.current?.focus();
    toast.success(t("downloadtime.clear_success"));
  };

  const handleClearRef = useRef(handleClear);
  const handleCopyRef = useRef(handleCopy);

  useEffect(() => {
    handleClearRef.current = handleClear;
    handleCopyRef.current = handleCopy;
  }, [handleClear, handleCopy]);

  // Isolate keyboard listener via handlersRef to avoid stale closures
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClearRef.current();
        return;
      }

      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.getAttribute("contenteditable") === "true"
      );

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* File Size */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="fileSize" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t("downloadtime.file_size")}</label>
            <div className="flex items-center gap-2">
              <Kbd modifier={null} className="text-slate-400">Esc</Kbd>
              <button
                onClick={handleClear}
                disabled={!fileSize && !speed}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t("common.clear")}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <input
              id="fileSize"
              ref={fileSizeRef}
              type="number"
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
              className="bg-transparent text-4xl font-black font-mono outline-none dark:text-white"
              placeholder="0"
              aria-label={t("downloadtime.file_size")}
            />
            <select
              id="sizeUnit"
              value={sizeUnit}
              onChange={(e) => setSizeUnit(e.target.value as SizeUnit)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={t("downloadtime.size_unit_aria")}
            >
              <option value="MB">{t("downloadtime.size_mb")}</option>
              <option value="GB">{t("downloadtime.size_gb")}</option>
              <option value="TB">{t("downloadtime.size_tb")}</option>
            </select>
          </div>
        </div>

        {/* Connection Speed */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="speed" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t("downloadtime.connection_speed")}</label>
            <div className="flex items-center gap-2 text-indigo-500">
              <Signal className="w-4 h-4" aria-hidden="true" />
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
              aria-label={t("downloadtime.connection_speed")}
            />
            <select
              id="speedUnit"
              value={speedUnit}
              onChange={(e) => setSpeedUnit(e.target.value as SpeedUnit)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-bold text-sm outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={t("downloadtime.speed_unit_aria")}
            >
              <option value="Mbps">{t("downloadtime.speed_mbps")}</option>
              <option value="Gbps">{t("downloadtime.speed_gbps")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Result Display with premium header & action-inline design */}
      <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 text-center space-y-6 relative">
        <div className="flex justify-between items-center border-b border-slate-800/60 pb-4 mb-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-500/20">
            <Clock className="w-3 h-3" aria-hidden="true" /> {t("downloadtime.estimated_time")}
          </div>
          <div className="flex items-center gap-2">
            <Kbd modifier={null} className="hidden sm:inline-flex bg-white/10 text-white border-transparent">C</Kbd>
            <button
              onClick={handleCopy}
              disabled={!result}
              className={`p-3 rounded-2xl transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-2 ${
                copied
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-white/10 text-white/40 border-transparent hover:text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
              title={t("downloadtime.copy_summary_title")}
              aria-label={t("downloadtime.copy_summary_title")}
            >
              {copied ? <Check className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="text-4xl md:text-6xl font-mono font-black text-white tracking-wider break-all">
          {formatTime()}
        </div>
        {result && (
           <p className="text-indigo-300/60 font-bold text-sm uppercase tracking-widest">
             {t("downloadtime.seconds_total", { seconds: Math.ceil(result.totalSeconds) })}
           </p>
        )}
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t("downloadtime.bytes_vs_bits_title")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            <Trans i18nKey="downloadtime.bytes_vs_bits_desc">
              Note that file sizes are typically measured in <strong>Bytes</strong> (B), whereas connection speeds are measured in <strong>Bits</strong> (b). 1 Byte = 8 Bits.
            </Trans>
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Signal className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t("downloadtime.real_speed_title")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("downloadtime.real_speed_desc")}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t("downloadtime.practical_use_title")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t("downloadtime.practical_use_desc")}
          </p>
        </div>
      </div>
    </div>
  );
}
