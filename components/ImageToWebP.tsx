import React, { useState, useCallback, useEffect } from 'react';
import { Image as ImageIcon, Download, Upload, Trash2, Check, RefreshCw, FileImage, Settings2 } from 'lucide-react';

export function ImageToWebP() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [isConverting, setIsConverting] = useState(false);
  const [webpBlob, setWebpBlob] = useState<Blob | null>(null);
  const [webpPreview, setWebpPreview] = useState<string | null>(null);

  const clear = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    if (webpPreview) URL.revokeObjectURL(webpPreview);
    setImage(null);
    setPreview(null);
    setWebpBlob(null);
    setWebpPreview(null);
  }, [preview, webpPreview]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (webpPreview) URL.revokeObjectURL(webpPreview);
    };
  }, [preview, webpPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      clear();
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const convertToWebP = useCallback(() => {
    if (!image) return;
    setIsConverting(true);

    const img = new Image();
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
              setWebpBlob(blob);
              if (webpPreview) URL.revokeObjectURL(webpPreview);
              setWebpPreview(URL.createObjectURL(blob));
            }
            setIsConverting(false);
          },
          'image/webp',
          quality
        );
      }
    };
    img.src = preview!;
  }, [image, preview, quality, webpPreview]);

  const download = () => {
    if (!webpBlob || !image) return;
    const link = document.createElement('a');
    link.href = webpPreview!;
    link.download = `${image.name.split('.')[0]}.webp`;
    link.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {!image ? (
        <label className="flex flex-col items-center justify-center w-full h-80 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-3xl mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-xl font-black mb-2 dark:text-white">Choisir une image</p>
            <p className="text-sm text-slate-500">PNG, JPG ou GIF jusqu'à 10MB</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Original</span>
                <button onClick={clear} className="text-rose-500 hover:text-rose-600 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <img src={preview!} alt="Original" className="w-full h-64 object-contain rounded-2xl" />
              <div className="mt-6 flex justify-between items-center text-sm font-bold text-slate-500">
                <span>{image.name}</span>
                <span>{(image.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" /> Réglages
                </h3>
                <span className="text-xs font-black font-mono text-indigo-500">{Math.round(quality * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <button
                onClick={convertToWebP}
                disabled={isConverting}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isConverting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileImage className="w-5 h-5" />}
                Convertir en WebP
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`h-full bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border ${webpPreview ? 'border-indigo-500/30' : 'border-dashed border-slate-200 dark:border-slate-800'} p-8 flex flex-col`}>
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">WebP optimisé</span>
                {webpBlob && (
                  <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
                    <Check className="w-4 h-4" /> -{Math.round((1 - webpBlob.size / image.size) * 100)}%
                  </span>
                )}
              </div>

              <div className="flex-grow flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl overflow-hidden min-h-[16rem]">
                {webpPreview ? (
                  <img src={webpPreview} alt="Optimized" className="max-w-full max-h-64 object-contain" />
                ) : (
                  <div className="text-center space-y-2 opacity-30">
                    <RefreshCw className="w-12 h-12 mx-auto" />
                    <p className="text-xs font-bold uppercase tracking-widest">En attente de conversion</p>
                  </div>
                )}
              </div>

              {webpBlob && (
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center text-sm font-bold text-slate-500">
                    <span>webp_output.webp</span>
                    <span>{(webpBlob.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <button
                    onClick={download}
                    className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" /> Télécharger
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
