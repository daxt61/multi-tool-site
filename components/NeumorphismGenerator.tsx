import { useState, useMemo } from 'react';
import { Copy, Check, Info, Palette, Box, Settings, Maximize } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NeumorphismGenerator() {
  const { t } = useTranslation();
  const [size, setSize] = useState(200);
  const [radius, setRadius] = useState(50);
  const [distance, setDistance] = useState(20);
  const [intensity, setIntensity] = useState(0.15);
  const [blur, setBlur] = useState(40);
  const [color, setColor] = useState('#e0e0e0');
  const [shape, setShape] = useState<'flat' | 'concave' | 'convex' | 'pressed'>('flat');
  const [copied, setCopied] = useState(false);

  const { darkShadow, lightShadow, gradient } = useMemo(() => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const adjust = (val: number, factor: number) => {
      return Math.round(Math.min(Math.max(0, val + val * factor), 255));
    };

    const toHex = (val: number) => val.toString(16).padStart(2, '0');

    const darkR = adjust(r, -intensity);
    const darkG = adjust(g, -intensity);
    const darkB = adjust(b, -intensity);
    const darkHex = `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`;

    const lightR = adjust(r, intensity);
    const lightG = adjust(g, intensity);
    const lightB = adjust(b, intensity);
    const lightHex = `#${toHex(lightR)}${toHex(lightG)}${toHex(lightB)}`;

    let grad = '';
    if (shape === 'concave') {
      grad = `linear-gradient(145deg, ${darkHex}, ${lightHex})`;
    } else if (shape === 'convex') {
      grad = `linear-gradient(145deg, ${lightHex}, ${darkHex})`;
    }

    return {
      darkShadow: darkHex,
      lightShadow: lightHex,
      gradient: grad
    };
  }, [color, intensity, shape]);

  const boxShadow = shape === 'pressed'
    ? `inset ${distance}px ${distance}px ${blur}px ${darkShadow}, inset -${distance}px -${distance}px ${blur}px ${lightShadow}`
    : `${distance}px ${distance}px ${blur}px ${darkShadow}, -${distance}px -${distance}px ${blur}px ${lightShadow}`;

  const cssCode = `border-radius: ${radius}px;
background: ${shape === 'concave' || shape === 'convex' ? gradient : color};
box-shadow: ${boxShadow};`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span className="flex items-center gap-2"><Palette className="w-3 h-3" /> {t('neumorphism.background_color')}</span>
                <span className="text-indigo-500 font-mono uppercase">{color}</span>
              </div>
              <div className="flex gap-4">
                <input
                  type="color" value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-white border border-slate-200 dark:border-slate-700 p-1"
                />
                <input
                  type="text" value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span className="flex items-center gap-2"><Maximize className="w-3 h-3" /> {t('neumorphism.size')}</span>
                <span className="text-indigo-500">{size}px</span>
              </div>
              <input
                type="range" min="100" max="400" value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span className="flex items-center gap-2"><Maximize className="w-3 h-3" /> {t('neumorphism.radius')}</span>
                <span className="text-indigo-500">{radius}px</span>
              </div>
              <input
                type="range" min="0" max="100" value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span className="flex items-center gap-2"><Box className="w-3 h-3" /> {t('neumorphism.distance')}</span>
                <span className="text-indigo-500">{distance}px</span>
              </div>
              <input
                type="range" min="5" max="50" value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span className="flex items-center gap-2"><Settings className="w-3 h-3" /> {t('neumorphism.intensity')}</span>
                <span className="text-indigo-500">{Math.round(intensity * 100)}%</span>
              </div>
              <input
                type="range" min="0.01" max="0.6" step="0.01" value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <span className="flex items-center gap-2"><Settings className="w-3 h-3" /> {t('neumorphism.blur')}</span>
                <span className="text-indigo-500">{blur}px</span>
              </div>
              <input
                type="range" min="0" max="100" value={blur}
                onChange={(e) => setBlur(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('neumorphism.shape')}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['flat', 'concave', 'convex', 'pressed'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setShape(s)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      shape === s
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                    }`}
                  >
                    {t(`neumorphism.${s}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Code */}
        <div className="space-y-8 flex flex-col">
          <div
            style={{ backgroundColor: color }}
            className="flex-1 min-h-[400px] relative rounded-[2.5rem] flex items-center justify-center p-12 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <div
              style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: `${radius}px`,
                background: shape === 'concave' || shape === 'convex' ? gradient : color,
                boxShadow: boxShadow,
              }}
              className="flex flex-col items-center justify-center text-center p-8 space-y-4 transition-all duration-300"
            >
              <Box className="w-12 h-12 text-slate-400/50" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">CSS Code</label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié !' : 'Copier CSS'}
              </button>
            </div>
            <pre className="p-6 bg-slate-900 text-slate-300 rounded-[2rem] font-mono text-sm overflow-x-auto leading-relaxed border border-slate-800">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Qu'est-ce que le Neumorphisme ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le Neumorphisme (ou Soft UI) est un style visuel qui combine des ombres douces et des dégradés pour donner aux éléments une apparence "extrudée" du fond ou "enfoncée" dedans.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-500" /> Règle d'Or
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La couleur de l'élément doit être identique ou très proche de la couleur de fond. L'effet est créé par deux ombres : une claire en haut à gauche et une sombre en bas à droite.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" /> Accessibilité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Attention : le Neumorphisme peut poser des problèmes de contraste pour les utilisateurs malvoyants. Utilisez-le avec parcimonie pour les éléments interactifs critiques.
          </p>
        </div>
      </div>
    </div>
  );
}
