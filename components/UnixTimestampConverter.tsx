import { useState, useEffect, useRef } from 'react';
import { Clock, Copy, Check, RefreshCw, Calendar, Globe, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

export function UnixTimestampConverter() {
  const { t } = useTranslation();
  const [timestamp, setTimestamp] = useState(() => Math.floor(Date.now() / 1000).toString());
  const [copied, setCopied] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getDates = (ts: string) => {
    try {
      let val = parseInt(ts, 10);
      if (isNaN(val)) return null;

      // If timestamp is too large, assume milliseconds
      if (val > 99999999999) {
        val = Math.floor(val / 1000);
      }

      const date = new Date(val * 1000);
      if (isNaN(date.getTime())) return null;

      return {
        iso: date.toISOString(),
        utc: date.toUTCString(),
        local: date.toLocaleString(),
        relative: getRelativeTime(date)
      };
    } catch {
      return null;
    }
  };

  const getRelativeTime = (date: Date) => {
    const diff = date.getTime() - Date.now();
    const absDiff = Math.abs(diff);
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const prefix = diff > 0 ? 'Dans ' : 'Il y a ';

    if (seconds < 60) return `${prefix}${seconds}s`;
    if (minutes < 60) return `${prefix}${minutes}m`;
    if (hours < 24) return `${prefix}${hours}h`;
    return `${prefix}${days}d`;
  };

  const dates = getDates(timestamp);

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success(t('unixtimestamp.toast_copied'));
    setTimeout(() => setCopied(''), 2000);
  };

  const handleSetNow = () => {
    const nowTs = Math.floor(Date.now() / 1000).toString();
    setTimestamp(nowTs);
    toast.success(t('unixtimestamp.toast_now'));
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setTimestamp('');
    toast.success(t('unixtimestamp.toast_cleared'));
    inputRef.current?.focus();
  };

  // Keep ref updated to avoid stale closures in event listeners
  const handlersRef = useRef({
    handleClear,
    handleSetNow,
    copyToClipboard,
    timestamp
  });

  useEffect(() => {
    handlersRef.current = {
      handleClear,
      handleSetNow,
      copyToClipboard,
      timestamp
    };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isEditable =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).isContentEditable);

      // Check if focus is inside our container or if no input is focused
      if (containerRef.current && active && !containerRef.current.contains(active) && isEditable) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if ((e.key === 'n' || e.key === 'N' || e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!isEditable) {
          e.preventDefault();
          handlersRef.current.handleSetNow();
        }
      } else if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!isEditable && handlersRef.current.timestamp) {
          e.preventDefault();
          handlersRef.current.copyToClipboard(handlersRef.current.timestamp, 'main');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-8">
      {/* Input Area */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <label htmlFor="unix-timestamp-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('unixtimestamp.label')}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSetNow}
              className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={t('unixtimestamp.use_current')}
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('unixtimestamp.use_current')}</span>
              <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-indigo-200 dark:border-indigo-800 text-indigo-500">
                N
              </Kbd>
            </button>
            <button
              onClick={handleClear}
              disabled={!timestamp}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-full flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              aria-label={t('unixtimestamp.clear')}
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('unixtimestamp.clear')}</span>
              <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-rose-200 dark:border-rose-800 text-rose-400">
                Esc
              </Kbd>
            </button>
          </div>
        </div>
        <div className="relative">
          <input
            id="unix-timestamp-input"
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value.replace(/[^\d-]/g, ''))}
            className="w-full p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            placeholder={t('unixtimestamp.input_placeholder')}
          />
          {timestamp && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider hidden md:block">
              {timestamp.length > 11 ? t('unixtimestamp.milliseconds') : t('unixtimestamp.seconds')}
            </div>
          )}
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { id: 'local', label: t('unixtimestamp.local_time'), value: dates?.local, icon: <Clock className="w-4 h-4" aria-hidden="true" /> },
          { id: 'iso', label: t('unixtimestamp.iso_8601'), value: dates?.iso, icon: <Calendar className="w-4 h-4" aria-hidden="true" /> },
          { id: 'utc', label: t('unixtimestamp.utc_gmt'), value: dates?.utc, icon: <Globe className="w-4 h-4" aria-hidden="true" /> },
          { id: 'relative', label: t('unixtimestamp.relative'), value: dates?.relative, icon: <RefreshCw className="w-4 h-4" aria-hidden="true" /> },
        ].map((item) => (
          <div key={item.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] space-y-3 group transition-all hover:border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-indigo-500 transition-colors">
                {item.icon}
                <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
              </div>
              <button
                onClick={() => item.value && copyToClipboard(item.value, item.id)}
                disabled={!item.value}
                className={`p-2 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${copied === item.id ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600'}`}
                aria-label={`Copy ${item.label}`}
              >
                {copied === item.id ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              </button>
            </div>
            <div className="text-lg font-black font-mono break-all dark:text-slate-200">
              {item.value || t('unixtimestamp.invalid')}
            </div>
          </div>
        ))}
      </div>

      {/* Conversion from Date to Timestamp */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110" aria-hidden="true"></div>
        <div className="relative z-10 space-y-6">
          <h3 className="text-xl font-black">{t('unixtimestamp.convert_date_title')}</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 space-y-1">
              <label htmlFor="date-to-timestamp-input" className="sr-only">
                {t('unixtimestamp.select_date_label')}
              </label>
              <input
                id="date-to-timestamp-input"
                type="datetime-local"
                onChange={(e) => {
                  const date = new Date(e.target.value);
                  if (!isNaN(date.getTime())) {
                    setTimestamp(Math.floor(date.getTime() / 1000).toString());
                  }
                }}
                className="w-full p-4 bg-white/10 border border-white/20 rounded-2xl outline-none focus:ring-2 focus:ring-white/30 transition-all font-bold text-white [color-scheme:dark]"
              />
            </div>
            <button
              onClick={() => copyToClipboard(timestamp, 'main')}
              disabled={!timestamp}
              className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={t('unixtimestamp.copy_result')}
            >
              {copied === 'main' ? <Check className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
              <span>{t('unixtimestamp.copy_result')}</span>
              {!copied && (
                <Kbd modifier={null} className="hidden sm:inline-flex bg-indigo-50 border-indigo-200 text-indigo-600">
                  C
                </Kbd>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
