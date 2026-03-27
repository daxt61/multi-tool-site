import { useState } from 'react';
import { Download, Trash2, QrCode, Info } from 'lucide-react';

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(256);

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
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Configuration */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="qr-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte ou URL à encoder</label>
              <button
                onClick={handleClear}
                disabled={!text}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-full transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Effacer le texte"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <textarea
              id="qr-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Entrez du texte, une URL, un numéro de téléphone..."
              className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="qr-size" className="text-xs font-black uppercase tracking-widest text-slate-400">Taille: {size}x{size} px</label>
            </div>
            <input
              id="qr-size"
              type="range"
              min="128"
              max="1024"
              step="64"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              <span>Petit</span>
              <span>Moyen</span>
              <span>Grand</span>
            </div>
          </div>
        </div>

        {/* Prévisualisation */}
        <div className="flex flex-col items-center justify-center space-y-6">
          {qrCodeUrl ? (
            <div className="p-8 bg-white dark:bg-white rounded-[2.5rem] shadow-xl shadow-indigo-500/5 border border-slate-100 animate-in zoom-in-95 duration-300">
              <img
                src={qrCodeUrl}
                alt="QR Code généré"
                className="w-full max-w-[256px] h-auto"
                style={{ width: '256px', height: '256px' }}
              />
            </div>
          ) : (
            <div className="w-full aspect-square max-w-[320px] bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 gap-4">
              <QrCode className="w-12 h-12 opacity-20" />
              <p className="text-sm font-bold text-center px-8">Entrez du texte pour générer un QR Code</p>
            </div>
          )}

          {text && (
            <button
              onClick={downloadQRCode}
              className="w-full max-w-[320px] py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <Download className="w-5 h-5" />
              Télécharger PNG
            </button>
          )}
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Saisissez simplement votre texte ou votre URL dans la zone de texte. Le QR Code se mettra à jour automatiquement. Vous pouvez ensuite ajuster la taille avant de le télécharger.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <QrCode className="w-4 h-4 text-indigo-500" /> Types de données
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Vous pouvez encoder des URLs, des adresses e-mail, des numéros de téléphone, des messages texte ou même des configurations Wi-Fi simples.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-500" /> Confidentialité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Bien que nous utilisions une API externe pour la génération du QR Code, aucune donnée n'est stockée sur nos serveurs. La génération est directe et éphémère.
          </p>
        </div>
      </div>
    </div>
  );
}
