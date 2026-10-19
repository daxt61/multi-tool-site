import { useState, useRef, useEffect, useCallback } from 'react';
import { Info, Trash2, Copy, Check, Sparkles, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface Product {
  price: string;
  quantity: string;
  unit: string;
}

interface Preset {
  id: string;
  labelKey: string;
  a: Product;
  b: Product;
  c: Product;
}

const UNITS = [
  { id: 'g', label: 'Grammes (g)', factor: 1 },
  { id: 'kg', label: 'Kilogrammes (kg)', factor: 1000 },
  { id: 'ml', label: 'Millilitres (ml)', factor: 1 },
  { id: 'l', label: 'Litres (l)', factor: 1000 },
  { id: 'unit', label: 'Unités', factor: 1 },
];

const PRESETS: Preset[] = [
  {
    id: 'cereal',
    labelKey: 'unitprice.preset_cereal',
    a: { price: '4.50', quantity: '375', unit: 'g' },
    b: { price: '6.20', quantity: '600', unit: 'g' },
    c: { price: '8.20', quantity: '850', unit: 'g' },
  },
  {
    id: 'soda',
    labelKey: 'unitprice.preset_soda',
    a: { price: '1.20', quantity: '330', unit: 'ml' },
    b: { price: '2.10', quantity: '1.5', unit: 'l' },
    c: { price: '4.50', quantity: '1980', unit: 'ml' },
  },
  {
    id: 'papertowel',
    labelKey: 'unitprice.preset_papertowel',
    a: { price: '2.50', quantity: '2', unit: 'unit' },
    b: { price: '6.80', quantity: '6', unit: 'unit' },
    c: { price: '12.00', quantity: '12', unit: 'unit' },
  },
  {
    id: 'coffee',
    labelKey: 'unitprice.preset_coffee',
    a: { price: '4.90', quantity: '250', unit: 'g' },
    b: { price: '8.90', quantity: '500', unit: 'g' },
    c: { price: '16.50', quantity: '1000', unit: 'g' },
  },
];

export function UnitPriceCalculator() {
  const { t } = useTranslation();
  const [productA, setProductA] = useState<Product>({ price: '', quantity: '', unit: 'g' });
  const [productB, setProductB] = useState<Product>({ price: '', quantity: '', unit: 'g' });
  const [productC, setProductC] = useState<Product>({ price: '', quantity: '', unit: 'g' });
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const primaryInputRef = useRef<HTMLInputElement>(null);

  const calculateUnitPrice = (p: Product) => {
    const price = parseFloat(p.price);
    const quantity = parseFloat(p.quantity);
    if (isNaN(price) || isNaN(quantity) || quantity === 0) return null;

    const unit = UNITS.find((u) => u.id === p.unit);
    const totalQuantityInBase = quantity * (unit?.factor || 1);

    // Price per 100 units (100g, 100ml, 1 unit)
    const pricePerBase = (price / totalQuantityInBase) * (p.unit === 'unit' ? 1 : 100);
    return pricePerBase;
  };

  const unitPriceA = calculateUnitPrice(productA);
  const unitPriceB = calculateUnitPrice(productB);
  const unitPriceC = calculateUnitPrice(productC);

  const betterValue = () => {
    const prices = [
      { id: 'A', price: unitPriceA },
      { id: 'B', price: unitPriceB },
      { id: 'C', price: unitPriceC },
    ].filter((p) => p.price !== null);

    if (prices.length < 2) return null;

    const minPrice = Math.min(...prices.map((p) => p.price!));
    const winners = prices.filter((p) => p.price === minPrice);

    if (winners.length > 1) return 'equal';
    return winners[0].id;
  };

  const win = betterValue();

  const handleApplyPreset = (preset: Preset) => {
    setProductA(preset.a);
    setProductB(preset.b);
    setProductC(preset.c);
    setActivePresetId(preset.id);
    toast.success(t('unitprice.preset_loaded'));
    setTimeout(() => {
      primaryInputRef.current?.focus();
    }, 0);
  };

  const handleClearAll = useCallback(() => {
    setProductA({ price: '', quantity: '', unit: 'g' });
    setProductB({ price: '', quantity: '', unit: 'g' });
    setProductC({ price: '', quantity: '', unit: 'g' });
    setActivePresetId(null);
    toast.success(t('unitprice.cleared'));
    setTimeout(() => {
      primaryInputRef.current?.focus();
    }, 0);
  }, [t]);

  const handleCopySummary = useCallback(() => {
    const results: string[] = [];
    if (unitPriceA !== null) {
      results.push(`Product A: ${productA.price}€ / ${productA.quantity}${productA.unit} (${unitPriceA.toFixed(3)}€/100)`);
    }
    if (unitPriceB !== null) {
      results.push(`Product B: ${productB.price}€ / ${productB.quantity}${productB.unit} (${unitPriceB.toFixed(3)}€/100)`);
    }
    if (unitPriceC !== null) {
      results.push(`Product C: ${productC.price}€ / ${productC.quantity}${productC.unit} (${unitPriceC.toFixed(3)}€/100)`);
    }

    if (results.length === 0) return;

    let summary = results.join('\n');
    if (win && win !== 'equal') {
      summary += `\nBest Value: Product ${win}`;
    } else if (win === 'equal') {
      summary += `\nBest Value: Equal value between multiple products`;
    }

    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast.success(t('unitprice.summary_copied'));
    setTimeout(() => setCopied(false), 2000);
  }, [unitPriceA, unitPriceB, unitPriceC, productA, productB, productC, win, t]);

  // Keydown listeners for Esc and C
  const handlersRef = useRef({
    onClear: handleClearAll,
    onCopy: handleCopySummary,
  });

  useEffect(() => {
    handlersRef.current = {
      onClear: handleClearAll,
      onCopy: handleCopySummary,
    };
  }, [handleClearAll, handleCopySummary]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement;

      const isInsideContainer = containerRef.current?.contains(activeElement) || activeElement === document.body;

      if (!isInsideContainer) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.onClear();
      } else if (e.key.toLowerCase() === 'c' && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handlersRef.current.onCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateProductA = (p: Product) => {
    setActivePresetId(null);
    setProductA(p);
  };

  const updateProductB = (p: Product) => {
    setActivePresetId(null);
    setProductB(p);
  };

  const updateProductC = (p: Product) => {
    setActivePresetId(null);
    setProductC(p);
  };

  const hasAnyInput =
    Boolean(productA.price || productA.quantity) ||
    Boolean(productB.price || productB.quantity) ||
    Boolean(productC.price || productC.quantity);

  const hasMultiplePrices = [unitPriceA, unitPriceB, unitPriceC].filter((p) => p !== null).length >= 1;

  interface ProductSectionProps {
    id: string;
    product: Product;
    setProduct: (p: Product) => void;
    unitPrice: number | null;
    isWinner: boolean;
    colorClass: string;
    isFirst?: boolean;
  }

  const ProductSection = ({ id, product, setProduct, unitPrice, isWinner, colorClass, isFirst }: ProductSectionProps) => (
    <div
      className={`p-6 rounded-[2.5rem] border-2 transition-all ${
        isWinner
          ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-500 shadow-xl shadow-emerald-500/10'
          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-6">
        <h3 className="font-black uppercase tracking-wider text-xs sm:text-sm flex items-center gap-2 text-slate-800 dark:text-slate-100 whitespace-nowrap shrink-0">
          <span className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${colorClass} text-white flex items-center justify-center text-xs shrink-0`}>{id}</span>
          <span>{t('unitprice.product', { id })}</span>
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setProduct({ price: '', quantity: '', unit: 'g' })}
            disabled={!product.price && !product.quantity}
            className="text-[11px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            aria-label={`${t('common.clear')} ${t('unitprice.product', { id })}`}
          >
            <Trash2 className="w-3 h-3" /> {t('common.clear')}
          </button>
          {isWinner && (
            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-full">
              {t('unitprice.cheaper')}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor={`price${id}`} className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            {t('unitprice.price')}
          </label>
          <input
            id={`price${id}`}
            ref={isFirst ? primaryInputRef : undefined}
            type="number"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
            className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black font-mono outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all dark:text-white"
            placeholder="0.00"
            step="any"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor={`qty${id}`} className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
              {t('unitprice.quantity')}
            </label>
            <input
              id={`qty${id}`}
              type="number"
              value={product.quantity}
              onChange={(e) => setProduct({ ...product, quantity: e.target.value })}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black font-mono outline-none focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all dark:text-white"
              placeholder="0"
              step="any"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`unit${id}`} className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
              {t('unitprice.unit')}
            </label>
            <select
              id={`unit${id}`}
              value={product.unit}
              onChange={(e) => setProduct({ ...product, unit: e.target.value })}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 transition-all dark:text-white"
            >
              {UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {unitPrice !== null && (
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
            {t('unitprice.for100', {
              unit: product.unit === 'unit' ? ' unité' : product.unit.includes('l') ? 'ml' : 'g',
            })}
          </div>
          <div className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {unitPrice.toFixed(3)}€
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-8">
      {/* Interactive Quick-Start Presets & Toolbar */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('unitprice.presets_title')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={!hasAnyInput}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              aria-label={t('common.clear')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('common.clear')}</span>
              <Kbd modifier={null}>Esc</Kbd>
            </button>
            {hasMultiplePrices && (
              <button
                type="button"
                onClick={handleCopySummary}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-1.5 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label={t('unitprice.copy_summary')}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{t('unitprice.copy_summary')}</span>
                <Kbd modifier={null}>C</Kbd>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {PRESETS.map((preset) => {
            const isActive = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                aria-pressed={isActive}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500'
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
              >
                {t(preset.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ProductSection
          id="A"
          product={productA}
          setProduct={updateProductA}
          unitPrice={unitPriceA}
          isWinner={win === 'A'}
          colorClass="bg-indigo-600"
          isFirst
        />
        <ProductSection
          id="B"
          product={productB}
          setProduct={updateProductB}
          unitPrice={unitPriceB}
          isWinner={win === 'B'}
          colorClass="bg-slate-400"
        />
        <ProductSection
          id="C"
          product={productC}
          setProduct={updateProductC}
          unitPrice={unitPriceC}
          isWinner={win === 'C'}
          colorClass="bg-blue-600"
        />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-3xl">
          <Info className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h4 className="font-black uppercase tracking-widest text-xs text-slate-400">{t('unitprice.how_title')}</h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{t('unitprice.how_text')}</p>
        </div>
      </div>
    </div>
  );
}
