import { useState, useEffect } from "react";
import { Image as ImageIcon, Download, Trash2, Copy, Check, Info, FileImage, ShieldCheck } from "lucide-react";

export function Base64ToImage() {
  const [base64String, setBase64String] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null);

  useEffect(() => {
    if (!base64String.trim()) {
      setPreviewUrl(null);
      setDetectedFormat(null);
      return;
    }

    const cleanString = base64String.trim();

    // Detect format if no data prefix
    if (!cleanString.startsWith('data:image/')) {
      const firstChar = cleanString.charAt(0);
      let format = 'png'; // Default
      if (firstChar === '/') format = 'jpeg';
      else if (firstChar === 'i') format = 'png';
      else if (firstChar === 'R') format = 'gif';
      else if (firstChar === 'U') format = 'webp';

      setDetectedFormat(format);
      setPreviewUrl(`data:image/${format};base64,${cleanString}`);
    } else {
      const match = cleanString.match(/^data:image\/(\w+);base64,/);
      setDetectedFormat(match ? match[1] : 'unknown');
      setPreviewUrl(cleanString);
    }
  }, [base64String]);

  const handleDownload = () => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `image-decodee.${detectedFormat || 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    if (!previewUrl) return;
    navigator.clipboard.writeText(previewUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Chaîne Base64</label>
            <button
              onClick={() => setBase64String("")}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={base64String}
            onChange={(e) => setBase64String(e.target.value)}
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-slate-300"
            placeholder="Collez votre chaîne Base64 ici (avec ou sans préfixe data:image/...)"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Aperçu de l'image</label>
            <div className="flex gap-4">
              <button
                onClick={handleCopy}
                disabled={!previewUrl}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'} disabled:opacity-30`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                Copier l'URI
              </button>
              <button
                onClick={handleDownload}
                disabled={!previewUrl}
                className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors disabled:opacity-30"
              >
                <Download className="w-3 h-3" /> Télécharger
              </button>
            </div>
          </div>
          <div className="w-full h-[400px] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] flex items-center justify-center overflow-hidden relative group">
            {previewUrl ? (
              <>
                <img src={previewUrl} alt="Aperçu" className="max-w-full max-h-full object-contain shadow-2xl" />
                {detectedFormat && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                    Format: {detectedFormat}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center space-y-4 text-slate-300 dark:text-slate-700">
                <ImageIcon className="w-16 h-16 mx-auto opacity-20" />
                <p className="text-sm font-bold">L'image apparaîtra ici</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Educational Section */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-12 mt-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Tout savoir sur le Base64</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              Le Base64 est un format d'encodage universel utilisé pour transformer des données binaires (comme des images) en texte ASCII.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500 mb-4">
                <FileImage className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Data URI</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Un URI de données permet d'inclure des fichiers directement dans le code HTML ou CSS, réduisant ainsi le nombre de requêtes HTTP nécessaires au chargement d'une page.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500 mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Usage Sécurisé</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Notre outil décode vos images localement. C'est idéal pour prévisualiser des ressources graphiques sans les uploader sur un serveur tiers.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500 mb-4">
                <Info className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Performance</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Attention : l'encodage Base64 augmente la taille du fichier d'environ 33% par rapport au binaire original. À utiliser avec parcimonie pour les icônes légères.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
