import { useState, useCallback } from 'react';
import { Download, QrCode, Trash2 } from 'lucide-react';

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(200);

  const qrCodeUrl = text 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`
    : '';

  const downloadQRCode = useCallback(async () => {
    if (!qrCodeUrl) return;
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
    }
  }, [qrCodeUrl]);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="relative">
        <label htmlFor="qr-text" className="block text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">
          Texte ou URL à encoder
        </label>
        <textarea
          id="qr-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez du texte, une URL, un numéro de téléphone..."
          className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] resize-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-lg"
        />
        {text && (
          <button
            onClick={() => setText('')}
            className="absolute top-10 right-4 p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
            aria-label="Effacer"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex justify-between items-center">
          <label htmlFor="qr-size" className="text-sm font-bold text-slate-700 dark:text-slate-300">Taille: {size}x{size} px</label>
        </div>
        <input
          id="qr-size"
          type="range"
          min="100"
          max="500"
          step="50"
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
        />
      </div>

      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900/40 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px]">
        {text ? (
          <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
            <div className="p-4 bg-white rounded-3xl shadow-2xl mb-8 border border-slate-100">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-full h-auto"
                style={{ width: size, height: size }}
              />
            </div>
            <button
              onClick={downloadQRCode}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-3"
            >
              <Download className="w-5 h-5" />
              Télécharger le QR Code
            </button>
          </div>
        ) : (
          <div className="text-center space-y-4 text-slate-400">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 dark:border-slate-700">
               <QrCode className="w-8 h-8" />
            </div>
            <p className="font-bold">Entrez du texte pour générer un QR Code</p>
          </div>
        )}
      </div>
    </div>
  );
}
