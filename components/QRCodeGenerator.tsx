import { useState } from 'react';
import { Download, QrCode, Trash2 } from 'lucide-react';

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
    setSize(200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="qr-text" className="text-xs font-black uppercase tracking-widest text-slate-400">
            Texte ou URL à encoder
          </label>
          {text && (
            <button
              onClick={handleClear}
              className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
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
          className="w-full h-40 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="qr-size" className="text-xs font-black uppercase tracking-widest text-slate-400">
                Taille
              </label>
              <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{size}x{size} px</span>
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

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Le code QR sera généré instantanément pendant que vous tapez. Vous pouvez ajuster la taille pour une meilleure résolution avant le téléchargement.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center">
          {qrCodeUrl ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-indigo-500/5 text-center w-full">
              <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-inner">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="mx-auto"
                />
              </div>
              <button
                onClick={downloadQRCode}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-6 h-6" />
                Télécharger
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-12 text-center w-full flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">Prêt à générer</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Entrez du texte ci-dessus pour voir votre QR Code apparaître ici.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
