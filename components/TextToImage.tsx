import { useState, useEffect, useRef, useCallback } from 'react';
import { Type, Download, Trash2, Sliders, Palette, Layout, ImageIcon, AlertCircle, Sparkles, Check, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 1000;
const MAX_CANVAS_DIMENSION = 4096;

export function TextToImage({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || 'Hello World');
  const [fontSize, setFontSize] = useState(initialData?.fontSize || 48);
  const [textColor, setTextColor] = useState(initialData?.textColor || '#000000');
  const [bgColor, setBgColor] = useState(initialData?.bgColor || '#ffffff');
  const [bgColor2, setBgColor2] = useState(initialData?.bgColor2 || '#e2e8f0');
  const [bgType, setBgType] = useState<'solid' | 'linear' | 'radial'>(initialData?.bgType || 'solid');
  const [borderRadius, setBorderRadius] = useState(initialData?.borderRadius || 0);
  const [padding, setPadding] = useState(initialData?.padding || 40);
  const [fontFamily, setFontFamily] = useState(initialData?.fontFamily || 'sans-serif');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>(initialData?.alignment || 'center');
  const [format, setFormat] = useState<'png' | 'jpeg'>(initialData?.format || 'png');
  const [shadowColor, setShadowColor] = useState(initialData?.shadowColor || 'rgba(0,0,0,0.5)');
  const [shadowBlur, setShadowBlur] = useState(initialData?.shadowBlur || 0);
  const [shadowOffsetX, setShadowOffsetX] = useState(initialData?.shadowOffsetX || 0);
  const [shadowOffsetY, setShadowOffsetY] = useState(initialData?.shadowOffsetY || 0);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = text.split('\n');
    ctx.font = `${fontSize}px ${fontFamily}`;

    // Calculate canvas size
    let maxWidth = 0;
    lines.forEach((line: string) => {
      const metrics = ctx.measureText(line);
      if (metrics.width > maxWidth) maxWidth = metrics.width;
    });

    let canvasWidth = Math.min(maxWidth + padding * 2, MAX_CANVAS_DIMENSION);
    let canvasHeight = Math.min((lines.length * fontSize * 1.2) + padding * 2, MAX_CANVAS_DIMENSION);

    if (canvasWidth < 1) canvasWidth = 1;
    if (canvasHeight < 1) canvasHeight = 1;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Background
    if (borderRadius > 0) {
      ctx.beginPath();
      const r = Math.min(borderRadius, canvasWidth / 2, canvasHeight / 2);
      ctx.moveTo(r, 0);
      ctx.lineTo(canvasWidth - r, 0);
      ctx.quadraticCurveTo(canvasWidth, 0, canvasWidth, r);
      ctx.lineTo(canvasWidth, canvasHeight - r);
      ctx.quadraticCurveTo(canvasWidth, canvasHeight, canvasWidth - r, canvasHeight);
      ctx.lineTo(r, canvasHeight);
      ctx.quadraticCurveTo(0, canvasHeight, 0, canvasHeight - r);
      ctx.lineTo(0, r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.closePath();
      ctx.clip();
    }

    if (bgType === 'solid') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (bgType === 'linear') {
      const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      gradient.addColorStop(0, bgColor);
      gradient.addColorStop(1, bgColor2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (bgType === 'radial') {
      const gradient = ctx.createRadialGradient(canvasWidth / 2, canvasHeight / 2, 0, canvasWidth / 2, canvasHeight / 2, Math.max(canvasWidth, canvasHeight) / 1.5);
      gradient.addColorStop(0, bgColor);
      gradient.addColorStop(1, bgColor2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Text Shadow
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffsetX;
    ctx.shadowOffsetY = shadowOffsetY;

    // Text
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    lines.forEach((line: string, index: number) => {
      let x = padding;
      if (alignment === 'center') {
        x = (canvasWidth - ctx.measureText(line).width) / 2;
      } else if (alignment === 'right') {
        x = canvasWidth - ctx.measureText(line).width - padding;
      }
      const y = padding + (index * fontSize * 1.2);
      ctx.fillText(line, x, y);
    });
  }, [
    text, fontSize, textColor, bgColor, bgColor2, bgType,
    borderRadius, padding, fontFamily, alignment,
    shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY
  ]);

  useEffect(() => {
    onStateChange?.({
      text, fontSize, textColor, bgColor, bgColor2, bgType,
      borderRadius, padding, fontFamily, alignment, format,
      shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY
    });
    renderImage();
  }, [
    text, fontSize, textColor, bgColor, bgColor2, bgType,
    borderRadius, padding, fontFamily, alignment, format,
    shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY,
    onStateChange, renderImage
  ]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `texte-image-${Date.now()}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`);
    link.click();
  };

  const handleCopyImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to copy image: ', err);
    }
  }, []);

  const handleClear = useCallback(() => {
    setText('');
  }, []);

  const handleToggleAlignment = useCallback(() => {
    setAlignment(prev => {
        if (prev === 'left') return 'center';
        if (prev === 'center') return 'right';
        return 'left';
    });
  }, []);

  const handlersRef = useRef({
    handleCopyImage,
    handleClear,
    handleToggleAlignment
  });

  useEffect(() => {
    handlersRef.current = {
        handleCopyImage,
        handleClear,
        handleToggleAlignment
    };
  }, [handleCopyImage, handleClear, handleToggleAlignment]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isEditable =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleClear();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopyImage();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handlersRef.current.handleToggleAlignment();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-500" /> {t('texttoimage.text')}
                </label>
                <div className="flex items-center gap-2">
                  <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
                  <button
                    onClick={handleClear}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    {t('common.clear')}
                  </button>
                </div>
              </div>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                className="w-full h-24 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm resize-none dark:text-white"
                placeholder={t('texttoimage.placeholder')}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('texttoimage.appearance')}</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('texttoimage.font_size')}</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('texttoimage.padding')}</label>
                  <input
                    type="number"
                    value={padding}
                    onChange={(e) => setPadding(parseInt(e.target.value) || 0)}
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('texttoimage.border_radius')}</label>
                <input
                    type="range"
                    min="0"
                    max="200"
                    value={borderRadius}
                    onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('texttoimage.font_family')}</label>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                >
                  <option value="sans-serif">Sans Serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="cursive">Cursive</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">{t('texttoimage.alignment')}</label>
                    <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 border border-slate-200 dark:border-slate-800 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900">S</kbd>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => setAlignment(align)}
                      className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${alignment === align ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                    >
                      {t(`texttoimage.align_${align}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Palette className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('texttoimage.colors')}</h4>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('texttoimage.bg_type')}</label>
                 <div className="grid grid-cols-3 gap-2">
                  {(['solid', 'linear', 'radial'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setBgType(type)}
                      className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${bgType === type ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('texttoimage.text_color')}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{bgType === 'solid' ? t('texttoimage.bg_color') : (t('texttoimage.color') + ' 1')}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono dark:text-white"
                    />
                  </div>
                </div>
                {bgType !== 'solid' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('texttoimage.color') + ' 2'}</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={bgColor2}
                        onChange={(e) => setBgColor2(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={bgColor2}
                        onChange={(e) => setBgColor2(e.target.value)}
                        className="flex-1 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('texttoimage.text_shadow')}</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Blur</label>
                   <input type="number" value={shadowBlur} onChange={e => setShadowBlur(parseInt(e.target.value) || 0)} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Color</label>
                   <input type="text" value={shadowColor} onChange={e => setShadowColor(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Offset X</label>
                   <input type="number" value={shadowOffsetX} onChange={e => setShadowOffsetX(parseInt(e.target.value) || 0)} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Offset Y</label>
                   <input type="number" value={shadowOffsetY} onChange={e => setShadowOffsetY(parseInt(e.target.value) || 0)} className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs dark:text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
             <div className="flex items-center gap-2 px-1">
                <Layout className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('texttoimage.export')}</h4>
              </div>
              <div className="flex gap-2">
                {(['png', 'jpeg'] as const).map(fmt => (
                   <button
                   key={fmt}
                   onClick={() => setFormat(fmt)}
                   className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all border ${format === fmt ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                 >
                   {fmt}
                 </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <button
                    onClick={handleCopyImage}
                    className={`w-full py-3 rounded-2xl font-black transition-all flex items-center justify-center gap-2 border ${
                    copied
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                        : "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 shadow-sm"
                    }`}
                >
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? t('common.copied') : (t('common.copy') + ' Image')}
                    {!copied && <kbd className="hidden md:inline-flex items-center justify-center w-5 h-5 border border-indigo-200 dark:border-indigo-800 rounded text-[10px] font-bold bg-white dark:bg-slate-900 ml-1">C</kbd>}
                </button>
                <button
                    onClick={handleDownload}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                    <Download className="w-5 h-5" /> {t('common.download')}
                </button>
              </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ImageIcon className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('texttoimage.preview')}</h3>
          </div>
          <div className="bg-slate-200 dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-300 dark:border-slate-800 flex items-center justify-center min-h-[500px] overflow-auto">
            <div className="shadow-2xl rounded-lg overflow-hidden">
              <canvas ref={canvasRef} className="max-w-full h-auto" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
        <AlertCircle className="w-6 h-6 text-indigo-600 shrink-0" />
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {t('texttoimage.info')}
        </p>
      </div>
    </div>
  );
}
