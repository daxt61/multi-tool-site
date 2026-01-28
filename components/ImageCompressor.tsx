import { useState, useRef } from 'react';
import { Upload, Download } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function ImageCompressor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalSize(file.size);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(event.target?.result as string);
        compressImage(img);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(img, 0, 0);
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCompressedSize(blob.size);
          const url = URL.createObjectURL(blob);
          setCompressedImage(url);
        }
      },
      'image/jpeg',
      quality / 100
    );
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    if (originalImage) {
      const img = new Image();
      img.onload = () => compressImage(img);
      img.src = originalImage;
    }
  };

  const downloadImage = () => {
    if (!compressedImage) return;
    const link = document.createElement('a');
    link.href = compressedImage;
    link.download = 'compressed-image.jpg';
    link.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const compressionRate = originalSize > 0 ? ((1 - compressedSize / originalSize) * 100).toFixed(1) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6 opacity-50 grayscale hover:grayscale-0 transition-all" />

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
          className="border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-16 text-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group"
        >
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all">
            <Upload className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black mb-2 dark:text-white">Glissez une image ici</h3>
          <p className="text-slate-500 dark:text-slate-400">ou cliquez pour parcourir vos fichiers</p>
          <p className="text-xs font-bold text-slate-400 mt-8 uppercase tracking-widest">JPG, PNG, WEBP, GIF</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm space-y-8">
          <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Qualité de compression
              </label>
              <span className="text-2xl font-black font-mono text-indigo-600">{quality}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => handleQualityChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Original ({formatFileSize(originalSize)})</div>
              <div className="aspect-video bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center p-2">
                <img src={originalImage} alt="Original" className="max-w-full max-h-full object-contain rounded-lg" />
              </div>
            </div>

            {compressedImage && (
              <div className="space-y-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Compressé ({formatFileSize(compressedSize)})</div>
                <div className="aspect-video bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center p-2">
                  <img src={compressedImage} alt="Compressed" className="max-w-full max-h-full object-contain rounded-lg" />
                </div>
              </div>
            )}
          </div>

          {compressedImage && (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-4 flex items-center justify-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                Gain de taille : {compressionRate}% de réduction
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Changer d'image
            </button>
            {compressedImage && (
              <button
                onClick={downloadImage}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-5 h-5" />
                Télécharger
              </button>
            )}
          </div>
        </div>
      )}

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
