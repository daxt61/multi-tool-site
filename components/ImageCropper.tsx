import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Trash2, Crop, Sliders, RefreshCw, AlertCircle, Info, Maximize2, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function ImageCropper({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [originalImage, setOriginalImage] = useState<string | null>(initialData?.image || null);
  const [crop, setCrop] = useState<CropArea>(initialData?.crop || { x: 0, y: 0, width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState<string>(initialData?.aspectRatio || 'free');
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const startCrop = useRef<CropArea>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    onStateChange?.({ image: originalImage, crop, aspectRatio });
  }, [originalImage, crop, aspectRatio, onStateChange]);

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

  const resetCrop = useCallback(() => {
    if (imgRef.current) {
      const w = imgRef.current.naturalWidth;
      const h = imgRef.current.naturalHeight;
      const side = Math.min(w, h) * 0.8;
      setCrop({
        x: (w - side) / 2,
        y: (h - side) / 2,
        width: side,
        height: side
      });
    }
  }, []);

  useEffect(() => {
    if (originalImage) {
      const timer = setTimeout(resetCrop, 100);
      return () => clearTimeout(timer);
    }
  }, [originalImage, resetCrop]);

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'resize') => {
    e.preventDefault();
    if (type === 'move') setIsMoving(true);
    else setIsResizing(true);

    startPos.current = { x: e.clientX, y: e.clientY };
    startCrop.current = { ...crop };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMoving && !isResizing) return;
    if (!imgRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;

    const dx = (e.clientX - startPos.current.x) * scaleX;
    const dy = (e.clientY - startPos.current.y) * scaleY;

    if (isMoving) {
      setCrop(prev => ({
        ...prev,
        x: Math.max(0, Math.min(imgRef.current!.naturalWidth - prev.width, startCrop.current.x + dx)),
        y: Math.max(0, Math.min(imgRef.current!.naturalHeight - prev.height, startCrop.current.y + dy))
      }));
    } else if (isResizing) {
      let newWidth = Math.max(20, startCrop.current.width + dx);
      let newHeight = Math.max(20, startCrop.current.height + dy);

      if (aspectRatio !== 'free') {
        const [aw, ah] = aspectRatio.split(':').map(Number);
        const ratio = aw / ah;
        if (Math.abs(dx) > Math.abs(dy)) {
          newHeight = newWidth / ratio;
        } else {
          newWidth = newHeight * ratio;
        }
      }

      // Constrain to image boundaries
      if (startCrop.current.x + newWidth > imgRef.current.naturalWidth) {
        newWidth = imgRef.current.naturalWidth - startCrop.current.x;
        if (aspectRatio !== 'free') {
          const [aw, ah] = aspectRatio.split(':').map(Number);
          newHeight = newWidth / (aw / ah);
        }
      }
      if (startCrop.current.y + newHeight > imgRef.current.naturalHeight) {
        newHeight = imgRef.current.naturalHeight - startCrop.current.y;
        if (aspectRatio !== 'free') {
          const [aw, ah] = aspectRatio.split(':').map(Number);
          newWidth = newHeight * (aw / ah);
        }
      }

      setCrop(prev => ({ ...prev, width: newWidth, height: newHeight }));
    }
  }, [isMoving, isResizing, aspectRatio]);

  const handleMouseUp = useCallback(() => {
    setIsMoving(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isMoving || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMoving, isResizing, handleMouseMove, handleMouseUp]);

  const handleDownload = () => {
    if (!imgRef.current || !crop.width || !crop.height) return;

    const canvas = document.createElement('canvas');
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      crop.x, crop.y, crop.width, crop.height,
      0, 0, crop.width, crop.height
    );

    const link = document.createElement('a');
    link.download = `cropped-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleAspectRatioChange = (val: string) => {
    setAspectRatio(val);
    if (val !== 'free' && imgRef.current) {
      const [aw, ah] = val.split(':').map(Number);
      const ratio = aw / ah;
      let newWidth = crop.width;
      let newHeight = newWidth / ratio;

      if (newHeight > imgRef.current.naturalHeight - crop.y) {
        newHeight = imgRef.current.naturalHeight - crop.y;
        newWidth = newHeight * ratio;
      }
      setCrop(prev => ({ ...prev, width: newWidth, height: newHeight }));
    }
  };

  const getOverlayStyle = () => {
    if (!imgRef.current || !containerRef.current) return {};
    const rect = containerRef.current.getBoundingClientRect();
    const scaleX = rect.width / imgRef.current.naturalWidth;
    const scaleY = rect.height / imgRef.current.naturalHeight;

    return {
      left: crop.x * scaleX,
      top: crop.y * scaleY,
      width: crop.width * scaleX,
      height: crop.height * scaleY
    };
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
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Sliders className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('aspectratio.ratio')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'free', label: 'Libre' },
                    { id: '1:1', label: '1:1 (Carré)' },
                    { id: '16:9', label: '16:9 (HD)' },
                    { id: '4:3', label: '4:3' },
                    { id: '3:2', label: '3:2' },
                    { id: '9:16', label: '9:16 (TikTok)' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleAspectRatioChange(opt.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                        aspectRatio === opt.id
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Largeur</label>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg text-center font-mono text-xs font-bold border border-slate-200 dark:border-slate-700">
                    {Math.round(crop.width)} px
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Hauteur</label>
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-lg text-center font-mono text-xs font-bold border border-slate-200 dark:border-slate-700">
                    {Math.round(crop.height)} px
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownload}
                disabled={!originalImage}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {t('common.download')}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Crop className="w-4 h-4 text-indigo-500" /> {t('common.output')}
            </div>
            {originalImage && (
              <button
                onClick={() => setOriginalImage(null)}
                className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-xl transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div
            className={`relative min-h-[400px] bg-slate-50 dark:bg-slate-900 border-4 border-dashed rounded-[2.5rem] flex items-center justify-center overflow-hidden transition-all ${
              originalImage ? 'border-transparent' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {originalImage ? (
              <div ref={containerRef} className="relative group max-w-full max-h-[600px] select-none">
                <img
                  ref={imgRef}
                  src={originalImage}
                  alt="Original"
                  className="max-w-full max-h-[600px] object-contain opacity-50 transition-opacity"
                />

                {/* Crop Overlay */}
                <div
                  className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move z-10"
                  style={getOverlayStyle()}
                  onMouseDown={(e) => handleMouseDown(e, 'move')}
                >
                  {/* Visual Guides */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-r border-b border-white/30" />
                    <div className="border-b border-white/30" />
                    <div className="border-r border-white/30" />
                    <div className="border-r border-white/30" />
                    <div />
                  </div>

                  {/* Resize Handle */}
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white cursor-nwse-resize shadow-lg hover:scale-125 transition-transform"
                    onMouseDown={(e) => handleMouseDown(e, 'resize')}
                  />

                  {/* Size Label */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    {Math.round(crop.width)} × {Math.round(crop.height)}
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-4 cursor-pointer p-12 text-center group">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500 transition-transform group-hover:scale-110">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-black dark:text-white">{t('imageeffects.upload_prompt')}</p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">PNG, JPG, WEBP (Max 10MB)</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }} className="hidden" />
                </div>
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('imagecropper.about_title', 'About Image Cropper')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('imagecropper.about_text', 'Crop your images to any size or use fixed aspect ratios. Drag the crop area to move it, and use the handle at the bottom-right corner to resize. This tool works entirely in your browser, ensuring your images stay private.')}
          </p>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm pt-2">
            <ShieldCheck className="w-4 h-4" />
            {t('common.privacy_desc')}
          </div>
        </div>
      </div>
    </div>
  );
}
