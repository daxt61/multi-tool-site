import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageIcon, Type, Upload, Download, Trash2, RotateCcw, Type as FontIcon, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WatermarkSettings {
  type: 'text' | 'image';
  text: string;
  image: string | null;
  opacity: number;
  rotation: number;
  scale: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile';
  font: string;
  color: string;
  size: number;
}

export function WatermarkGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const watermarkImageInputRef = useRef<HTMLInputElement>(null);

  const [mainImage, setMainImage] = useState<string | null>(initialData?.mainImage || null);
  const [settings, setSettings] = useState<WatermarkSettings>(initialData?.settings || {
    type: 'text',
    text: 'WATERMARK',
    image: null,
    opacity: 0.5,
    rotation: 0,
    scale: 1,
    position: 'center',
    font: 'Arial',
    color: '#ffffff',
    size: 40,
  });

  useEffect(() => {
    onStateChange?.({ mainImage, settings });
  }, [mainImage, settings, onStateChange]);

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setMainImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleWatermarkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setSettings(prev => ({ ...prev, image: event.target?.result as string, type: 'image' }));
      reader.readAsDataURL(file);
    }
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mainImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mainImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      ctx.save();
      ctx.globalAlpha = settings.opacity;

      if (settings.type === 'text') {
        ctx.font = `${settings.size * (img.width / 500)}px ${settings.font}`;
        ctx.fillStyle = settings.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textWidth = ctx.measureText(settings.text).width;
        const textHeight = settings.size * (img.width / 500);

        const drawText = (x: number, y: number) => {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((settings.rotation * Math.PI) / 180);
          ctx.fillText(settings.text, 0, 0);
          ctx.restore();
        };

        if (settings.position === 'tile') {
          const stepX = textWidth * 2;
          const stepY = textHeight * 4;
          for (let x = 0; x < canvas.width + stepX; x += stepX) {
            for (let y = 0; y < canvas.height + stepY; y += stepY) {
              drawText(x, y);
            }
          }
        } else {
          let x = canvas.width / 2;
          let y = canvas.height / 2;
          const margin = 50;

          if (settings.position === 'top-left') { x = margin; y = margin; ctx.textAlign = 'left'; }
          else if (settings.position === 'top-right') { x = canvas.width - margin; y = margin; ctx.textAlign = 'right'; }
          else if (settings.position === 'bottom-left') { x = margin; y = canvas.height - margin; ctx.textAlign = 'left'; }
          else if (settings.position === 'bottom-right') { x = canvas.width - margin; y = canvas.height - margin; ctx.textAlign = 'right'; }

          drawText(x, y);
        }
      } else if (settings.type === 'image' && settings.image) {
        const wmImg = new Image();
        wmImg.crossOrigin = "anonymous";
        wmImg.src = settings.image;
        wmImg.onload = () => {
          const wmWidth = wmImg.width * settings.scale * (img.width / 1000);
          const wmHeight = wmImg.height * settings.scale * (img.width / 1000);

          const drawWM = (x: number, y: number) => {
            ctx.save();
            ctx.translate(x + wmWidth / 2, y + wmHeight / 2);
            ctx.rotate((settings.rotation * Math.PI) / 180);
            ctx.drawImage(wmImg, -wmWidth / 2, -wmHeight / 2, wmWidth, wmHeight);
            ctx.restore();
          };

          if (settings.position === 'tile') {
            const stepX = wmWidth * 2;
            const stepY = wmHeight * 2;
            for (let x = 0; x < canvas.width; x += stepX) {
              for (let y = 0; y < canvas.height; y += stepY) {
                drawWM(x, y);
              }
            }
          } else {
            let x = (canvas.width - wmWidth) / 2;
            let y = (canvas.height - wmHeight) / 2;
            const margin = 20;

            if (settings.position === 'top-left') { x = margin; y = margin; }
            else if (settings.position === 'top-right') { x = canvas.width - wmWidth - margin; y = margin; }
            else if (settings.position === 'bottom-left') { x = margin; y = canvas.height - wmHeight - margin; }
            else if (settings.position === 'bottom-right') { x = canvas.width - wmWidth - margin; y = canvas.height - wmHeight - margin; }

            drawWM(x, y);
          }
          ctx.restore();
        };
      } else {
        ctx.restore();
      }
    };
  }, [mainImage, settings]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mainImage) return;
    const link = document.createElement('a');
    link.download = 'watermarked-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [mainImage]);

  const resetSettings = useCallback(() => {
    setSettings({
      type: 'text',
      text: 'WATERMARK',
      image: null,
      opacity: 0.5,
      rotation: 0,
      scale: 1,
      position: 'center',
      font: 'Arial',
      color: '#ffffff',
      size: 40,
    });
  }, []);

  const handlersRef = useRef({ handleDownload, resetSettings });
  useEffect(() => {
    handlersRef.current = { handleDownload, resetSettings };
  }, [handleDownload, resetSettings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable && e.key !== "Escape") return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handlersRef.current.resetSettings();
      } else if (e.key.toLowerCase() === "d") {
        e.preventDefault();
        handlersRef.current.handleDownload();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-sm">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Upload className="w-4 h-4" /> {t('watermark.upload_main')}
              </label>
              <div
                onClick={() => mainImageInputRef.current?.click()}
                className="group relative h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
              >
                <input type="file" ref={mainImageInputRef} onChange={handleMainImageUpload} accept="image/*" className="hidden" />
                <ImageIcon className="w-8 h-8 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                <span className="text-xs font-bold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                  {mainImage ? t('watermark.change_image') : t('watermark.select_image')}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                {t('watermark.position')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right', 'tile'] as const).map(pos => (
                  <button
                    key={pos}
                    onClick={() => setSettings(prev => ({ ...prev, position: pos }))}
                    className={`p-2 rounded-xl border text-[10px] font-black uppercase transition-all ${
                      settings.position === pos
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {pos.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
               <button
                  onClick={() => setSettings(prev => ({ ...prev, type: 'text' }))}
                  className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                    settings.type === 'text'
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-transparent'
                  }`}
               >
                  <Type className="w-4 h-4" /> {t('watermark.text_mode')}
               </button>
               <button
                  onClick={() => setSettings(prev => ({ ...prev, type: 'image' }))}
                  className={`flex-1 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                    settings.type === 'image'
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border border-transparent'
                  }`}
               >
                  <ImageIcon className="w-4 h-4" /> {t('watermark.image_mode')}
               </button>
            </div>

            {settings.type === 'text' ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={settings.text}
                  onChange={(e) => setSettings(prev => ({ ...prev, text: e.target.value }))}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold dark:text-white"
                  placeholder={t('watermark.text_placeholder')}
                />
              </div>
            ) : (
              <div
                onClick={() => watermarkImageInputRef.current?.click()}
                className="group relative h-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all"
              >
                <input type="file" ref={watermarkImageInputRef} onChange={handleWatermarkImageUpload} accept="image/*" className="hidden" />
                <Upload className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                <span className="text-[10px] font-black uppercase text-slate-400">{t('watermark.upload_watermark')}</span>
              </div>
            )}

            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                    {t('watermark.opacity')} <span>{Math.round(settings.opacity * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.opacity}
                    onChange={(e) => setSettings(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                    {t('watermark.rotation')} <span>{settings.rotation}°</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={settings.rotation}
                    onChange={(e) => setSettings(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                    {t('watermark.scale')} <span>{settings.scale.toFixed(1)}x</span>
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={settings.scale}
                    onChange={(e) => setSettings(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                {settings.type === 'text' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                      {t('watermark.size')} <span>{settings.size}px</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={settings.size}
                      onChange={(e) => setSettings(prev => ({ ...prev, size: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                )}
              </div>

              {settings.type === 'text' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                      <Palette className="w-3 h-3" /> {t('watermark.color')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={settings.color}
                        onChange={(e) => setSettings(prev => ({ ...prev, color: e.target.value }))}
                        className="w-10 h-10 rounded-lg border-0 p-0 cursor-pointer overflow-hidden bg-transparent"
                      />
                      <input
                        type="text"
                        value={settings.color}
                        onChange={(e) => setSettings(prev => ({ ...prev, color: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                      <FontIcon className="w-3 h-3" /> {t('watermark.font')}
                    </label>
                    <select
                      value={settings.font}
                      onChange={(e) => setSettings(prev => ({ ...prev, font: e.target.value }))}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Impact">Impact</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center min-h-[400px] relative overflow-hidden group">
            {!mainImage && (
              <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto shadow-xl text-slate-300">
                   <ImageIcon className="w-10 h-10" />
                </div>
                <p className="text-slate-400 font-bold">{t('watermark.upload_hint')}</p>
              </div>
            )}
            <canvas ref={canvasRef} className={`max-w-full h-auto rounded-xl shadow-2xl ${!mainImage ? 'hidden' : 'block'}`} />

            {mainImage && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setMainImage(null)}
                  className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-rose-500 rounded-2xl shadow-xl hover:bg-rose-500 hover:text-white transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-4">
             <button
                onClick={resetSettings}
                className="group px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                title={`${t('common.reset')} (Esc)`}
             >
                <RotateCcw className="w-5 h-5" />
                <span className="hidden sm:inline">{t('common.reset')}</span>
                <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold bg-white dark:bg-slate-800 ml-1">Esc</kbd>
             </button>
             <button
                onClick={handleDownload}
                disabled={!mainImage}
                className="group flex-1 px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                title={`${t('watermark.download')} (D)`}
             >
                <Download className="w-6 h-6" />
                <span>{t('watermark.download')}</span>
                <kbd className="hidden md:inline-flex items-center justify-center w-6 h-6 border border-white/20 rounded text-xs font-bold ml-2 bg-white/10">D</kbd>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
