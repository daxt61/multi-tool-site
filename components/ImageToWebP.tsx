import React, { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon, Download, Trash2, Check, AlertCircle, Loader2, Info, FileImage } from 'lucide-react';

interface ConversionResult {
  id: string;
  originalName: string;
  originalSize: number;
  webpSize: number;
  webpUrl: string;
}

export function ImageToWebP() {
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<ConversionResult[]>([]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    return () => {
      // Cleanup Object URLs on unmount to prevent memory leaks
      resultsRef.current.forEach(result => URL.revokeObjectURL(result.webpUrl));
    };
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const convertToWebP = async (file: File): Promise<ConversionResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Impossible d\'obtenir le contexte canvas'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('La conversion a échoué'));
              return;
            }
            const webpUrl = URL.createObjectURL(blob);
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              originalName: file.name,
              originalSize: file.size,
              webpSize: blob.size,
              webpUrl: webpUrl
            });
          }, 'image/webp', 0.85); // 0.85 quality
        };
        img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const newResults = await Promise.all(
        files.filter(f => f.type.startsWith('image/')).map(convertToWebP)
      );
      setResults(prev => [...newResults, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la conversion');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const clearResults = () => {
    results.forEach(result => URL.revokeObjectURL(result.webpUrl));
    setResults([]);
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-12 rounded-[3rem] border border-slate-200 dark:border-slate-800 text-center space-y-8">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-500 mx-auto">
            <ImageIcon className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black dark:text-white">Image en WebP</h2>
            <p className="text-slate-500 dark:text-slate-400">Convertissez vos images (JPG, PNG) au format WebP ultra-léger instantanément.</p>
          </div>

          <div className="relative group">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={isProcessing}
            />
            <div className={`py-8 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl group-hover:border-indigo-500/50 group-hover:bg-indigo-50/30 dark:group-hover:bg-indigo-500/5 transition-all flex flex-col items-center gap-3 ${isProcessing ? 'opacity-50' : ''}`}>
              {isProcessing ? (
                <>
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-sm font-bold text-slate-500">Conversion en cours...</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <FileImage className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Cliquez ou glissez vos images ici</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PNG, JPG, WEBP jusqu'à 10MB</span>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="max-w-md mx-auto bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Résultats ({results.length})</h3>
            <button
              onClick={clearResults}
              className="text-xs font-bold text-rose-500 flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full hover:bg-rose-100 transition-all"
            >
              <Trash2 className="w-3 h-3" /> Tout effacer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result) => {
              const reduction = Math.round((1 - result.webpSize / result.originalSize) * 100);
              return (
                <div key={result.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-6 group hover:border-indigo-500/30 transition-all">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 relative">
                    <img src={result.webpUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate text-sm mb-1">{result.originalName}</div>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <span>{formatSize(result.webpSize)}</span>
                      {reduction > 0 && (
                        <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded">
                          -{reduction}%
                        </span>
                      )}
                    </div>
                  </div>
                  <a
                    href={result.webpUrl}
                    download={result.originalName.replace(/\.[^/.]+$/, "") + ".webp"}
                    className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    title="Télécharger WebP"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="pt-8 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Pourquoi WebP ?
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            WebP est un format d'image moderne qui offre une compression supérieure pour les images sur le web. Les images WebP sont environ 30% plus petites que les JPEG ou PNG équivalents, tout en conservant une excellente qualité visuelle.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500" /> Confidentialité
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Toutes les conversions sont effectuées localement dans votre navigateur. Vos images ne sont jamais téléchargées sur un serveur.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-500" /> Usage mobile
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Utiliser des images WebP permet de réduire drastiquement le temps de chargement de vos pages web, améliorant ainsi l'expérience utilisateur et le SEO.
          </p>
        </div>
      </div>
    </div>
  );
}
