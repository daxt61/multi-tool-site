import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Trash2, Maximize2, Sliders, RefreshCw, AlertCircle, Info, Link2, Link2Off } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageResizer({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [width, setWidth] = useState<number>(initialData?.width || 0);
  const [height, setHeight] = useState<number>(initialData?.height || 0);
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [lockAspectRatio, setLockAspectRatio] = useState(initialData?.lockAspectRatio ?? true);
  const [percentage, setPercentage] = useState<number>(100);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ width, height, lockAspectRatio });
  }, [width, height, lockAspectRatio, onStateChange]);

  const handleFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > MAX_FILE_SIZE) {
      setError(t('imagecompressor.error_size') || 'File too large (Max 10MB)');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleImageLoad = () => {
    if (imgRef.current) {
      const w = imgRef.current.naturalWidth;
      const h = imgRef.current.naturalHeight;
      setWidth(w);
      setHeight(h);
      setAspectRatio(w / h);
      setPercentage(100);
    }
  };

  const updateWidth = (val: number) => {
    setWidth(val);
    if (lockAspectRatio && aspectRatio) {
      setHeight(Math.round(val / aspectRatio));
    }
    setPercentage(Math.round((val / (imgRef.current?.naturalWidth || val)) * 100));
  };

  const updateHeight = (val: number) => {
    setHeight(val);
    if (lockAspectRatio && aspectRatio) {
      setWidth(Math.round(val * aspectRatio));
    }
    setPercentage(Math.round((val / (imgRef.current?.naturalHeight || val)) * 100));
  };

  const updatePercentage = (val: number) => {
    setPercentage(val);
    if (imgRef.current) {
      const newWidth = Math.round((imgRef.current.naturalWidth * val) / 100);
      const newHeight = Math.round((imgRef.current.naturalHeight * val) / 100);
      setWidth(newWidth);
      setHeight(newHeight);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !width || !height) return;

    setIsProcessing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);

    const link = document.createElement('a');
    link.download = `resized-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsProcessing(false);
  };

  const handleClear = () => {
    setOriginalImage(null);
    setWidth(0);
    setHeight(0);
    setPercentage(100);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Sliders className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-6">
              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-4 relative">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('aspectratio.width')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={width || ''}
                      onChange={(e) => updateWidth(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">PX</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('aspectratio.height')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={height || ''}
                      onChange={(e) => updateHeight(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">PX</span>
                  </div>
                </div>
                <button
                  onClick={() => setLockAspectRatio(!lockAspectRatio)}
                  className={`absolute left-1/2 top-[34px] -translate-x-1/2 p-1.5 rounded-full border transition-all z-10 ${
                    lockAspectRatio
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                  title={lockAspectRatio ? "Unlock aspect ratio" : "Lock aspect ratio"}
                >
                  {lockAspectRatio ? <Link2 className="w-3 h-3" /> : <Link2Off className="w-3 h-3" />}
                </button>
              </div>

              {/* Percentage Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Scaling</label>
                  <span className="text-xs font-black text-indigo-500">{percentage}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={percentage}
                  onChange={(e) => updatePercentage(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleDownload}
                  disabled={!originalImage || isProcessing}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {t('common.download')} Resized
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Maximize2 className="w-4 h-4 text-indigo-500" /> Preview
            </div>
            {originalImage && (
              <button
                onClick={handleClear}
                className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className={`relative min-h-[400px] bg-slate-50 dark:bg-slate-900 border-4 border-dashed rounded-[2.5rem] flex items-center justify-center overflow-hidden transition-all ${
              isDragging ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {originalImage ? (
              <div className="relative group p-8 flex items-center justify-center w-full h-full">
                <img
                  ref={imgRef}
                  src={originalImage}
                  alt="Preview"
                  onLoad={handleImageLoad}
                  className="max-w-full max-h-[600px] object-contain shadow-2xl rounded-lg"
                  style={{ width: percentage !== 100 ? `${percentage}%` : 'auto' }}
                />
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md text-white rounded-full text-[10px] font-bold">
                  {width} × {height} PX
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-4 cursor-pointer p-12 text-center group">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500 transition-transform group-hover:scale-110">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-black dark:text-white">{t('imageeffects.upload_prompt')}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Up to 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                    className="hidden"
                  />
                </div>
              </label>
            )}
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('imageresizer.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('imageresizer.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
