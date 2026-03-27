import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Trash2, Image as ImageIcon, Info, Zap, ShieldCheck } from 'lucide-react';

export function ImageToWebP() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [webpImage, setWebpImage] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [originalSize, setOriginalSize] = useState(0);
  const [webpSize, setWebpSize] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<{ url: string }[]>([]);

  const convertToWebP = (img: HTMLImageElement, q: number) => {
    setIsConverting(true);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsConverting(false);
      return;
    }

    ctx.drawImage(img, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setWebpSize(blob.size);
          const url = URL.createObjectURL(blob);
          setWebpImage(url);
          resultsRef.current.push({ url });
        }
        setIsConverting(false);
      },
      'image/webp',
      q / 100
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOriginalSize(file.size);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setOriginalImage(event.target?.result as string);
        convertToWebP(img, quality);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleQualityChange = (newQuality: number) => {
    setQuality(newQuality);
    if (originalImage) {
      const img = new Image();
      img.onload = () => convertToWebP(img, newQuality);
      img.src = originalImage;
    }
  };

  const downloadImage = () => {
    if (!webpImage) return;
    const link = document.createElement('a');
    link.href = webpImage;
    link.download = 'image-convertie.webp';
    link.click();
  };

  const handleClear = () => {
    setOriginalImage(null);
    setWebpImage(null);
    setOriginalSize(0);
    setWebpSize(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // Cleanup will be handled by useEffect or when new results are added
  };

  useEffect(() => {
    return () => {
      // Cleanup all created Object URLs on unmount
      resultsRef.current.forEach(result => URL.revokeObjectURL(result.url));
    };
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const reductionRate = originalSize > 0 ? ((1 - webpSize / originalSize) * 100).toFixed(1) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <input
        ref={fileInputRef}
        id="image-upload-webp"
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {!originalImage ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50 dark:bg-slate-900/50 hover:border-indigo-500/50 hover:bg-indigo-50/10 transition-all cursor-pointer overflow-hidden"
        >
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all shadow-sm">
            <Upload className="w-10 h-10" />
          </div>
          <p className="mt-8 text-2xl font-black tracking-tight dark:text-white text-center">
            Cliquez pour convertir une image en WebP
          </p>
          <p className="mt-2 text-slate-500 font-bold uppercase tracking-widest text-xs">JPG, PNG, GIF → WEBP</p>

          <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2.5rem]">
            <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="webp-quality" className="text-xs font-black uppercase tracking-widest text-slate-400">Qualité WebP: {quality}%</label>
                {isConverting && <span className="text-[10px] font-bold text-indigo-500 animate-pulse">CONVERSION...</span>}
              </div>
              <input
                id="webp-quality"
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
                className="p-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-2xl hover:bg-rose-100 transition-all"
                title="Effacer"
              >
                <Trash2 className="w-6 h-6" />
              </button>
              <button
                onClick={downloadImage}
                disabled={!webpImage}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-6 h-6" />
                Télécharger WebP
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Original</h3>
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
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Résultat WebP</h3>
              <div className="relative group rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 min-h-[200px] flex items-center justify-center">
                {webpImage ? (
                  <>
                    <img src={webpImage} alt="WebP Result" className="w-full h-auto object-contain max-h-[500px]" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-lg">
                        <Zap className="w-3 h-3" /> {formatFileSize(webpSize)}
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full text-xs font-bold shadow-lg">
                        {Number(reductionRate) > 0 ? `-${reductionRate}%` : `+${Math.abs(Number(reductionRate))}%`}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="animate-pulse flex flex-col items-center gap-2 text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-xs font-bold uppercase tracking-widest">Conversion en cours...</p>
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
            <Zap className="w-4 h-4 text-indigo-500" /> Pourquoi le WebP ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le format WebP offre une compression supérieure (environ 30% de moins que le JPEG) tout en conservant une excellente qualité visuelle et le support de la transparence.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Sécurité des données
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Comme pour tous nos outils d'image, le traitement est 100% local. Vos fichiers ne sont jamais téléchargés sur nos serveurs.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Conseils d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Une qualité de 80% est généralement le compromis idéal entre poids du fichier et fidélité visuelle pour le web.
          </p>
        </div>
      </div>
    </div>
  );
}
