import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Copy, Check, Trash2, Info, Palette, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface NamedColor {
  name: string;
  hex: string;
  rgb: [number, number, number];
}

const NAMED_COLORS: NamedColor[] = [
  { name: 'AliceBlue', hex: '#F0F8FF', rgb: [240, 248, 255] },
  { name: 'AntiqueWhite', hex: '#FAEBD7', rgb: [250, 235, 215] },
  { name: 'Aqua', hex: '#00FFFF', rgb: [0, 255, 255] },
  { name: 'Aquamarine', hex: '#7FFFD4', rgb: [127, 255, 212] },
  { name: 'Azure', hex: '#F0FFFF', rgb: [240, 255, 255] },
  { name: 'Beige', hex: '#F5F5DC', rgb: [245, 245, 220] },
  { name: 'Bisque', hex: '#FFE4C4', rgb: [255, 228, 196] },
  { name: 'Black', hex: '#000000', rgb: [0, 0, 0] },
  { name: 'BlanchedAlmond', hex: '#FFEBCD', rgb: [255, 235, 205] },
  { name: 'Blue', hex: '#0000FF', rgb: [0, 0, 255] },
  { name: 'BlueViolet', hex: '#8A2BE2', rgb: [138, 43, 226] },
  { name: 'Brown', hex: '#A52A2A', rgb: [165, 42, 42] },
  { name: 'BurlyWood', hex: '#DEB887', rgb: [222, 184, 135] },
  { name: 'CadetBlue', hex: '#5F9EA0', rgb: [95, 158, 160] },
  { name: 'Chartreuse', hex: '#7FFF00', rgb: [127, 255, 0] },
  { name: 'Chocolate', hex: '#D2691E', rgb: [210, 105, 30] },
  { name: 'Coral', hex: '#FF7F50', rgb: [255, 127, 80] },
  { name: 'CornflowerBlue', hex: '#6495ED', rgb: [100, 149, 237] },
  { name: 'Cornsilk', hex: '#FFF8DC', rgb: [255, 248, 220] },
  { name: 'Crimson', hex: '#DC143C', rgb: [220, 20, 60] },
  { name: 'Cyan', hex: '#00FFFF', rgb: [0, 255, 255] },
  { name: 'DarkBlue', hex: '#00008B', rgb: [0, 0, 139] },
  { name: 'DarkCyan', hex: '#008B8B', rgb: [0, 139, 139] },
  { name: 'DarkGoldenRod', hex: '#B8860B', rgb: [184, 134, 11] },
  { name: 'DarkGray', hex: '#A9A9A9', rgb: [169, 169, 169] },
  { name: 'DarkGrey', hex: '#A9A9A9', rgb: [169, 169, 169] },
  { name: 'DarkGreen', hex: '#006400', rgb: [0, 100, 0] },
  { name: 'DarkKhaki', hex: '#BDB76B', rgb: [189, 183, 107] },
  { name: 'DarkMagenta', hex: '#8B008B', rgb: [139, 0, 139] },
  { name: 'DarkOliveGreen', hex: '#556B2F', rgb: [85, 107, 47] },
  { name: 'DarkOrange', hex: '#FF8C00', rgb: [255, 140, 0] },
  { name: 'DarkOrchid', hex: '#9932CC', rgb: [153, 50, 204] },
  { name: 'DarkRed', hex: '#8B0000', rgb: [139, 0, 0] },
  { name: 'DarkSalmon', hex: '#E9967A', rgb: [233, 150, 122] },
  { name: 'DarkSeaGreen', hex: '#8FBC8F', rgb: [143, 188, 143] },
  { name: 'DarkSlateBlue', hex: '#483D8B', rgb: [72, 61, 139] },
  { name: 'DarkSlateGray', hex: '#2F4F4F', rgb: [47, 79, 79] },
  { name: 'DarkSlateGrey', hex: '#2F4F4F', rgb: [47, 79, 79] },
  { name: 'DarkTurquoise', hex: '#00CED1', rgb: [0, 206, 209] },
  { name: 'DarkViolet', hex: '#9400D3', rgb: [148, 0, 211] },
  { name: 'DeepPink', hex: '#FF1493', rgb: [255, 20, 147] },
  { name: 'DeepSkyBlue', hex: '#00BFFF', rgb: [0, 191, 255] },
  { name: 'DimGray', hex: '#696969', rgb: [105, 105, 105] },
  { name: 'DimGrey', hex: '#696969', rgb: [105, 105, 105] },
  { name: 'DodgerBlue', hex: '#1E90FF', rgb: [30, 144, 255] },
  { name: 'FireBrick', hex: '#B22222', rgb: [178, 34, 34] },
  { name: 'FloralWhite', hex: '#FFFAF0', rgb: [255, 250, 240] },
  { name: 'ForestGreen', hex: '#228B22', rgb: [34, 139, 34] },
  { name: 'Fuchsia', hex: '#FF00FF', rgb: [255, 0, 255] },
  { name: 'Gainsboro', hex: '#DCDCDC', rgb: [220, 220, 220] },
  { name: 'GhostWhite', hex: '#F8F8FF', rgb: [248, 248, 255] },
  { name: 'Gold', hex: '#FFD700', rgb: [255, 215, 0] },
  { name: 'GoldenRod', hex: '#DAA520', rgb: [218, 165, 32] },
  { name: 'Gray', hex: '#808080', rgb: [128, 128, 128] },
  { name: 'Grey', hex: '#808080', rgb: [128, 128, 128] },
  { name: 'Green', hex: '#008000', rgb: [0, 128, 0] },
  { name: 'GreenYellow', hex: '#ADFF2F', rgb: [173, 255, 47] },
  { name: 'HoneyDew', hex: '#F0FFF0', rgb: [240, 255, 240] },
  { name: 'HotPink', hex: '#FF69B4', rgb: [255, 105, 180] },
  { name: 'IndianRed', hex: '#CD5C5C', rgb: [205, 92, 92] },
  { name: 'Indigo', hex: '#4B0082', rgb: [75, 0, 130] },
  { name: 'Ivory', hex: '#FFFFF0', rgb: [255, 255, 240] },
  { name: 'Khaki', hex: '#F0E68C', rgb: [240, 230, 140] },
  { name: 'Lavender', hex: '#E6E6FA', rgb: [230, 230, 250] },
  { name: 'LavenderBlush', hex: '#FFF0F5', rgb: [255, 240, 245] },
  { name: 'LawnGreen', hex: '#7CFC00', rgb: [124, 252, 0] },
  { name: 'LemonChiffon', hex: '#FFFACD', rgb: [255, 250, 205] },
  { name: 'LightBlue', hex: '#ADD8E6', rgb: [173, 216, 230] },
  { name: 'LightCoral', hex: '#F08080', rgb: [240, 128, 128] },
  { name: 'LightCyan', hex: '#E0FFFF', rgb: [224, 255, 255] },
  { name: 'LightGoldenRodYellow', hex: '#FAFAD2', rgb: [250, 250, 210] },
  { name: 'LightGray', hex: '#D3D3D3', rgb: [211, 211, 211] },
  { name: 'LightGrey', hex: '#D3D3D3', rgb: [211, 211, 211] },
  { name: 'LightGreen', hex: '#90EE90', rgb: [144, 238, 144] },
  { name: 'LightPink', hex: '#FFB6C1', rgb: [255, 182, 193] },
  { name: 'LightSalmon', hex: '#FFA07A', rgb: [255, 160, 122] },
  { name: 'LightSeaGreen', hex: '#20B2AA', rgb: [32, 178, 170] },
  { name: 'LightSkyBlue', hex: '#87CEFA', rgb: [135, 206, 250] },
  { name: 'LightSlateGray', hex: '#778899', rgb: [119, 136, 153] },
  { name: 'LightSlateGrey', hex: '#778899', rgb: [119, 136, 153] },
  { name: 'LightSteelBlue', hex: '#B0C4DE', rgb: [176, 196, 222] },
  { name: 'LightYellow', hex: '#FFFFE0', rgb: [255, 255, 224] },
  { name: 'Lime', hex: '#00FF00', rgb: [0, 255, 0] },
  { name: 'LimeGreen', hex: '#32CD32', rgb: [50, 205, 50] },
  { name: 'Linen', hex: '#FAF0E6', rgb: [250, 240, 230] },
  { name: 'Magenta', hex: '#FF00FF', rgb: [255, 0, 255] },
  { name: 'Maroon', hex: '#800000', rgb: [128, 0, 0] },
  { name: 'MediumAquaMarine', hex: '#66CDAA', rgb: [102, 205, 170] },
  { name: 'MediumBlue', hex: '#0000CD', rgb: [0, 0, 205] },
  { name: 'MediumOrchid', hex: '#BA55D3', rgb: [186, 85, 211] },
  { name: 'MediumPurple', hex: '#9370DB', rgb: [147, 112, 219] },
  { name: 'MediumSeaGreen', hex: '#3CB371', rgb: [60, 179, 113] },
  { name: 'MediumSlateBlue', hex: '#7B68EE', rgb: [123, 104, 238] },
  { name: 'MediumSpringGreen', hex: '#00FA9A', rgb: [0, 250, 154] },
  { name: 'MediumTurquoise', hex: '#48D1CC', rgb: [72, 209, 204] },
  { name: 'MediumVioletRed', hex: '#C71585', rgb: [199, 21, 133] },
  { name: 'MidnightBlue', hex: '#191970', rgb: [25, 25, 112] },
  { name: 'MintCream', hex: '#F5FFFA', rgb: [245, 255, 250] },
  { name: 'MistyRose', hex: '#FFE4E1', rgb: [255, 228, 225] },
  { name: 'Moccasin', hex: '#FFE4B5', rgb: [255, 228, 181] },
  { name: 'NavajoWhite', hex: '#FFDEAD', rgb: [255, 222, 173] },
  { name: 'Navy', hex: '#000080', rgb: [0, 0, 128] },
  { name: 'OldLace', hex: '#FDF5E6', rgb: [253, 245, 230] },
  { name: 'Olive', hex: '#808000', rgb: [128, 128, 0] },
  { name: 'OliveDrab', hex: '#6B8E23', rgb: [107, 142, 35] },
  { name: 'Orange', hex: '#FFA500', rgb: [255, 165, 0] },
  { name: 'OrangeRed', hex: '#FF4500', rgb: [255, 69, 0] },
  { name: 'Orchid', hex: '#DA70D6', rgb: [218, 112, 214] },
  { name: 'PaleGoldenRod', hex: '#EEE8AA', rgb: [238, 232, 170] },
  { name: 'PaleGreen', hex: '#98FB98', rgb: [152, 251, 152] },
  { name: 'PaleTurquoise', hex: '#AFEEEE', rgb: [175, 238, 238] },
  { name: 'PaleVioletRed', hex: '#DB7093', rgb: [219, 112, 147] },
  { name: 'PapayaWhip', hex: '#FFEFD5', rgb: [255, 239, 213] },
  { name: 'PeachPuff', hex: '#FFDAB9', rgb: [255, 218, 185] },
  { name: 'Peru', hex: '#CD853F', rgb: [205, 133, 63] },
  { name: 'Pink', hex: '#FFC0CB', rgb: [255, 192, 203] },
  { name: 'Plum', hex: '#DDA0DD', rgb: [221, 160, 221] },
  { name: 'PowderBlue', hex: '#B0E0E6', rgb: [176, 224, 230] },
  { name: 'Purple', hex: '#800080', rgb: [128, 0, 128] },
  { name: 'RebeccaPurple', hex: '#663399', rgb: [102, 51, 153] },
  { name: 'Red', hex: '#FF0000', rgb: [255, 0, 0] },
  { name: 'RosyBrown', hex: '#BC8F8F', rgb: [188, 143, 143] },
  { name: 'RoyalBlue', hex: '#4169E1', rgb: [65, 105, 225] },
  { name: 'SaddleBrown', hex: '#8B4513', rgb: [139, 69, 19] },
  { name: 'Salmon', hex: '#FA8072', rgb: [250, 128, 114] },
  { name: 'SandyBrown', hex: '#F4A460', rgb: [244, 164, 96] },
  { name: 'SeaGreen', hex: '#2E8B57', rgb: [46, 139, 87] },
  { name: 'SeaShell', hex: '#FFF5EE', rgb: [255, 245, 238] },
  { name: 'Sienna', hex: '#A0522D', rgb: [160, 82, 45] },
  { name: 'Silver', hex: '#C0C0C0', rgb: [192, 192, 192] },
  { name: 'SkyBlue', hex: '#87CEEB', rgb: [135, 206, 235] },
  { name: 'SlateBlue', hex: '#6A5ACD', rgb: [106, 90, 205] },
  { name: 'SlateGray', hex: '#708090', rgb: [112, 128, 144] },
  { name: 'SlateGrey', hex: '#708090', rgb: [112, 128, 144] },
  { name: 'Snow', hex: '#FFFAFA', rgb: [255, 250, 250] },
  { name: 'SpringGreen', hex: '#00FF7F', rgb: [0, 255, 127] },
  { name: 'SteelBlue', hex: '#4682B4', rgb: [70, 130, 180] },
  { name: 'Tan', hex: '#D2B48C', rgb: [210, 180, 140] },
  { name: 'Teal', hex: '#008080', rgb: [0, 128, 128] },
  { name: 'Thistle', hex: '#D8BFD8', rgb: [216, 191, 216] },
  { name: 'Tomato', hex: '#FF6347', rgb: [255, 99, 71] },
  { name: 'Turquoise', hex: '#40E0D0', rgb: [64, 224, 208] },
  { name: 'Violet', hex: '#EE82EE', rgb: [238, 130, 238] },
  { name: 'Wheat', hex: '#F5DEB3', rgb: [245, 222, 179] },
  { name: 'White', hex: '#FFFFFF', rgb: [255, 255, 255] },
  { name: 'WhiteSmoke', hex: '#F5F5F5', rgb: [245, 245, 245] },
  { name: 'Yellow', hex: '#FFFF00', rgb: [255, 255, 0] },
  { name: 'YellowGreen', hex: '#9ACD32', rgb: [154, 205, 50] },
];

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
}

