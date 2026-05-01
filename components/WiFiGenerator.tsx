import { useState, useEffect } from 'react';
import { Download, Trash2, QrCode, Wifi, ShieldCheck, Copy, Check, Eye, EyeOff } from 'lucide-react';

export function WiFiGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [ssid, setSsid] = useState(initialData?.ssid || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [encryption, setEncryption] = useState(initialData?.encryption || 'WPA');
  const [hidden, setHidden] = useState(initialData?.hidden || false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ ssid, password, encryption, hidden });
  }, [ssid, password, encryption, hidden]);

  const wifiString = `WIFI:S:${ssid};T:${encryption === 'none' ? 'nopass' : encryption};P:${password};H:${hidden};;`;

  const qrCodeUrl = ssid
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(wifiString)}`
    : '';

  const downloadQRCode = async () => {
    if (!qrCodeUrl) return;
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wifi-qr-${ssid || 'wifi'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      // Fallback to opening in new tab if fetch fails due to CORS
      window.open(qrCodeUrl, '_blank');
    }
  };

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(wifiString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setSsid('');
    setPassword('');
    setEncryption('WPA');
    setHidden(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Configuration */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-indigo-500" /> Configuration du WiFi
              </h3>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-full transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="ssid" className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">Nom du réseau (SSID)</label>
                <input
                  id="ssid"
                  type="text"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  placeholder="Ex: MaBox_WiFi"
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">Mot de passe</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe du réseau"
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white pr-12"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">Sécurité</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['WPA', 'WEP', 'none'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setEncryption(type)}
                        className={`py-3 rounded-xl font-bold text-xs uppercase transition-all border ${
                          encryption === type
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {type === 'none' ? 'Aucune' : type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">Réseau Masqué</label>
                  <button
                    onClick={() => setHidden(!hidden)}
                    className={`w-full py-3 rounded-xl font-bold text-xs uppercase transition-all border flex items-center justify-center gap-2 ${
                      hidden
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {hidden ? 'Oui' : 'Non'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {ssid && (
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Chaîne brute</span>
                <button
                  onClick={handleCopyRaw}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    copied ? 'bg-emerald-50 text-emerald-600' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
              <code className="block p-4 bg-slate-50 dark:bg-slate-950 rounded-xl font-mono text-xs break-all dark:text-slate-300">
                {wifiString}
              </code>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6">
          <div className="relative group">
            {ssid ? (
              <div className="p-10 bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-slate-100 animate-in zoom-in-95 duration-500">
                <img
                  src={qrCodeUrl}
                  alt="WiFi QR Code"
                  className="w-full max-w-[256px] h-auto rounded-lg"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 gap-4">
                <QrCode className="w-16 h-16 opacity-10" />
                <p className="text-xs font-bold text-center px-8 uppercase tracking-widest opacity-40">Entrez un SSID pour générer le code</p>
              </div>
            )}
          </div>

          {ssid && (
            <button
              onClick={downloadQRCode}
              className="w-full max-w-[320px] py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Télécharger PNG
            </button>
          )}

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-3xl w-full max-w-[320px]">
             <div className="flex items-center gap-3 mb-2">
               <ShieldCheck className="w-4 h-4 text-indigo-500" />
               <span className="text-xs font-black uppercase tracking-widest text-slate-400">Sécurisé & Privé</span>
             </div>
             <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               Générez un QR Code pour partager votre WiFi sans donner votre mot de passe à voix haute. Vos données sont transmises de façon éphémère pour la génération.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
