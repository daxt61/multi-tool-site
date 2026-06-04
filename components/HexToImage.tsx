import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ImageIcon, Download, Trash2, Hash, Settings2, AlertCircle, Info, Maximize } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_HEX_LENGTH = 1000000; // 1 million chars

type ColorMode = 'grayscale' | 'rgb' | 'rgba';

export function HexToImage({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [hex, setHex] = useState(initialData?.hex || '');
  const [width, setWidth] = useState(initialData?.width || 64);
  const [pixelSize, setPixelSize] = useState(initialData?.pixelSize || 4);
  const [colorMode, setColorMode] = useState<ColorMode>(initialData?.colorMode || 'rgb');
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ hex, width, pixelSize, colorMode });
  }, [hex, width, pixelSize, colorMode, onStateChange]);

  const bytes = useMemo(() => {
    const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
    if (cleanHex.length % 2 !== 0) return null;

    const result = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      result[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
    }
    return result;
  }, [hex]);

  const renderImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bytes || bytes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let pixelCount = 0;
    if (colorMode === 'grayscale') pixelCount = bytes.length;
    else if (colorMode === 'rgb') pixelCount = Math.floor(bytes.length / 3);
    else if (colorMode === 'rgba') pixelCount = Math.floor(bytes.length / 4);

    if (pixelCount === 0) return;

    const height = Math.ceil(pixelCount / width);
    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < pixelCount; i++) {
      const idx = i * 4;
      if (colorMode === 'grayscale') {
        const val = bytes[i];
        data[idx] = val;     // R
        data[idx + 1] = val; // G
        data[idx + 2] = val; // B
        data[idx + 3] = 255; // A
      } else if (colorMode === 'rgb') {
        const bIdx = i * 3;
        data[idx] = bytes[bIdx];
        data[idx + 1] = bytes[bIdx + 1];
        data[idx + 2] = bytes[bIdx + 2];
        data[idx + 3] = 255;
      } else if (colorMode === 'rgba') {
        const bIdx = i * 4;
        data[idx] = bytes[bIdx];
        data[idx + 1] = bytes[bIdx + 1];
        data[idx + 2] = bytes[bIdx + 2];
        data[idx + 3] = bytes[bIdx + 3];
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [bytes, width, colorMode]);

  useEffect(() => {
    if (bytes) {
      renderImage();
    }
  }, [bytes, width, colorMode, renderImage]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas for scaling
    const scaleCanvas = document.createElement('canvas');
    scaleCanvas.width = canvas.width * pixelSize;
    scaleCanvas.height = canvas.height * pixelSize;
    const sCtx = scaleCanvas.getContext('2d');
    if (sCtx) {
      sCtx.imageSmoothingEnabled = false;
      sCtx.drawImage(canvas, 0, 0, scaleCanvas.width, scaleCanvas.height);

      const link = document.createElement('a');
      link.download = `hex-image-${Date.now()}.png`;
      link.href = scaleCanvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleClear = () => {
    setHex('');
    setError(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="hex-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-500" /> {t('hextoimage.input_label', 'Hexadecimal Data')}
              </label>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-3 h-3" /> {t('common.clear')}
              </button>
            </div>
            <textarea
              id="hex-input"
              value={hex}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= MAX_HEX_LENGTH) {
                  setHex(val);
                  setError(null);
                } else {
                  setError(t('error.max_length', { max: MAX_HEX_LENGTH.toLocaleString() }));
                }
              }}
              placeholder="e.g., ff 00 00 00 ff 00 00 00 ff..."
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm dark:text-slate-300 resize-none"
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="flex items-center gap-2 px-1">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.settings', 'Settings')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('hextoimage.width', 'Image Width (pixels)')}</label>
                <input
                  type="number"
                  min="1"
                  max="1024"
                  value={width}
                  onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('hextoimage.pixel_size', 'Display Scaling')}</label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={pixelSize}
                  onChange={(e) => setPixelSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-4"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>1x</span>
                  <span>{pixelSize}x</span>
                  <span>20x</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">{t('hextoimage.mode', 'Color Mode')}</label>
              <div className="flex flex-wrap gap-2">
                {(['grayscale', 'rgb', 'rgba'] as ColorMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setColorMode(mode)}
                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all border ${
                      colorMode === mode
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <ImageIcon className="w-4 h-4 text-indigo-500" /> {t('common.result', 'Preview')}
            </div>
            <button
              onClick={handleDownload}
              disabled={!bytes || bytes.length === 0}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> {t('common.download')}
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center p-8 overflow-auto min-h-[400px]">
            {bytes && bytes.length > 0 ? (
              <canvas
                ref={canvasRef}
                style={{
                  width: width * pixelSize,
                  imageRendering: 'pixelated',
                  maxWidth: '100%',
                  height: 'auto'
                }}
                className="shadow-2xl rounded-lg bg-white dark:bg-black"
              />
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Maximize className="w-8 h-8" />
                </div>
                <p className="text-sm font-medium text-slate-400 italic">
                  {t('hextoimage.waiting', 'Enter hex data to see image')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-600 mt-1 shrink-0" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('hextoimage.about_title', 'How it works')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('hextoimage.about_text', 'This tool converts raw hexadecimal bytes into visual pixels. Each byte (or group of bytes) represents a single pixel color based on the selected mode. Grayscale uses 1 byte per pixel, RGB uses 3 bytes, and RGBA uses 4 bytes.')}
          </p>
        </div>
      </div>
    </div>
  );
}
