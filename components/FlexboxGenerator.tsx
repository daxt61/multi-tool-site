import { useState, useEffect, useRef } from 'react';
import { Layout, Copy, Check, Plus, Trash2, Info, RotateCcw, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface FlexItem {
  id: number;
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
  order: number;
  alignSelf: string;
}

interface FlexPreset {
  id: string;
  nameKey: string;
  flexDirection: string;
  flexWrap: string;
  justifyContent: string;
  alignItems: string;
  alignContent: string;
  gap: string;
}

const FLEX_PRESETS: FlexPreset[] = [
  { id: 'hero', nameKey: 'flexbox.preset_hero', flexDirection: 'column', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'center', alignContent: 'stretch', gap: '20' },
  { id: 'centered', nameKey: 'flexbox.preset_centered', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'center', alignContent: 'stretch', gap: '16' },
  { id: 'navbar', nameKey: 'flexbox.preset_navbar', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'center', alignContent: 'stretch', gap: '12' },
  { id: 'sidebar', nameKey: 'flexbox.preset_sidebar', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'flex-start', alignItems: 'stretch', alignContent: 'stretch', gap: '24' },
];

const DEFAULT_ITEMS: FlexItem[] = [
  { id: 1, flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0, alignSelf: 'auto' },
  { id: 2, flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0, alignSelf: 'auto' },
  { id: 3, flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0, alignSelf: 'auto' },
];

export function FlexboxGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  const [flexDirection, setFlexDirection] = useState(initialData?.flexDirection || 'row');
  const [flexWrap, setFlexWrap] = useState(initialData?.flexWrap || 'nowrap');
  const [justifyContent, setJustifyContent] = useState(initialData?.justifyContent || 'flex-start');
  const [alignItems, setAlignItems] = useState(initialData?.alignItems || 'stretch');
  const [alignContent, setAlignContent] = useState(initialData?.alignContent || 'stretch');
  const [gap, setGap] = useState(initialData?.gap || '10');
  const [items, setItems] = useState<FlexItem[]>(initialData?.items || DEFAULT_ITEMS);

  const [copied, setCopied] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onStateChange?.({ flexDirection, flexWrap, justifyContent, alignItems, alignContent, gap, items });
  }, [flexDirection, flexWrap, justifyContent, alignItems, alignContent, gap, items]);

  const addItem = () => {
    if (items.length >= 12) return;
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems([...items, { id: newId, flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0, alignSelf: 'auto' }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
    if (selectedItemIndex !== null && items[selectedItemIndex]?.id === id) {
      setSelectedItemIndex(null);
    }
  };

  const updateItem = (index: number, updates: Partial<FlexItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: flexDirection as any,
    flexWrap: flexWrap as any,
    justifyContent: justifyContent as any,
    alignItems: alignItems as any,
    alignContent: alignContent as any,
    gap: `${gap}px`,
  };

  const generateCSS = () => {
    let css = `.container {\n  display: flex;\n  flex-direction: ${flexDirection};\n  flex-wrap: ${flexWrap};\n  justify-content: ${justifyContent};\n  align-items: ${alignItems};\n  align-content: ${alignContent};\n  gap: ${gap}px;\n}\n\n`;

    items.forEach((item) => {
      const hasCustomProps = item.flexGrow !== 0 || item.flexShrink !== 1 || item.flexBasis !== 'auto' || item.order !== 0 || item.alignSelf !== 'auto';
      if (hasCustomProps) {
        css += `.item-${item.id} {\n`;
        if (item.flexGrow !== 0) css += `  flex-grow: ${item.flexGrow};\n`;
        if (item.flexShrink !== 1) css += `  flex-shrink: ${item.flexShrink};\n`;
        if (item.flexBasis !== 'auto') css += `  flex-basis: ${item.flexBasis};\n`;
        if (item.order !== 0) css += `  order: ${item.order};\n`;
        if (item.alignSelf !== 'auto') css += `  align-self: ${item.alignSelf};\n`;
        css += `}\n\n`;
      }
    });
    return css.trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateCSS());
    setCopied(true);
    toast.success(t('flexbox.toast_copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setFlexDirection('row');
    setFlexWrap('nowrap');
    setJustifyContent('flex-start');
    setAlignItems('stretch');
    setAlignContent('stretch');
    setGap('10');
    setItems(DEFAULT_ITEMS);
    setSelectedItemIndex(null);
    toast.success(t('flexbox.toast_reset'));
    primaryInputRef.current?.focus();
  };

  const handlePresetSelect = (preset: FlexPreset) => {
    setFlexDirection(preset.flexDirection);
    setFlexWrap(preset.flexWrap);
    setJustifyContent(preset.justifyContent);
    setAlignItems(preset.alignItems);
    setAlignContent(preset.alignContent);
    setGap(preset.gap);
    toast.success(t('flexbox.toast_preset_applied', { name: t(preset.nameKey) }));
  };

  // Keyboard shortcut handlers
  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  }, [handleReset, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isWithinContainer = containerRef.current?.contains(activeEl) || activeEl === document.body;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          (activeEl as HTMLElement).isContentEditable);

      if (e.key === 'Escape' && isWithinContainer) {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if ((e.key === 'c' || e.key === 'C') && !isInputFocused && isWithinContainer && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Quick Presets */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" /> {t('flexbox.presets')}
          </h3>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 flex items-center gap-2 transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label={t('flexbox.reset')}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>{t('flexbox.reset')}</span>
            <Kbd modifier={null}>Esc</Kbd>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FLEX_PRESETS.map((preset) => {
            const isActive =
              flexDirection === preset.flexDirection &&
              flexWrap === preset.flexWrap &&
              justifyContent === preset.justifyContent &&
              alignItems === preset.alignItems &&
              alignContent === preset.alignContent &&
              gap === preset.gap;

            return (
              <button
                key={preset.id}
                onClick={() => handlePresetSelect(preset)}
                aria-pressed={isActive}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border text-left flex flex-col gap-1 ${
                  isActive
                    ? 'bg-indigo-500 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-slate-800/80'
                }`}
              >
                <span>{t(preset.nameKey)}</span>
                <span className={`text-[10px] font-normal ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {preset.flexDirection} • {preset.justifyContent}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Layout className="w-4 h-4 text-indigo-500" /> {t('flexbox.container_props')}
            </h3>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">flex-direction</span>
                <div className="grid grid-cols-2 gap-2">
                  {['row', 'row-reverse', 'column', 'column-reverse'].map(dir => (
                    <button
                      key={dir}
                      onClick={() => setFlexDirection(dir)}
                      aria-pressed={flexDirection === dir}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${flexDirection === dir ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">flex-wrap</span>
                <div className="grid grid-cols-3 gap-2">
                  {['nowrap', 'wrap', 'wrap-reverse'].map(w => (
                    <button
                      key={w}
                      onClick={() => setFlexWrap(w)}
                      aria-pressed={flexWrap === w}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${flexWrap === w ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="flex-justify-content" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">justify-content</label>
                <select
                  id="flex-justify-content"
                  value={justifyContent}
                  onChange={(e) => setJustifyContent(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all dark:text-white"
                >
                  {['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="flex-align-items" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">align-items</label>
                <select
                  id="flex-align-items"
                  value={alignItems}
                  onChange={(e) => setAlignItems(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all dark:text-white"
                >
                  {['stretch', 'flex-start', 'flex-end', 'center', 'baseline'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="flex-align-content" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">align-content</label>
                <select
                  id="flex-align-content"
                  value={alignContent}
                  onChange={(e) => setAlignContent(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all dark:text-white"
                >
                  {['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="flex-gap" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('flexbox.gap')} ({gap}px)
                  </label>
                </div>
                <input
                  ref={primaryInputRef}
                  id="flex-gap"
                  type="range"
                  min="0"
                  max="100"
                  value={gap}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Number(gap)}
                  aria-label={t('flexbox.gap')}
                  onChange={(e) => setGap(e.target.value)}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Layout className="w-4 h-4 text-emerald-500" /> {t('flexbox.items')}
              </h3>
              <button
                onClick={addItem}
                disabled={items.length >= 12}
                aria-label={t('flexbox.add_item')}
                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemIndex(selectedItemIndex === index ? null : index)}
                  aria-pressed={selectedItemIndex === index}
                  aria-label={`Select item ${item.id}`}
                  className={`h-10 rounded-xl font-black text-xs transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${selectedItemIndex === index ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                  {item.id}
                </button>
              ))}
            </div>

            {selectedItemIndex !== null && items[selectedItemIndex] && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-indigo-500">{t('flexbox.item_props')} {items[selectedItemIndex].id}</span>
                  <button
                    onClick={() => removeItem(items[selectedItemIndex].id)}
                    aria-label={t('flexbox.delete_item')}
                    className="text-rose-500 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-lg p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor={`flex-grow-${items[selectedItemIndex].id}`} className="text-[9px] font-bold text-slate-400 uppercase">flex-grow</label>
                    <input
                      id={`flex-grow-${items[selectedItemIndex].id}`}
                      type="number"
                      value={items[selectedItemIndex].flexGrow}
                      onChange={(e) => updateItem(selectedItemIndex, { flexGrow: Number(e.target.value) })}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`flex-shrink-${items[selectedItemIndex].id}`} className="text-[9px] font-bold text-slate-400 uppercase">flex-shrink</label>
                    <input
                      id={`flex-shrink-${items[selectedItemIndex].id}`}
                      type="number"
                      value={items[selectedItemIndex].flexShrink}
                      onChange={(e) => updateItem(selectedItemIndex, { flexShrink: Number(e.target.value) })}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`flex-basis-${items[selectedItemIndex].id}`} className="text-[9px] font-bold text-slate-400 uppercase">flex-basis</label>
                    <input
                      id={`flex-basis-${items[selectedItemIndex].id}`}
                      type="text"
                      value={items[selectedItemIndex].flexBasis}
                      onChange={(e) => updateItem(selectedItemIndex, { flexBasis: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor={`flex-order-${items[selectedItemIndex].id}`} className="text-[9px] font-bold text-slate-400 uppercase">order</label>
                    <input
                      id={`flex-order-${items[selectedItemIndex].id}`}
                      type="number"
                      value={items[selectedItemIndex].order}
                      onChange={(e) => updateItem(selectedItemIndex, { order: Number(e.target.value) })}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor={`flex-align-self-${items[selectedItemIndex].id}`} className="text-[9px] font-bold text-slate-400 uppercase">align-self</label>
                  <select
                    id={`flex-align-self-${items[selectedItemIndex].id}`}
                    value={items[selectedItemIndex].alignSelf}
                    onChange={(e) => updateItem(selectedItemIndex, { alignSelf: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    {['auto', 'flex-start', 'flex-end', 'center', 'baseline', 'stretch'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-100 dark:bg-slate-950 rounded-[2.5rem] border-4 border-slate-200 dark:border-slate-800 p-8 min-h-[500px] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('flexbox.preview')}</span>
               <div className="flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
               </div>
            </div>

            <div
              className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 transition-all duration-300"
              style={containerStyle}
            >
              {items.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemIndex(selectedItemIndex === index ? null : index)}
                  className={`min-w-[60px] min-h-[60px] rounded-xl flex items-center justify-center font-black transition-all cursor-pointer select-none border-2 shadow-xs ${selectedItemIndex === index ? 'bg-emerald-500 border-emerald-400 text-white scale-105 z-10' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:border-indigo-300'}`}
                  style={{
                    flexGrow: item.flexGrow,
                    flexShrink: item.flexShrink,
                    flexBasis: item.flexBasis,
                    order: item.order,
                    alignSelf: item.alignSelf as any,
                  }}
                >
                  {item.id}
                </div>
              ))}
            </div>
          </div>

          {/* Generated CSS */}
          <div className="relative group/copy">
            <button
              onClick={handleCopy}
              className={`absolute top-4 right-4 px-3 py-2 rounded-xl transition-all border flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 shadow-xs border-slate-100 dark:border-slate-700'
              }`}
              aria-label={copied ? t('common.copied') : t('common.copy')}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <Kbd modifier={null} className={copied ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}>
                C
              </Kbd>
            </button>
            <pre className="bg-slate-900 dark:bg-black p-8 rounded-[2rem] text-indigo-400 font-mono text-sm overflow-x-auto">
              <code>{generateCSS()}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-xs">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white">{t('flexbox.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('flexbox.about_text')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-2">
              <h5 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400">{t('flexbox.container_title')}</h5>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <li>• <span className="font-bold">flex-direction :</span> Row, Column...</li>
                <li>• <span className="font-bold">justify-content :</span> Alignment on main axis.</li>
                <li>• <span className="font-bold">align-items :</span> Alignment on cross axis.</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h5 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">{t('flexbox.items_title')}</h5>
              <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <li>• <span className="font-bold">flex-grow :</span> Ability to grow.</li>
                <li>• <span className="font-bold">flex-shrink :</span> Ability to shrink.</li>
                <li>• <span className="font-bold">align-self :</span> Override alignment for individual item.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
