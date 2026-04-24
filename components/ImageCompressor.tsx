import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, Trash2, Image as ImageIcon, Info, Zap, ShieldCheck, AlertCircle } from 'lucide-react';

// Sentinel: Enforce file size limit to mitigate client-side Denial of Service (DoS)
// and prevent browser memory exhaustion or crashes.
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function ImageCompressor() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const compressImage = useCallback((img: HTMLImageElement, q: number) => {
    setIsCompressing(true);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCompressing(false);
      return;
    }
    
    ctx.drawImage(img, 0, 0);
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCompressedSize(blob.size);
          if (compressedImage) URL.revokeObjectURL(compressedImage);
          const url = URL.createObjectURL(blob);
          setCompressedImage(url);
        }
        setIsCompressing(false);
      },
      'image/jpeg',
      q / 100
    );
  }, [compressedImage]);

  const handleFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith('image/')) return;

    if (file.size > MAX_SIZE) {
      setError(`L'image est trop volumineuse. La limite est de 5 Mo.`);
      return;
    }
    setError(null);

    setOriginalSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        setOriginalImage(event.target?.result as string);
        compressImage(img, quality);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [compressImage, quality]);

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

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    if (imgRef.current) {
      compressImage(imgRef.current, newQuality);
    }
  };

  const downloadImage = () => {
    if (!compressedImage) return;
    const link = document.createElement('a');
    link.href = compressedImage;
    link.download = 'image-compressee.jpg';
    link.click();
  };

  const handleClear = () => {
    setOriginalImage(null);
    if (compressedImage) URL.revokeObjectURL(compressedImage);
    setCompressedImage(null);
    setOriginalSize(0);
    setCompressedSize(0);
    imgRef.current = null;
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  useEffect(() => {
    return () => {
      if (compressedImage) URL.revokeObjectURL(compressedImage);
    };
  }, [compressedImage]);

  const compressionRate = originalSize > 0 ? ((1 - compressedSize / originalSize) * 100).toFixed(1) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
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
            Cliquez pour uploader une image
          </p>
          <p className="mt-2 text-slate-500 font-bold uppercase tracking-widest text-xs">JPG, PNG, WEBP, GIF</p>

          <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem]">
            <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="quality-range" className="text-xs font-black uppercase tracking-widest text-slate-400">Qualité: {quality}%</label>
                {isCompressing && <span className="text-[10px] font-bold text-indigo-500 animate-pulse">COMPRESSION...</span>}
              </div>
              <input
                id="quality-range"
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => handleQualityChange(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClear}
                className="p-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-2xl hover:bg-rose-100 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                title="Effacer"
                aria-label="Effacer le formulaire"
              >
                <Trash2 className="w-6 h-6" />
              </button>
              <button
                onClick={downloadImage}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
              >
                <Download className="w-6 h-6" />
                Télécharger
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Image originale</h3>
              <div className="relative group rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                <img src={originalImage} alt="Original" className="w-full h-auto object-contain max-h-[500px]" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md text-white rounded-full text-xs font-bold">
                    <ImageIcon className="w-3 h-3" /> {formatFileSize(originalSize)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Image compressée</h3>
              <div className="relative group rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 min-h-[200px] flex items-center justify-center">
                {compressedImage ? (
                  <>
                    <img src={compressedImage} alt="Compressed" className="w-full h-auto object-contain max-h-[500px]" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-lg">
                        <Zap className="w-3 h-3" /> {formatFileSize(compressedSize)}
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full text-xs font-bold shadow-lg">
                        -{compressionRate}%
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="animate-pulse flex flex-col items-center gap-2 text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-xs font-bold uppercase tracking-widest">Compression en cours...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> 100% Client-Side
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Vos images ne quittent jamais votre ordinateur. La compression est effectuée localement dans votre navigateur grâce à l'API Canvas.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" /> Performance Web
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Réduisez le poids de vos pages web sans sacrifier la qualité visuelle. Idéal pour le SEO et le temps de chargement de vos sites.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Formats supportés
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'outil accepte les fichiers JPG, PNG, WEBP et GIF. Le fichier compressé est généré au format JPEG optimisé.
          </p>
        </div>
      </div>
    </div>
  );
}
