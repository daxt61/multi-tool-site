import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Image as ImageIcon, Download, Copy, Check, RotateCcw, Upload, Sliders, Info, AlertCircle, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_CANVAS_DIMENSION = 4096;
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit

interface Preset {
  id: string;
  name: string;
  pixelSize: number;
}

const PRESETS: Preset[] = [
  { id: 'subtle', name: 'Subtle Pixelation', pixelSize: 4 },
  { id: 'retro', name: 'Retro 8-Bit', pixelSize: 12 },
  { id: 'heavy', name: 'Heavy Anonymize', pixelSize: 28 },
  { id: 'mosaic', name: 'Mosaic Art', pixelSize: 50 },
];

export function ImagePixelator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [pixelSize, setPixelSize] = useState<number>(initialData?.pixelSize || 12);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>(initialData?.format || 'png');
  const [activePreset, setActivePreset] = useState<string | null>(initialData?.activePreset || 'retro');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    onStateChange?.({ pixelSize, format, activePreset });
  }, [pixelSize, format, activePreset, onStateChange]);

  // Generate a default sample canvas image if none uploaded
  const generateSampleImage = useCallback(() => {
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 600;
    sampleCanvas.height = 400;
    const ctx = sampleCanvas.getContext('2d');
    if (!ctx) return;

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(0.5, '#a855f7');
    gradient.addColorStop(1, '#ec4899');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // Decorative shapes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(200, 200, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(340, 110, 180, 180);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(120, 320);
    ctx.lineTo(220, 160);
    ctx.lineTo(320, 320);
    ctx.closePath();
    ctx.fill();

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
      setError(null);
    };
    img.src = sampleCanvas.toDataURL('image/png');
  }, []);

  useEffect(() => {
    generateSampleImage();
  }, [generateSampleImage]);

  // Render pixelated image to main canvas
  const renderPixelatedImage = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clamp dimensions to MAX_CANVAS_DIMENSION to prevent DoS
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION) {
      const ratio = Math.min(MAX_CANVAS_DIMENSION / width, MAX_CANVAS_DIMENSION / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;

    const size = Math.max(1, Math.min(200, pixelSize));
    const scaledWidth = Math.max(1, Math.floor(width / size));
    const scaledHeight = Math.max(1, Math.floor(height / size));

    // Offscreen canvas for downscaling
    const offscreen = document.createElement('canvas');
    offscreen.width = scaledWidth;
    offscreen.height = scaledHeight;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    // Downscale image to offscreen canvas
    offCtx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

    // Disable image smoothing on main context for nearest-neighbor crisp pixelation
    ctx.imageSmoothingEnabled = false;
    // @ts-ignore - Vendor prefix fallbacks
    ctx.mozImageSmoothingEnabled = false;
    // @ts-ignore
    ctx.webkitImageSmoothingEnabled = false;
    // @ts-ignore
    ctx.msImageSmoothingEnabled = false;

    // Upscale from offscreen canvas back to full canvas
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(offscreen, 0, 0, scaledWidth, scaledHeight, 0, 0, width, height);
  }, [pixelSize, imageLoaded]);

  useEffect(() => {
    renderPixelatedImage();
  }, [renderPixelatedImage]);

  const loadFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t('imagepixelator.error_invalid_type', 'Please select a valid image file (PNG, JPG, WebP, GIF).'));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(t('imagepixelator.error_too_large', 'File size exceeds 20MB limit.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setImageLoaded(true);
        setError(null);
        toast.success(t('imagepixelator.image_loaded', 'Image loaded successfully!'));
      };
      img.onerror = () => {
        setError(t('imagepixelator.error_load_failed', 'Failed to load image.'));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) loadFile(file);
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const mimeType = `image/${format}`;
    const quality = format === 'jpeg' || format === 'webp' ? 0.92 : undefined;
    const dataUrl = canvas.toDataURL(mimeType, quality);

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `pixelated-image-${pixelSize}px-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success(t('imagepixelator.download_success', 'Pixelated image downloaded!'));
  }, [format, imageLoaded, pixelSize, t]);

  const handleCopyDataUrl = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const mimeType = `image/${format}`;
    const dataUrl = canvas.toDataURL(mimeType);

    navigator.clipboard.writeText(dataUrl);
    setCopied(true);
    toast.success(t('imagepixelator.copy_success', 'Image Data URL copied to clipboard!'));
    setTimeout(() => setCopied(false), 2000);
  }, [format, imageLoaded, t]);

  const handleReset = useCallback(() => {
    setPixelSize(12);
    setActivePreset('retro');
    setFormat('png');
    setError(null);
    generateSampleImage();
    toast.success(t('imagepixelator.reset_success', 'Image and settings reset!'));
    sliderRef.current?.focus();
  }, [generateSampleImage, t]);

  const handleApplyPreset = (preset: Preset) => {
    setPixelSize(preset.pixelSize);
    setActivePreset(preset.id);
    toast.success(t('imagepixelator.preset_applied', `Applied preset: ${preset.name}`));
  };

  // Handlers ref pattern for keyboard shortcuts
  const handlersRef = useRef({ handleReset, handleCopyDataUrl, handleDownload });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopyDataUrl, handleDownload };
  }, [handleReset, handleCopyDataUrl, handleDownload]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) {
        return;
      }

      const activeEl = document.activeElement;
      const isEditable = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.getAttribute('contenteditable') === 'true'
      );

      if (isEditable) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handlersRef.current.handleReset();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopyDataUrl();
      } else if (e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handlersRef.current.handleDownload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Start Presets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            {t('imagepixelator.presets_label', 'Quick Presets')}
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              aria-pressed={activePreset === preset.id}
              className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                activePreset === preset.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <span className="font-bold text-sm leading-tight mb-1">{preset.name}</span>
              <span className={`text-xs font-mono ${activePreset === preset.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                {preset.pixelSize}px blocks
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Sliders className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                {t('common.options', 'Settings')}
              </div>
              <button
                onClick={handleReset}
                title="Reset Image and Settings (Esc)"
                className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-lg px-2 py-1"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('common.reset', 'Reset')}</span>
                <Kbd modifier={null} className="hidden sm:inline-flex text-[10px]">Esc</Kbd>
              </button>
            </div>

            <div className="space-y-6">
              {/* File Upload / Dropzone */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                  {t('imagepixelator.upload_label', 'Source Image')}
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl cursor-pointer text-center transition-all group"
                >
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mx-auto mb-2 transition-colors" aria-hidden="true" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {t('imagepixelator.drop_text', 'Click or drag image here')}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {t('imagepixelator.drop_subtext', 'PNG, JPG, WebP, GIF up to 20MB or Paste')}
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Pixel Block Size Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="pixel-size-slider" className="text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">
                    {t('imagepixelator.block_size', 'Pixel Block Size')}
                  </label>
                  <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">{pixelSize}px</span>
                </div>
                <input
                  id="pixel-size-slider"
                  ref={sliderRef}
                  type="range"
                  min="2"
                  max="100"
                  step="1"
                  value={pixelSize}
                  aria-valuemin={2}
                  aria-valuemax={100}
                  aria-valuenow={pixelSize}
                  onChange={(e) => {
                    setPixelSize(parseInt(e.target.value));
                    setActivePreset(null);
                  }}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                />
              </div>

              {/* Export Format Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                  {t('imagepixelator.format_label', 'Export Format')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      aria-pressed={format === fmt}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                        format === fmt
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <button
                  onClick={handleDownload}
                  disabled={!imageLoaded}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>{t('common.download', 'Download')} Image</span>
                  <Kbd modifier={null} className="hidden sm:inline-flex text-indigo-200 border-indigo-500">D</Kbd>
                </button>

                <button
                  onClick={handleCopyDataUrl}
                  disabled={!imageLoaded}
                  className={`w-full py-3 rounded-2xl font-bold text-xs border transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                    copied
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                  <span>{copied ? t('common.copied', 'Copied!') : t('imagepixelator.copy_data_url', 'Copy Data URL')}</span>
                  {!copied && <Kbd modifier={null} className="hidden sm:inline-flex">C</Kbd>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas Live Preview Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              {t('imagepixelator.preview_title', 'Live Pixelated Preview')}
            </label>
            <span className="text-xs text-slate-400 font-mono">
              {canvasRef.current ? `${canvasRef.current.width} × ${canvasRef.current.height} px` : ''}
            </span>
          </div>

          <div className="relative min-h-[500px] bg-slate-50 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center overflow-auto p-6 checkerboard-bg">
            <canvas
              ref={canvasRef}
              className="shadow-2xl rounded-2xl max-w-full max-h-[600px] object-contain transition-all"
            />
          </div>
        </div>
      </div>

      {/* Info Notice */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex-shrink-0">
          <Info className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 dark:text-white">
            {t('imagepixelator.about_title', 'About Image Pixelator')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('imagepixelator.about_text', 'Pixelate and anonymize photos or create 8-bit retro pixel art graphics instantly in your browser. All image processing occurs locally on your client machine using HTML5 Canvas API without transmitting any data to external servers.')}
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .checkerboard-bg {
          background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        .dark .checkerboard-bg {
          background-image: linear-gradient(45deg, #1e293b 25%, transparent 25%),
                            linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #1e293b 75%),
                            linear-gradient(-45deg, transparent 75%, #1e293b 75%);
          background-color: #0f172a;
        }
      `}} />
    </div>
  );
}