function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(rgb1[0] - rgb2[0], 2) +
    Math.pow(rgb1[1] - rgb2[1], 2) +
    Math.pow(rgb1[2] - rgb2[2], 2)
  );
}

export function ColorNameFinder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [inputColor, setInputColor] = useState(initialData?.inputColor || '#6366f1');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ inputColor });
  }, [inputColor, onStateChange]);

  const closestColor = useMemo(() => {
    const rgb = hexToRgb(inputColor);
    if (!rgb) return null;

    let minDistance = Infinity;
    let closest = NAMED_COLORS[0];

    for (const color of NAMED_COLORS) {
      const distance = colorDistance(rgb, color.rgb);
      if (distance < minDistance) {
        minDistance = distance;
        closest = color;
      }
    }
    return { ...closest, distance: minDistance };
  }, [inputColor]);

  const handleCopy = useCallback(() => {
    if (!closestColor) return;
    navigator.clipboard.writeText(closestColor.name);
    setCopied(true);
    toast.success(t('common.copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [closestColor, t]);

  const handleReset = useCallback(() => {
    setInputColor('#6366f1');
  }, []);

  const handleCopyRef = useRef(handleCopy);
  const handleResetRef = useRef(handleReset);

  useEffect(() => {
    handleCopyRef.current = handleCopy;
    handleResetRef.current = handleReset;
  }, [handleCopy, handleReset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused && activeElement?.id !== 'color-picker') return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleResetRef.current();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopyRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Color Input Section */}
        <div className="space-y-8">
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
               <label htmlFor="color-picker" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                 {t('colorconverter.choose_color')}
               </label>
               <button
                 onClick={handleReset}
                 className="text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
               >
                 <RefreshCcw className="w-3 h-3" /> {t('common.reset')}
               </button>
             </div>
             <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
               <input
                 id="color-picker"
                 type="color"
                 value={inputColor}
                 onChange={(e) => setInputColor(e.target.value)}
                 className="w-20 h-20 rounded-2xl cursor-pointer bg-transparent border-none"
               />
               <div className="flex-1 space-y-2">
                 <input
                   type="text"
                   value={inputColor}
                   onChange={(e) => {
                     const val = e.target.value;
                     if (/^#[0-9A-F]{0,6}$/i.test(val)) {
                       setInputColor(val);
                     }
                   }}
                   className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 font-mono font-black text-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                 />
                 <div className="flex gap-2">
                    <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500">HEX</div>
                    <div className="text-[10px] font-bold text-slate-400">Click circle to pick</div>
                 </div>
               </div>
             </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-4">
            <Info className="w-6 h-6 text-indigo-600 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-bold dark:text-white text-sm">{t('color_finder.how_it_works_title')}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('color_finder.how_it_works_text')}
              </p>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('color_finder.closest_match')}</h3>
             {closestColor && (
               <div className="animate-in zoom-in-95 duration-300">
                  <div className="text-4xl md:text-5xl font-black tracking-tighter dark:text-white mb-2">
                    {closestColor.name}
                  </div>
                  <div className="text-sm font-bold text-indigo-500 font-mono">
                    {closestColor.hex}
                  </div>
               </div>
             )}
          </div>

          <div className="grid grid-cols-2 gap-4 h-48">
             <div className="rounded-3xl border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                <div className="flex-1" style={{ backgroundColor: inputColor }}></div>
                <div className="bg-white dark:bg-slate-900 p-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">{t('color_finder.your_color')}</div>
             </div>
             <div className="rounded-3xl border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                <div className="flex-1" style={{ backgroundColor: closestColor?.hex }}></div>
                <div className="bg-white dark:bg-slate-900 p-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">{t('color_finder.named_match')}</div>
             </div>
          </div>

          <button
            onClick={handleCopy}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 border-2 ${
              copied
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
            }`}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? t('common.copied') : t('color_finder.copy_name', { name: closestColor?.name })}
            {!copied && <kbd className="hidden sm:inline-flex items-center justify-center h-5 px-1.5 border border-white/20 rounded text-[10px] font-bold bg-white/10 ml-1">C</kbd>}
          </button>
        </div>
      </div>

      {/* Suggested Colors / History */}
      <div className="pt-12 border-t border-slate-100 dark:border-slate-800">
         <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2 px-1">
           <Palette className="w-4 h-4 text-indigo-500" /> {t('color_finder.similar_colors')}
         </h3>
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
           {NAMED_COLORS
             .map(c => ({ ...c, dist: colorDistance(hexToRgb(inputColor) || [0,0,0], c.rgb) }))
             .sort((a, b) => a.dist - b.dist)
             .slice(1, 6)
             .map(color => (
               <button
                 key={color.name}
                 onClick={() => setInputColor(color.hex)}
                 className="group p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-left hover:border-indigo-500/30 transition-all flex items-center gap-3"
               >
                 <div className="w-8 h-8 rounded-lg shadow-inner group-hover:scale-110 transition-transform" style={{ backgroundColor: color.hex }}></div>
                 <div className="min-w-0">
                    <div className="text-[10px] font-black truncate dark:text-white uppercase">{color.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{color.hex}</div>
                 </div>
               </button>
             ))}
         </div>
      </div>
    </div>
  );
}
