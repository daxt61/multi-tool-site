import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(200);
  const [isDownloading, setIsDownloading] = useState(false);

  const qrCodeUrl = text 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`
    : '';

  const downloadQRCode = async () => {
    if (!qrCodeUrl || isDownloading) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="relative group">
            <div className="flex justify-between items-center mb-2 px-1">
              <label htmlFor="qr-input" className="text-sm font-bold text-slate-600 dark:text-slate-400">
                Texte ou URL à encoder
              </label>
              {text && (
                <button
                  onClick={handleClear}
                  className="text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 text-xs font-bold uppercase tracking-wider"
                  aria-label="Effacer le texte"
                >
                  <Trash2 className="w-3 h-3" />
                  Effacer
                </button>
              )}
            </div>
            <textarea
              id="qr-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Entrez du texte, une URL, un numéro de téléphone..."
              className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl resize-none h-48 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-900 dark:text-white"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="qr-size" className="text-xs font-black uppercase tracking-widest text-slate-400">
                Taille du QR Code
              </label>
              <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{size}x{size} px</span>
            </div>
            <input
              id="qr-size"
              type="range"
              min="100"
              max="1000"
              step="50"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 min-h-[400px]">
          {text ? (
            <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="p-4 bg-white rounded-[2rem] shadow-xl shadow-slate-200 dark:shadow-none border border-slate-100 dark:border-slate-800">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-full h-auto max-w-[300px] mx-auto rounded-xl"
                />
              </div>
              <button
                onClick={downloadQRCode}
                disabled={isDownloading}
                className="w-full py-4 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isDownloading ? (
                   <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-6 h-6" />
                )}
                Télécharger PNG
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4 text-slate-400">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Download className="w-10 h-10 opacity-20" />
              </div>
              <p className="font-bold">Générateur de QR Code</p>
              <p className="text-sm max-w-[200px]">Entrez du texte pour générer instantanément votre code.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
