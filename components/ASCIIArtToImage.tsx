import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Type, Download, Copy, Check, Trash2, Settings2, Info, Maximize, Palette } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 10000;
const MAX_CANVAS_DIMENSION = 4096;

export function ASCIIArtToImage({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [asciiText, setAsciiText] = useState(initialData?.asciiText || '');
  const [fontSize, setFontSize] = useState(initialData?.fontSize || 14);
  const [lineHeight, setLineHeight] = useState(initialData?.lineHeight || 1.2);
  const [padding, setPadding] = useState(initialData?.padding || 40);
  const [textColor, setTextColor] = useState(initialData?.textColor || '#6366f1');
  const [bgColor, setBgColor] = useState(initialData?.bgColor || '#0f172a');
  const [format, setFormat] = useState<'png' | 'jpeg'>(initialData?.format || 'png');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ asciiText, fontSize, lineHeight, padding, textColor, bgColor, format });
  }, [asciiText, fontSize, lineHeight, padding, textColor, bgColor, format, onStateChange]);

  const renderASCII = useCallback(() => {
    if (!asciiText.trim()) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = asciiText.split('\n');
    ctx.font = `${fontSize}px "Courier New", Courier, monospace`;

    // Calculate dimensions
    let maxWidth = 0;
    lines.forEach((line: string) => {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    });

    const totalWidth = Math.min(maxWidth + padding * 2, MAX_CANVAS_DIMENSION);
    const totalHeight = Math.min(lines.length * fontSize * lineHeight + padding * 2, MAX_CANVAS_DIMENSION);

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Redraw with new dimensions
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    ctx.font = `${fontSize}px "Courier New", Courier, monospace`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'top';

    lines.forEach((line: string, i: number) => {
      ctx.fillText(line, padding, padding + i * fontSize * lineHeight);
    });
  }, [asciiText, fontSize, lineHeight, padding, textColor, bgColor]);

  useEffect(() => {
    const timer = setTimeout(renderASCII, 100);
    return () => clearTimeout(timer);
  }, [renderASCII]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !asciiText) return;

    const dataUrl = canvas.toDataURL(`image/${format}`, 0.9);
    const link = document.createElement('a');
    link.download = `ascii-art-${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();
    toast.success(t('common.download_success', 'Image downloaded successfully'));
  };

  const handleCopy = () => {
    if (!asciiText) return;
    navigator.clipboard.writeText(asciiText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('common.copied'));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Side */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="ascii-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-500" /> ASCII Art
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                  title={t('common.copy')}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setAsciiText('')}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  title={t('common.clear')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              id="ascii-input"
              value={asciiText}
              onChange={(e) => setAsciiText(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="Paste your ASCII art here..."
              spellCheck={false}
              autoComplete="off"
              className="w-full h-64 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-slate-300"
            />
            <div className="flex justify-end px-1">
               <span className="text-[10px] font-bold text-slate-400">{asciiText.length} / {MAX_LENGTH}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('texttoimage.font_size')} ({fontSize}px)</label>
                <input
                  type="range" min="6" max="40" value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('texttoimage.padding')} ({padding}px)</label>
                <input
                  type="range" min="0" max="100" value={padding}
                  onChange={(e) => setPadding(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('common.color')}</label>
                <div className="flex gap-3">
                   <div className="flex items-center gap-2">
                      <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer bg-transparent" />
                      <span className="text-[10px] font-mono text-slate-400">Text</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer bg-transparent" />
                      <span className="text-[10px] font-mono text-slate-400">BG</span>
                   </div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('common.format')}</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Side */}
        <div className="space-y-6 flex flex-col h-full">
           <div className="flex-grow bg-slate-100 dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center overflow-auto min-h-[400px] relative">
              <canvas
                ref={canvasRef}
                className="shadow-2xl max-w-full h-auto"
              />
              {!asciiText && (
                <div className="text-center space-y-4 opacity-30 select-none">
                  <Maximize className="w-16 h-16 mx-auto" />
                  <p className="text-sm font-black uppercase tracking-widest">{t('common.preview')}</p>
                </div>
              )}
           </div>

           <button
             onClick={handleDownload}
             disabled={!asciiText}
             className="w-full py-4 bg-indigo-600 text-white rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
           >
             <Download className="w-6 h-6 transition-transform group-hover:-translate-y-1" />
             {t('common.download')} {format.toUpperCase()}
           </button>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('common.options')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Render your ASCII art strings into images. Useful for banners, source code documentation, or profile decorations. Custom colors and padding allow for a perfectly framed result.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" /> {t('common.privacy')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            All rendering is done client-side using the Canvas API. Your text and images are never uploaded to any server.
          </p>
        </div>
      </div>
    </div>
  );
}
