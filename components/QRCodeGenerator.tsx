import { useState } from 'react';
import { Download } from 'lucide-react';

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(200);

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
      link.download = `qrcode-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR Code:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="qr-text" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                Texte ou URL à encoder
              </label>
              <textarea
                id="qr-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Entrez du texte, une URL, un numéro de téléphone..."
                className="w-full h-40 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white resize-none"
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
                max="1000"
                step="50"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
            {text ? (
              <div className="space-y-6 text-center">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xl inline-block">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-full max-w-[300px] h-auto"
                  />
                </div>
                <button
                  onClick={downloadQRCode}
                  className="w-full py-4 px-8 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 font-black active:scale-95"
                >
                  <Download className="w-5 h-5" />
                  Télécharger
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 p-8">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                  <Download className="w-10 h-10" />
                </div>
                <p className="text-slate-400 font-bold">
                  Entrez du texte pour générer un QR Code
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
