import React, { useState, useEffect } from 'react';
import { Copy, Check, RotateCcw, Layout, Maximize, Settings2, Link as LinkIcon, Unlink } from 'lucide-react';

interface BorderRadiusState {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
  linked: boolean;
}

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

  const getCssValue = () => {
    if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
      return `${topLeft}px`;
    }
    return `${topLeft}px ${topRight}px ${bottomRight}px ${bottomLeft}px`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`border-radius: ${getCssValue()};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setTopLeft(DEFAULT_STATE.topLeft);
    setTopRight(DEFAULT_STATE.topRight);
    setBottomRight(DEFAULT_STATE.bottomRight);
    setBottomLeft(DEFAULT_STATE.bottomLeft);
    setLinked(DEFAULT_STATE.linked);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex justify-end">
        <button
          onClick={handleReset}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" /> Paramètres
            </h4>
            <button
              onClick={() => setLinked(!linked)}
              className={`p-2 rounded-xl transition-all border flex items-center gap-2 text-xs font-bold ${
                linked
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
              }`}
            >
              {linked ? <LinkIcon className="w-3.5 h-3.5" /> : <Unlink className="w-3.5 h-3.5" />}
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
                 type="range"
                 min="0"
                 max="200"
                 value={topLeft}
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
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">CSS Code</h4>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800 text-indigo-600 border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
            <pre className="p-6 bg-slate-900 text-indigo-400 rounded-3xl font-mono text-sm border border-slate-800 overflow-x-auto">
              {`border-radius: ${getCssValue()};`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
