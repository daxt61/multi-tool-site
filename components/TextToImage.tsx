import { useState, useEffect, useRef, useCallback } from 'react';
import { Type, Download, Trash2, Sliders, Palette, Layout, ImageIcon, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_LENGTH = 1000;

export function TextToImage({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [text, setText] = useState(initialData?.text || 'Hello World');
  const [fontSize, setFontSize] = useState(initialData?.fontSize || 48);
  const [textColor, setTextColor] = useState(initialData?.textColor || '#000000');
  const [bgColor, setBgColor] = useState(initialData?.bgColor || '#ffffff');
  const [padding, setPadding] = useState(initialData?.padding || 40);
  const [fontFamily, setFontFamily] = useState(initialData?.fontFamily || 'sans-serif');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>(initialData?.alignment || 'center');
  const [format, setFormat] = useState<'png' | 'jpeg'>(initialData?.format || 'png');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ text, fontSize, textColor, bgColor, padding, fontFamily, alignment, format });
    renderImage();
  }, [text, fontSize, textColor, bgColor, padding, fontFamily, alignment, format, onStateChange]);

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

    const canvasWidth = maxWidth + padding * 2;
    const canvasHeight = (lines.length * fontSize * 1.2) + padding * 2;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

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
  }, [text, fontSize, textColor, bgColor, padding, fontFamily, alignment]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `texte-image-${Date.now()}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`);
    link.click();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-500" /> {t('texttoimage.text')}
                </label>
                <button
                  onClick={() => setText('')}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                >
                  {t('common.clear')}
                </button>
              </div>
              <textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                className="w-full h-32 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm resize-none dark:text-white"
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
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('texttoimage.alignment')}</label>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('texttoimage.bg_color')}</label>
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
              <button
                onClick={handleDownload}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" /> {t('common.download')}
              </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ImageIcon className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('texttoimage.preview')}</h3>
          </div>
          <div className="bg-slate-200 dark:bg-slate-950 p-8 rounded-[2.5rem] border border-slate-300 dark:border-slate-800 flex items-center justify-center min-h-[500px] overflow-auto">
            <div className="shadow-2xl bg-white rounded-lg overflow-hidden">
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
