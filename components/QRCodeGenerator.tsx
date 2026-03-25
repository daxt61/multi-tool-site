import { useState } from 'react';
import { Download, QrCode, Sliders, Info, Trash2 } from 'lucide-react';

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(250);

  const qrCodeUrl = text 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`
    : '';

  const downloadQRCode = async () => {
    if (!qrCodeUrl) return;
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qrcode.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm space-y-8">
            <h3 className="font-bold flex items-center gap-2 dark:text-white uppercase tracking-wider text-xs">
              <Sliders className="w-5 h-5 text-indigo-500" /> Configuration
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <span>Taille</span>
                <span className="text-indigo-500">{size}x{size}px</span>
              </div>
              <input
                type="range"
                min="100"
                max="500"
                step="50"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-indigo-600 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setText('')}
                disabled={!text}
                className="w-full py-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl font-bold text-rose-500 text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" /> Effacer tout
              </button>
            </div>
          </div>

          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl space-y-3 border border-indigo-100 dark:border-indigo-900/30">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-400 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Info className="w-4 h-4" /> Usage
            </h4>
            <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed">
              Les codes QR peuvent stocker des URLs, du texte simple, des informations de contact (vCard) ou des configurations Wi-Fi.
            </p>
          </div>
        </div>

        {/* Editor and Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <label htmlFor="qr-text" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Contenu du QR Code</label>
            <textarea
              id="qr-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Entrez une URL, un texte ou un numéro..."
              className="w-full p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 shadow-sm resize-none h-40"
            />
          </div>

          <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center space-y-8 shadow-sm min-h-[400px]">
            {text ? (
              <>
                <div className="p-4 bg-white rounded-3xl shadow-2xl shadow-indigo-500/10 border-8 border-slate-50 dark:border-slate-800">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-full h-full"
                    style={{ width: `${size}px`, height: `${size}px` }}
                  />
                </div>
                <button
                  onClick={downloadQRCode}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                >
                  <Download className="w-6 h-6" />
                  Télécharger le PNG
                </button>
              </>
            ) : (
              <div className="text-center space-y-4 opacity-30">
                <QrCode className="w-24 h-24 mx-auto text-slate-400" />
                <p className="font-bold text-slate-500 uppercase tracking-widest text-sm">En attente de contenu...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
