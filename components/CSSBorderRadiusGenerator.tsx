import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, RotateCcw, Settings2, Link as LinkIcon, Unlink, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface BorderRadiusState {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
  linked: boolean;
}

interface Preset {
  id: string;
  name: string;
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
  linked: boolean;
}

const PRESETS: Preset[] = [
  { id: 'subtle-card', name: 'Subtle Card', topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12, linked: true },
  { id: 'pill-button', name: 'Pill / Rounded', topLeft: 50, topRight: 50, bottomRight: 50, bottomLeft: 50, linked: true },
  { id: 'asymmetric-tag', name: 'Asymmetric Tag', topLeft: 24, topRight: 4, bottomRight: 24, bottomLeft: 4, linked: false },
  { id: 'circle-avatar', name: 'Circle / Oval', topLeft: 100, topRight: 100, bottomRight: 100, bottomLeft: 100, linked: true },
];

const DEFAULT_STATE: BorderRadiusState = {
  topLeft: 20,
  topRight: 20,
  bottomRight: 20,
  bottomLeft: 20,
  linked: true,
};

export function CSSBorderRadiusGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [topLeft, setTopLeft] = useState<number>(initialData?.topLeft ?? DEFAULT_STATE.topLeft);
  const [topRight, setTopRight] = useState<number>(initialData?.topRight ?? DEFAULT_STATE.topRight);
  const [bottomRight, setBottomRight] = useState<number>(initialData?.bottomRight ?? DEFAULT_STATE.bottomRight);
  const [bottomLeft, setBottomLeft] = useState<number>(initialData?.bottomLeft ?? DEFAULT_STATE.bottomLeft);
  const [linked, setLinked] = useState<boolean>(initialData?.linked ?? DEFAULT_STATE.linked);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ topLeft, topRight, bottomRight, bottomLeft, linked });
  }, [topLeft, topRight, bottomRight, bottomLeft, linked]);

  const updateAll = (val: number) => {
    setTopLeft(val);
    setTopRight(val);
    setBottomRight(val);
    setBottomLeft(val);
  };

  const handleTopLeftChange = (val: number) => {
    setTopLeft(val);
    if (linked) updateAll(val);
  };

  const getCssValue = useCallback(() => {
    if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
      return `${topLeft}px`;
    }
    return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
  }, [topLeft, topRight, bottomRight, bottomLeft]);

  const cssCode = `border-radius: ${getCssValue()};`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(cssCode);
    setCopied(true);
    toast.success('CSS code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }, [cssCode]);

  const handleReset = useCallback(() => {
    setTopLeft(DEFAULT_STATE.topLeft);
    setTopRight(DEFAULT_STATE.topRight);
    setBottomRight(DEFAULT_STATE.bottomRight);
    setBottomLeft(DEFAULT_STATE.bottomLeft);
    setLinked(DEFAULT_STATE.linked);
    toast.success('Border radius parameters reset');
    primaryInputRef.current?.focus();
  }, []);

  const handleApplyPreset = (preset: Preset) => {
    setTopLeft(preset.topLeft);
    setTopRight(preset.topRight);
    setBottomRight(preset.bottomRight);
    setBottomLeft(preset.bottomLeft);
    setLinked(preset.linked);
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
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-12">
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
              className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all text-left group"
            >
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                {preset.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {preset.linked ? `${preset.topLeft}px` : `${preset.topLeft}px ${preset.topRight}px...`}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
          aria-label="Réinitialiser les paramètres de border-radius (Esc)"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Réinitialiser
          <Kbd modifier={null} className="hidden sm:inline-flex bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-500">Esc</Kbd>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" aria-hidden="true" /> Paramètres
            </h4>
            <button
              type="button"
              onClick={() => setLinked(!linked)}
              aria-pressed={linked}
              className={`p-2 rounded-xl transition-all border flex items-center gap-2 text-xs font-bold ${
                linked
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
              }`}
            >
              {linked ? <LinkIcon className="w-3.5 h-3.5" aria-hidden="true" /> : <Unlink className="w-3.5 h-3.5" aria-hidden="true" />}
              {linked ? 'Liés' : 'Indépendants'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
               <div className="flex justify-between items-center">
                 <label htmlFor="tl" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Haut-Gauche</label>
                 <span className="text-sm font-black font-mono dark:text-slate-300">{topLeft}px</span>
               </div>
               <input
                 id="tl"
                 ref={primaryInputRef}
                 type="range"
                 min="0"
                 max="200"
                 value={topLeft}
                 aria-valuemin={0}
                 aria-valuemax={200}
                 aria-valuenow={topLeft}
                 aria-label="Rayon haut-gauche en pixels"
                 onChange={(e) => handleTopLeftChange(Number(e.target.value))}
                 className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-indigo-600"
               />
            </div>

            {!linked && (
              <>
                <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                   <div className="flex justify-between items-center">
                     <label htmlFor="tr" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Haut-Droite</label>
                     <span className="text-sm font-black font-mono dark:text-slate-300">{topRight}px</span>
                   </div>
                   <input
                     id="tr"
                     type="range"
                     min="0"
                     max="200"
                     value={topRight}
                     aria-valuemin={0}
                     aria-valuemax={200}
                     aria-valuenow={topRight}
                     aria-label="Rayon haut-droite en pixels"
                     onChange={(e) => setTopRight(Number(e.target.value))}
                     className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-indigo-600"
                   />
                </div>
                <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                   <div className="flex justify-between items-center">
                     <label htmlFor="br" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bas-Droite</label>
                     <span className="text-sm font-black font-mono dark:text-slate-300">{bottomRight}px</span>
                   </div>
                   <input
                     id="br"
                     type="range"
                     min="0"
                     max="200"
                     value={bottomRight}
                     aria-valuemin={0}
                     aria-valuemax={200}
                     aria-valuenow={bottomRight}
                     aria-label="Rayon bas-droite en pixels"
                     onChange={(e) => setBottomRight(Number(e.target.value))}
                     className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-indigo-600"
                   />
                </div>
                <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                   <div className="flex justify-between items-center">
                     <label htmlFor="bl" className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bas-Gauche</label>
                     <span className="text-sm font-black font-mono dark:text-slate-300">{bottomLeft}px</span>
                   </div>
                   <input
                     id="bl"
                     type="range"
                     min="0"
                     max="200"
                     value={bottomLeft}
                     aria-valuemin={0}
                     aria-valuemax={200}
                     aria-valuenow={bottomLeft}
                     aria-label="Rayon bas-gauche en pixels"
                     onChange={(e) => setBottomLeft(Number(e.target.value))}
                     className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200 dark:bg-slate-700 accent-indigo-600"
                   />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-100 dark:bg-slate-900/80 rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-800 p-12 flex items-center justify-center min-h-[300px]">
            <div
              style={{
                borderRadius: getCssValue(),
                width: '200px',
                height: '200px',
              }}
              className="bg-indigo-600 shadow-2xl shadow-indigo-600/20 transition-all duration-300"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span id="border-radius-css-label" className="text-xs font-black uppercase tracking-widest text-slate-400">CSS Code</span>
              <button
                type="button"
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                }`}
                aria-label="Copier le code CSS (C)"
              >
                {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied ? 'Copié !' : 'Copier'}
                {!copied && <Kbd modifier={null} className="hidden sm:inline-flex ml-1">C</Kbd>}
              </button>
            </div>
            <pre aria-labelledby="border-radius-css-label" className="p-6 bg-slate-900 text-indigo-400 rounded-3xl font-mono text-sm border border-slate-800 overflow-x-auto">
              {cssCode}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
