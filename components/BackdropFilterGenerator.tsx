import { useState, useMemo, useEffect, useRef } from 'react';
import { Copy, Check, Info, LayoutGrid, Sliders, Type, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

export function BackdropFilterGenerator() {
  const { t } = useTranslation();
  const [blur, setBlur] = useState(5);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);
  const [invert, setInvert] = useState(0);
  const [opacity, setOpacity] = useState(100);
  const [sepia, setSepia] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState('rgba(255, 255, 255, 0.3)');
  const [previewBg, setPreviewBg] = useState('mesh');
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  const backdropFilter = useMemo(() => {
    const filters = [];
    if (blur !== 0) filters.push(`blur(${blur}px)`);
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (grayscale !== 0) filters.push(`grayscale(${grayscale}%)`);
    if (hueRotate !== 0) filters.push(`hue-rotate(${hueRotate}deg)`);
    if (invert !== 0) filters.push(`invert(${invert}%)`);
    if (opacity !== 100) filters.push(`opacity(${opacity}%)`);
    if (sepia !== 0) filters.push(`sepia(${sepia}%)`);

    return filters.length > 0 ? filters.join(' ') : 'none';
  }, [blur, brightness, contrast, grayscale, hueRotate, invert, opacity, sepia]);

  const cssSnippet = `background-color: ${backgroundColor};\nbackdrop-filter: ${backdropFilter};\n-webkit-backdrop-filter: ${backdropFilter};`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cssSnippet);
    setCopied(true);
    toast.success(t('backdropfilter.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setBlur(5);
    setBrightness(100);
    setContrast(100);
    setGrayscale(0);
    setHueRotate(0);
    setInvert(0);
    setOpacity(100);
    setSepia(0);
    setBackgroundColor('rgba(255, 255, 255, 0.3)');
    toast.success(t('backdropfilter.toast_reset'));
    primaryInputRef.current?.focus();
  };

  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        containerRef.current &&
        !containerRef.current.contains(activeElement) &&
        activeElement !== document.body
      ) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey) {
        const isEditingText =
          activeElement instanceof HTMLInputElement && activeElement.type === 'text';
        if (!isEditingText) {
          e.preventDefault();
          handlersRef.current.handleCopy();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const bgStyles = {
    mesh: 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] from-indigo-500/20 via-purple-500/20 to-pink-500/20',
    dots: 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)]',
    image: 'bg-[url("https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000")] bg-cover bg-center',
    colors: 'bg-gradient-to-br from-rose-400 via-fuchsia-500 to-indigo-500'
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('backdropfilter.filters')}
              </h3>
              <button
                onClick={handleReset}
                className="text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg px-2 py-1"
              >
                <RefreshCcw className="w-3 h-3" aria-hidden="true" />
                <span>{t('common.reset')}</span>
                <Kbd modifier={null}>Esc</Kbd>
              </button>
            </div>

            <div className="space-y-4">
              {[
                { id: 'Blur', label: t('backdropfilter.blur'), value: blur, set: setBlur, min: 0, max: 20, unit: 'px' },
                { id: 'Brightness', label: t('backdropfilter.brightness'), value: brightness, set: setBrightness, min: 0, max: 200, unit: '%' },
                { id: 'Contrast', label: t('backdropfilter.contrast'), value: contrast, set: setContrast, min: 0, max: 200, unit: '%' },
                { id: 'Grayscale', label: t('backdropfilter.grayscale'), value: grayscale, set: setGrayscale, min: 0, max: 100, unit: '%' },
                { id: 'HueRotate', label: t('backdropfilter.hue_rotate'), value: hueRotate, set: setHueRotate, min: 0, max: 360, unit: 'deg' },
                { id: 'Invert', label: t('backdropfilter.invert'), value: invert, set: setInvert, min: 0, max: 100, unit: '%' },
                { id: 'Opacity', label: t('backdropfilter.opacity'), value: opacity, set: setOpacity, min: 0, max: 100, unit: '%' },
                { id: 'Sepia', label: t('backdropfilter.sepia'), value: sepia, set: setSepia, min: 0, max: 100, unit: '%' },
              ].map((f, idx) => (
                <div key={f.id} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <label htmlFor={`filter-${f.id}`} className="cursor-pointer">{f.label}</label>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{f.value}{f.unit}</span>
                  </div>
                  <input
                    ref={idx === 0 ? primaryInputRef : undefined}
                    id={`filter-${f.id}`}
                    type="range"
                    min={f.min}
                    max={f.max}
                    value={f.value}
                    aria-valuemin={f.min}
                    aria-valuemax={f.max}
                    aria-valuenow={f.value}
                    aria-label={f.label}
                    onChange={(e) => f.set(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  />
                </div>
              ))}

              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <label htmlFor="bg-color-rgba" className="cursor-pointer">{t('backdropfilter.bg_color')}</label>
                </div>
                <input
                  id="bg-color-rgba"
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 space-y-4">
             <div className="flex justify-between items-center">
               <label htmlFor="css-snippet-output" className="text-[10px] font-black uppercase tracking-widest text-white/40 cursor-pointer">
                 {t('backdropfilter.css_snippet')}
               </label>
               <button
                 onClick={handleCopy}
                 className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                   copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                 }`}
               >
                 {copied ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
                 <span>{copied ? t('common.copied') : t('common.copy')}</span>
                 <Kbd modifier={null} className="bg-white/20 text-white border-white/20">C</Kbd>
               </button>
             </div>
             <pre id="css-snippet-output" className="text-xs font-mono text-indigo-300 leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-indigo-500/30">
               {cssSnippet}
             </pre>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-4 md:p-8 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('backdropfilter.preview')}
              </h3>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {Object.keys(bgStyles).map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setPreviewBg(bg)}
                    aria-pressed={previewBg === bg}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      previewBg === bg ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {t(`backdropfilter.${bg}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className={`aspect-video rounded-3xl relative overflow-hidden flex items-center justify-center ${bgStyles[previewBg as keyof typeof bgStyles]}`}>
               {/* Elements behind the filter */}
               <div className="absolute top-10 left-10 w-20 h-20 bg-rose-500 rounded-full animate-bounce" />
               <div className="absolute bottom-10 right-20 w-32 h-32 bg-amber-400 rounded-lg rotate-12" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-white/20 rounded-full" />

               {/* The filtered element */}
               <div
                 className="w-3/4 h-3/4 rounded-3xl border border-white/30 shadow-2xl flex flex-col items-center justify-center text-center p-8 transition-all duration-300"
                 style={{
                   backgroundColor,
                   backdropFilter,
                   WebkitBackdropFilter: backdropFilter
                 }}
               >
                 <Type className="w-12 h-12 text-white mb-4 drop-shadow-lg" />
                 <h4 className="text-2xl font-black text-white drop-shadow-lg mb-2">Glassmorphism</h4>
                 <p className="text-sm font-medium text-white/90 drop-shadow-md">
                   Testing the backdrop-filter property in real-time. This element mimics a frosted glass effect.
                 </p>
               </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
             <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <Info className="w-6 h-6" />
             </div>
             <div className="space-y-2">
                <h4 className="font-bold dark:text-white">What is Backdrop Filter?</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  The <code>backdrop-filter</code> CSS property lets you apply graphical effects such as blurring or color shifting to the area behind an element.
                  Because it applies to everything <em>behind</em> the element, to see the effect, you must make the element or its background at least partially transparent.
                </p>
                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Browser Compatibility</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Supported in all modern browsers. Safari requires the <code>-webkit-</code> prefix.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
