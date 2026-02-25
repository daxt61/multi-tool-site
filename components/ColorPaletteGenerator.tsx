import { useState, useMemo } from 'react';
import { Copy, Check, RefreshCw, Palette, Layers, Grid, Info } from 'lucide-react';

export function ColorPaletteGenerator() {
  const [baseColor, setBaseColor] = useState('#6366f1');
  const [copied, setCopied] = useState<string | null>(null);

  const hexToHsl = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.substring(1, 3), 16);
      g = parseInt(hex.substring(3, 5), 16);
      b = parseInt(hex.substring(5, 7), 16);
    }
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const palettes = useMemo(() => {
    const { h, s, l } = hexToHsl(baseColor);

    const generatePalette = (offsets: number[]) => {
      return offsets.map(offset => hslToHex((h + offset + 360) % 360, s, l));
    };

    return [
      {
        name: 'Complémentaire',
        colors: generatePalette([0, 180]),
        desc: 'Couleurs opposées sur le cercle chromatique.'
      },
      {
        name: 'Analogue',
        colors: generatePalette([-30, 0, 30]),
        desc: 'Couleurs adjacentes pour une harmonie douce.'
      },
      {
        name: 'Triadique',
        colors: generatePalette([0, 120, 240]),
        desc: 'Trois couleurs équidistantes pour un contraste vibrant.'
      },
      {
        name: 'Monochromatique',
        colors: [
          hslToHex(h, s, Math.max(l - 30, 10)),
          hslToHex(h, s, Math.max(l - 15, 20)),
          baseColor,
          hslToHex(h, s, Math.min(l + 15, 85)),
          hslToHex(h, s, Math.min(l + 30, 95)),
        ],
        desc: 'Variations de luminosité d\'une seule teinte.'
      },
      {
        name: 'Tétradique',
        colors: generatePalette([0, 90, 180, 270]),
        desc: 'Quatre couleurs formant un rectangle, offrant une grande variété.'
      }
    ];
  }, [baseColor]);

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopied(hex);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateRandom = () => {
    // Sentinel: Use cryptographically secure random values instead of Math.random()
    // for high entropy and uniform distribution of colors.
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    const randomHex = '#' + (array[0] & 0xFFFFFF).toString(16).padStart(6, '0');
    setBaseColor(randomHex);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Control Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="space-y-2">
            <label htmlFor="baseColor" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Couleur de base</label>
            <div className="flex items-center gap-3">
              <input
                id="baseColor"
                type="color"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="w-16 h-16 rounded-2xl border-4 border-white dark:border-slate-800 shadow-lg cursor-pointer overflow-hidden"
              />
              <input
                type="text"
                value={baseColor.toUpperCase()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9A-F]{0,6}$/i.test(val)) setBaseColor(val);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl font-mono font-black text-lg w-32 focus:border-indigo-500 outline-none transition-all dark:text-white"
              />
            </div>
          </div>
        </div>

        <button
          onClick={generateRandom}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" /> Générer aléatoirement
        </button>
      </div>

      {/* Palettes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {palettes.map((palette) => (
          <div key={palette.name} className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-6 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black dark:text-white">{palette.name}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{palette.desc}</p>
              </div>
              <Palette className="w-5 h-5 text-indigo-500 opacity-20" />
            </div>

            <div className="flex h-24 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
              {palette.colors.map((color, i) => (
                <button
                  key={`${palette.name}-${i}`}
                  onClick={() => copyToClipboard(color)}
                  className="flex-1 relative group transition-all hover:flex-[1.5]"
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    {copied === color ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
               {palette.colors.map((color, i) => (
                 <button
                   key={i}
                   onClick={() => copyToClipboard(color)}
                   className="text-[10px] font-mono font-black py-2 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 transition-all dark:text-slate-300 flex items-center justify-between group"
                 >
                   {color.toUpperCase()}
                   <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </button>
               ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex items-start gap-4">
         <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <Layers className="w-6 h-6" />
         </div>
         <div className="space-y-2">
            <h4 className="font-bold dark:text-white">Comment utiliser les palettes de couleurs ?</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Choisissez une couleur de base et explorez les différentes harmonies générées automatiquement. La théorie des couleurs aide à créer des designs équilibrés et agréables à l'œil. Cliquez sur n'importe quelle couleur pour copier son code HEX dans votre presse-papiers.
            </p>
         </div>
      </div>
    </div>
  );
}
