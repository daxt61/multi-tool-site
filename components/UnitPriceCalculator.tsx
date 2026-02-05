import { useState } from 'react';
import { Tag, Info } from 'lucide-react';

interface Product {
  price: string;
  quantity: string;
  unit: string;
}

const UNITS = [
  { id: 'g', label: 'Grammes (g)', factor: 1 },
  { id: 'kg', label: 'Kilogrammes (kg)', factor: 1000 },
  { id: 'mg', label: 'Milligrammes (mg)', factor: 0.001 },
  { id: 'oz', label: 'Onces (oz)', factor: 28.3495 },
  { id: 'lb', label: 'Livres (lb)', factor: 453.592 },
  { id: 'ml', label: 'Millilitres (ml)', factor: 1 },
  { id: 'l', label: 'Litres (l)', factor: 1000 },
  { id: 'floz', label: 'Fl. oz (US)', factor: 29.5735 },
  { id: 'gal', label: 'Gallon (US)', factor: 3785.41 },
  { id: 'unit', label: 'Unités', factor: 1 },
];

export function UnitPriceCalculator() {
  const [productA, setProductA] = useState<Product>({ price: '', quantity: '', unit: 'g' });
  const [productB, setProductB] = useState<Product>({ price: '', quantity: '', unit: 'g' });

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

  const betterValue = () => {
    if (unitPriceA === null || unitPriceB === null) return null;
    if (unitPriceA < unitPriceB) return 'A';
    if (unitPriceB < unitPriceA) return 'B';
    return 'equal';
  };

  const win = betterValue();

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product A */}
        <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${win === 'A' ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-500 shadow-xl shadow-emerald-500/10' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs">A</span>
              Produit A
            </h3>
            {win === 'A' && (
              <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-bounce">Moins cher</span>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="priceA" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Prix (€)</label>
              <input
                id="priceA"
                type="number"
                value={productA.price}
                onChange={(e) => setProductA({ ...productA, price: e.target.value })}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black font-mono outline-none focus:border-indigo-500 transition-all dark:text-white"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="qtyA" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Quantité</label>
                <input
                  id="qtyA"
                  type="number"
                  value={productA.quantity}
                  onChange={(e) => setProductA({ ...productA, quantity: e.target.value })}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black font-mono outline-none focus:border-indigo-500 transition-all dark:text-white"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="unitA" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Unité</label>
                <select
                  id="unitA"
                  value={productA.unit}
                  onChange={(e) => setProductA({ ...productA, unit: e.target.value })}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-indigo-500 transition-all"
                >
                  {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {unitPriceA !== null && (
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Prix pour 100{productA.unit === 'unit' ? ' unités' : (['ml', 'l', 'floz', 'gal'].includes(productA.unit) ? 'ml' : 'g')}
              </div>
              <div className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {unitPriceA.toFixed(3)}€
              </div>
            </div>
          )}
        </div>

        {/* Product B */}
        <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${win === 'B' ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-500 shadow-xl shadow-emerald-500/10' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-slate-400 text-white flex items-center justify-center text-xs">B</span>
              Produit B
            </h3>
            {win === 'B' && (
              <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full animate-bounce">Moins cher</span>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="priceB" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Prix (€)</label>
              <input
                id="priceB"
                type="number"
                value={productB.price}
                onChange={(e) => setProductB({ ...productB, price: e.target.value })}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black font-mono outline-none focus:border-indigo-500 transition-all dark:text-white"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="qtyB" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Quantité</label>
                <input
                  id="qtyB"
                  type="number"
                  value={productB.quantity}
                  onChange={(e) => setProductB({ ...productB, quantity: e.target.value })}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black font-mono outline-none focus:border-indigo-500 transition-all dark:text-white"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="unitB" className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Unité</label>
                <select
                  id="unitB"
                  value={productB.unit}
                  onChange={(e) => setProductB({ ...productB, unit: e.target.value })}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:border-indigo-500 transition-all"
                >
                  {UNITS.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {unitPriceB !== null && (
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700 text-center">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Prix pour 100{productB.unit === 'unit' ? ' unités' : (['ml', 'l', 'floz', 'gal'].includes(productB.unit) ? 'ml' : 'g')}
              </div>
              <div className="text-4xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {unitPriceB.toFixed(3)}€
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] flex items-start gap-6">
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-3xl">
          <Info className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h4 className="font-black uppercase tracking-widest text-xs text-slate-400">Comment ça marche ?</h4>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Entrez le prix et la quantité de deux produits pour comparer leur rapport qualité-prix. Nous convertissons tout dans une unité de base (100g, 100ml ou à l'unité) pour faciliter la comparaison.
          </p>
        </div>
      </div>
    </div>
  );
}
