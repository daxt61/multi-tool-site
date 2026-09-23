import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Palette, Trash2, Copy, Check, Plus, RefreshCcw, Layers, Sparkles, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface ColorStop {
  id: string;
  color: string;
  position: number;
}

interface Preset {
  id: string;
  nameKey: string;
  type: 'linear' | 'radial';
  angle: number;
  stops: ColorStop[];
}

const DEFAULT_STOPS: ColorStop[] = [
  { id: '1', color: '#6366f1', position: 0 },
  { id: '2', color: '#a855f7', position: 100 },
];

const PRESETS: Preset[] = [
  {
    id: 'sunset',
    nameKey: 'gradient.preset_sunset',
    type: 'linear',
    angle: 135,
    stops: [
      { id: 'p1-1', color: '#f97316', position: 0 },
      { id: 'p1-2', color: '#ec4899', position: 100 },
    ],
  },
  {
    id: 'ocean',
    nameKey: 'gradient.preset_ocean',
    type: 'linear',
    angle: 90,
    stops: [
      { id: 'p2-1', color: '#06b6d4', position: 0 },
      { id: 'p2-2', color: '#3b82f6', position: 100 },
    ],
  },
  {
    id: 'neon',
    nameKey: 'gradient.preset_neon',
    type: 'radial',
    angle: 135,
    stops: [
      { id: 'p3-1', color: '#10b981', position: 0 },
      { id: 'p3-2', color: '#6366f1', position: 100 },
    ],
  },
  {
    id: 'berry',
    nameKey: 'gradient.preset_berry',
    type: 'linear',
    angle: 180,
    stops: [
      { id: 'p4-1', color: '#8b5cf6', position: 0 },
      { id: 'p4-2', color: '#d946ef', position: 100 },
    ],
  },
];

