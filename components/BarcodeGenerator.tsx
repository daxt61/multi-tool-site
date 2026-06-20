import { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Trash2, Barcode, Info, Palette, Settings2, Type } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Code 128 patterns (103 data patterns + 3 start patterns + 1 stop pattern)
const PATTERNS = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100", "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
  "11001000100", "11000100100", "10110011100", "10011011100", "10011001110", "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
  "11001001110", "11011100100", "11001110100", "11101101110", "11101001100", "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000", "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
  "11000101000", "11000100010", "10110111000", "10110001110", "10001101110", "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
  "11000101110", "11011101000", "11011100010", "11011101110", "11101011000", "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
  "11101111010", "11001000010", "11110001010", "10100110000", "10100001100", "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
  "10110000100", "10011010000", "10011000010", "10000110100", "10000110010", "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
  "10100111100", "10010111100", "10010011110", "10111100100", "10011110100", "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
  "11011110110", "11110110110", "10101111000", "10100011110", "10001011110", "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
  "10111101110", "11101011110", "11110101110", "11010000100", "11010010000", "11010011100", "1100011101011"
];

const START_B_INDEX = 104;
const STOP_INDEX = 106;

export function BarcodeGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState(initialData?.text || '12345678');
  const [height, setHeight] = useState(initialData?.height ?? 100);
  const [barWidth, setBarWidth] = useState(initialData?.barWidth ?? 2);
  const [fgColor, setFgColor] = useState(initialData?.fgColor || '#000000');
  const [bgColor, setBgColor] = useState(initialData?.bgColor || '#FFFFFF');
  const [showText, setShowText] = useState(initialData?.showText ?? true);

  useEffect(() => {
    onStateChange?.({ text, height, barWidth, fgColor, bgColor, showText });
  }, [text, height, barWidth, fgColor, bgColor, showText, onStateChange]);

  const drawBarcode = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !text) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Filter valid characters for Subset B (ASCII 32-127)
    const validChars = text.split('').map((c: string) => {
      const code = c.charCodeAt(0);
      return (code >= 32 && code <= 126) ? c : '?';
    }).join('');

    let checksum = 104; // Subset B start value
    let bin = PATTERNS[START_B_INDEX];

    for (let i = 0; i < validChars.length; i++) {
      const val = validChars.charCodeAt(i) - 32;
      bin += PATTERNS[val];
      checksum += val * (i + 1);
    }

    const checkDigit = checksum % 103;
    bin += PATTERNS[checkDigit];
    bin += PATTERNS[STOP_INDEX];

    const dpr = window.devicePixelRatio || 1;
    const padding = 40;
    const textHeight = showText ? 30 : 0;
    const totalWidth = bin.length * barWidth + padding * 2;
    const totalHeight = height + textHeight + padding * 2;

    canvas.width = totalWidth * dpr;
    canvas.height = totalHeight * dpr;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Bars
    ctx.fillStyle = fgColor;
    for (let i = 0; i < bin.length; i++) {
      if (bin[i] === '1') {
        ctx.fillRect(padding + i * barWidth, padding, barWidth, height);
      }
    }

    // Text
    if (showText) {
      ctx.font = `bold 16px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(validChars, totalWidth / 2, padding + height + 10);
    }
  }, [text, height, barWidth, fgColor, bgColor, showText]);

  useEffect(() => {
    drawBarcode();
  }, [drawBarcode]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `barcode-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleClear = () => {
    setText('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="barcode-text" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Type className="w-4 h-4 text-indigo-500" /> {t('common.input')}
                </label>
                <button
                  onClick={handleClear}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 px-3 py-1.5 rounded-full transition-all"
                >
                  <Trash2 className="w-3 h-3" /> {t('common.clear')}
                </button>
              </div>
              <input
                id="barcode-text"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-xl font-mono"
                placeholder="Enter text..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-indigo-500" /> {t('common.options')}
                </label>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-500">{t('barcode.height')}</span>
                      <span className="text-xs font-mono font-bold text-indigo-500">{height}px</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-slate-500">{t('barcode.bar_width')}</span>
                      <span className="text-xs font-mono font-bold text-indigo-500">{barWidth}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={barWidth}
                      onChange={(e) => setBarWidth(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show-text"
                      checked={showText}
                      onChange={(e) => setShowText(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="show-text" className="text-sm font-bold text-slate-600 dark:text-slate-400">{t('barcode.show_text')}</label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-500" /> {t('common.color')}
                </label>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white dark:border-slate-800 shadow-sm"
                    />
                    <span className="text-xs font-bold text-slate-500">{t('barcode.bars')}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-white dark:border-slate-800 shadow-sm"
                    />
                    <span className="text-xs font-bold text-slate-500">{t('qrcode.background')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-8">
          <div className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-auto max-w-full">
            <canvas ref={canvasRef} className="max-w-full h-auto" />
          </div>

          <button
            onClick={handleDownload}
            disabled={!text}
            className="w-full max-w-xs py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {t('common.download')} PNG
          </button>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4 max-w-xs">
            <Info className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Code 128</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                High-density alphanumeric symbology. All processing is done locally in your browser.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
