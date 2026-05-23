import { useState, useEffect, useRef, useCallback } from 'react';
import { ImageIcon, Copy, Check, Trash2, Download, AlertCircle, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const MAX_WIDTH = 200;
const CHAR_SETS = {
  'standard': '@%#*+=-:. ',
  'complex': '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
  'blocks': '█▓▒░ ',
  'minimal': '#. '
};

export function ImageToASCII({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [image, setImage] = useState<string | null>(initialData?.image || null);
  const [ascii, setAscii] = useState('');
  const [width, setWidth] = useState(initialData?.width || 100);
  const [contrast, setContrast] = useState(initialData?.contrast || 1);
  const [charSet, setCharSet] = useState<keyof typeof CHAR_SETS>(initialData?.charSet || 'standard');
  const [invert, setInvert] = useState(initialData?.invert || false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    onStateChange?.({ image, width, contrast, charSet, invert });
    if (image) {
        generateAscii();
    }
  }, [image, width, contrast, charSet, invert]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('imagecompressor.error_size'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAscii = useCallback(() => {
    if (!image) return;

    const img = new Image();
    img.src = image;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const height = Math.floor((img.height / img.width) * width * 0.55); // 0.55 adjustment for font aspect ratio
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      const chars = CHAR_SETS[charSet];
      let asciiResult = '';

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];

          // Calculate brightness (grayscale)
          let brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

          // Apply contrast
          brightness = ((brightness - 0.5) * contrast) + 0.5;
          brightness = Math.max(0, Math.min(1, brightness));

          if (invert) brightness = 1 - brightness;

          const charIndex = Math.floor(brightness * (chars.length - 1));
          asciiResult += chars[charIndex];
        }
        asciiResult += '\n';
      }
      setAscii(asciiResult);
    };
  }, [image, width, contrast, charSet, invert]);

  const handleCopy = () => {
    if (!ascii) return;
    navigator.clipboard.writeText(ascii);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!ascii) return;
    const blob = new Blob([ascii], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ascii-art-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <ImageIcon className="w-4 h-4 text-indigo-500" /> {t('common.input')}
              </label>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-all"
                >
                  {image ? (
                    <img src={image} alt="Preview" className="h-full w-full object-contain p-4" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-xs font-bold">{t('imagecompressor.upload_prompt')}</span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
              </label>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{t('imagetoascii.contrast')}</span>
                    <span className="text-xs font-black text-indigo-600">{width}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max={MAX_WIDTH}
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Contrast</span>
                    <span className="text-xs font-black text-indigo-600">{contrast}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{t('imagetoascii.charset')}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(CHAR_SETS).map((set) => (
                      <button
                        key={set}
                        onClick={() => setCharSet(set as any)}
                        className={`py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${charSet === set ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                      >
                        {set}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setInvert(!invert)}
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all border ${invert ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}
                >
                   {invert ? t('imagetoascii.invert_dark') : t('imagetoascii.invert_light')}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => {setImage(null); setAscii('');}}
            disabled={!image}
            className="w-full py-4 text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> {t('common.clear')}
          </button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
             <label className="text-xs font-black uppercase tracking-widest text-slate-400">{t('imagetoascii.output')}</label>
             <div className="flex gap-2">
               <button
                 onClick={handleDownload}
                 disabled={!ascii}
                 className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
               >
                 <Download className="w-4 h-4" />
               </button>
               <button
                 onClick={handleCopy}
                 disabled={!ascii}
                 className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                   copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                 } disabled:opacity-50`}
               >
                 {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                 {copied ? t('common.copied') : t('common.copy')}
               </button>
             </div>
          </div>
          <div className="bg-black p-8 rounded-[2.5rem] overflow-auto shadow-inner border border-slate-800 min-h-[500px]">
            <pre className="font-mono text-[8px] leading-[1] text-white whitespace-pre">
              {ascii || <div className="h-full flex items-center justify-center text-slate-700 italic">{t('imagetoascii.placeholder')}</div>}
            </pre>
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
