import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Download, Trash2, Info, Loader2, Check } from 'lucide-react';

interface ConversionResult {
  id: string;
  originalName: string;
  originalSize: number;
  newSize: number;
  dataUrl: string;
  status: 'done' | 'error';
}

export function ImageToWebP() {
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quality, setQuality] = useState(0.8);
  const resultsRef = useRef<ConversionResult[]>([]);

  // Update resultsRef whenever results changes to manage Object URLs correctly
  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  // Clean up Object URLs on unmount
  useEffect(() => {
    return () => {
      resultsRef.current.forEach(result => {
        if (result.dataUrl.startsWith('blob:')) {
          URL.revokeObjectURL(result.dataUrl);
        }
      });
    };
  }, []);

  const processImage = useCallback(async (file: File): Promise<ConversionResult> => {
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
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Failed to convert to WebP'));
              return;
            }
            const dataUrl = URL.createObjectURL(blob);
            resolve({
              id: Math.random().toString(36).substr(2, 9),
              originalName: file.name.replace(/\.[^/.]+$/, ""),
              originalSize: file.size,
              newSize: blob.size,
              dataUrl,
              status: 'done'
            });
          }, 'image/webp', quality);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }, [quality]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    const newResults: ConversionResult[] = [];

    for (const file of files) {
      try {
        const result = await processImage(file);
        newResults.push(result);
      } catch (error) {
        console.error('Conversion failed:', error);
      }
    }

    setResults(prev => [...newResults, ...prev]);
    setIsProcessing(false);
    // Reset input
    e.target.value = '';
  };

  const removeResult = (id: string) => {
    setResults(prev => {
      const result = prev.find(r => r.id === id);
      if (result && result.dataUrl.startsWith('blob:')) {
        URL.revokeObjectURL(result.dataUrl);
      }
      return prev.filter(r => r.id !== id);
    });
  };

  const clearAll = () => {
    results.forEach(r => {
      if (r.dataUrl.startsWith('blob:')) URL.revokeObjectURL(r.dataUrl);
    });
    setResults([]);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload and Settings Area */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm space-y-8">
            <h3 className="font-bold flex items-center gap-2 dark:text-white uppercase tracking-wider text-xs">
              <ImageIcon className="w-5 h-5 text-indigo-500" /> Configuration
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
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
                className="w-full accent-indigo-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="relative group">
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center space-y-4 group-hover:border-indigo-500/50 group-hover:bg-indigo-50/10 dark:group-hover:bg-indigo-900/10 transition-all">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto text-indigo-500">
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold dark:text-white">Ajouter des images</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG, JPEG</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl space-y-3 border border-indigo-100 dark:border-indigo-900/30">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" /> Performance
            </h4>
            <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed">
              WebP offre une compression supérieure (jusqu'à 30% plus léger que le JPEG) tout en conservant une excellente qualité visuelle.
            </p>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold flex items-center gap-2 dark:text-white uppercase tracking-wider text-xs">
              <ImageIcon className="w-5 h-5 text-indigo-500" /> Files ({results.length})
            </h3>
            {results.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Effacer tout
              </button>
            )}
          </div>

          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-slate-400">
                <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">Aucune image convertie</p>
              </div>
            ) : (
              results.map((result) => (
                <div key={result.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center gap-6 group hover:border-indigo-500/30 transition-all shadow-sm">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-800 flex-shrink-0 border border-slate-100 dark:border-slate-800">
                    <img src={result.dataUrl} alt={result.originalName} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold dark:text-white truncate mb-1">{result.originalName}.webp</p>
                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="text-slate-400 line-through">{formatSize(result.originalSize)}</span>
                      <span className="text-emerald-500">{formatSize(result.newSize)}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-md">
                        -{Math.round((1 - result.newSize / result.originalSize) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={result.dataUrl}
                      download={`${result.originalName}.webp`}
                      className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      title="Télécharger"
                      aria-label="Télécharger l'image"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => removeResult(result.id)}
                      className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
