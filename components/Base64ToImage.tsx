import { useState } from 'react';
import { Download, ImageIcon, Trash2, FileCode, Check, Copy, AlertCircle } from 'lucide-react';

export function Base64ToImage() {
  const [base64, setBase64] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBase64Change = (value: string) => {
    setBase64(value);
    setError(null);

    if (!value.trim()) {
      setImagePreview(null);
      return;
    }

    // Attempt to normalize the base64 string
    let normalized = value.trim();
    if (!normalized.startsWith('data:image/')) {
      // Try to guess format or default to png
      normalized = `data:image/png;base64,${normalized}`;
    }

    const img = new Image();
    img.onload = () => {
      setImagePreview(normalized);
      setError(null);
    };
    img.onerror = () => {
      setImagePreview(null);
      setError('Chaîne Base64 invalide ou format d\'image non supporté.');
    };
    img.src = normalized;
  };

  const handleDownload = () => {
    if (!imagePreview) return;
    const link = document.createElement('a');
    const extension = imagePreview.split(';')[0].split('/')[1] || 'png';
    link.download = `decoded-image-${Date.now()}.${extension}`;
    link.href = imagePreview;
    link.click();
  };

  const handleClear = () => {
    setBase64('');
    setImagePreview(null);
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Code Base64</label>
            </div>
            <button
              onClick={handleClear}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={base64}
            onChange={(e) => handleBase64Change(e.target.value)}
            placeholder="Collez votre code Base64 ici (avec ou sans préfixe data:image/...)"
            className="w-full h-[450px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-[10px] leading-relaxed dark:text-slate-300 resize-none break-all"
          />
        </div>

        {/* Preview Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Aperçu de l'image</label>
            </div>
            {imagePreview && (
              <button
                onClick={handleDownload}
                className="text-xs font-bold px-4 py-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/10"
              >
                <Download className="w-3.5 h-3.5" /> Télécharger
              </button>
            )}
          </div>

          <div className="w-full h-[450px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-center overflow-hidden relative group">
            {error ? (
              <div className="flex flex-col items-center gap-3 text-rose-500 p-8 text-center">
                <AlertCircle className="w-12 h-12 opacity-20" />
                <p className="text-sm font-bold">{error}</p>
              </div>
            ) : imagePreview ? (
              <div className="p-8 w-full h-full flex items-center justify-center">
                <img
                  src={imagePreview}
                  alt="Decoded"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-300 dark:text-slate-700">
                <ImageIcon className="w-16 h-16" />
                <p className="font-bold uppercase tracking-widest text-xs">En attente de code...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4">À propos du décodage Base64</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Cet outil vous permet de transformer une chaîne de caractères encodée en Base64 en une image visualisable et téléchargeable.
          Il accepte les formats avec ou sans l'en-tête <code>data:image/...;base64,</code>.
          Tous les traitements sont effectués localement dans votre navigateur pour garantir votre confidentialité.
        </p>
      </div>
    </div>
  );
}
