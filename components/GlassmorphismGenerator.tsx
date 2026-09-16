import { useState, useMemo, useEffect, useRef } from 'react';
import { Copy, Check, Info, Palette, Layers, Settings, RefreshCw, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

export function GlassmorphismGenerator({
  initialData,
  onStateChange,
}: {
  initialData?: any;
  onStateChange?: (state: any) => void;
}) {
  const { t } = useTranslation();
  const [blur, setBlur] = useState(initialData?.blur ?? 10);
  const [opacity, setOpacity] = useState(initialData?.opacity ?? 0.2);
  const [color, setColor] = useState(initialData?.color ?? '#ffffff');
  const [saturation, setSaturation] = useState(initialData?.saturation ?? 100);
  const [borderOpacity, setBorderOpacity] = useState(initialData?.borderOpacity ?? 0.1);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ blur, opacity, color, saturation, borderOpacity });
  }, [blur, opacity, color, saturation, borderOpacity, onStateChange]);

  const presets = [
    {
      id: 'frosted',
      name: t('glassmorphism.preset_frosted'),
      blur: 16,
      opacity: 0.25,
      color: '#ffffff',
      saturation: 120,
      borderOpacity: 0.2,
    },
    {
      id: 'subtle',
      name: t('glassmorphism.preset_subtle'),
      blur: 8,
      opacity: 0.1,
      color: '#ffffff',
      saturation: 100,
      borderOpacity: 0.08,
    },
    {
      id: 'vibrant',
      name: t('glassmorphism.preset_vibrant'),
      blur: 24,
      opacity: 0.35,
      color: '#6366f1',
      saturation: 180,
      borderOpacity: 0.3,
    },
    {
      id: 'dark',
      name: t('glassmorphism.preset_dark'),
      blur: 12,
      opacity: 0.4,
      color: '#0f172a',
      saturation: 110,
      borderOpacity: 0.15,
    },
  ];

  const activePresetId = useMemo(() => {
    const match = presets.find(
      (p) =>
        p.blur === blur &&
        p.opacity === opacity &&
        p.color.toLowerCase() === color.toLowerCase() &&
        p.saturation === saturation &&
        p.borderOpacity === borderOpacity
    );
    return match?.id || null;
  }, [blur, opacity, color, saturation, borderOpacity, presets]);

  const hexToRgba = (hex: string, alpha: number) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.slice(0, 2) || '0', 16);
    const g = parseInt(cleanHex.slice(2, 4) || '0', 16);
    const b = parseInt(cleanHex.slice(4, 6) || '0', 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const cssCode = useMemo(() => {
    return `background: ${hexToRgba(color, opacity)};
backdrop-filter: blur(${blur}px) saturate(${saturation}%);
-webkit-backdrop-filter: blur(${blur}px) saturate(${saturation}%);
border: 1px solid ${hexToRgba(color, borderOpacity)};
border-radius: 24px;`;
  }, [color, opacity, blur, saturation, borderOpacity]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    toast.success(t('glassmorphism.copied_msg'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setBlur(10);
    setOpacity(0.2);
    setColor('#ffffff');
    setSaturation(100);
    setBorderOpacity(0.1);
    toast.success(t('glassmorphism.reset_msg'));
    primaryInputRef.current?.focus();
  };

  const applyPreset = (preset: typeof presets[0]) => {
    setBlur(preset.blur);
    setOpacity(preset.opacity);
    setColor(preset.color);
    setSaturation(preset.saturation);
    setBorderOpacity(preset.borderOpacity);
    toast.success(t('glassmorphism.preset_applied', { name: preset.name }));
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
      } else if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
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
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-12">
      {/* Quick Presets */}
      <div className="space-y-3">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />{' '}
          {t('glassmorphism.presets')}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {presets.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset)}
                aria-pressed={isActive}
                className={`p-3 text-left border rounded-2xl transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500/50 dark:border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : 'bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className={`text-xs font-bold transition-colors ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                }`}>
                  {preset.name}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  {preset.blur}px blur • {Math.round(preset.opacity * 100)}%
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.options')}
            </h3>
            <button
              onClick={handleReset}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-2 py-1"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t('common.reset')}</span>
              <Kbd modifier={null}>Esc</Kbd>
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="blur-slider" className="flex items-center gap-2 cursor-pointer">
                  <Layers className="w-3.5 h-3.5" aria-hidden="true" /> {t('glassmorphism.blur')}
                </label>
                <span className="text-indigo-500 font-mono text-sm">{blur}px</span>
              </div>
              <input
                ref={primaryInputRef}
                id="blur-slider"
                type="range"
                min="0"
                max="40"
                step="1"
                value={blur}
                aria-valuemin={0}
                aria-valuemax={40}
                aria-valuenow={blur}
                aria-label={t('glassmorphism.blur')}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="opacity-slider" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="w-3.5 h-3.5" aria-hidden="true" /> {t('glassmorphism.opacity')}
                </label>
                <span className="text-indigo-500 font-mono text-sm">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                id="opacity-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={opacity}
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={opacity}
                aria-label={t('glassmorphism.opacity')}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="color-hex" className="flex items-center gap-2 cursor-pointer">
                  <Palette className="w-3.5 h-3.5" aria-hidden="true" /> {t('glassmorphism.color')}
                </label>
                <span className="text-indigo-500 font-mono text-sm uppercase">{color}</span>
              </div>
              <div className="flex gap-4">
                <input
                  id="color-picker"
                  type="color"
                  value={color}
                  aria-label={t('glassmorphism.color')}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-white border border-slate-200 dark:border-slate-700 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <input
                  id="color-hex"
                  type="text"
                  value={color}
                  aria-label={t('glassmorphism.color')}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm text-slate-900 dark:text-white uppercase outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="saturation-slider" className="cursor-pointer">
                  {t('glassmorphism.saturation')}
                </label>
                <span className="text-indigo-500 font-mono text-sm">{saturation}%</span>
              </div>
              <input
                id="saturation-slider"
                type="range"
                min="0"
                max="200"
                step="1"
                value={saturation}
                aria-valuemin={0}
                aria-valuemax={200}
                aria-valuenow={saturation}
                aria-label={t('glassmorphism.saturation')}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="border-opacity-slider" className="cursor-pointer">
                  {t('glassmorphism.border_opacity')}
                </label>
                <span className="text-indigo-500 font-mono text-sm">{Math.round(borderOpacity * 100)}%</span>
              </div>
              <input
                id="border-opacity-slider"
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={borderOpacity}
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={borderOpacity}
                aria-label={t('glassmorphism.border_opacity')}
                onChange={(e) => setBorderOpacity(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Preview & Code */}
        <div className="space-y-8 flex flex-col">
          <div className="flex-1 min-h-[300px] relative rounded-[2.5rem] overflow-hidden bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center p-12">
            <div
              style={{
                background: hexToRgba(color, opacity),
                backdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
                WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation}%)`,
                border: `1px solid ${hexToRgba(color, borderOpacity)}`,
                borderRadius: '24px',
              }}
              className="w-full h-full flex flex-col items-center justify-center text-center p-8 space-y-4 shadow-2xl shadow-black/20"
            >
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                <Layers className="w-8 h-8 text-white" aria-hidden="true" />
              </div>
              <h3 className="text-2xl font-black text-white drop-shadow-md">Glassmorphism</h3>
              <p className="text-white/80 text-sm font-medium drop-shadow-sm">{t('glassmorphism.preview')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="css-code-output" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-500" aria-hidden="true" /> {t('glassmorphism.css_code')}
              </label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 border-transparent'
                }`}
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                <span>{copied ? t('common.copied') : t('common.copy')}</span>
                <Kbd modifier={null} className={copied ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100' : 'bg-indigo-700 text-indigo-100'}>
                  C
                </Kbd>
              </button>
            </div>
            <pre
              id="css-code-output"
              className="p-6 bg-slate-900 text-slate-300 rounded-[2rem] font-mono text-sm overflow-x-auto leading-relaxed border border-slate-800"
            >
              {cssCode}
            </pre>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('glassmorphism.about_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('glassmorphism.about_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" aria-hidden="true" /> Propriétés Clés
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'effet repose principalement sur <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">backdrop-filter</code>. Notez que pour le support Safari, il est nécessaire d'inclure le préfixe <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">-webkit-</code>.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-500" aria-hidden="true" /> Conseils Design
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Pour un effet réussi, utilisez des couleurs vives en arrière-plan et une opacité faible (entre 0.1 et 0.3). Une bordure fine semi-transparente aide à définir la forme.
          </p>
        </div>
      </div>
    </div>
  );
}
