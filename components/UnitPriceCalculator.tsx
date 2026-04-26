import { useState } from 'react';
import { Tag, Info, Trash2 } from 'lucide-react';

interface Product {
  price: string;
  quantity: string;
  unit: string;
}

const UNITS = [
  { id: 'g', label: 'Grammes (g)', factor: 1 },
  { id: 'kg', label: 'Kilogrammes (kg)', factor: 1000 },
  { id: 'ml', label: 'Millilitres (ml)', factor: 1 },
  { id: 'l', label: 'Litres (l)', factor: 1000 },
  { id: 'unit', label: 'Unités', factor: 1 },
];

export function UnitPriceCalculator() {
  const [productA, setProductA] = useState<Product>({ price: '', quantity: '', unit: 'g' });
  const [productB, setProductB] = useState<Product>({ price: '', quantity: '', unit: 'g' });
  const [productC, setProductC] = useState<Product>({ price: '', quantity: '', unit: 'g' });

  const calculateUnitPrice = (p: Product) => {
    const price = parseFloat(p.price);
    const quantity = parseFloat(p.quantity);
    if (isNaN(price) || isNaN(quantity) || quantity === 0) return null;

    const unit = UNITS.find(u => u.id === p.unit);
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
    ].filter(p => p.price !== null);

    if (prices.length < 2) return null;

    const minPrice = Math.min(...prices.map(p => p.price!));
    const winners = prices.filter(p => p.price === minPrice);

    if (winners.length > 1) return 'equal';
    return winners[0].id;
  };

  const win = betterValue();

  interface ProductSectionProps {
    id: string;
    product: Product;
    setProduct: (p: Product) => void;
    unitPrice: number | null;
    isWinner: boolean;
    colorClass: string;
  }

  const ProductSection = ({ id, product, setProduct, unitPrice, isWinner, colorClass }: ProductSectionProps) => (
    <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${isWinner ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-500 shadow-xl shadow-emerald-500/10' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
          <span className={`w-8 h-8 rounded-lg ${colorClass} text-white flex items-center justify-center text-xs`}>{id}</span>
          Produit {id}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProduct({ price: '', quantity: '', unit: 'g' })}
            disabled={!product.price && !product.quantity}
            className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-2 py-1 rounded-lg flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
          {isWinner && (
            <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-bounce">Moins cher</span>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor={`price${id}`} className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Prix (€)</label>
          <input
            id={`price${id}`}
            type="number"
            value={product.price}
            onChange={(e) => setProduct({ ...product, price: e.target.value })}
            className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black font-mono outline-none focus:border-indigo-500 transition-all dark:text-white"
            placeholder="0.00"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor={`qty${id}`} className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Quantité</label>
            <input
              id={`qty${id}`}
              type="number"
              value={product.quantity}
              onChange={(e) => setProduct({ ...product, quantity: e.target.value })}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black font-mono outline-none focus:border-indigo-500 transition-all dark:text-white"
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor={`unit${id}`} className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Unité</label>
            <select
              id={`unit${id}`}
              value={product.unit}
              onChange={(e) => setProduct({ ...product, unit: e.target.value })}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-indigo-500 transition-all"
            >
              {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {unitPrice !== null && (
        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 text-center">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Prix pour 100{product.unit === 'unit' ? ' unités' : (product.unit.includes('l') ? 'ml' : 'g')}</div>
          <div className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400">
            {unitPrice.toFixed(3)}€
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ProductSection id="A" product={productA} setProduct={setProductA} unitPrice={unitPriceA} isWinner={win === 'A'} colorClass="bg-indigo-600" />
        <ProductSection id="B" product={productB} setProduct={setProductB} unitPrice={unitPriceB} isWinner={win === 'B'} colorClass="bg-slate-400" />
        <ProductSection id="C" product={productC} setProduct={setProductC} unitPrice={unitPriceC} isWinner={win === 'C'} colorClass="bg-blue-600" />
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-3xl">
          <Info className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h4 className="font-black uppercase tracking-widest text-xs text-slate-400">Comment ça marche ?</h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Entrez le prix et la quantité de jusqu'à trois produits pour comparer leur rapport qualité-prix. Nous convertissons tout dans une unité de base (100g, 100ml ou à l'unité) pour faciliter la comparaison.
          </p>
        </div>
      </div>
    </div>
  );
}
