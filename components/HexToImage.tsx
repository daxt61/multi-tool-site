import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { ImageIcon, Download, Trash2, Hash, Settings2, AlertCircle, Info, Maximize, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

const MAX_HEX_LENGTH = 1000000; // 1 million chars

type ColorMode = 'grayscale' | 'rgb' | 'rgba';

interface Preset {
  id: string;
  nameKey: string;
  defaultName: string;
  hex: string;
  width: number;
  pixelSize: number;
  colorMode: ColorMode;
}

const PRESETS: Preset[] = [
  {
    id: 'rgb_square',
    nameKey: 'hextoimage.preset_rgb_square',
    defaultName: '3x3 RGB Square',
    hex: 'ff0000 00ff00 0000ff 00ffff ff00ff ffff00 000000 ffffff 808080',
    width: 3,
    pixelSize: 12,
    colorMode: 'rgb',
  },
  {
    id: 'grayscale',
    nameKey: 'hextoimage.preset_grayscale',
    defaultName: 'Grayscale Gradient',
    hex: '00 20 40 60 80 a0 c0 e0 ff c0 a0 80 60 40 20 00',
    width: 16,
    pixelSize: 12,
    colorMode: 'grayscale',
  },
  {
    id: 'rgba_checker',
    nameKey: 'hextoimage.preset_rgba_checker',
    defaultName: 'RGBA Checker',
    hex: 'ff0000ff 00ff0080 0000ffff ffff0080 00ffffff ff00ff80 000000ff ffffff80',
    width: 4,
    pixelSize: 12,
    colorMode: 'rgba',
  },
];

export function HexToImage({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [hex, setHex] = useState(initialData?.hex || '');
  const [width, setWidth] = useState(initialData?.width || 64);
  const [pixelSize, setPixelSize] = useState(initialData?.pixelSize || 4);
  const [colorMode, setColorMode] = useState<ColorMode>(initialData?.colorMode || 'rgb');
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlersRef = useRef({
    handleClear: () => {},
  });

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
      toast.success(t('hextoimage.toast_copied', 'PNG image downloaded successfully!'));
    }
  };

  const handleClear = useCallback(() => {
    setHex('');
    setError(null);
    toast.success(t('hextoimage.toast_cleared', 'Inputs cleared and focus restored!'));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [t]);

  handlersRef.current.handleClear = handleClear;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const activeEl = document.activeElement;
        if (containerRef.current?.contains(activeEl) || activeEl === document.body) {
          e.preventDefault();
          handlersRef.current.handleClear();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLoadPreset = (preset: Preset) => {
    setHex(preset.hex);
    setWidth(preset.width);
    setPixelSize(preset.pixelSize);
    setColorMode(preset.colorMode);
    setError(null);
    toast.success(t('hextoimage.toast_preset_loaded', 'Preset applied!'));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {/* Presets Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" />
          {t('hextoimage.presets_title', 'Quick Presets')}:
        </span>
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => handleLoadPreset(preset)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            {t(preset.nameKey, preset.defaultName)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="hex-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('hextoimage.input_label', 'Hexadecimal Data')}
              </label>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear')}
                <Kbd modifier={null} className="hidden sm:inline-flex ml-1 bg-white/50 dark:bg-black/20 border-rose-200 dark:border-rose-800 text-rose-400">Esc</Kbd>
              </button>
            </div>
            <textarea
              ref={inputRef}
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
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('common.settings', 'Settings')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label htmlFor="hex-width" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 block">
                  {t('hextoimage.width', 'Image Width (pixels)')}
                </label>
                <input
                  id="hex-width"
                  type="number"
                  min="1"
                  max="1024"
                  value={width}
                  onChange={(e) => setWidth(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                />
              </div>
              <div className="space-y-4">
                <label htmlFor="hex-pixel-size" className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 block">
                  {t('hextoimage.pixel_size', 'Display Scaling')}
                </label>
                <input
                  id="hex-pixel-size"
                  type="range"
                  min="1"
                  max="20"
                  value={pixelSize}
                  aria-valuemin={1}
                  aria-valuemax={20}
                  aria-valuenow={pixelSize}
                  onChange={(e) => setPixelSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-4 focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400">
                  <span>1x</span>
                  <span>{pixelSize}x</span>
                  <span>20x</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1 block">
                {t('hextoimage.mode', 'Color Mode')}
              </span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('hextoimage.mode', 'Color Mode')}>
                {(['grayscale', 'rgb', 'rgba'] as ColorMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setColorMode(mode)}
                    aria-pressed={colorMode === mode}
                    className={`px-6 py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 ${
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
              <ImageIcon className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('common.result', 'Preview')}
            </div>
            <button
              onClick={handleDownload}
              disabled={!bytes || bytes.length === 0}
              aria-label={t('common.download', 'Download')}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Download className="w-4 h-4" aria-hidden="true" /> {t('common.download')}
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center p-8 overflow-auto min-h-[400px]">
            {bytes && bytes.length > 0 ? (
              <canvas
                ref={canvasRef}
                aria-label="Generated Hex Image Canvas"
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
                  <Maximize className="w-8 h-8" aria-hidden="true" />
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
        <Info className="w-6 h-6 text-indigo-600 mt-1 shrink-0" aria-hidden="true" />
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
