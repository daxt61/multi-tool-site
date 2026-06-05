import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Trash2, QrCode, Info, Palette, ShieldCheck, ArrowLeftRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function QRCodeGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(initialData?.text || '');
  const [size, setSize] = useState(initialData?.size ?? 256);
  const [fgColor, setFgColor] = useState(initialData?.fgColor || '#000000');
  const [bgColor, setBgColor] = useState(initialData?.bgColor || '#FFFFFF');
  const [ecc, setEcc] = useState<'L' | 'M' | 'Q' | 'H'>(initialData?.ecc || 'L');

  useEffect(() => {
    onStateChange?.({ text, size, fgColor, bgColor, ecc });
  }, [text, size, fgColor, bgColor, ecc, onStateChange]);

  const cleanFg = fgColor.replace('#', '');
  const cleanBg = bgColor.replace('#', '');

  const qrCodeUrl = text 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&color=${cleanFg}&bgcolor=${cleanBg}&ecc=${ecc}`
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
    } catch (e) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.target = '_blank';
      link.download = `qrcode-${Date.now()}.png`;
      link.click();
    }
  };

  const handleClear = useCallback(() => {
    setText('');
    textareaRef.current?.focus();
  }, []);

  const handleSwapColors = useCallback(() => {
    setFgColor(bgColor);
    setBgColor(fgColor);
  }, [fgColor, bgColor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        if (e.key === 'Escape' && document.activeElement?.id === 'qr-text') {
          handleClear();
        }
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSwapColors();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear, handleSwapColors]);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Configuration */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="qr-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-indigo-500" /> {t('qrcode.label')}
                </label>
                <div className="flex gap-2 items-center">
                  <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
                  <button
                    onClick={handleClear}
                    disabled={!text}
                    className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                  >
                    <Trash2 className="w-3 h-3" /> {t('common.clear')}
                  </button>
                </div>
              </div>
              <textarea
                id="qr-text"
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('qrcode.placeholder')}
                className="w-full h-40 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colors */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-500" /> {t('common.color')}
                  </label>
                  <div className="flex gap-2 items-center">
                    <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold text-indigo-400 bg-white dark:bg-slate-900">S</kbd>
                    <button
                      onClick={handleSwapColors}
                      className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-full transition-all flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                      aria-label={t('qrcode.swap_aria')}
                    >
                      <ArrowLeftRight className="w-3 h-3" /> {t('common.swap') || 'Swap'}
                    </button>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t('qrcode.foreground')}</div>
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-full h-12 rounded-xl cursor-pointer border-2 border-white dark:border-slate-700 shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{t('qrcode.background')}</div>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full h-12 rounded-xl cursor-pointer border-2 border-white dark:border-slate-700 shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Error Correction */}
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" /> {t('qrcode.error_correction')}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['L', 'M', 'Q', 'H'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setEcc(level)}
                      aria-pressed={ecc === level}
                      className={`py-3 rounded-xl font-bold text-sm transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
                <label htmlFor="qr-size" className="text-xs font-black uppercase tracking-widest text-slate-400">{t('qrcode.size')}: {size}x{size} px</label>
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
                <span>{t('qrcode.size_small')}</span>
                <span>{t('qrcode.size_medium')}</span>
                <span>{t('qrcode.size_large')}</span>
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
                  alt={t('qrcode.alt_text')}
                  className="w-full max-w-[256px] h-auto rounded-lg"
                  style={{ width: '256px', height: '256px' }}
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-400 gap-4 transition-all">
                <QrCode className="w-16 h-16 opacity-10" />
                <p className="text-xs font-bold text-center px-8 uppercase tracking-widest opacity-40">{t('qrcode.waiting')}</p>
              </div>
            )}
          </div>

          {text && (
            <button
              onClick={downloadQRCode}
              className="w-full max-w-[320px] py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Download className="w-5 h-5" />
              {t('common.download')} PNG
            </button>
          )}

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-3xl w-full max-w-[320px]">
             <div className="flex items-center gap-3 mb-2">
               <ShieldCheck className="w-4 h-4 text-indigo-500" />
               <span className="text-xs font-black uppercase tracking-widest text-slate-400">{t('qrcode.ecc_levels')}</span>
             </div>
             <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               {t('qrcode.ecc_desc')}
             </p>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('unit.guide_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('qrcode.guide_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" /> {t('qrcode.accessibility_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('qrcode.accessibility_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> {t('hashgenerator.security_note_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('qrcode.privacy_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
