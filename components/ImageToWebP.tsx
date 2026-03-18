import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, Download, Image as ImageIcon, Check, RefreshCw, Trash2, FileType } from 'lucide-react';

export function ImageToWebP() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [isConverting, setIsConverting] = useState(false);
  const [stats, setStats] = useState<{ originalSize: number; convertedSize: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setConvertedUrl(null);
      setStats(null);
    }
  };

  const convertImage = useCallback(async () => {
    if (!preview) return;
    setIsConverting(true);

    const img = new Image();
    img.src = preview;
    await new Promise((resolve) => (img.onload = resolve));

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          if (convertedUrl) URL.revokeObjectURL(convertedUrl);
          setConvertedUrl(url);
          setStats({
            originalSize: image?.size || 0,
            convertedSize: blob.size,
          });
        }
        setIsConverting(false);
      },
      'image/webp',
      quality
    );
  }, [preview, quality, image, convertedUrl]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    };
  }, [preview, convertedUrl]);

  const handleReset = () => {
    setImage(null);
    if (preview) URL.revokeObjectURL(preview);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    setPreview(null);
    setConvertedUrl(null);
    setStats(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {!preview ? (
        <div className="border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] p-20 text-center space-y-8 group hover:border-indigo-500/20 transition-all duration-500 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-500">
            <Upload className="w-10 h-10 text-indigo-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black dark:text-white tracking-tight">Convertir en WebP</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Téléchargez un JPG, PNG ou BMP pour obtenir une image WebP plus légère.</p>
          </div>
          <label className="inline-block cursor-pointer">
            <span className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-600/20">
              Sélectionner un fichier
            </span>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 group">
              <img src={preview} alt="Preview" className="w-full h-full object-contain p-4" />
              <button
                onClick={handleReset}
                className="absolute top-4 right-4 p-3 bg-rose-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all active:scale-95 hover:bg-rose-600 shadow-lg shadow-rose-500/20"
                aria-label="Supprimer l'image"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm shadow-indigo-500/5">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Qualité</label>
                  <span className="text-sm font-bold text-indigo-500">{Math.round(quality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <button
                onClick={convertImage}
                disabled={isConverting}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    Conversion...
                  </>
                ) : (
                  <>
                    <FileType className="w-6 h-6" />
                    Convertir en WebP
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-8 h-full flex flex-col justify-center">
            {convertedUrl ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-slate-900 border border-slate-800 group">
                  <img src={convertedUrl} alt="Converted" className="w-full h-full object-contain p-4" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl border border-emerald-100 dark:border-emerald-500/20 space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600/60">Taille</div>
                    <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {stats ? formatSize(stats.convertedSize) : '--'}
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Réduction</div>
                    <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {stats ? Math.round((1 - stats.convertedSize / stats.originalSize) * 100) : '--'}%
                    </div>
                  </div>
                </div>

                <a
                  href={convertedUrl}
                  download={image?.name.replace(/\.[^/.]+$/, "") + ".webp"}
                  className="w-full py-6 bg-emerald-500 text-white rounded-2xl font-black text-xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-4 shadow-xl shadow-emerald-500/20"
                >
                  <Download className="w-8 h-8" />
                  Télécharger WebP
                </a>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]">
                <ImageIcon className="w-16 h-16 text-slate-200 dark:text-slate-800" />
                <p className="text-slate-400 font-bold max-w-[200px]">Le résultat s'affichera ici après conversion</p>
              </div>
            )}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
