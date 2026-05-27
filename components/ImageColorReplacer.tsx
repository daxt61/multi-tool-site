import { useState, useRef, useEffect, useCallback } from 'react';
import { ImageIcon, Download, Trash2, Upload, Sliders, RefreshCw, AlertCircle, Info, Pipette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageColorReplacer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(initialData?.image || null);
  const [sourceColor, setSourceColor] = useState(initialData?.sourceColor || '#ffffff');
  const [targetColor, setTargetColor] = useState(initialData?.targetColor || '#4f46e5');
  const [tolerance, setTolerance] = useState(initialData?.tolerance ?? 20);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    onStateChange?.({ image, sourceColor, targetColor, tolerance });
  }, [image, sourceColor, targetColor, tolerance, onStateChange]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

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

  const processImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !image) return;

    setIsProcessing(true);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const srcRgb = hexToRgb(sourceColor);
    const dstRgb = hexToRgb(targetColor);
    if (!srcRgb || !dstRgb) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const dist = Math.sqrt(
        Math.pow(r - srcRgb.r, 2) +
        Math.pow(g - srcRgb.g, 2) +
        Math.pow(b - srcRgb.b, 2)
      );

      if (dist <= tolerance) {
        data[i] = dstRgb.r;
        data[i + 1] = dstRgb.g;
        data[i + 2] = dstRgb.b;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    setIsProcessing(false);
  }, [image, sourceColor, targetColor, tolerance]);

  useEffect(() => {
    if (image) {
      const timeout = setTimeout(processImage, 100);
      return () => clearTimeout(timeout);
    }
  }, [image, sourceColor, targetColor, tolerance, processImage]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `replaced-color-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = "#" + ("000000" + ((pixel[0] << 16) | (pixel[1] << 8) | pixel[2]).toString(16)).slice(-6);
    setSourceColor(hex);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Sliders className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('imagecolorreplacer.source_color', 'Color to replace')}</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={sourceColor}
                    onChange={(e) => setSourceColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white dark:border-slate-800 shadow-sm"
                  />
                  <input
                    type="text"
                    value={sourceColor}
                    onChange={(e) => setSourceColor(e.target.value)}
                    className="flex-1 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <p className="text-[10px] text-slate-400 italic px-1">{t('imagecolorreplacer.picker_hint', 'Click on image to pick color')}</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('imagecolorreplacer.target_color', 'New color')}</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={targetColor}
                    onChange={(e) => setTargetColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white dark:border-slate-800 shadow-sm"
                  />
                  <input
                    type="text"
                    value={targetColor}
                    onChange={(e) => setTargetColor(e.target.value)}
                    className="flex-1 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="tolerance" className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('imagecolorreplacer.tolerance', 'Tolerance')}</label>
                  <span className="text-xs font-bold text-indigo-500 font-mono">{tolerance}</span>
                </div>
                <input
                  id="tolerance"
                  type="range"
                  min="0"
                  max="255"
                  value={tolerance}
                  onChange={(e) => setTolerance(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <ImageIcon className="w-4 h-4 text-indigo-500" /> {t('common.output')}
            </div>
            <div className="flex gap-2">
              {image && (
                <>
                  <button
                    onClick={handleDownload}
                    className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> {t('common.download')}
                  </button>
                  <button
                    onClick={() => setImage(null)}
                    className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-xl transition-all"
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
                <img ref={imgRef} src={image} alt="Original" className="hidden" onLoad={processImage} />
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  className="max-w-full max-h-[600px] object-contain shadow-2xl rounded-lg cursor-crosshair"
                  title={t('imagecolorreplacer.click_to_pick', 'Click to pick source color')}
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <label className="flex flex-col items-center gap-4 cursor-pointer p-12 text-center">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-black dark:text-white">{t('imageeffects.upload_prompt')}</p>
                  <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                </div>
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Pipette className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('imagecolorreplacer.about_title', 'About Color Replacer')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('imagecolorreplacer.about_text', 'This tool allows you to replace a specific color in an image with a new one. You can use the color picker or click directly on the image to select the source color. The tolerance slider helps you include similar shades in the replacement process.')}
          </p>
        </div>
      </div>
    </div>
  );
}
