import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Copy, Check, Info, Palette, Box, Settings, Maximize, RotateCcw, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface Preset {
  id: string;
  name: string;
  size: number;
  radius: number;
  distance: number;
  intensity: number;
  blur: number;
  color: string;
  shape: 'flat' | 'concave' | 'convex' | 'pressed';
}

const PRESETS: Preset[] = [
  { id: 'soft-card', name: 'Soft Card', size: 200, radius: 30, distance: 15, intensity: 0.15, blur: 30, color: '#e0e0e0', shape: 'flat' },
  { id: 'pressed-btn', name: 'Pressed Button', size: 180, radius: 50, distance: 10, intensity: 0.20, blur: 20, color: '#e0e0e0', shape: 'pressed' },
  { id: 'concave-dial', name: 'Concave Dial', size: 200, radius: 100, distance: 20, intensity: 0.15, blur: 40, color: '#e0e0e0', shape: 'concave' },
  { id: 'vibrant-convex', name: 'Vibrant Convex', size: 220, radius: 40, distance: 25, intensity: 0.25, blur: 45, color: '#6366f1', shape: 'convex' },
];

const DEFAULT_STATE = {
  size: 200,
  radius: 50,
  distance: 20,
  intensity: 0.15,
  blur: 40,
  color: '#e0e0e0',
  shape: 'flat' as const,
};

