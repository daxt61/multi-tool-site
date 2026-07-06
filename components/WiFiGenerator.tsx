import { useState, useEffect, useCallback } from 'react';
import { Download, Trash2, QrCode, Wifi, ShieldCheck, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Kbd } from './ui/Kbd';

const MAX_LENGTH = 100;

export function WiFiGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [ssid, setSsid] = useState((initialData?.ssid || '').slice(0, MAX_LENGTH));
  const [password, setPassword] = useState((initialData?.password || '').slice(0, MAX_LENGTH));
  const [encryption, setEncryption] = useState(initialData?.encryption || 'WPA');
  const [hidden, setHidden] = useState(initialData?.hidden || false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Sentinel: Never share the WiFi password in the URL state.
    onStateChange?.({ ssid, encryption, hidden });
  }, [ssid, encryption, hidden, onStateChange]);

  const escapeMecard = (val: string) => {
    // Sentinel: Escape special characters (\, ;, :, ,, ") for MECARD format
    return val.replace(/\\/g, '\\\\')
              .replace(/;/g, '\\;')
              .replace(/:/g, '\\:')
              .replace(/,/g, '\\,')
              .replace(/"/g, '\\"');
  };

  const wifiString = `WIFI:S:${escapeMecard(ssid)};T:${encryption === 'none' ? 'nopass' : encryption};P:${escapeMecard(password)};H:${hidden};;`;

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

  const handleClear = useCallback(() => {
    setSsid('');
    setPassword('');
    setEncryption('WPA');
    setHidden(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        if (e.key === 'Escape') {
          handleClear();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear]);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Configuration */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-indigo-500" /> {t('wifi.config_title')}
              </h3>
              <div className="flex gap-2 items-center">
                <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
                <button
                  onClick={handleClear}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                >
                  <Trash2 className="w-3 h-3" /> {t('common.clear')}
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="ssid" className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">{t('wifi.ssid_label')}</label>
                <input
                  id="ssid"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={ssid}
                  maxLength={MAX_LENGTH}
                  onChange={(e) => setSsid(e.target.value.slice(0, MAX_LENGTH))}
                  placeholder={t('wifi.ssid_placeholder')}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">{t('wifi.password_label')}</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="off"
                    spellCheck={false}
                    value={password}
                    maxLength={MAX_LENGTH}
                    onChange={(e) => setPassword(e.target.value.slice(0, MAX_LENGTH))}
                    placeholder={t('wifi.password_placeholder')}
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
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">{t('wifi.security_label')}</label>
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
                        {type === 'none' ? t('wifi.security_none') : type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1">{t('wifi.hidden_label')}</label>
                  <button
                    onClick={() => setHidden(!hidden)}
                    className={`w-full py-3 rounded-xl font-bold text-xs uppercase transition-all border flex items-center justify-center gap-2 ${
                      hidden
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {hidden ? t('wifi.hidden_yes') : t('wifi.hidden_no')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {ssid && (
            <div className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t('wifi.raw_string')}</span>
                <button
                  onClick={handleCopyRaw}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    copied ? 'bg-emerald-50 text-emerald-600' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? t('common.copied') : t('common.copy')}
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
                <p className="text-xs font-bold text-center px-8 uppercase tracking-widest opacity-40">{t('wifi.waiting')}</p>
              </div>
            )}
          </div>

          {ssid && (
            <button
              onClick={downloadQRCode}
              className="w-full max-w-[320px] py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Download className="w-5 h-5" />
              {t('wifi.download_png')}
            </button>
          )}

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-3xl w-full max-w-[320px]">
             <div className="flex items-center gap-3 mb-2">
               <ShieldCheck className="w-4 h-4 text-indigo-500" />
               <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.privacy')}</span>
             </div>
             <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               {t('wifi.privacy_text')}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