export function GradientGenerator() {
  const { t } = useTranslation();
  const [type, setType] = useState<'linear' | 'radial'>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<ColorStop[]>(DEFAULT_STOPS);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  const activePresetId = useMemo(() => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const match = PRESETS.find((p) => {
      if (p.type !== type) return false;
      if (type === 'linear' && p.angle !== angle) return false;
      if (p.stops.length !== sortedStops.length) return false;
      const sortedPresetStops = [...p.stops].sort((a, b) => a.position - b.position);
      return sortedPresetStops.every(
        (ps, i) =>
          ps.position === sortedStops[i].position &&
          ps.color.toLowerCase() === sortedStops[i].color.toLowerCase()
      );
    });
    return match?.id || null;
  }, [type, angle, stops]);

  const gradientString = useMemo(() => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopsStr = sortedStops.map((s) => `${s.color} ${s.position}%`).join(', ');
    return type === 'linear'
      ? `linear-gradient(${angle}deg, ${stopsStr})`
      : `radial-gradient(circle, ${stopsStr})`;
  }, [type, angle, stops]);

  const handleAddStop = () => {
    if (stops.length >= 5) return;
    const newStop: ColorStop = {
      id: crypto.randomUUID(),
      color: '#ffffff',
      position: 50,
    };
    setStops([...stops, newStop]);
  };

  const handleRemoveStop = (id: string) => {
    if (stops.length <= 2) return;
    setStops(stops.filter((s) => s.id !== id));
  };

  const handleUpdateStop = (id: string, updates: Partial<ColorStop>) => {
    setStops(stops.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`background: ${gradientString};`);
    setCopied(true);
    toast.success(t('gradient.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [gradientString, t]);

  const handleReset = useCallback(() => {
    setType('linear');
    setAngle(135);
    setStops(DEFAULT_STOPS);
    toast.success(t('gradient.toast_reset'));
    primaryInputRef.current?.focus();
  }, [t]);

  const handleApplyPreset = (preset: Preset) => {
    setType(preset.type);
    setAngle(preset.angle);
    setStops(preset.stops);
    toast.success(t('gradient.toast_preset_applied', { name: t(preset.nameKey) }));
  };

  const handleRandomize = () => {
    const generateSecureHex = () => {
      const range = 16777216;
      const array = new Uint32Array(1);
      const maxUint32 = 0xffffffff;
      const limit = maxUint32 - (maxUint32 % range);
      let randomValue;
      do {
        window.crypto.getRandomValues(array);
        randomValue = array[0];
      } while (randomValue >= limit);
      return '#' + (randomValue % range).toString(16).padStart(6, '0');
    };

    setStops(stops.map((s) => ({ ...s, color: generateSecureHex() })));
    toast.success(t('gradient.toast_randomized'));
  };

  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        containerRef.current &&
        !containerRef.current.contains(activeElement) &&
        activeElement !== document.body
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const isEditingText =
          activeElement instanceof HTMLInputElement && activeElement.type === 'text';
        if (!isEditingText) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" /> {t('gradient.presets_title')}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isActive}
                className={`p-3 text-left border rounded-2xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/50 dark:border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                }`}
              >
                <div
                  className={`text-xs font-bold transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`}
                >
                  {t(preset.nameKey)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono uppercase">
                  {preset.type} • {preset.stops.length} {t('gradient.color_stops')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-2 px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('gradient.configuration')}
              </h3>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleRandomize}
                  aria-label={t('gradient.randomize')}
                  className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  <RefreshCcw className="w-3 h-3" aria-hidden="true" /> {t('gradient.randomize')}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label={t('gradient.reset')}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>{t('gradient.reset')}</span>
                  <Kbd modifier={null} className="hidden xl:inline-flex bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-500">Esc</Kbd>
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('linear')}
                  aria-pressed={type === 'linear'}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    type === 'linear'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  {t('gradient.linear')}
                </button>
                <button
                  type="button"
                  onClick={() => setType('radial')}
                  aria-pressed={type === 'radial'}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                    type === 'radial'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  {t('gradient.radial')}
                </button>
              </div>

              {type === 'linear' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor="gradient-angle" className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer">
                      {t('gradient.angle')} ({angle}°)
                    </label>
                  </div>
                  <input
                    ref={primaryInputRef}
                    id="gradient-angle"
                    type="range"
                    min="0"
                    max="360"
                    value={angle}
                    aria-valuemin={0}
                    aria-valuemax={360}
                    aria-valuenow={angle}
                    aria-label={`${t('gradient.angle')} (${angle}°)`}
                    onChange={(e) => setAngle(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{t('gradient.color_stops')}</span>
                  <button
                    type="button"
                    onClick={handleAddStop}
                    disabled={stops.length >= 5}
                    aria-label={t('gradient.add_stop')}
                    className="text-xs font-bold text-indigo-600 flex items-center gap-1 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-2 py-0.5"
                  >
                    <Plus className="w-3 h-3" aria-hidden="true" /> {t('gradient.add_stop')}
                  </button>
                </div>
                <div className="space-y-3">
                  {stops.map((stop) => (
                    <div
                      key={stop.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"
                    >
                      <input
                        type="color"
                        value={stop.color}
                        aria-label={`${t('gradient.stop_color')} ${stop.position}%`}
                        onChange={(e) => handleUpdateStop(stop.id, { color: e.target.value })}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      />
                      <div className="flex-1 space-y-1">
                        <label htmlFor={`gradient-stop-pos-${stop.id}`} className="sr-only">
                          {t('gradient.stop_position')}
                        </label>
                        <input
                          id={`gradient-stop-pos-${stop.id}`}
                          type="range"
                          min="0"
                          max="100"
                          value={stop.position}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={stop.position}
                          aria-label={`${t('gradient.stop_position')} (${stop.position}%)`}
                          onChange={(e) =>
                            handleUpdateStop(stop.id, { position: parseInt(e.target.value) })
                          }
                          className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold w-8 text-slate-400">
                        {stop.position}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStop(stop.id)}
                        disabled={stops.length <= 2}
                        aria-label={t('gradient.remove_stop')}
                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Code */}
        <div className="lg:col-span-7 space-y-6">
          <div
            className="w-full h-[400px] rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-white/20 relative group overflow-hidden"
            style={{ background: gradientString }}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-sm">
              <span className="text-white font-black uppercase tracking-widest text-sm drop-shadow-md">
                {t('gradient.preview')}
              </span>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] border border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="gradient-css-output" className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 cursor-pointer">
                <Layers className="w-4 h-4" aria-hidden="true" /> {t('gradient.css_code')}
              </label>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={`${t('gradient.css_code')} (${t('common.copy')})`}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  copied
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                <span>{copied ? t('common.copied') : t('common.copy')}</span>
                <Kbd modifier={null} className={copied ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100' : 'bg-slate-800 text-slate-200 border-slate-700'}>
                  C
                </Kbd>
              </button>
            </div>
            <pre id="gradient-css-output" className="p-6 bg-white/5 rounded-2xl font-mono text-xs md:text-sm text-indigo-300 break-all leading-relaxed border border-slate-800/80">
              background: {gradientString};
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
