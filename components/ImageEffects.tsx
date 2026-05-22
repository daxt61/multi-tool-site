import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ImageIcon, Download, Trash2, Wand2,
  Upload, Sliders, RefreshCw, AlertCircle, Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface FilterState {
  blur: number;
  pixelate: number;
  brightness: number;
  contrast: number;
  grayscale: number;
  sepia: number;
  invert: number;
}

const DEFAULT_FILTERS: FilterState = {
  blur: 0,
  pixelate: 1,
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  sepia: 0,
  invert: 0
};

export function ImageEffects({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(initialData?.image || null);
  const [filters, setFilters] = useState<FilterState>(initialData?.filters || DEFAULT_FILTERS);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    onStateChange?.({ image, filters });
  }, [image, filters, onStateChange]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setError(t('error.max_length', { max: '5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const applyFilters = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !image) return;

    setIsProcessing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Apply standard CSS filters
    ctx.filter = `
      blur(${filters.blur}px)
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      grayscale(${filters.grayscale}%)
      sepia(${filters.sepia}%)
      invert(${filters.invert}%)
    `;

    ctx.drawImage(img, 0, 0);

    // Apply Pixelation if needed
    if (filters.pixelate > 1) {
      const w = canvas.width;
      const h = canvas.height;
      const blockSize = Math.max(1, filters.pixelate);

      const smallCanvas = document.createElement('canvas');
      const smallCtx = smallCanvas.getContext('2d');
      if (smallCtx) {
        smallCanvas.width = w / blockSize;
        smallCanvas.height = h / blockSize;
        smallCtx.imageSmoothingEnabled = false;
        smallCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);

        ctx.filter = 'none'; // Reset filter for final draw
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(smallCanvas, 0, 0, smallCanvas.width, smallCanvas.height, 0, 0, w, h);
      }
    }

    setIsProcessing(false);
  }, [image, filters]);

  useEffect(() => {
    if (image) {
      const timeout = setTimeout(applyFilters, 100);
      return () => clearTimeout(timeout);
    }
  }, [image, filters, applyFilters]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `edited-image-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const updateFilter = (key: keyof FilterState, val: number) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const resetFilters = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Sliders className="w-4 h-4 text-indigo-500" /> {t('imageeffects.filters')}
              </div>
              <button
                onClick={resetFilters}
                className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors"
              >
                {t('common.reset')}
              </button>
            </div>

            <div className="space-y-6">
              {[
                { label: t('imageeffects.blur'), key: 'blur', min: 0, max: 20, step: 0.1 },
                { label: t('imageeffects.pixelate'), key: 'pixelate', min: 1, max: 50, step: 1 },
                { label: t('imageeffects.brightness'), key: 'brightness', min: 0, max: 200, step: 1 },
                { label: t('imageeffects.contrast'), key: 'contrast', min: 0, max: 200, step: 1 },
                { label: t('imageeffects.grayscale'), key: 'grayscale', min: 0, max: 100, step: 1 },
                { label: t('imageeffects.sepia'), key: 'sepia', min: 0, max: 100, step: 1 },
                { label: t('imageeffects.invert'), key: 'invert', min: 0, max: 100, step: 1 },
              ].map((f) => (
                <div key={f.key} className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor={`filter-${f.key}`} className="text-[10px] font-black uppercase tracking-widest text-slate-500">{f.label}</label>
                    <span className="text-xs font-bold text-indigo-500 font-mono">
                      {filters[f.key as keyof FilterState]}{f.key === 'blur' ? 'px' : (f.key === 'pixelate' ? '' : '%')}
                    </span>
                  </div>
                  <input
                    id={`filter-${f.key}`}
                    type="range"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={filters[f.key as keyof FilterState]}
                    onChange={(e) => updateFilter(f.key as keyof FilterState, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <ImageIcon className="w-4 h-4 text-indigo-500" /> {t('imageeffects.preview')}
            </div>
            <div className="flex gap-2">
              {image && (
                <>
                  <button
                    onClick={handleDownload}
                    className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <Download className="w-4 h-4" /> {t('common.download')}
                  </button>
                  <button
                    onClick={() => setImage(null)}
                    className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-xl transition-all"
                    title={t('common.clear')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="relative min-h-[400px] bg-slate-50 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center overflow-hidden group">
            {image ? (
              <>
                <img
                  ref={imgRef}
                  src={image}
                  alt="Original"
                  className="hidden"
                  onLoad={applyFilters}
                />
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[600px] object-contain shadow-2xl rounded-lg"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <label className="flex flex-col items-center gap-4 cursor-pointer p-12 text-center group-hover:scale-105 transition-transform">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-black dark:text-white">{t('imageeffects.upload_prompt')}</p>
                  <p className="text-sm text-slate-400 font-medium">{t('imageeffects.format_hint')}</p>
                </div>
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Wand2 className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('imageeffects.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('imageeffects.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
