import { useState, useCallback, useEffect } from 'react';
import { Image as ImageIcon, Download, Upload, Trash2, Check, RefreshCcw } from 'lucide-react';

export function ImageToWebP() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [isConverting, setIsConverting] = useState(false);
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearState = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    setImage(null);
    setPreview(null);
    setConvertedUrl(null);
    setError(null);
  }, [preview, convertedUrl]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    };
  }, [preview, convertedUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Le fichier doit être une image.');
        return;
      }
      clearState();
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const convertToWebP = async () => {
    if (!image) return;
    setIsConverting(true);
    setError(null);

    try {
      const img = new Image();
      img.src = preview!;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Impossible de créer le contexte canvas');

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setConvertedUrl(url);
            setIsConverting(false);
          }
        },
        'image/webp',
        quality
      );
    } catch (err) {
      setError('Échec de la conversion de l\'image.');
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {!image ? (
        <div className="relative group">
          <label className="flex flex-col items-center justify-center w-full h-80 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/60 hover:border-indigo-500/50 transition-all cursor-pointer">
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-[2rem] bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mb-6 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black mb-2">Choisir une image</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs">Sélectionnez une image (JPG, PNG) pour la convertir en WebP</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm flex items-center gap-2">
                   <ImageIcon className="w-4 h-4 text-indigo-500" /> Original
                </h3>
                <button
                  onClick={clearState}
                  className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <img src={preview!} alt="Original" className="w-full h-auto rounded-2xl shadow-lg border border-white dark:border-slate-800" />
              <div className="mt-4 flex items-center gap-4 text-sm font-bold text-slate-400">
                 <span>{(image.size / 1024).toFixed(1)} KB</span>
                 <span>•</span>
                 <span>{image.type.split('/')[1].toUpperCase()}</span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label htmlFor="quality" className="text-sm font-bold text-slate-700 dark:text-slate-300">Qualité WebP: {(quality * 100).toFixed(0)}%</label>
                </div>
                <input
                  id="quality"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <button
                onClick={convertToWebP}
                disabled={isConverting}
                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
              >
                {isConverting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
                {isConverting ? 'Conversion...' : 'Convertir en WebP'}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 min-h-[400px] flex flex-col items-center justify-center text-center transition-all ${convertedUrl ? 'opacity-100' : 'opacity-50 grayscale'}`}>
              {convertedUrl ? (
                <>
                  <div className="flex items-center justify-between w-full mb-6 px-1">
                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm flex items-center gap-2">
                       <Check className="w-4 h-4 text-emerald-500" /> Résultat WebP
                    </h3>
                  </div>
                  <img src={convertedUrl} alt="WebP Result" className="w-full h-auto rounded-2xl shadow-lg border border-white dark:border-slate-800 mb-8" />
                  <a
                    href={convertedUrl}
                    download={`${image.name.split('.')[0]}.webp`}
                    className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all"
                  >
                    <Download className="w-5 h-5" /> Télécharger WebP
                  </a>
                </>
              ) : (
                <div className="p-12">
                   <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto mb-6 text-slate-400">
                     <ImageIcon className="w-8 h-8" />
                   </div>
                   <p className="font-bold text-slate-400">Cliquez sur convertir pour voir le résultat</p>
                </div>
              )}
            </div>
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-2xl text-sm font-bold border border-rose-200 dark:border-rose-800">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
