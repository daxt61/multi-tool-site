import React, { useState, useCallback, useEffect } from 'react';
import { Upload, ImageIcon, Check, Download, Info, Trash2, Loader2 } from 'lucide-react';

export function ImageToWebP() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [isConverting, setIsConverting] = useState(false);

  const cleanupUrls = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);
  }, [previewUrl, convertedUrl]);

  useEffect(() => {
    return cleanupUrls;
  }, [cleanupUrls]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      cleanupUrls();
      setConvertedUrl(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const convertToWebP = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    const img = new Image();
    img.src = URL.createObjectURL(selectedFile);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              setConvertedUrl(url);
            }
            setIsConverting(false);
            URL.revokeObjectURL(img.src);
          },
          'image/webp',
          quality
        );
      }
    };
  };

  const reset = () => {
    cleanupUrls();
    setSelectedFile(null);
    setPreviewUrl(null);
    setConvertedUrl(null);
    setIsConverting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload & Settings */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Importation</h3>
              {(selectedFile || convertedUrl) && (
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg"
                  aria-label="Effacer tout"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Effacer
                </button>
              )}
            </div>

            {!selectedFile ? (
              <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] cursor-pointer hover:bg-white dark:hover:bg-slate-900/50 hover:border-indigo-500/50 transition-all group">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors shadow-sm mb-4">
                  <Upload className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Choisir une image</span>
                <span className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
                <img src={previewUrl!} alt="Aperçu" className="w-full h-full object-contain rounded-2xl" />
              </div>
            )}

            {selectedFile && (
              <div className="space-y-6 pt-2">
                <div className="space-y-4">
                  <div className="flex justify-between px-1">
                    <label htmlFor="quality" className="text-xs font-bold text-slate-500 uppercase">Qualité WebP</label>
                    <span className="text-xs font-black text-indigo-500">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    id="quality"
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <button
                  onClick={convertToWebP}
                  disabled={isConverting}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isConverting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Convertir en WebP'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        <div className="flex flex-col">
          <div className={`flex-grow bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center ${!convertedUrl && 'opacity-50'}`}>
            {!convertedUrl ? (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
                  <ImageIcon className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Résultat de conversion</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">L'image convertie s'affichera ici.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8 w-full">
                <div className="relative aspect-square rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 mx-auto max-w-[300px]">
                  <img src={convertedUrl} alt="Convertie" className="w-full h-full object-contain rounded-2xl" />
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-lg">WebP</div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold">
                    <Check className="w-5 h-5" /> Conversion réussie
                  </div>
                  <a
                    href={convertedUrl}
                    download={`image_${Date.now()}.webp`}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 transition-all active:scale-95"
                  >
                    <Download className="w-5 h-5" /> Télécharger
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">Format WebP et Performance</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            WebP est un format d'image moderne qui offre une compression supérieure pour les images sur le Web. Il permet de réduire considérablement le poids des fichiers sans sacrifier la qualité visuelle, accélérant ainsi le chargement des pages.
          </p>
        </div>
      </div>
    </div>
  );
}
