import { useState } from 'react';
import { Download, QrCode, Trash2, Settings, Info, Sparkles } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(300);

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

  const clear = () => {
    setText('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <AdPlaceholder size="banner" className="mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="qr-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Contenu du QR Code</label>
              <button
                onClick={clear}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <textarea
              id="qr-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Entrez du texte, une URL, un numéro de téléphone..."
              className="w-full h-48 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300"
            />
          </div>

          <div className="space-y-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4" /> Configuration
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold">
                <label htmlFor="qr-size">Taille de l'image</label>
                <span className="text-indigo-500">{size}x{size} px</span>
              </div>
              <input
                id="qr-size"
                type="range"
                min="100"
                max="1000"
                step="50"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center">
          {qrCodeUrl ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 rounded-[3rem] shadow-2xl shadow-indigo-500/5 text-center space-y-8 group animate-in zoom-in-95 duration-300">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-inner">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="mx-auto border-8 border-white dark:border-slate-900 rounded-lg shadow-sm w-48 h-48 sm:w-64 sm:h-64"
                />
              </div>
              <button
                onClick={downloadQRCode}
                className="w-full py-4 px-8 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95"
              >
                <Download className="w-6 h-6" />
                Télécharger (PNG)
              </button>
            </div>
          ) : (
            <div className="w-full aspect-square flex flex-col items-center justify-center p-12 border-4 border-dashed border-slate-100 dark:border-slate-800/50 rounded-[3rem] text-center text-slate-400">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center mb-6">
                <QrCode className="w-10 h-10 opacity-30" />
              </div>
              <h4 className="font-bold mb-2">En attente de contenu...</h4>
              <p className="text-sm">Remplissez le champ pour générer le code.</p>
            </div>
          )}
        </div>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Utilisation Universelle
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Créez des QR codes pour des URL, du texte libre, des identifiants Wi-Fi ou des informations de contact (vCard).
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-500" /> Rapide et Fiable
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Générez instantanément des codes haute résolution prêts à être imprimés ou partagés numériquement.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Sécurité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Nous n'enregistrons pas les données que vous encodez. Votre confidentialité est notre priorité absolue.
          </p>
        </div>
      </div>
    </div>
  );
}
