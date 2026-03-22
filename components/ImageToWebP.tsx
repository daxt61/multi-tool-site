import { useState, useCallback, useEffect } from 'react';
import { Image as ImageIcon, Upload, Download, Trash2, Check, Info, FileType } from 'lucide-react';

interface ImageFile {
  file: File;
  preview: string;
  webpBlob?: Blob;
  webpUrl?: string;
  isConverting: boolean;
  isConverted: boolean;
}

export function ImageToWebP() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [quality, setQuality] = useState(0.8);

  const convertToWebP = useCallback(async (imgFile: ImageFile) => {
    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Conversion failed'));
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imgFile.preview;
    });
  }, [quality]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isConverting: false,
      isConverted: false,
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const processImages = async () => {
    setImages(prev => prev.map(img => img.isConverted ? img : { ...img, isConverting: true }));

    for (let i = 0; i < images.length; i++) {
      if (images[i].isConverted) continue;

      try {
        const webpBlob = await convertToWebP(images[i]);
        const webpUrl = URL.createObjectURL(webpBlob);

        setImages(prev => {
          const updated = [...prev];
          updated[i] = {
            ...updated[i],
            webpBlob,
            webpUrl,
            isConverting: false,
            isConverted: true,
          };
          return updated;
        });
      } catch (error) {
        console.error('Error converting image:', error);
        setImages(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], isConverting: false };
          return updated;
        });
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const img = prev[index];
      URL.revokeObjectURL(img.preview);
      if (img.webpUrl) URL.revokeObjectURL(img.webpUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const clearAll = () => {
    images.forEach(img => {
      URL.revokeObjectURL(img.preview);
      if (img.webpUrl) URL.revokeObjectURL(img.webpUrl);
    });
    setImages([]);
  };

  useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.preview);
        if (img.webpUrl) URL.revokeObjectURL(img.webpUrl);
      });
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Upload Area */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-6 group hover:border-indigo-500/50 transition-all">
        <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-400 group-hover:text-indigo-500 transition-colors shadow-sm">
          <Upload className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold dark:text-white">Glissez-déposez vos images</h3>
          <p className="text-slate-500 dark:text-slate-400">PNG, JPG ou GIF jusqu'à 10MB</p>
        </div>
        <label className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold cursor-pointer hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-600/20">
          Parcourir les fichiers
          <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {images.length > 0 && (
        <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="flex-grow md:flex-initial space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                  <span>Qualité WebP</span>
                  <span className="text-indigo-500">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full md:w-48 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={processImages}
                disabled={images.every(img => img.isConverted)}
                className="flex-grow md:flex-initial px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                Convertir tout en WebP
              </button>
              <button
                onClick={clearAll}
                className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-100 transition-colors"
                aria-label="Tout effacer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((img, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 group">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                  <img src={img.preview} alt="Aperçu" className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="font-bold text-sm truncate dark:text-white">{img.file.name}</div>
                  <div className="text-xs text-slate-400">{(img.file.size / 1024).toFixed(1)} KB</div>
                  {img.isConverted && img.webpBlob && (
                    <div className="text-xs font-bold text-emerald-500 mt-1">
                      WebP: {(img.webpBlob.size / 1024).toFixed(1)} KB (-{Math.round((1 - img.webpBlob.size / img.file.size) * 100)}%)
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {img.isConverted && img.webpUrl ? (
                    <a
                      href={img.webpUrl}
                      download={img.file.name.replace(/\.[^/.]+$/, "") + ".webp"}
                      className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                      aria-label="Télécharger"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  ) : (
                    <div className={`p-2 rounded-lg ${img.isConverting ? 'animate-pulse text-indigo-500' : 'text-slate-300'}`}>
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <FileType className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">Pourquoi utiliser le format WebP ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le format WebP offre une compression supérieure pour les images sur le web. Il permet de réduire considérablement la taille des fichiers (souvent de plus de 30% par rapport au JPEG ou PNG) tout en conservant une excellente qualité visuelle, ce qui accélère le chargement des pages.
          </p>
        </div>
      </div>
    </div>
  );
}
