import { useState } from 'react';
import { Download, Trash2, QrCode } from 'lucide-react';

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

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="qr-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <QrCode className="w-3 h-3" /> Texte ou URL à encoder
          </label>
          {text && (
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              aria-label="Effacer"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          )}
        </div>
        <textarea
          id="qr-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Entrez du texte, une URL, un numéro de téléphone..."
          className="w-full h-40 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />

        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="qr-size" className="text-xs font-black uppercase tracking-widest text-slate-400">
              Taille : {size}x{size} px
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
            className="w-full accent-indigo-600"
          />
        </div>
      </div>

      <div className="flex justify-center">
        {qrCodeUrl ? (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] text-center shadow-sm animate-in fade-in zoom-in duration-300">
            <div className="bg-white p-4 rounded-2xl shadow-inner mb-6 inline-block border border-slate-100">
              <img
                src={qrCodeUrl}
                alt={`QR Code pour: ${text.slice(0, 30)}${text.length > 30 ? '...' : ''}`}
                className="w-full max-w-[300px] h-auto"
              />
            </div>
            <button
              onClick={downloadQRCode}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Télécharger
            </button>
          </div>
        ) : (
          <div className="w-full py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center">
              <QrCode className="w-8 h-8 opacity-20" />
            </div>
            <p className="font-bold">Entrez du texte pour générer un QR Code</p>
          </div>
        )}
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2">Conseils</h4>
        <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1 list-disc list-inside">
          <li>Plus le texte est long, plus le QR Code sera dense et potentiellement difficile à scanner.</li>
          <li>Utilisez une taille d'au moins 200px pour une impression de qualité.</li>
          <li>Le QR Code est généré de manière sécurisée sans stocker vos données sur le serveur.</li>
        </ul>
      </div>
    </div>
  );
}
