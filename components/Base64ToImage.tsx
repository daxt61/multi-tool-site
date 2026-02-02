import React, { useState } from 'react';
import { Copy, Check, Trash2, Image as ImageIcon, Download, AlertCircle } from 'lucide-react';

export function Base64ToImage() {
  const [base64, setBase64] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cleanBase64 = (str: string) => {
    return str.trim().replace(/^data:image\/[a-z]+;base64,/, '');
  };

  const getFullDataUrl = (str: string) => {
    if (str.startsWith('data:image/')) return str;
    // Attempt to detect format or default to png
    return `data:image/png;base64,${cleanBase64(str)}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = getFullDataUrl(base64);
    link.download = `image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Chaîne Base64</label>
          <button
            onClick={() => setBase64('')}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>
        <textarea
          value={base64}
          onChange={(e) => setBase64(e.target.value)}
          placeholder="Collez votre code Base64 d'image ici..."
          className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-xs leading-relaxed dark:text-slate-400 break-all resize-none"
        />
      </div>

      {base64 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Aperçu de l'image</label>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" /> Télécharger
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 flex items-center justify-center min-h-[300px] overflow-hidden">
            <img
              src={getFullDataUrl(base64)}
              alt="Aperçu Base64"
              className="max-w-full max-h-[500px] object-contain rounded-xl shadow-2xl"
              onError={() => setError('Chaîne Base64 invalide ou format d\'image non supporté')}
              onLoad={() => setError(null)}
            />
          </div>

          {error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>
      )}

      {!base64 && (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-4">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <ImageIcon className="w-8 h-8" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Collez une chaîne Base64 pour voir l'aperçu de l'image</p>
        </div>
      )}
    </div>
  );
}
