import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sliders, Copy, Check, RotateCcw, Image as ImageIcon, Info, Shield, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface FilterState {
  blur: number;
  brightness: number;
  contrast: number;
  grayscale: number;
  hueRotate: number;
  invert: number;
  opacity: number;
  saturate: number;
  sepia: number;
}

interface FilterPreset {
  id: string;
  name: string;
  filters: FilterState;
}

const DEFAULT_FILTERS: FilterState = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  hueRotate: 0,
  invert: 0,
  opacity: 100,
  saturate: 100,
  sepia: 0,
};

const PRESETS: FilterPreset[] = [
  {
    id: 'vintage-sepia',
    name: 'Vintage Sepia',
    filters: { ...DEFAULT_FILTERS, sepia: 70, contrast: 110, brightness: 90, saturate: 80 },
  },
  {
    id: 'high-contrast-bw',
    name: 'High Contrast B&W',
    filters: { ...DEFAULT_FILTERS, grayscale: 100, contrast: 160, brightness: 105 },
  },
  {
    id: 'subtle-blur',
    name: 'Subtle Soft Blur',
    filters: { ...DEFAULT_FILTERS, blur: 3, saturate: 120, brightness: 105 },
  },
  {
    id: 'inverted-cyber',
    name: 'Inverted Cyber',
    filters: { ...DEFAULT_FILTERS, invert: 100, hueRotate: 180, contrast: 120 },
  },
  {
    id: 'vibrant-warmth',
    name: 'Vibrant Warmth',
    filters: { ...DEFAULT_FILTERS, saturate: 150, contrast: 110, sepia: 20 },
  },
];

export function CSSFilterGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FilterState>(initialData || DEFAULT_FILTERS);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onStateChange?.(filters);
  }, [filters, onStateChange]);

  const filterString = useMemo(() => {
    const parts = [];
    if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
    if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
    if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
    if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`);
    if (filters.hueRotate > 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
    if (filters.invert > 0) parts.push(`invert(${filters.invert}%)`);
    if (filters.opacity !== 100) parts.push(`opacity(${filters.opacity}%)`);
    if (filters.saturate !== 100) parts.push(`saturate(${filters.saturate}%)`);
    if (filters.sepia > 0) parts.push(`sepia(${filters.sepia}%)`);
    return parts.length > 0 ? parts.join(' ') : 'none';
  }, [filters]);

  const cssCode = `filter: ${filterString};`;

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActivePresetId(null);
    toast.success('CSS filter parameters reset');
    primaryInputRef.current?.focus();
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    toast.success('CSS filter code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [cssCode]);

  const handleApplyPreset = (preset: FilterPreset) => {
    setFilters(preset.filters);
    setActivePresetId(preset.id);
    toast.success(`Preset "${preset.name}" applied!`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  }, [handleReset, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      const isBodyOrComponent =
        !activeElement ||
        activeElement === document.body ||
        containerRef.current?.contains(activeElement as Node);

      if (e.key === 'Escape' && isBodyOrComponent) {
        e.preventDefault();
        handlersRef.current.handleReset();
        return;
      }

      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!isEditable && isBodyOrComponent) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filterFields = [
    { label: t('css_filter.blur'), key: 'blur' as keyof FilterState, min: 0, max: 20, unit: 'px' },
    { label: t('css_filter.brightness'), key: 'brightness' as keyof FilterState, min: 0, max: 200, unit: '%' },
    { label: t('css_filter.contrast'), key: 'contrast' as keyof FilterState, min: 0, max: 200, unit: '%' },
    { label: t('css_filter.grayscale'), key: 'grayscale' as keyof FilterState, min: 0, max: 100, unit: '%' },
    { label: t('css_filter.hue_rotate'), key: 'hueRotate' as keyof FilterState, min: 0, max: 360, unit: 'deg' },
    { label: t('css_filter.invert'), key: 'invert' as keyof FilterState, min: 0, max: 100, unit: '%' },
    { label: t('css_filter.opacity'), key: 'opacity' as keyof FilterState, min: 0, max: 100, unit: '%' },
    { label: t('css_filter.saturate'), key: 'saturate' as keyof FilterState, min: 0, max: 200, unit: '%' },
    { label: t('css_filter.sepia'), key: 'sepia' as keyof FilterState, min: 0, max: 100, unit: '%' },
  ];

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.presets', 'Quick Presets:')}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isSelected}
                className={`px-4 py-3 rounded-2xl border transition-all text-left group ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                }`}
              >
                <span className={`text-xs font-bold block transition-colors ${
                  isSelected
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                }`}>
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between items-center px-1">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          >
            <ImageIcon className="w-4 h-4" aria-hidden="true" /> {imageUrl ? t('watermark.change_image', 'Change Image') : t('watermark.select_image', 'Upload Custom Image')}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset CSS filters (Esc)"
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> {t('common.reset')}
            <Kbd modifier={null} className="hidden sm:inline-flex bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-500">Esc</Kbd>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
            <Sliders className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.options')}
          </h3>

          <div className="space-y-6">
            {filterFields.map((f) => {
              const inputId = `filter-${f.key}`;
              return (
                <div key={f.key} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold px-1">
                    <label htmlFor={inputId} className="text-slate-500 cursor-pointer">
                      {f.label}
                    </label>
                    <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                      {filters[f.key]}{f.unit}
                    </span>
                  </div>
                  <input
                    id={inputId}
                    ref={f.key === 'blur' ? primaryInputRef : undefined}
                    type="range"
                    min={f.min}
                    max={f.max}
                    value={filters[f.key]}
                    aria-valuemin={f.min}
                    aria-valuemax={f.max}
                    aria-valuenow={filters[f.key]}
                    aria-label={`${f.label} (${f.unit})`}
                    onChange={(e) => {
                      setActivePresetId(null);
                      setFilters((prev) => ({ ...prev, [f.key]: Number(e.target.value) }));
                    }}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview & Code */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('css_filter.preview')}</h3>
            <div className="aspect-video bg-slate-100 dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center relative group">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="CSS Filter Live Preview"
                  className="w-full h-full object-contain transition-all duration-300"
                  style={{ filter: filterString }}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-300 dark:text-slate-700">
                  <ImageIcon className="w-16 h-16" aria-hidden="true" />
                  <p className="text-sm font-bold">{t('imagecompressor.upload_prompt')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span id="css-filter-code-label" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('css_filter.code')}</span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy CSS code (C)"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  copied
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                }`}
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied ? t('common.copied') : t('common.copy')}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1">C</Kbd>}
              </button>
            </div>
            <pre aria-labelledby="css-filter-code-label" className="p-6 bg-slate-900 dark:bg-black rounded-3xl font-mono text-sm text-indigo-300 break-all border border-slate-800 shadow-xl">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('tool.css-filter.name')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('css_filter.about_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('css_filter.performance')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('css_filter.performance_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
