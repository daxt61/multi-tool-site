import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageIcon, Download, Copy, Check, Trash2, Settings2, Info, AlertCircle, Maximize } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

const MAX_LENGTH = 100000;
const MAX_CANVAS_DIMENSION = 4096;

export function SVGToImage({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [svgCode, setSvgCode] = useState(initialData?.svgCode || '');
  const [scale, setScale] = useState(initialData?.scale || 1);
  const [bgColor, setBgColor] = useState(initialData?.bgColor || 'transparent');
  const [format, setFormat] = useState<'png' | 'jpeg'>(initialData?.format || 'png');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ svgCode, scale, bgColor, format });
  }, [svgCode, scale, bgColor, format, onStateChange]);

  const renderSVG = useCallback(() => {
    if (!svgCode.trim()) {
      setError(null);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    if (svgCode.length > MAX_LENGTH) {
      setError(t('error.max_length', { max: MAX_LENGTH.toLocaleString() }));
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgCode, 'image/svg+xml');
      const svgElement = doc.querySelector('svg');

      if (!svgElement || doc.querySelector('parsererror')) {
        setError(t('error.invalid_svg', 'Invalid SVG code'));
        return;
      }

      setError(null);

      let width = parseFloat(svgElement.getAttribute('width') || '300');
      let height = parseFloat(svgElement.getAttribute('height') || '150');
      const viewBox = svgElement.getAttribute('viewBox');

      if (viewBox) {
        const parts = viewBox.split(/[ ,]+/).map(parseFloat);
        if (parts.length === 4) {
          if (!svgElement.hasAttribute('width')) width = parts[2];
          if (!svgElement.hasAttribute('height')) height = parts[3];
        }
      }

      const canvasWidth = Math.min(width * scale, MAX_CANVAS_DIMENSION);
      const canvasHeight = Math.min(height * scale, MAX_CANVAS_DIMENSION);

      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      // Ensure xmlns is present for rendering to canvas
      let processingSvg = svgCode;
      if (!processingSvg.includes('xmlns=')) {
        processingSvg = processingSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgBlob = new Blob([processingSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        if (bgColor !== 'transparent') {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        setError(t('error.invalid_svg', 'Error rendering SVG'));
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (e) {
      setError(t('error.invalid_svg', 'Error parsing SVG'));
    }
  }, [svgCode, scale, bgColor, t]);

  useEffect(() => {
    const timer = setTimeout(renderSVG, 300);
    return () => clearTimeout(timer);
  }, [renderSVG]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !svgCode) return;

    const dataUrl = canvas.toDataURL(`image/${format}`, 0.9);
    const link = document.createElement('a');
    link.download = `converted-svg-${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();
    toast.success(t('common.download_success', 'Image downloaded successfully'));
  };

  const handleCopy = () => {
    if (!svgCode) return;
    navigator.clipboard.writeText(svgCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('common.copied'));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Side */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="svg-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" /> {t('svg_to_image.source', 'SVG Source')}
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
                  onClick={() => setSvgCode('')}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  title={t('common.clear')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <textarea
              id="svg-input"
              value={svgCode}
              onChange={(e) => setSvgCode(e.target.value)}
              placeholder='<svg width="100" height="100">...</svg>'
              spellCheck={false}
              autoComplete="off"
              className="w-full h-64 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-slate-300"
            />
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.options')}</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="scale-range" className="text-[10px] font-bold text-slate-400 uppercase">{t('svg_to_image.scale', 'Scale')} ({scale}x)</label>
                </div>
                <input
                  id="scale-range"
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="format-select" className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('common.format')}</label>
                <select
                  id="format-select"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-white"
                >
                  <option value="png">PNG (Transparent)</option>
                  <option value="jpeg">JPEG (Solid)</option>
                </select>
              </div>

              <div className="space-y-3">
                <label htmlFor="bg-color" className="text-[10px] font-bold text-slate-400 uppercase px-1">{t('common.background')}</label>
                <div className="flex gap-2">
                  <input
                    id="bg-color"
                    type="color"
                    value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    disabled={bgColor === 'transparent' && format === 'png'}
                    className="w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-30"
                  />
                  {format === 'png' && (
                    <button
                      onClick={() => setBgColor(bgColor === 'transparent' ? '#ffffff' : 'transparent')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                        bgColor === 'transparent'
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      Transparent
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Side */}
        <div className="space-y-6 flex flex-col h-full">
           <div className="flex-grow bg-slate-100 dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 flex items-center justify-center overflow-auto min-h-[400px] relative group/preview">
              <canvas
                ref={canvasRef}
                className="shadow-2xl max-w-full h-auto bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACtJREFUGFdjZEAD9+/f/8/IyMgIJY9lZGRkZGBgYIDShxKMgAowMTKCJZkBABH6E6PqWvYcAAAAAElFTkSuQmCC')] bg-repeat"
              />
              {!svgCode && (
                <div className="text-center space-y-4 opacity-30 select-none">
                  <Maximize className="w-16 h-16 mx-auto" />
                  <p className="text-sm font-black uppercase tracking-widest">{t('common.preview')}</p>
                </div>
              )}
           </div>

           <button
             onClick={handleDownload}
             disabled={!svgCode || !!error}
             className="w-full py-4 bg-indigo-600 text-white rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
           >
             <Download className="w-6 h-6 transition-transform group-hover:-translate-y-1" />
             {t('common.download')} {format.toUpperCase()}
           </button>
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('common.options')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('svg_to_image.info', 'Paste your SVG XML code to render it onto a canvas. You can scale the image up to 5x for high-resolution exports. Supports transparency for PNG format.')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Maximize className="w-4 h-4 text-indigo-500" /> {t('common.quality')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('svg_to_image.quality_info', 'The scaling process maintains vector crispness. Maximum dimension is capped at 4096px to ensure browser stability and performance.')}
          </p>
        </div>
      </div>
    </div>
  );
}
