import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Copy, Check, Trash2, FileCode } from 'lucide-react';

export function FileToBase64() {
  const [base64, setBase64] = useState('');
  const [isImage, setIsImage] = useState(false);
  const [hasFile, setHasFile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setBase64(result);
      setIsImage(file.type.startsWith('image/'));
      setHasFile(true);
      setFileInfo({
        name: file.name,
        size: (file.size / 1024).toFixed(2) + ' KB',
        type: file.type || 'application/octet-stream'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(base64);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setBase64('');
    setIsImage(false);
    setHasFile(false);
    setFileInfo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {!hasFile ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-16 text-center hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all cursor-pointer group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all">
            <Upload className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-black mb-2 dark:text-white">Glissez un fichier ici</h3>
          <p className="text-slate-500 dark:text-slate-400">ou cliquez pour parcourir vos fichiers</p>
          <p className="text-xs font-bold text-slate-400 mt-8 uppercase tracking-widest">Tous types de fichiers supportés (Max 5MB)</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
              <div className="aspect-square relative flex items-center justify-center bg-white dark:bg-slate-950 p-4">
                {isImage ? (
                  <img src={base64} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-slate-300">
                    <FileCode className="w-20 h-20" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 text-center px-4">Aperçu non disponible pour ce type de fichier</span>
                  </div>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom du fichier</div>
                  <div className="text-sm font-bold truncate dark:text-slate-200">{fileInfo?.name}</div>
                </div>
                <div className="flex justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taille</div>
                    <div className="text-sm font-bold dark:text-slate-200">{fileInfo?.size}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Format</div>
                    <div className="text-sm font-bold dark:text-slate-200">{fileInfo?.type.split('/')[1].toUpperCase()}</div>
                  </div>
                </div>
                <button
                  onClick={handleClear}
                  className="w-full py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-sm hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Changer de fichier
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <FileCode className="w-4 h-4" /> Chaîne Base64
              </h3>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié !' : 'Copier le code'}
              </button>
            </div>
            <div className="relative group">
              <textarea
                readOnly
                value={base64}
                className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] font-mono text-[10px] leading-relaxed resize-none outline-none focus:ring-2 focus:ring-indigo-500/20 break-all dark:text-slate-400"
              />
              <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                {base64.length.toLocaleString()} caractères
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <FileCode className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">Pourquoi utiliser l'encodage Base64 ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'encodage Base64 permet de convertir des données binaires en texte ASCII.
            C'est particulièrement utile pour intégrer des fichiers (images, polices, petits documents) directement dans du code HTML, CSS ou JSON sans avoir besoin de fichiers séparés.
            Cela peut réduire le nombre de requêtes HTTP et simplifier le transport de données binaires dans des formats textuels.
          </p>
        </div>
      </div>
    </div>
  );
}
