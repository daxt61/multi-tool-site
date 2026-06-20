import { useState, useRef, useEffect, useCallback } from 'react';
import { ImageIcon, Download, Trash2, Palette, Maximize, Settings2, Info, Frame } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ImageBorderGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(initialData?.image || null);
  const [borderWidth, setBorderWidth] = useState(initialData?.borderWidth ?? 20);
  const [borderColor, setBorderColor] = useState(initialData?.borderColor || '#ffffff');
  const [borderRadius, setCornerRadius] = useState(initialData?.borderRadius ?? 0);
  const [padding, setPadding] = useState(initialData?.padding ?? 0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onStateChange?.({ borderWidth, borderColor, borderRadius, padding });
  }, [borderWidth, borderColor, borderRadius, padding, onStateChange]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const draw = useCallback(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    img.onload = () => {
      const totalWidth = img.width + (borderWidth + padding) * 2;
      const totalHeight = img.height + (borderWidth + padding) * 2;

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      // Draw background/border
      ctx.fillStyle = borderColor;

      // Use clip for rounded corners if radius > 0
      if (borderRadius > 0) {
        ctx.beginPath();
        const r = Math.min(borderRadius, totalWidth / 2, totalHeight / 2);
        ctx.moveTo(r, 0);
        ctx.lineTo(totalWidth - r, 0);
        ctx.quadraticCurveTo(totalWidth, 0, totalWidth, r);
        ctx.lineTo(totalWidth, totalHeight - r);
        ctx.quadraticCurveTo(totalWidth, totalHeight, totalWidth - r, totalHeight);
        ctx.lineTo(r, totalHeight);
        ctx.quadraticCurveTo(0, totalHeight, 0, totalHeight - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();
        ctx.clip();
      } else {
        ctx.fillRect(0, 0, totalWidth, totalHeight);
      }

      // Draw the image centered
      ctx.drawImage(img, borderWidth + padding, borderWidth + padding);
    };
  }, [image, borderWidth, borderColor, borderRadius, padding]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `image-border-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleClear = () => {
    setImage(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h3>
              </div>
              {image && (
                <button
                  onClick={handleClear}
                  className="text-rose-500 hover:text-rose-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {!image ? (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-10 h-10 text-slate-400 group-hover:text-indigo-500 transition-colors mb-4" />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{t('imagecompressor.upload_prompt')}</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                       <Frame className="w-3 h-3" /> {t('image_border.width', 'Border Width')}
                    </label>
                    <span className="text-[10px] font-mono font-bold text-indigo-500">{borderWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={borderWidth}
                    onChange={(e) => setBorderWidth(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                       <Maximize className="w-3 h-3" /> {t('image_border.padding', 'Inner Padding')}
                    </label>
                    <span className="text-[10px] font-mono font-bold text-indigo-500">{padding}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={padding}
                    onChange={(e) => setPadding(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                       <Maximize className="w-3 h-3" /> {t('image_border.radius', 'Corner Radius')}
                    </label>
                    <span className="text-[10px] font-mono font-bold text-indigo-500">{borderRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={borderRadius}
                    onChange={(e) => setCornerRadius(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1 flex items-center gap-1.5">
                     <Palette className="w-3 h-3" /> {t('common.color')}
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white dark:border-slate-800 shadow-sm"
                    />
                    <input
                      type="text"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" /> {t('common.download')} PNG
                </button>
              </div>
            )}
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
            <Info className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-sm font-bold dark:text-white">{t('image_border.about_title', 'About Borders')}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('image_border.about_text', 'Easily add decorative borders to your images. You can customize the border thickness, color, and even add rounded corners for a modern look. All processing happens locally.')}
              </p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center min-h-[400px] bg-slate-100 dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 overflow-hidden">
          {image ? (
            <div
              ref={containerRef}
              className="max-w-full max-h-full flex items-center justify-center animate-in zoom-in-95 duration-500"
            >
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto shadow-2xl rounded-[inherit]"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-slate-400">
              <ImageIcon className="w-16 h-16 opacity-10" />
              <p className="text-xs font-black uppercase tracking-widest opacity-40">{t('common.waiting')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
