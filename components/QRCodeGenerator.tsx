import { useState } from 'react';
import { Download, QrCode, Settings, Palette, Check, Copy } from 'lucide-react';

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(300);
  const [color, setColor] = useState('#000000');
  const [bgcolor, setBgcolor] = useState('#ffffff');
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>('L');
  const [copied, setCopied] = useState(false);

  const cleanColor = (c: string) => c.replace('#', '');

  const qrCodeUrl = text 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${cleanColor(color)}&bgcolor=${cleanColor(bgcolor)}&ecc=${ecc}`
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
      console.error('Erreur lors du téléchargement du QR Code:', error);
    }
  };

  const copyUrl = () => {
    if (!qrCodeUrl) return;
    navigator.clipboard.writeText(qrCodeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input and Settings */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte ou URL à encoder</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Entrez du texte, une URL..."
                className="w-full h-32 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none font-medium dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Couleur QR
                </label>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 bg-transparent font-mono font-bold text-sm outline-none dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Arrière-plan
                </label>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                  <input
                    type="color"
                    value={bgcolor}
                    onChange={(e) => setBgcolor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                  />
                  <input
                    type="text"
                    value={bgcolor}
                    onChange={(e) => setBgcolor(e.target.value)}
                    className="flex-1 bg-transparent font-mono font-bold text-sm outline-none dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
             <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Settings className="w-3 h-3" /> Taille
                </label>
                <span className="text-sm font-black font-mono text-indigo-600">{size}x{size}px</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Correction d'erreur (ECC)</label>
              <div className="grid grid-cols-4 gap-2">
                {(['L', 'M', 'Q', 'H'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setEcc(level)}
                    className={`py-2 rounded-xl text-xs font-black transition-all border ${
                      ecc === level
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview and Actions */}
        <div className="flex flex-col gap-6">
          <div className="flex-grow bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] flex flex-col items-center justify-center space-y-8 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
            {text ? (
              <div className="relative animate-in zoom-in duration-500">
                <div className="absolute -inset-4 bg-white rounded-[2rem] opacity-10 blur-2xl group-hover:opacity-20 transition-opacity"></div>
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="relative z-10 w-full max-w-[250px] aspect-square rounded-2xl shadow-2xl border-4 border-white dark:border-slate-800"
                />
              </div>
            ) : (
              <div className="text-center space-y-4 py-20">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto">
                  <QrCode className="w-10 h-10 text-white/20" />
                </div>
                <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Aperçu en attente</p>
              </div>
            )}

            <div className="w-full flex flex-col sm:flex-row gap-3">
              <button
                onClick={downloadQRCode}
                disabled={!text}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
              >
                <Download className="w-4 h-4" /> Télécharger (PNG)
              </button>
              <button
                onClick={copyUrl}
                disabled={!text}
                className={`px-6 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                } disabled:opacity-50`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié' : 'Copier URL'}
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm mb-2 flex items-center gap-2">
               Conseil d'utilisation
            </h4>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
              Pour une meilleure scannabilité, assurez-vous de maintenir un contraste élevé entre la couleur du QR et celle de l'arrière-plan. Le niveau de correction H permet de scanner le code même s'il est partiellement endommagé.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
