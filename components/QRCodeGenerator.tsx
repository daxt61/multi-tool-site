import { useState } from 'react';
import { Download, QrCode } from 'lucide-react';

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(200);

  const qrCodeUrl = text 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`
    : '';

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = 'qrcode.png';
    link.click();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="space-y-2">
          <label htmlFor="qr-input" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
            Texte ou URL à encoder
          </label>
          <textarea
            id="qr-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Entrez du texte, une URL, un numéro de téléphone..."
            className="w-full p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl resize-none h-40 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white leading-relaxed"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="qr-size" className="text-xs font-black uppercase tracking-widest text-slate-400">
              Taille: {size}x{size} px
            </label>
          </div>
          <input
            id="qr-size"
            type="range"
            min="100"
            max="500"
            step="50"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>
      </div>

      {qrCodeUrl ? (
        <div className="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-12 text-center space-y-8 shadow-sm">
          <div className="inline-block p-4 bg-white rounded-2xl shadow-xl border border-slate-100">
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="mx-auto"
              style={{ width: size, height: size }}
            />
          </div>
          <button
            onClick={downloadQRCode}
            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2 mx-auto"
          >
            <Download className="w-5 h-5" />
            Télécharger le QR Code
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-24 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-200 dark:text-slate-800">
            <QrCode className="w-8 h-8" />
          </div>
          <p className="text-slate-400 font-medium">Entrez du texte pour générer un QR Code</p>
        </div>
      )}
    </div>
  );
}
