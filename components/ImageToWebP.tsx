import { useState, useCallback, useEffect, useRef } from 'react';
import { Image as ImageIcon, Download, Trash2, ArrowRight, Loader2, FileCheck, AlertCircle } from 'lucide-react';

export function ImageToWebP() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [converted, setConverted] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cleanup = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    if (converted) URL.revokeObjectURL(converted);
  }, [preview, converted]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image valide.');
        return;
      }
      setError(null);
      cleanup();
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setConverted(null);
    }
  };

  const convertToWebP = useCallback(() => {
    if (!image || !preview) return;
    setIsProcessing(true);
    setError(null);

    const img = new Image();
    img.onload = () => {
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
            setConverted(URL.createObjectURL(blob));
          } else {
            setError('Échec de la conversion de l\'image.');
          }
          setIsProcessing(false);
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => {
      setError('Erreur lors du chargement de l\'image.');
      setIsProcessing(false);
    };
    img.src = preview;
  }, [image, preview, quality]);

  const handleDownload = () => {
    if (!converted) return;
    const link = document.createElement('a');
    link.href = converted;
    link.download = `${image?.name.split('.')[0] || 'image'}.webp`;
    link.click();
  };

  const handleClear = () => {
    cleanup();
    setImage(null);
    setPreview(null);
    setConverted(null);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center relative group transition-all hover:border-indigo-500/50">
        {!preview ? (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto text-indigo-500 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Convertir en WebP</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Glissez une image ou cliquez pour parcourir.</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              aria-label="Choisir une image"
            />
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-center gap-12">
            <div className="space-y-4">
              <div className="text-xs font-black uppercase tracking-widest text-slate-400">Original</div>
              <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
              </div>
              <div className="text-xs font-bold text-slate-500">{(image!.size / 1024 / 1024).toFixed(2)} Mo</div>
            </div>

            <ArrowRight className="w-8 h-8 text-indigo-500 opacity-50 hidden md:block" />

            {converted ? (
              <div className="space-y-4 animate-in zoom-in-50 duration-300">
                <div className="text-xs font-black uppercase tracking-widest text-emerald-500">WebP</div>
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-800 border border-emerald-500/50">
                  <img src={converted} alt="Convertie" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs font-bold text-emerald-600">Prêt au téléchargement</div>
              </div>
            ) : (
              <div className="space-y-4 opacity-50">
                <div className="text-xs font-black uppercase tracking-widest text-slate-400">WebP</div>
                <div className="w-48 h-48 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
                  {isProcessing ? <Loader2 className="w-8 h-8 animate-spin text-indigo-500" /> : <FileCheck className="w-8 h-8" />}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {preview && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-8 bg-white dark:bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 shadow-xl shadow-indigo-500/5">
             <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="quality-range" className="text-sm font-bold text-slate-700 dark:text-slate-300">Qualité de compression</label>
                  <span className="text-xs font-mono font-bold text-indigo-500">{(quality * 100).toFixed(0)}%</span>
                </div>
                <input
                  id="quality-range"
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={convertToWebP}
                  disabled={isProcessing}
                  className="flex-grow flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileCheck className="w-5 h-5" />}
                  Convertir l'image
                </button>
                {converted && (
                  <button
                    onClick={handleDownload}
                    className="flex-grow flex items-center justify-center gap-3 px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-bold shadow-xl shadow-emerald-500/20 transition-all animate-in slide-in-from-bottom-2"
                  >
                    <Download className="w-5 h-5" />
                    Télécharger .webp
                  </button>
                )}
                <button
                  onClick={handleClear}
                  className="px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-[1.5rem] font-bold transition-all border border-slate-200 dark:border-slate-700"
                  aria-label="Effacer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
          </div>

          <div className="md:col-span-4 bg-indigo-600 rounded-[2.5rem] p-8 text-white space-y-6 shadow-xl shadow-indigo-600/10">
            <h3 className="text-xl font-black">Pourquoi WebP ?</h3>
            <ul className="space-y-4 text-sm font-medium text-indigo-100">
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</div>
                <span>Taille réduite jusqu'à 30% par rapport au JPEG</span>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</div>
                <span>Supporte la transparence (alpha)</span>
              </li>
              <li className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</div>
                <span>Chargement web beaucoup plus rapide</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-500 text-sm font-bold">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
