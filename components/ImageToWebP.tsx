import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, RefreshCcw, Image as ImageIcon, Check, Trash2 } from 'lucide-react';

export function ImageToWebP() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [webpImage, setWebpImage] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [originalSize, setOriginalSize] = useState(0);
  const [webpSize, setWebpSize] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanup = useCallback(() => {
    if (webpImage) {
      URL.revokeObjectURL(webpImage);
    }
  }, [webpImage]);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const convertToWebP = useCallback((img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setWebpSize(blob.size);
          const url = URL.createObjectURL(blob);
          setWebpImage(url);
          setIsConverting(false);
        }
      },
      'image/webp',
      quality / 100
    );
  }, [quality]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsConverting(true);
    setOriginalSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(event.target?.result as string);
        convertToWebP(img);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    if (originalImage) {
      setIsConverting(true);
      const img = new Image();
      img.onload = () => convertToWebP(img);
      img.src = originalImage;
    }
  };

  const downloadImage = () => {
    if (!webpImage) return;
    const link = document.createElement('a');
    link.href = webpImage;
    link.download = 'image.webp';
    link.click();
  };

  const clear = () => {
    cleanup();
    setOriginalImage(null);
    setWebpImage(null);
    setOriginalSize(0);
    setWebpSize(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const compressionRate = originalSize > 0 ? ((1 - webpSize / originalSize) * 100).toFixed(1) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {!originalImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-16 text-center cursor-pointer hover:border-indigo-500 transition-all group bg-slate-50 dark:bg-slate-900/40"
        >
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all shadow-sm">
            <Upload className="w-10 h-10" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mb-3">
            Déposez une image ou cliquez pour uploader
          </p>
          <p className="text-slate-500 font-medium">Formats supportés : JPG, PNG, WEBP, GIF</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-grow space-y-4">
              <div className="flex justify-between items-center text-sm">
                <label htmlFor="quality" className="font-bold text-slate-600 dark:text-slate-400 uppercase">Qualité WebP: {quality}%</label>
                <button onClick={() => handleQualityChange(80)} className="text-indigo-600 hover:text-indigo-700 transition-colors" aria-label="Réinitialiser la qualité">
                  <RefreshCcw className="w-4 h-4" />
                </button>
              </div>
              <input
                id="quality"
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => handleQualityChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <button
              onClick={clear}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl transition-all h-[52px]"
            >
              <Trash2 className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-400" /> Original
                </h3>
                <span className="text-xs font-bold px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-md">{formatFileSize(originalSize)}</span>
              </div>
              <div className="aspect-video relative rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <img src={originalImage} alt="Original" className="w-full h-full object-contain" />
              </div>
            </div>

            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30 space-y-4 relative">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-500" /> WebP
                </h3>
                <span className="text-xs font-bold px-2 py-1 bg-indigo-200/50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-md">{formatFileSize(webpSize)}</span>
              </div>
              <div className="aspect-video relative rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800">
                {isConverting ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 dark:bg-slate-900/80">
                    <RefreshCcw className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                ) : (
                  webpImage && <img src={webpImage} alt="WebP Preview" className="w-full h-full object-contain" />
                )}
              </div>

              {webpImage && !isConverting && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-emerald-500/20 whitespace-nowrap">
                  Réduction de {compressionRate}% !
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl hover:border-indigo-500 transition-all font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
            >
              <Upload className="w-5 h-5" />
              Choisir une autre image
            </button>
            <button
              onClick={downloadImage}
              disabled={!webpImage || isConverting}
              className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              Télécharger en WebP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
