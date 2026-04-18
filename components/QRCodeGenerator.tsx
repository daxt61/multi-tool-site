import { useState, useEffect } from 'react';
import { Download, Trash2, QrCode, Info, Palette, ShieldCheck } from 'lucide-react';

export function QRCodeGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [text, setText] = useState(initialData?.text || '');
  const [size, setSize] = useState(initialData?.size ?? 256);
  const [fgColor, setFgColor] = useState(initialData?.fgColor || '#000000');
  const [bgColor, setBgColor] = useState(initialData?.bgColor || '#FFFFFF');
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>(initialData?.ecc || 'L');

  useEffect(() => {
    onStateChange?.({ text, size, fgColor, bgColor, ecc });
  }, [text, size, fgColor, bgColor, ecc, onStateChange]);

  // Clean hex colors for API (remove #)
  const cleanFg = fgColor.replace('#', '');
  const cleanBg = bgColor.replace('#', '');

  const qrCodeUrl = text 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${cleanFg}&bgcolor=${cleanBg}&ecc=${ecc}`
    : '';

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qrcode-${Date.now()}.png`;
    link.click();
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Configuration */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="qr-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-indigo-500" /> Texte ou URL à encoder
                </label>
                <button
                  onClick={handleClear}
                  disabled={!text}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-full transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3 h-3" /> Effacer
                </button>
              </div>
              <textarea
                id="qr-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Entrez du texte, une URL, un numéro de téléphone..."
                className="w-full h-40 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colors */}
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <Palette className="w-4 h-4 text-indigo-500" /> Couleurs
                </label>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Module</div>
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-full h-12 rounded-xl cursor-pointer border-2 border-white dark:border-slate-700 shadow-sm"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fond</div>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full h-12 rounded-xl cursor-pointer border-2 border-white dark:border-slate-700 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Error Correction */}
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" /> Correction d'erreurs
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['L', 'M', 'Q', 'H'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setEcc(level)}
                      className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                        ecc === level
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10'
                          : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Size Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="qr-size" className="text-xs font-black uppercase tracking-widest text-slate-400">Taille: {size}x{size} px</label>
              </div>
              <input
                id="qr-size"
                type="range"
                min="128"
                max="1000"
                step="8"
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
        </div>

        {/* Prévisualisation */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6">
          <div className="relative group">
            {qrCodeUrl ? (
              <div className="p-10 bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-slate-100 animate-in zoom-in-95 duration-500">
                <img
                  src={qrCodeUrl}
                  alt="QR Code généré"
                  className="w-full max-w-[256px] h-auto rounded-lg"
                  style={{ width: '256px', height: '256px' }}
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 gap-4 transition-all">
                <QrCode className="w-16 h-16 opacity-10" />
                <p className="text-xs font-bold text-center px-8 uppercase tracking-widest opacity-40">En attente de texte...</p>
              </div>
            )}
          </div>

          {text && (
            <button
              onClick={downloadQRCode}
              className="w-full max-w-[320px] py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <Download className="w-5 h-5" />
              Télécharger PNG
            </button>
          )}

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-3xl w-full max-w-[320px]">
             <div className="flex items-center gap-3 mb-2">
               <ShieldCheck className="w-4 h-4 text-indigo-500" />
               <span className="text-xs font-black uppercase tracking-widest text-slate-400">Niveaux ECC</span>
             </div>
             <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               <strong>L:</strong> 7% • <strong>M:</strong> 15% • <strong>Q:</strong> 25% • <strong>H:</strong> 30% de correction d'erreurs.
             </p>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Saisissez votre texte, choisissez vos couleurs préférées et le niveau de correction d'erreur. Le QR Code se génère en temps réel. Un niveau d'erreur plus élevé (H) rend le code plus robuste mais plus dense.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" /> Accessibilité & Couleurs
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Pour une lecture optimale, assurez-vous de conserver un contraste élevé entre la couleur des modules et celle du fond. Un fond clair et des modules sombres restent le choix le plus fiable.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Confidentialité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La génération est effectuée via l'API QRServer. Aucune de vos données n'est stockée de façon permanente. Tout le processus est sécurisé et éphémère.
          </p>
        </div>
      </div>
    </div>
  );
}