export function NeumorphismGenerator() {
  const { t } = useTranslation();
  const [size, setSize] = useState(DEFAULT_STATE.size);
  const [radius, setRadius] = useState(DEFAULT_STATE.radius);
  const [distance, setDistance] = useState(DEFAULT_STATE.distance);
  const [intensity, setIntensity] = useState(DEFAULT_STATE.intensity);
  const [blur, setBlur] = useState(DEFAULT_STATE.blur);
  const [color, setColor] = useState(DEFAULT_STATE.color);
  const [shape, setShape] = useState<'flat' | 'concave' | 'convex' | 'pressed'>(DEFAULT_STATE.shape);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  const { darkShadow, lightShadow, gradient } = useMemo(() => {
    const hex = color.replace('#', '');
    const validHex = hex.length === 6 ? hex : 'e0e0e0';
    const r = parseInt(validHex.substring(0, 2), 16) || 0;
    const g = parseInt(validHex.substring(2, 4), 16) || 0;
    const b = parseInt(validHex.substring(4, 6), 16) || 0;

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

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    toast.success('CSS code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [cssCode]);

  const handleReset = useCallback(() => {
    setSize(DEFAULT_STATE.size);
    setRadius(DEFAULT_STATE.radius);
    setDistance(DEFAULT_STATE.distance);
    setIntensity(DEFAULT_STATE.intensity);
    setBlur(DEFAULT_STATE.blur);
    setColor(DEFAULT_STATE.color);
    setShape(DEFAULT_STATE.shape);
    setActivePresetId(null);
    toast.success('Neumorphism parameters reset');
    setTimeout(() => primaryInputRef.current?.focus(), 0);
  }, []);

  const handleApplyPreset = (preset: Preset) => {
    setSize(preset.size);
    setRadius(preset.radius);
    setDistance(preset.distance);
    setIntensity(preset.intensity);
    setBlur(preset.blur);
    setColor(preset.color);
    setShape(preset.shape);
    setActivePresetId(preset.id);
    toast.success(`Preset "${preset.name}" applied!`);
  };

  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  }, [handleReset, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      const isBodyOrComponent =
        !activeElement ||
        activeElement === document.body ||
        containerRef.current?.contains(activeElement as Node);

      if (e.key === 'Escape' && isBodyOrComponent) {
        e.preventDefault();
        handlersRef.current.handleReset();
        return;
      }

      if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!isEditable && isBodyOrComponent) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-12">
      {/* Quick Presets */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" /> Quick Presets
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isActive}
                className={`px-4 py-3 border rounded-2xl transition-all text-left group focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md'
                }`}
              >
                <span className={`text-xs font-bold transition-colors block ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                  {preset.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5 uppercase">
                  {preset.shape} • {preset.color}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Header */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          aria-label="Réinitialiser les paramètres de Neumorphism (Esc)"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Réinitialiser
          <Kbd modifier={null} className="hidden sm:inline-flex bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-500">Esc</Kbd>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Controls */}
        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="neo-color-text" className="flex items-center gap-2 cursor-pointer">
                  <Palette className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" /> {t('neumorphism.background_color')}
                </label>
                <span className="text-indigo-500 font-mono uppercase">{color}</span>
              </div>
              <div className="flex gap-4">
                <input
                  id="neo-color-picker"
                  type="color"
                  value={color}
                  aria-label="Sélectionner la couleur de fond"
                  onChange={(e) => {
                    setColor(e.target.value);
                    if (activePresetId) setActivePresetId(null);
                  }}
                  className="w-12 h-12 rounded-xl cursor-pointer bg-white border border-slate-200 dark:border-slate-700 p-1"
                />
                <input
                  id="neo-color-text"
                  ref={primaryInputRef}
                  type="text"
                  value={color}
                  onChange={(e) => {
                    setColor(e.target.value);
                    if (activePresetId) setActivePresetId(null);
                  }}
                  className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="neo-size" className="flex items-center gap-2 cursor-pointer">
                  <Maximize className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" /> {t('neumorphism.size')}
                </label>
                <span className="text-indigo-500 font-mono">{size}px</span>
              </div>
              <input
                id="neo-size"
                type="range"
                min="100"
                max="400"
                value={size}
                aria-valuemin={100}
                aria-valuemax={400}
                aria-valuenow={size}
                aria-label="Taille en pixels"
                onChange={(e) => {
                  setSize(Number(e.target.value));
                  if (activePresetId) setActivePresetId(null);
                }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="neo-radius" className="flex items-center gap-2 cursor-pointer">
                  <Maximize className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" /> {t('neumorphism.radius')}
                </label>
                <span className="text-indigo-500 font-mono">{radius}px</span>
              </div>
              <input
                id="neo-radius"
                type="range"
                min="0"
                max="100"
                value={radius}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={radius}
                aria-label="Rayon en pixels"
                onChange={(e) => {
                  setRadius(Number(e.target.value));
                  if (activePresetId) setActivePresetId(null);
                }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="neo-distance" className="flex items-center gap-2 cursor-pointer">
                  <Box className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" /> {t('neumorphism.distance')}
                </label>
                <span className="text-indigo-500 font-mono">{distance}px</span>
              </div>
              <input
                id="neo-distance"
                type="range"
                min="5"
                max="50"
                value={distance}
                aria-valuemin={5}
                aria-valuemax={50}
                aria-valuenow={distance}
                aria-label="Distance en pixels"
                onChange={(e) => {
                  setDistance(Number(e.target.value));
                  if (activePresetId) setActivePresetId(null);
                }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="neo-intensity" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" /> {t('neumorphism.intensity')}
                </label>
                <span className="text-indigo-500 font-mono">{Math.round(intensity * 100)}%</span>
              </div>
              <input
                id="neo-intensity"
                type="range"
                min="0.01"
                max="0.6"
                step="0.01"
                value={intensity}
                aria-valuemin={0.01}
                aria-valuemax={0.6}
                aria-valuenow={intensity}
                aria-label="Intensité de l'ombre en pourcentage"
                onChange={(e) => {
                  setIntensity(Number(e.target.value));
                  if (activePresetId) setActivePresetId(null);
                }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400 px-1">
                <label htmlFor="neo-blur" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="w-3.5 h-3.5 text-indigo-500" aria-hidden="true" /> {t('neumorphism.blur')}
                </label>
                <span className="text-indigo-500 font-mono">{blur}px</span>
              </div>
              <input
                id="neo-blur"
                type="range"
                min="0"
                max="100"
                value={blur}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={blur}
                aria-label="Flou de l'ombre en pixels"
                onChange={(e) => {
                  setBlur(Number(e.target.value));
                  if (activePresetId) setActivePresetId(null);
                }}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 block">{t('neumorphism.shape')}</span>
              <div className="grid grid-cols-2 gap-2">
                {(['flat', 'concave', 'convex', 'pressed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setShape(s);
                      if (activePresetId) setActivePresetId(null);
                    }}
                    aria-pressed={shape === s}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border focus-visible:ring-2 focus-visible:ring-indigo-500 ${
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
              <Box className="w-12 h-12 text-slate-400/50" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="neumorphism-css-code" className="text-xs font-black uppercase tracking-widest text-slate-400">CSS Code</label>
              <button
                type="button"
                onClick={handleCopy}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                }`}
                aria-label="Copier le code CSS (C)"
              >
                {copied ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
                {copied ? 'Copié !' : 'Copier CSS'}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex bg-indigo-700 text-indigo-100 border-indigo-500">C</Kbd>}
              </button>
            </div>
            <pre id="neumorphism-css-code" className="p-6 bg-slate-900 text-slate-300 rounded-[2rem] font-mono text-sm overflow-x-auto leading-relaxed border border-slate-800">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" aria-hidden="true" /> Qu'est-ce que le Neumorphisme ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le Neumorphisme (ou Soft UI) est un style visuel qui combine des ombres douces et des dégradés pour donner aux éléments une apparence "extrudée" du fond ou "enfoncée" dedans.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-500" aria-hidden="true" /> Règle d'Or
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La couleur de l'élément doit être identique ou très proche de la couleur de fond. L'effet est créé par deux ombres : une claire en haut à gauche et une sombre en bas à droite.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-500" aria-hidden="true" /> Accessibilité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Attention : le Neumorphisme peut poser des problèmes de contraste pour les utilisateurs malvoyants. Utilisez-le avec parcimonie pour les éléments interactifs critiques.
          </p>
        </div>
      </div>
    </div>
  );
}
