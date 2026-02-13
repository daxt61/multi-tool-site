import { useState } from 'react';
import { Download, QrCode, Trash2, Settings, Palette } from 'lucide-react';

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(250);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}-${g}-${b}`;
  };

  const qrCodeUrl = text 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${hexToRgb(fgColor)}&bgcolor=${hexToRgb(bgColor)}`
    : '';

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    fetch(qrCodeUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'qrcode.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Contenu du QR Code</label>
              <button
                onClick={() => setText('')}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Entrez du texte, une URL, un numéro..."
              className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
            />
          </div>

          <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-8">
            <div className="flex items-center gap-3 text-indigo-500">
              <Settings className="w-5 h-5" />
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Options</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Taille: {size}px</label>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Couleur QR</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                    />
                    <span className="text-sm font-bold font-mono">{fgColor.toUpperCase()}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Couleur Fond</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                    />
                    <span className="text-sm font-bold font-mono">{bgColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prévisualisation */}
        <div className="flex flex-col items-center justify-center space-y-8">
          {text ? (
            <div className="bg-white p-12 rounded-[3rem] shadow-2xl shadow-indigo-500/10 border border-slate-100 relative group transition-transform hover:scale-[1.02]">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-64 h-64 md:w-80 md:h-80 object-contain"
              />
              <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors rounded-[3rem] pointer-events-none" />
            </div>
          ) : (
            <div className="w-64 h-64 md:w-80 md:h-80 bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 space-y-4">
              <QrCode className="w-16 h-16 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-40">En attente de texte</p>
            </div>
          )}

          {text && (
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
              <button
                onClick={downloadQRCode}
                className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <Download className="w-6 h-6" />
                Télécharger
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
