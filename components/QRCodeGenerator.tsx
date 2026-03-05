import { useState } from 'react';
import { Download, QrCode, Trash2, Settings2, Image as ImageIcon } from 'lucide-react';

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(300);
  const [margin, setMargin] = useState(1);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [downloading, setDownloading] = useState(false);

  // Using a more reliable QR API with more options
  const qrCodeUrl = text 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&margin=${margin}&color=${fgColor.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}`
    : '';

  const downloadQRCode = async () => {
    if (!qrCodeUrl) return;
    setDownloading(true);
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
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Configuration</h3>
            </div>

            <div className="space-y-4">
              <label htmlFor="qr-input" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Texte ou URL
              </label>
              <textarea
                id="qr-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Entrez du texte, une URL, un numéro de téléphone..."
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl resize-none h-32 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Taille ({size}px)
                </label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Marge ({margin})
                </label>
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Couleur QR
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border-0 p-0 overflow-hidden cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Fond
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border-0 p-0 overflow-hidden cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setText('')}
              className="w-full py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Réinitialiser
            </button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex-1 flex flex-col items-center justify-center p-12 min-h-[400px]">
            {text ? (
              <div className="space-y-8 text-center animate-in fade-in zoom-in duration-300">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-indigo-500/10 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="relative mx-auto rounded-2xl shadow-2xl border-4 border-white dark:border-slate-800 max-w-full h-auto"
                    style={{ width: Math.min(size, 400) }}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500">Prêt à être téléchargé</p>
                  <button
                    onClick={downloadQRCode}
                    disabled={downloading}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 mx-auto disabled:opacity-50"
                  >
                    {downloading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Download className="w-6 h-6" />
                    )}
                    {downloading ? 'Téléchargement...' : 'Télécharger PNG'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 max-w-sm">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
                  <QrCode className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">Générateur de QR Code</h4>
                  <p className="text-slate-500 dark:text-slate-400">Entrez du texte ou une URL à gauche pour voir l'aperçu de votre QR Code en temps réel.</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-indigo-600 rounded-3xl p-6 text-white flex items-center gap-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold">Haute résolution</h5>
              <p className="text-indigo-100 text-sm">Générez des codes jusqu'à 1000x1000 pixels pour une impression parfaite.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
