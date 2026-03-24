import { useState, useCallback, useEffect, useRef } from 'react';
import { Image as ImageIcon, Download, Upload, Trash2, Info, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

interface ConversionResult {
  url: string;
  name: string;
  originalSize: number;
  newSize: number;
}

export function ImageToWebP() {
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<ConversionResult[]>([]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  const convertImage = useCallback(async (file: File): Promise<ConversionResult> => {
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
            reject(new Error('Erreur de contexte canvas'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Erreur de conversion'));
              return;
            }
            const url = URL.createObjectURL(blob);
            resolve({
              url,
              name: file.name.replace(/\.[^/.]+$/, "") + ".webp",
              originalSize: file.size,
              newSize: blob.size,
            });
          }, 'image/webp', 0.85);
        };
        img.onerror = () => reject(new Error('Erreur de chargement image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erreur de lecture de fichier'));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsConverting(true);
    setError(null);

    try {
      const newResults = await Promise.all(files.map(convertImage));
      setResults(prev => [...prev, ...newResults]);
    } catch (err) {
      setError("Une erreur est survenue lors de la conversion des images.");
      console.error(err);
    } finally {
      setIsConverting(false);
      e.target.value = ''; // Reset input
    }
  };

  const removeResult = (index: number) => {
    setResults(prev => {
      const newResults = [...prev];
      URL.revokeObjectURL(newResults[index].url);
      newResults.splice(index, 1);
      return newResults;
    });
  };

  const clearAll = () => {
    results.forEach(r => URL.revokeObjectURL(r.url));
    setResults([]);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Cleanup Object URLs on unmount
  useEffect(() => {
    return () => {
      resultsRef.current.forEach(r => URL.revokeObjectURL(r.url));
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Upload Zone */}
      <div className="relative group">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-80 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer group-hover:border-indigo-500/50"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all shadow-xl shadow-indigo-500/5 mb-6">
              {isConverting ? <Loader2 className="w-10 h-10 animate-spin" /> : <Upload className="w-10 h-10" />}
            </div>
            <p className="mb-2 text-xl font-black tracking-tight dark:text-white">
              {isConverting ? 'Conversion en cours...' : 'Déposez vos images ici'}
            </p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              JPG, PNG, GIF vers WebP
            </p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={isConverting}
          />
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Images Converties ({results.length})</h3>
            <button
              onClick={clearAll}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
              aria-label="Tout effacer"
            >
              <Trash2 className="w-3 h-3" /> Tout effacer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result, idx) => (
              <div key={idx} className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex-shrink-0">
                    <img src={result.url} alt="Aperçu" className="w-full h-full object-cover" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-900 dark:text-white truncate text-sm" title={result.name}>{result.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono text-slate-400 line-through">{formatSize(result.originalSize)}</span>
                      <span className="text-xs font-mono text-emerald-500 font-bold">{formatSize(result.newSize)}</span>
                      <span className="text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded uppercase">
                        -{Math.round((1 - result.newSize / result.originalSize) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={result.url}
                    download={result.name}
                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    aria-label="Télécharger"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  <button
                    onClick={() => removeResult(idx)}
                    className="p-3 text-slate-400 hover:text-rose-500 transition-all"
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

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> WebP Moderne
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            WebP est un format d'image moderne qui offre une compression supérieure sans perte et avec perte pour les images sur le Web.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-500" /> Performance
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Réduisez la taille de vos images jusqu'à 80% tout en conservant une excellente qualité visuelle pour vos sites web.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Confidentialité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Toutes les conversions sont effectuées localement dans votre navigateur. Vos images ne quittent jamais votre ordinateur.
          </p>
        </div>
      </div>
    </div>
  );
}
