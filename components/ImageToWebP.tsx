import { useState, useCallback, useEffect } from "react";
import { Upload, Download, Image as ImageIcon, Trash2, FileWarning, Check } from "lucide-react";

interface ImageFile {
  file: File;
  preview: string;
  webpUrl?: string;
  status: 'idle' | 'converting' | 'done' | 'error';
  originalSize: number;
  newSize?: number;
}

export function ImageToWebP() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [quality, setQuality] = useState(0.8);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        status: 'idle' as const,
        originalSize: file.size
      }));
      setImages(prev => [...prev, ...newFiles]);
    }
  };

  const convertToWebP = useCallback(async (imgFile: ImageFile) => {
    return new Promise<ImageFile>((resolve) => {
      const img = new Image();
      img.src = imgFile.preview;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ ...imgFile, status: 'error' });
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            if (imgFile.webpUrl) URL.revokeObjectURL(imgFile.webpUrl);
            resolve({
              ...imgFile,
              status: 'done',
              webpUrl: URL.createObjectURL(blob),
              newSize: blob.size
            });
          } else {
            resolve({ ...imgFile, status: 'error' });
          }
        }, 'image/webp', quality);
      };
      img.onerror = () => resolve({ ...imgFile, status: 'error' });
    });
  }, [quality]);

  const convertAll = async () => {
    const updatedImages = await Promise.all(
      images.map(async (img) => {
        if (img.status === 'done' || img.status === 'converting') return img;
        return await convertToWebP({ ...img, status: 'converting' });
      })
    );
    setImages(updatedImages);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      const removed = newImages.splice(index, 1)[0];
      URL.revokeObjectURL(removed.preview);
      if (removed.webpUrl) URL.revokeObjectURL(removed.webpUrl);
      return newImages;
    });
  };

  useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.preview);
        if (img.webpUrl) URL.revokeObjectURL(img.webpUrl);
      });
    };
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center group hover:border-indigo-500 transition-all">
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors shadow-sm mb-4">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold mb-2">Cliquez ou glissez vos images ici</h3>
          <p className="text-slate-500 dark:text-slate-400">Supporte PNG, JPG, GIF et plus</p>
        </label>
      </div>

      {images.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="flex-grow max-w-xs">
              <div className="flex justify-between mb-2">
                <label htmlFor="quality" className="text-sm font-bold text-slate-500 uppercase">Qualité WebP</label>
                <span className="text-sm font-mono font-bold text-indigo-600">{Math.round(quality * 100)}%</span>
              </div>
              <input
                id="quality"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <button
              onClick={convertAll}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
            >
              Convertir {images.length} image{images.length > 1 ? 's' : ''}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((img, index) => (
              <div key={index} className="flex gap-4 p-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 relative group">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                  <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0 space-y-1">
                  <p className="font-bold text-sm truncate">{img.file.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(img.originalSize)}</p>

                  {img.status === 'done' && img.newSize && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 text-[10px] font-bold rounded-md">
                        WebP: {formatSize(img.newSize)}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-500">
                        -{Math.round((1 - img.newSize / img.originalSize) * 100)}%
                      </span>
                    </div>
                  )}

                  {img.status === 'converting' && (
                    <div className="text-[10px] font-bold text-indigo-500 animate-pulse">Conversion...</div>
                  )}

                  {img.status === 'error' && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
                      <FileWarning className="w-3 h-3" /> Erreur
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between items-end">
                  <button
                    onClick={() => removeImage(index)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {img.status === 'done' && img.webpUrl && (
                    <a
                      href={img.webpUrl}
                      download={`${img.file.name.split('.')[0]}.webp`}
                      className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold">Pourquoi WebP ?</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Le format WebP offre une compression supérieure pour les images sur le web, tout en conservant une excellente qualité visuelle. Il permet de réduire considérablement le temps de chargement de vos pages web.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
