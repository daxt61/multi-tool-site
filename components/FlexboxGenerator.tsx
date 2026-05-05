import { useState, useEffect } from 'react';
import { Layout, Copy, Check, Plus, Minus, Trash2, Info, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FlexItem {
  id: number;
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
  order: number;
  alignSelf: string;
}

export function FlexboxGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();

  const [flexDirection, setFlexDirection] = useState(initialData?.flexDirection || 'row');
  const [flexWrap, setFlexWrap] = useState(initialData?.flexWrap || 'nowrap');
  const [justifyContent, setJustifyContent] = useState(initialData?.justifyContent || 'flex-start');
  const [alignItems, setAlignItems] = useState(initialData?.alignItems || 'stretch');
  const [alignContent, setAlignContent] = useState(initialData?.alignContent || 'stretch');
  const [gap, setGap] = useState(initialData?.gap || '10');
  const [items, setItems] = useState<FlexItem[]>(initialData?.items || [
    { id: 1, flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0, alignSelf: 'auto' },
    { id: 2, flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0, alignSelf: 'auto' },
    { id: 3, flexGrow: 0, flexShrink: 1, flexBasis: 'auto', order: 0, alignSelf: 'auto' },
  ]);

  const [copied, setCopied] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);

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

    items.forEach((item, index) => {
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
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Layout className="w-4 h-4 text-indigo-500" /> {t('flexbox.container_props')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">flex-direction</label>
                <div className="grid grid-cols-2 gap-2">
                  {['row', 'row-reverse', 'column', 'column-reverse'].map(dir => (
                    <button
                      key={dir}
                      onClick={() => setFlexDirection(dir)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${flexDirection === dir ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                    >
                      {dir}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">flex-wrap</label>
                <div className="grid grid-cols-3 gap-2">
                  {['nowrap', 'wrap', 'wrap-reverse'].map(w => (
                    <button
                      key={w}
                      onClick={() => setFlexWrap(w)}
                      className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${flexWrap === w ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">justify-content</label>
                <select
                  value={justifyContent}
                  onChange={(e) => setJustifyContent(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                >
                  {['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">align-items</label>
                <select
                  value={alignItems}
                  onChange={(e) => setAlignItems(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                >
                  {['stretch', 'flex-start', 'flex-end', 'center', 'baseline'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">align-content</label>
                <select
                  value={alignContent}
                  onChange={(e) => setAlignContent(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                >
                  {['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'].map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">gap ({gap}px)</label>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={gap}
                  onChange={(e) => setGap(e.target.value)}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
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
                className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItemIndex(selectedItemIndex === index ? null : index)}
                  className={`h-10 rounded-xl font-black text-xs transition-all border ${selectedItemIndex === index ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'}`}
                >
                  {item.id}
                </button>
              ))}
            </div>

            {selectedItemIndex !== null && items[selectedItemIndex] && (
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-indigo-500">{t('flexbox.item_props')} {items[selectedItemIndex].id}</span>
                  <button onClick={() => removeItem(items[selectedItemIndex].id)} className="text-rose-500 hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">flex-grow</label>
                    <input
                      type="number"
                      value={items[selectedItemIndex].flexGrow}
                      onChange={(e) => updateItem(selectedItemIndex, { flexGrow: Number(e.target.value) })}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">flex-shrink</label>
                    <input
                      type="number"
                      value={items[selectedItemIndex].flexShrink}
                      onChange={(e) => updateItem(selectedItemIndex, { flexShrink: Number(e.target.value) })}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">flex-basis</label>
                    <input
                      type="text"
                      value={items[selectedItemIndex].flexBasis}
                      onChange={(e) => updateItem(selectedItemIndex, { flexBasis: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">order</label>
                    <input
                      type="number"
                      value={items[selectedItemIndex].order}
                      onChange={(e) => updateItem(selectedItemIndex, { order: Number(e.target.value) })}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">align-self</label>
                  <select
                    value={items[selectedItemIndex].alignSelf}
                    onChange={(e) => updateItem(selectedItemIndex, { alignSelf: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold dark:text-white"
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
                  className={`min-w-[60px] min-h-[60px] rounded-xl flex items-center justify-center font-black transition-all cursor-pointer select-none border-2 shadow-sm ${selectedItemIndex === index ? 'bg-emerald-500 border-emerald-400 text-white scale-105 z-10' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:border-indigo-300'}`}
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
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleCopy}
                className={`p-2 rounded-xl transition-all border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-800 shadow-sm border-slate-100 dark:border-slate-700'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre className="bg-slate-900 dark:bg-black p-8 rounded-[2rem] text-indigo-400 font-mono text-sm overflow-x-auto">
              <code>{generateCSS()}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
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
