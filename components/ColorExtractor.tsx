import { useState, useRef, useCallback, useEffect } from 'react';
import { Palette, Upload, Copy, Check, Trash2, ImageIcon, Info, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ColorExtractor({ onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({});
  }, [onStateChange]);

  const rgbToHex = (r: number, g: number, b: number) =>
    "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

  const extractColors = useCallback((imgElement: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size to a smaller version for performance
    const size = 100;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(imgElement, 0, 0, size, size);

    const imageData = ctx.getImageData(0, 0, size, size).data;
    const colorMap: Record<string, number> = {};

    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i+1];
      const b = imageData[i+2];
      const a = imageData[i+3];

      // Skip transparent pixels
      if (a < 128) continue;

      // Group colors slightly to find "dominant" ones
      const factor = 10;
      const key = `${Math.round(r/factor)*factor},${Math.round(g/factor)*factor},${Math.round(b/factor)*factor}`;
      colorMap[key] = (colorMap[key] || 0) + 1;
    }

    const sortedColors = Object.entries(colorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key]) => {
        const [r, g, b] = key.split(',').map(Number);
        return rgbToHex(r, g, b);
      });

    setColors(sortedColors);
    setExtracting(false);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImage(result);
      const img = new Image();
      img.onload = () => extractColors(img);
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setImage(null);
    setColors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <canvas ref={canvasRef} className="hidden" />

      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            {t('colorextractor.title')}
          </h3>
        </div>
        {image && (
          <button
            onClick={handleClear}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
          >
            <Trash2 className="w-3 h-3" /> {t('common.clear')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="space-y-4">
          {!image ? (
            <label className="group relative flex flex-col items-center justify-center w-full h-80 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all cursor-pointer overflow-hidden">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-indigo-500" />
                </div>
                <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t('colorextractor.upload_prompt')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  PNG, JPG, WEBP (Max 5MB)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          ) : (
            <div className="relative w-full h-80 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
              <img
                src={image}
                alt="Preview"
                className="max-w-full max-h-full object-contain"
              />
              {extracting && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Area */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-1">
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">
              {t('colorextractor.palette_label')}
            </label>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem] min-h-[20rem]">
            {colors.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {colors.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => handleCopy(hex)}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-indigo-500/50 transition-all group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl shadow-inner border border-black/5"
                      style={{ backgroundColor: hex }}
                    />
                    <div className="flex-1 text-left">
                      <div className="text-xs font-black font-mono dark:text-slate-300">{hex}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {copied === hex ? t('common.copied') : t('common.copy')}
                      </div>
                    </div>
                    <div className={`p-1.5 rounded-lg transition-colors ${copied === hex ? 'text-emerald-500' : 'text-slate-300 group-hover:text-slate-500'}`}>
                      {copied === hex ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 py-12">
                <Palette className="w-12 h-12 opacity-20" />
                <p className="text-sm font-medium italic opacity-60">
                  {extracting ? t('colorextractor.extracting') : t('colorextractor.waiting')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('colorextractor.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('colorextractor.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
