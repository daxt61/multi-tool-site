import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sliders, Copy, Check, RotateCcw, Image as ImageIcon, Info, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

export function CSSFilterGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FilterState>(initialData || DEFAULT_FILTERS);
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`filter: ${filterString};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [filterString]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement
      ) return;

      if (e.key === 'Escape') {
        handleReset();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleReset, handleCopy]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center px-1">
        <div className="flex gap-2">
           <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
          >
            <ImageIcon className="w-4 h-4" /> {imageUrl ? t('watermark.change_image') : t('watermark.select_image')}
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
          <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
          <button
            onClick={handleReset}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" /> {t('common.reset')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-inner">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
            <Sliders className="w-4 h-4 text-indigo-500" /> {t('common.options')}
          </h3>

          <div className="space-y-6">
            {[
              { label: t('css_filter.blur'), key: 'blur', min: 0, max: 20, unit: 'px' },
              { label: t('css_filter.brightness'), key: 'brightness', min: 0, max: 200, unit: '%' },
              { label: t('css_filter.contrast'), key: 'contrast', min: 0, max: 200, unit: '%' },
              { label: t('css_filter.grayscale'), key: 'grayscale', min: 0, max: 100, unit: '%' },
              { label: t('css_filter.hue_rotate'), key: 'hueRotate', min: 0, max: 360, unit: 'deg' },
              { label: t('css_filter.invert'), key: 'invert', min: 0, max: 100, unit: '%' },
              { label: t('css_filter.opacity'), key: 'opacity', min: 0, max: 100, unit: '%' },
              { label: t('css_filter.saturate'), key: 'saturate', min: 0, max: 200, unit: '%' },
              { label: t('css_filter.sepia'), key: 'sepia', min: 0, max: 100, unit: '%' },
            ].map((f) => (
              <div key={f.key} className="space-y-2">
                <div className="flex justify-between text-xs font-bold px-1">
                  <span className="text-slate-500">{f.label}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                    {filters[f.key as keyof FilterState]}{f.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={f.min}
                  max={f.max}
                  value={filters[f.key as keyof FilterState]}
                  onChange={(e) => setFilters(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            ))}
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
                  alt="Preview"
                  className="w-full h-full object-contain transition-all duration-300"
                  style={{ filter: filterString }}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-300 dark:text-slate-700">
                   <ImageIcon className="w-16 h-16" />
                   <p className="text-sm font-bold">{t('imagecompressor.upload_prompt')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('css_filter.code')}</h3>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <div className="p-6 bg-slate-900 dark:bg-black rounded-3xl font-mono text-sm text-indigo-300 break-all border border-slate-800 shadow-xl">
              filter: {filterString};
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('tool.css-filter.name')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('css_filter.about_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-500" /> {t('css_filter.performance')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('css_filter.performance_desc')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('common.privacy_desc')}
          </p>
        </div>
      </div>
    </div>
  );
}
