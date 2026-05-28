import { useState, useRef, useEffect, useCallback } from 'react';
import { Smile, Download, Sliders, RefreshCw, Info, Type, Palette, Maximize } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function EmojiToImage({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [emoji, setEmoji] = useState(initialData?.emoji || '🚀');
  const [fontSize, setFontSize] = useState(initialData?.fontSize || 256);
  const [padding, setPadding] = useState(initialData?.padding || 32);
  const [bgColor, setBgColor] = useState(initialData?.bgColor || 'transparent');
  const [format, setFormat] = useState<'png' | 'jpeg'>(initialData?.format || 'png');
  const [isTransparent, setIsTransparent] = useState(initialData?.isTransparent ?? true);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ emoji, fontSize, padding, bgColor, format, isTransparent });
  }, [emoji, fontSize, padding, bgColor, format, isTransparent, onStateChange]);

  const drawEmoji = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = fontSize + padding * 2;
    canvas.width = size;
    canvas.height = size;

    // Clear and draw background
    ctx.clearRect(0, 0, size, size);
    if (!isTransparent || format === 'jpeg') {
      ctx.fillStyle = bgColor === 'transparent' ? '#ffffff' : bgColor;
      ctx.fillRect(0, 0, size, size);
    }

    // Draw Emoji
    ctx.font = `${fontSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Adjust vertical position slightly for better centering of emojis
    ctx.fillText(emoji, size / 2, size / 2 + fontSize * 0.05);
  }, [emoji, fontSize, padding, bgColor, isTransparent, format]);

  useEffect(() => {
    const timeout = setTimeout(drawEmoji, 100);
    return () => clearTimeout(timeout);
  }, [drawEmoji]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `emoji-${emoji}-${Date.now()}.${format}`;
    link.href = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.9 : undefined);
    link.click();
  };

  const commonEmojis = ['🚀', '✨', '🔥', '❤️', '😂', '👍', '🌟', '🎉', '💻', '🎨', '🍕', '🌈'];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Sliders className="w-4 h-4 text-indigo-500" /> {t('common.options')}
            </div>

            <div className="space-y-6">
              {/* Emoji Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Emoji</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value.slice(-2))} // Capture the last emoji
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-2xl text-center outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {commonEmojis.map(e => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 transition-all text-lg"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('texttoimage.font_size')}</label>
                  <span className="text-xs font-black text-indigo-500">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="1024"
                  step="32"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Padding Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('texttoimage.padding')}</label>
                  <span className="text-xs font-black text-indigo-500">{padding}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="256"
                  value={padding}
                  onChange={(e) => setPadding(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Background */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('texttoimage.bg_color')}</label>
                   <button
                     onClick={() => setIsTransparent(!isTransparent)}
                     className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${isTransparent ? 'bg-indigo-500 border-indigo-500 text-white' : 'text-slate-400 border-slate-200 dark:border-slate-700'}`}
                   >
                     Transparent
                   </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="color"
                    disabled={isTransparent && format === 'png'}
                    value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                    onChange={(e) => {
                      setBgColor(e.target.value);
                      setIsTransparent(false);
                    }}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white dark:border-slate-800 shadow-sm disabled:opacity-50"
                  />
                  <input
                    type="text"
                    disabled={isTransparent && format === 'png'}
                    value={isTransparent && format === 'png' ? 'Transparent' : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Format */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('texttoimage.export')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['png', 'jpeg'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${format === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleDownload}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t('common.download')} Image
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Maximize className="w-4 h-4 text-indigo-500" /> Preview
            </div>
          </div>

          <div className="relative min-h-[500px] bg-slate-50 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center overflow-auto p-8 checkerboard-bg">
            <canvas
              ref={canvasRef}
              className="shadow-2xl rounded-lg bg-white"
              style={{
                maxWidth: '100%',
                height: 'auto',
                backgroundColor: (isTransparent && format === 'png') ? 'transparent' : bgColor
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('emojitoimage.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('emojitoimage.about_text')}
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .checkerboard-bg {
          background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        .dark .checkerboard-bg {
          background-image: linear-gradient(45deg, #1e293b 25%, transparent 25%),
                            linear-gradient(-45deg, #1e293b 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #1e293b 75%),
                            linear-gradient(-45deg, transparent 75%, #1e293b 75%);
          background-color: #0f172a;
        }
      `}} />
    </div>
  );
}
