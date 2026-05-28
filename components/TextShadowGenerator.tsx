import { useState, useEffect } from 'react';
import { Type, Plus, Trash2, Copy, Check, Info, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Shadow {
  id: string;
  x: number;
  y: number;
  blur: number;
  color: string;
  opacity: number;
}

export function TextShadowGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [shadows, setShadows] = useState<Shadow[]>(initialData?.shadows || [
    { id: '1', x: 2, y: 2, blur: 4, color: '#000000', opacity: 0.5 }
  ]);
  const [previewText, setPreviewText] = useState(initialData?.previewText || 'Hello World');
  const [textColor, setTextColor] = useState(initialData?.textColor || '#4f46e5');
  const [fontSize, setFontSize] = useState(initialData?.fontSize || 64);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ shadows, previewText, textColor, fontSize });
  }, [shadows, previewText, textColor, fontSize, onStateChange]);

  const addShadow = () => {
    const newShadow: Shadow = {
      id: Math.random().toString(36).substr(2, 9),
      x: 0,
      y: 0,
      blur: 5,
      color: '#000000',
      opacity: 0.3
    };
    setShadows([...shadows, newShadow]);
  };

  const removeShadow = (id: string) => {
    setShadows(shadows.filter(s => s.id !== id));
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

  const generateCss = () => {
    return shadows.map(s => {
      const r = parseInt(s.color.slice(1, 3), 16);
      const g = parseInt(s.color.slice(3, 5), 16);
      const b = parseInt(s.color.slice(5, 7), 16);
      return `${s.x}px ${s.y}px ${s.blur}px rgba(${r}, ${g}, ${b}, ${s.opacity})`;
    }).join(', ');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`text-shadow: ${generateCss()};`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setShadows([{ id: '1', x: 2, y: 2, blur: 4, color: '#000000', opacity: 0.5 }]);
    setTextColor('#4f46e5');
    setFontSize(64);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('textshadow.config')}</h4>
              <button onClick={handleReset} aria-label={t('common.reset')} className="text-rose-500 hover:text-rose-600 transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('textshadow.preview_text')}</label>
                <input
                  type="text"
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('textshadow.text_color')}</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="flex-1 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs uppercase font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('textshadow.font_size')}</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('textshadow.layers')}</h4>
                <button
                  onClick={addShadow}
                  aria-label="Add Shadow"
                  className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                {shadows.map((shadow, index) => (
                  <div key={shadow.id} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 relative group">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">#{index + 1}</span>
                      <div className="flex gap-1">
                        <button onClick={() => moveShadow(index, 'up')} className="p-1 hover:text-indigo-500 transition-colors disabled:opacity-30" disabled={index === 0}>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveShadow(index, 'down')} className="p-1 hover:text-indigo-500 transition-colors disabled:opacity-30" disabled={index === shadows.length - 1}>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeShadow(shadow.id)} className="p-1 hover:text-rose-500 transition-colors ml-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-slate-400">X: {shadow.x}px</label>
                         <input type="range" min="-50" max="50" value={shadow.x} onChange={(e) => updateShadow(shadow.id, { x: parseInt(e.target.value) })} className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-slate-400">Y: {shadow.y}px</label>
                         <input type="range" min="-50" max="50" value={shadow.y} onChange={(e) => updateShadow(shadow.id, { y: parseInt(e.target.value) })} className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-slate-400">Blur: {shadow.blur}px</label>
                         <input type="range" min="0" max="50" value={shadow.blur} onChange={(e) => updateShadow(shadow.id, { blur: parseInt(e.target.value) })} className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                       </div>
                       <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-slate-400">Opacity: {Math.round(shadow.opacity * 100)}%</label>
                         <input type="range" min="0" max="1" step="0.01" value={shadow.opacity} onChange={(e) => updateShadow(shadow.id, { opacity: parseFloat(e.target.value) })} className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                       </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400">{t('common.color')}</label>
                      <input type="color" value={shadow.color} onChange={(e) => updateShadow(shadow.id, { color: e.target.value })} className="w-full h-6 rounded cursor-pointer" />
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
               <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                 <Type className="w-4 h-4 text-indigo-500" /> CSS Output
               </div>
               <button
                 onClick={handleCopy}
                 className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                   copied ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-500'
                 }`}
               >
                 {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                 {copied ? t('common.copied') : t('common.copy')}
               </button>
            </div>
            <pre className="p-6 bg-slate-900 text-indigo-300 rounded-3xl font-mono text-sm overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
              text-shadow: {generateCss()};
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <Info className="w-6 h-6 text-indigo-500 mt-1" />
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
