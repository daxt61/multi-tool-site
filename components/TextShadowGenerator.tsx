import { useState, useEffect, useCallback, useRef } from 'react';
import { Type, Plus, Trash2, Copy, Check, Info, RotateCcw, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';
import { getSecureRandomInt } from './ui/crypto';

const MAX_LENGTH = 500;

interface Shadow {
  id: string;
  x: number;
  y: number;
  blur: number;
  color: string;
  opacity: number;
}

interface Preset {
  id: string;
  name: string;
  textColor: string;
  fontSize: number;
  shadows: Shadow[];
}

const PRESETS: Preset[] = [
  {
    id: 'subtle-drop',
    name: 'Subtle Drop',
    textColor: '#1e293b',
    fontSize: 64,
    shadows: [
      { id: '1', x: 2, y: 4, blur: 8, color: '#000000', opacity: 0.25 }
    ]
  },
  {
    id: '3d-neon-glow',
    name: '3D Neon Glow',
    textColor: '#ffffff',
    fontSize: 64,
    shadows: [
      { id: '1', x: 0, y: 0, blur: 10, color: '#6366f1', opacity: 1 },
      { id: '2', x: 0, y: 0, blur: 20, color: '#818cf8', opacity: 0.8 },
      { id: '3', x: 0, y: 0, blur: 40, color: '#c084fc', opacity: 0.6 }
    ]
  },
  {
    id: 'retro-layered',
    name: 'Retro Layered',
    textColor: '#f43f5e',
    fontSize: 64,
    shadows: [
      { id: '1', x: 3, y: 3, blur: 0, color: '#fbbf24', opacity: 1 },
      { id: '2', x: 6, y: 6, blur: 0, color: '#06b6d4', opacity: 1 },
      { id: '3', x: 9, y: 9, blur: 0, color: '#1e1b4b', opacity: 1 }
    ]
  },
  {
    id: 'soft-blur',
    name: 'Soft Blur',
    textColor: '#4f46e5',
    fontSize: 64,
    shadows: [
      { id: '1', x: 0, y: 12, blur: 24, color: '#4f46e5', opacity: 0.35 }
    ]
  }
];

export function TextShadowGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [shadows, setShadows] = useState<Shadow[]>(initialData?.shadows || [
    { id: '1', x: 2, y: 2, blur: 4, color: '#000000', opacity: 0.5 }
  ]);
  const [previewText, setPreviewText] = useState((initialData?.previewText || 'Hello World').slice(0, MAX_LENGTH));
  const [textColor, setTextColor] = useState(initialData?.textColor || '#4f46e5');
  const [fontSize, setFontSize] = useState(initialData?.fontSize || 64);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ shadows, previewText, textColor, fontSize });
  }, [shadows, previewText, textColor, fontSize, onStateChange]);

  const addShadow = () => {
    const newShadow: Shadow = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `fallback-${getSecureRandomInt(1000000)}`,
      x: 0,
      y: 0,
      blur: 5,
      color: '#000000',
      opacity: 0.3
    };
    setShadows([...shadows, newShadow]);
    toast.success('New shadow layer added');
  };

  const removeShadow = (id: string) => {
    if (shadows.length <= 1) {
      toast.error('At least one shadow layer is required');
      return;
    }
    setShadows(shadows.filter(s => s.id !== id));
    toast.success('Shadow layer removed');
  };

  const updateShadow = (id: string, updates: Partial<Shadow>) => {
    setShadows(shadows.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const moveShadow = (index: number, direction: 'up' | 'down') => {
    const newShadows = [...shadows];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= shadows.length) return;
    [newShadows[index], newShadows[targetIndex]] = [newShadows[targetIndex], newShadows[index]];
    setShadows(newShadows);
  };

  const generateCss = useCallback(() => {
    return shadows.map(s => {
      const r = parseInt(s.color.slice(1, 3), 16);
      const g = parseInt(s.color.slice(3, 5), 16);
      const b = parseInt(s.color.slice(5, 7), 16);
      return `${s.x}px ${s.y}px ${s.blur}px rgba(${r}, ${g}, ${b}, ${s.opacity})`;
    }).join(', ');
  }, [shadows]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(`text-shadow: ${generateCss()};`);
    setCopied(true);
    toast.success('CSS code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [generateCss]);

  const handleReset = useCallback(() => {
    setShadows([{ id: '1', x: 2, y: 2, blur: 4, color: '#000000', opacity: 0.5 }]);
    setTextColor('#4f46e5');
    setFontSize(64);
    setPreviewText('Hello World');
    toast.success('Text shadow parameters reset');
    previewInputRef.current?.focus();
  }, []);

  const handleApplyPreset = (preset: Preset) => {
    setShadows(preset.shadows);
    setTextColor(preset.textColor);
    setFontSize(preset.fontSize);
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
        if (!isEditable) {
          e.preventDefault();
          handlersRef.current.handleReset();
        } else {
          (activeElement as HTMLElement)?.blur();
        }
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
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 px-1">
          <Sparkles className="w-4 h-4 text-indigo-500" aria-hidden="true" /> Quick Presets
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-left group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                {preset.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {preset.shadows.length} layer{preset.shadows.length > 1 ? 's' : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('textshadow.config')}</h4>
              <button
                type="button"
                onClick={handleReset}
                aria-label={`${t('common.reset')} (Esc)`}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t('common.reset')}</span>
                <Kbd modifier={null} className="hidden sm:inline-flex bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-500">Esc</Kbd>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="preview-text-input" className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('textshadow.preview_text')}</label>
                  <span className="text-[9px] text-slate-400 font-bold">{previewText.length} / {MAX_LENGTH}</span>
                </div>
                <input
                  id="preview-text-input"
                  ref={previewInputRef}
                  type="text"
                  maxLength={MAX_LENGTH}
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="text-color-hex" className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('textshadow.text_color')}</label>
                  <div className="flex gap-2">
                    <input
                      id="text-color-picker"
                      type="color"
                      value={textColor}
                      aria-label="Selector text color picker"
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700"
                    />
                    <input
                      id="text-color-hex"
                      type="text"
                      value={textColor}
                      aria-label="Text color hex code"
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs uppercase font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="font-size-input" className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('textshadow.font_size')}</label>
                  <input
                    id="font-size-input"
                    type="number"
                    min="12"
                    max="160"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value) || 12)}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('textshadow.layers')}</h4>
                <button
                  type="button"
                  onClick={addShadow}
                  aria-label="Add shadow layer"
                  className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                {shadows.map((shadow, index) => (
                  <div key={shadow.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">#{index + 1}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => moveShadow(index, 'up')}
                          aria-label={`Move shadow #${index + 1} up`}
                          className="p-1 hover:text-indigo-500 transition-colors disabled:opacity-30 focus-visible:ring-1 focus-visible:ring-indigo-500"
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveShadow(index, 'down')}
                          aria-label={`Move shadow #${index + 1} down`}
                          className="p-1 hover:text-indigo-500 transition-colors disabled:opacity-30 focus-visible:ring-1 focus-visible:ring-indigo-500"
                          disabled={index === shadows.length - 1}
                        >
                          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeShadow(shadow.id)}
                          aria-label={`Remove shadow #${index + 1}`}
                          className="p-1 hover:text-rose-500 transition-colors ml-1 focus-visible:ring-1 focus-visible:ring-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <div className="flex justify-between items-center">
                           <label htmlFor={`shadow-x-${shadow.id}`} className="text-[9px] font-black uppercase text-slate-400">X: {shadow.x}px</label>
                         </div>
                         <input
                           id={`shadow-x-${shadow.id}`}
                           type="range"
                           min="-50"
                           max="50"
                           value={shadow.x}
                           aria-valuemin={-50}
                           aria-valuemax={50}
                           aria-valuenow={shadow.x}
                           aria-label={`Shadow #${index + 1} X offset in pixels`}
                           onChange={(e) => updateShadow(shadow.id, { x: parseInt(e.target.value) })}
                           className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                         />
                       </div>
                       <div className="space-y-1">
                         <div className="flex justify-between items-center">
                           <label htmlFor={`shadow-y-${shadow.id}`} className="text-[9px] font-black uppercase text-slate-400">Y: {shadow.y}px</label>
                         </div>
                         <input
                           id={`shadow-y-${shadow.id}`}
                           type="range"
                           min="-50"
                           max="50"
                           value={shadow.y}
                           aria-valuemin={-50}
                           aria-valuemax={50}
                           aria-valuenow={shadow.y}
                           aria-label={`Shadow #${index + 1} Y offset in pixels`}
                           onChange={(e) => updateShadow(shadow.id, { y: parseInt(e.target.value) })}
                           className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                         />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <div className="flex justify-between items-center">
                           <label htmlFor={`shadow-blur-${shadow.id}`} className="text-[9px] font-black uppercase text-slate-400">Blur: {shadow.blur}px</label>
                         </div>
                         <input
                           id={`shadow-blur-${shadow.id}`}
                           type="range"
                           min="0"
                           max="50"
                           value={shadow.blur}
                           aria-valuemin={0}
                           aria-valuemax={50}
                           aria-valuenow={shadow.blur}
                           aria-label={`Shadow #${index + 1} blur radius in pixels`}
                           onChange={(e) => updateShadow(shadow.id, { blur: parseInt(e.target.value) })}
                           className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                         />
                       </div>
                       <div className="space-y-1">
                         <div className="flex justify-between items-center">
                           <label htmlFor={`shadow-opacity-${shadow.id}`} className="text-[9px] font-black uppercase text-slate-400">Opacity: {Math.round(shadow.opacity * 100)}%</label>
                         </div>
                         <input
                           id={`shadow-opacity-${shadow.id}`}
                           type="range"
                           min="0"
                           max="1"
                           step="0.01"
                           value={shadow.opacity}
                           aria-valuemin={0}
                           aria-valuemax={1}
                           aria-valuenow={shadow.opacity}
                           aria-label={`Shadow #${index + 1} opacity percentage`}
                           onChange={(e) => updateShadow(shadow.id, { opacity: parseFloat(e.target.value) })}
                           className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                         />
                       </div>
                    </div>

                    <div className="space-y-1">
                      <label htmlFor={`shadow-color-${shadow.id}`} className="text-[9px] font-black uppercase text-slate-400">{t('common.color')}</label>
                      <input
                        id={`shadow-color-${shadow.id}`}
                        type="color"
                        value={shadow.color}
                        aria-label={`Shadow #${index + 1} color`}
                        onChange={(e) => updateShadow(shadow.id, { color: e.target.value })}
                        className="w-full h-6 rounded cursor-pointer border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-100 dark:bg-slate-900/80 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 h-[400px] flex items-center justify-center overflow-hidden p-12">
            <h2
              style={{
                color: textColor,
                fontSize: `${fontSize}px`,
                textShadow: generateCss(),
                fontWeight: '900',
                textAlign: 'center',
                wordBreak: 'break-word',
                lineHeight: '1.2'
              }}
            >
              {previewText}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
               <div id="css-output-heading" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                 <Type className="w-4 h-4 text-indigo-500" aria-hidden="true" /> CSS Output
               </div>
               <button
                 type="button"
                 onClick={handleCopy}
                 aria-label="Copy CSS code (C)"
                 className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 border ${
                   copied
                     ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg'
                     : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500'
                 } focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none`}
               >
                 {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                 <span>{copied ? t('common.copied') : t('common.copy')}</span>
                 {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1">C</Kbd>}
               </button>
            </div>
            <pre aria-labelledby="css-output-heading" className="p-6 bg-slate-900 text-indigo-300 rounded-3xl font-mono text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
              text-shadow: {generateCss()};
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" aria-hidden="true" />
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('textshadow.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('textshadow.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
