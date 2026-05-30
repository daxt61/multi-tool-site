import { useState, useRef, useEffect, useCallback } from 'react';
import {
  RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Download, Trash2, Upload, Maximize2, AlertCircle, Info, RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface RotatorState {
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
}

export function ImageRotator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(initialData?.image || null);
  const [state, setState] = useState<RotatorState>(initialData?.state || { rotation: 0, flipH: false, flipV: false });
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    onStateChange?.({ image, state });
  }, [image, state, onStateChange]);

  const handleUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    if (file.size > MAX_SIZE) {
      setError(t('error.max_length', { max: '5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setState({ rotation: 0, flipH: false, flipV: false });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const applyTransformations = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !image) return;

    setIsProcessing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const angle = (state.rotation * Math.PI) / 180;
    const isVertical = (state.rotation / 90) % 2 !== 0;

    const width = isVertical ? img.naturalHeight : img.naturalWidth;
    const height = isVertical ? img.naturalWidth : img.naturalHeight;

    canvas.width = width;
    canvas.height = height;

    ctx.save();

    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Rotate
    ctx.rotate(angle);

    // Flip
    ctx.scale(state.flipH ? -1 : 1, state.flipV ? -1 : 1);

    // Draw image back from center
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    ctx.restore();
    setIsProcessing(false);
  }, [image, state]);

  useEffect(() => {
    if (image) {
      const timeout = setTimeout(applyTransformations, 100);
      return () => clearTimeout(timeout);
    }
  }, [image, state, applyTransformations]);

  const rotate = (direction: 'cw' | 'ccw') => {
    setState(prev => {
      let newRotation = prev.rotation + (direction === 'cw' ? 90 : -90);
      if (newRotation < 0) newRotation = 270;
      if (newRotation >= 360) newRotation = 0;
      return { ...prev, rotation: newRotation };
    });
  };

  const flip = (type: 'h' | 'v') => {
    setState(prev => ({
      ...prev,
      [type === 'h' ? 'flipH' : 'flipV']: !prev[type === 'h' ? 'flipH' : 'flipV']
    }));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `rotated-image-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const reset = () => setState({ rotation: 0, flipH: false, flipV: false });

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
                <RotateCw className="w-4 h-4 text-indigo-500" /> {t('common.options')}
              </div>
              <button
                onClick={reset}
                className="text-[10px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors"
              >
                {t('common.reset')}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => rotate('ccw')}
                disabled={!image}
                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-all group disabled:opacity-50"
              >
                <RotateCcw className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">-90°</span>
              </button>
              <button
                onClick={() => rotate('cw')}
                disabled={!image}
                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 transition-all group disabled:opacity-50"
              >
                <RotateCw className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">+90°</span>
              </button>
              <button
                onClick={() => flip('h')}
                disabled={!image}
                className={`flex flex-col items-center justify-center p-4 border rounded-2xl transition-all group disabled:opacity-50 ${
                  state.flipH ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <FlipHorizontal className={`w-6 h-6 mb-2 ${state.flipH ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${state.flipH ? 'text-indigo-600' : 'text-slate-500'}`}>{t('imagerotator.flip_h')}</span>
              </button>
              <button
                onClick={() => flip('v')}
                disabled={!image}
                className={`flex flex-col items-center justify-center p-4 border rounded-2xl transition-all group disabled:opacity-50 ${
                  state.flipV ? 'bg-indigo-50 border-indigo-500 dark:bg-indigo-900/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <FlipVertical className={`w-6 h-6 mb-2 ${state.flipV ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${state.flipV ? 'text-indigo-600' : 'text-slate-500'}`}>{t('imagerotator.flip_v')}</span>
              </button>
            </div>

            <button
              onClick={handleDownload}
              disabled={!image || isProcessing}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Download className="w-5 h-5" /> {t('common.download')}
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Maximize2 className="w-4 h-4 text-indigo-500" /> {t('common.output')}
            </div>
            {image && (
              <button
                onClick={() => setImage(null)}
                className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-xl transition-all"
                title={t('common.clear')}
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
              if (file) handleUpload(file);
            }}
            className={`relative min-h-[400px] bg-slate-50 dark:bg-slate-900 border-4 border-dashed rounded-[2.5rem] flex items-center justify-center overflow-hidden transition-all ${
              isDragging ? 'border-indigo-500 bg-indigo-50/10' : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {image ? (
              <>
                <img
                  ref={imgRef}
                  src={image}
                  alt="Original"
                  className="hidden"
                  onLoad={applyTransformations}
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
              <label className="flex flex-col items-center gap-4 cursor-pointer p-12 text-center group">
                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500 transition-transform group-hover:scale-110">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-lg font-black dark:text-white">{t('imageeffects.upload_prompt')}</p>
                  <p className="text-sm text-slate-400 font-medium">JPG, PNG, WEBP (Max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('imagerotator.about_title', 'About Image Rotator')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('imagerotator.about_text', 'Easily rotate and flip your images directly in your browser. This tool supports 90-degree rotations and horizontal/vertical mirroring. All processing is done locally via the Canvas API, meaning your images never leave your computer, ensuring total privacy.')}
          </p>
        </div>
      </div>
    </div>
  );
}
