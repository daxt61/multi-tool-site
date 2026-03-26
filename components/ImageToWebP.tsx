import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Download, Trash2, Check } from 'lucide-react';

interface ConversionResult {
  id: string;
  originalName: string;
  originalSize: number;
  webpUrl: string;
  webpSize: number;
  status: 'converting' | 'completed' | 'error';
}

export function ImageToWebP() {
  const [results, setResults] = useState<ConversionResult[]>([]);
  const resultsRef = useRef<ConversionResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync ref with state for cleanup
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  // Memory management: Revoke Object URLs on unmount
  useEffect(() => {
    return () => {
      resultsRef.current.forEach(result => {
        if (result.webpUrl) URL.revokeObjectURL(result.webpUrl);
      });
    };
  }, []);

  const convertToWebP = async (file: File): Promise<ConversionResult> => {
    const id = Math.random().toString(36).substr(2, 9);

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              id,
              originalName: file.name,
              originalSize: file.size,
              webpUrl: '',
              webpSize: 0,
              status: 'error'
            });
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const webpUrl = URL.createObjectURL(blob);
              resolve({
                id,
                originalName: file.name,
                originalSize: file.size,
                webpUrl,
                webpSize: blob.size,
                status: 'completed'
              });
            } else {
              resolve({
                id,
                originalName: file.name,
                originalSize: file.size,
                webpUrl: '',
                webpSize: 0,
                status: 'error'
              });
            }
          }, 'image/webp', 0.8);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newResults: ConversionResult[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      originalName: file.name,
      originalSize: file.size,
      webpUrl: '',
      webpSize: 0,
      status: 'converting'
    }));

    setResults(prev => [...prev, ...newResults]);

    for (let i = 0; i < files.length; i++) {
      const result = await convertToWebP(files[i]);
      setResults(prev => prev.map(r => r.originalName === result.originalName && r.status === 'converting' ? result : r));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeResult = (id: string) => {
    setResults(prev => {
      const filtered = prev.filter(r => {
        if (r.id === id) {
          URL.revokeObjectURL(r.webpUrl);
          return false;
        }
        return true;
      });
      return filtered;
    });
  };

  const clearAll = () => {
    results.forEach(r => URL.revokeObjectURL(r.webpUrl));
    setResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="group cursor-pointer bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-12 text-center hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all shadow-sm">
          <Upload className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold mb-2">Cliquez ou glissez vos images ici</h3>
        <p className="text-slate-500 dark:text-slate-400">Supporte PNG, JPG, JPEG et autres formats d'image</p>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Résultats</h3>
            <button
              onClick={clearAll}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Tout effacer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((result) => (
              <div key={result.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 group">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                  {result.status === 'completed' ? (
                    <img src={result.webpUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <h4 className="font-bold text-sm truncate dark:text-white">{result.originalName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 line-through">{formatSize(result.originalSize)}</span>
                    {result.status === 'completed' && (
                      <span className="text-xs font-bold text-emerald-500">
                        {formatSize(result.webpSize)} (-{Math.round((1 - result.webpSize / result.originalSize) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {result.status === 'completed' ? (
                    <>
                      <a
                        href={result.webpUrl}
                        download={result.originalName.replace(/\.[^/.]+$/, "") + ".webp"}
                        className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
                        aria-label="Télécharger en WebP"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => removeResult(result.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : result.status === 'converting' ? (
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-xs font-bold text-rose-500">Erreur</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20">
        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">Pourquoi WebP ?</h3>
        <p className="text-indigo-900/70 dark:text-indigo-300/70 leading-relaxed text-sm">
          Le format WebP offre une compression supérieure pour les images sur le web. En moyenne, les images WebP sont <strong>25% à 35% plus légères</strong> que les formats JPEG ou PNG équivalents, tout en conservant une qualité visuelle identique. Cela permet d'accélérer le chargement de vos pages web et de réduire la consommation de bande passante.
        </p>
      </div>
    </div>
  );
}
