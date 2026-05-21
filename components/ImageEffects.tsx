import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Trash2, Image as ImageIcon, ShieldCheck, Zap, Info, Sliders, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function ImageEffects() {
  const { t } = useTranslation();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [pixelSize, setPixelSize] = useState(1);
  const [blurRadius, setBlurRadius] = useState(0);
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const applyEffects = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    setIsProcessing(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Apply Filters (Blur & Grayscale)
    let filters = '';
    if (blurRadius > 0) filters += `blur(${blurRadius}px) `;
    if (isGrayscale) filters += 'grayscale(100%)';
    ctx.filter = filters.trim() || 'none';

    if (pixelSize > 1) {
      // Pixelation technique: draw small then scale up
      const w = canvas.width / pixelSize;
      const h = canvas.height / pixelSize;

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) {
        setIsProcessing(false);
        return;
      }
      tempCanvas.width = w;
      tempCanvas.height = h;
      tempCtx.filter = ctx.filter;
      tempCtx.drawImage(img, 0, 0, w, h);

      ctx.filter = 'none'; // Reset main filter as it's already applied to temp
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(img, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/png');
    setProcessedImage(dataUrl);
    setIsProcessing(false);
  }, [pixelSize, blurRadius, isGrayscale]);

  // Debounce effect application
  useEffect(() => {
    if (originalImage) {
      const timer = setTimeout(() => {
        applyEffects();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pixelSize, blurRadius, isGrayscale, originalImage, applyEffects]);

  const handleFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    if (file.size > MAX_SIZE) {
      setError(t('error.max_length', { max: '10MB' }));
      return;
    }
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setOriginalImage(event.target?.result as string);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const downloadImage = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `processed-image-${Date.now()}.png`;
    link.click();
  };

  const handleClear = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    imgRef.current = null;
    setPixelSize(1);
    setBlurRadius(0);
    setIsGrayscale(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {!originalImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group relative flex flex-col items-center justify-center p-20 border-2 border-dashed rounded-[3rem] transition-all cursor-pointer overflow-hidden ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-500/10'
              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-500/50 hover:bg-indigo-50/10'
          }`}
        >
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-sm ${
            isDragging
              ? 'bg-indigo-500 text-white scale-110'
              : 'bg-white dark:bg-slate-800 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110'
          }`}>
            <Upload className="w-10 h-10" />
          </div>
          <p className="mt-8 text-2xl font-black tracking-tight dark:text-white text-center">
            {t('imagecompressor.upload_prompt') || 'Cliquez pour uploader une image'}
          </p>
          <p className="mt-2 text-slate-500 font-bold uppercase tracking-widest text-xs">JPG, PNG, WEBP, GIF</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Controls */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] space-y-6 sticky top-8">
                <div className="flex items-center gap-2 px-1">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
                </div>

                {/* Pixelation */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor="pixel-size" className="text-xs font-bold text-slate-500">{t('imageeffects.pixelation')}</label>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{pixelSize}px</span>
                  </div>
                  <input
                    id="pixel-size"
                    type="range"
                    min="1"
                    max="50"
                    value={pixelSize}
                    onChange={(e) => setPixelSize(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Blur */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label htmlFor="blur-radius" className="text-xs font-bold text-slate-500">{t('imageeffects.blur')}</label>
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{blurRadius}px</span>
                  </div>
                  <input
                    id="blur-radius"
                    type="range"
                    min="0"
                    max="20"
                    value={blurRadius}
                    onChange={(e) => setBlurRadius(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Grayscale */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <label htmlFor="grayscale-toggle" className="text-xs font-bold text-slate-500 cursor-pointer">{t('imageeffects.grayscale')}</label>
                  <button
                    id="grayscale-toggle"
                    onClick={() => setIsGrayscale(!isGrayscale)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${isGrayscale ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isGrayscale ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleClear}
                    className="flex-1 p-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-2xl hover:bg-rose-100 transition-all font-bold text-sm"
                  >
                    {t('common.clear')}
                  </button>
                  <button
                    onClick={downloadImage}
                    className="flex-[2] px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {t('common.download')}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                   <div className="flex justify-between items-center px-1">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.output')}</h3>
                      {isProcessing && <span className="text-[10px] font-bold text-indigo-500 animate-pulse uppercase tracking-widest">{t('imageeffects.processing')}</span>}
                   </div>
                  <div className="relative group rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center min-h-[400px]">
                    {processedImage ? (
                      <img src={processedImage} alt="Processed" className="max-w-full h-auto object-contain max-h-[700px]" />
                    ) : (
                      <div className="animate-pulse flex flex-col items-center gap-2 text-slate-400">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> {t('imageeffects.privacy_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('imageeffects.privacy_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" /> {t('imageeffects.effects_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('imageeffects.effects_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('imageeffects.about_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('imageeffects.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
