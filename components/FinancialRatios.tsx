import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, DollarSign, Calculator, Percent, Info, Trash2, Download } from 'lucide-react';

export function FinancialRatios({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [data, setData] = useState({
    assets: initialData?.assets || '',
    liabilities: initialData?.liabilities || '',
    equity: initialData?.equity || '',
    revenue: initialData?.revenue || '',
    netIncome: initialData?.netIncome || '',
    costOfGoods: initialData?.costOfGoods || '',
  });

  useEffect(() => {
    onStateChange?.(data);
  }, [data, onStateChange]);

  const ratios = useMemo(() => {
    const assets = parseFloat(data.assets) || 0;
    const liabilities = parseFloat(data.liabilities) || 0;
    const equity = parseFloat(data.equity) || 0;
    const revenue = parseFloat(data.revenue) || 0;
    const netIncome = parseFloat(data.netIncome) || 0;
    const cogs = parseFloat(data.costOfGoods) || 0;

    return {
      currentRatio: liabilities !== 0 ? (assets / liabilities).toFixed(2) : '0.00',
      debtToEquity: equity !== 0 ? (liabilities / equity).toFixed(2) : '0.00',
      grossMargin: revenue !== 0 ? (((revenue - cogs) / revenue) * 100).toFixed(2) : '0.00',
      profitMargin: revenue !== 0 ? ((netIncome / revenue) * 100).toFixed(2) : '0.00',
      roe: equity !== 0 ? ((netIncome / equity) * 100).toFixed(2) : '0.00',
    };
  }, [data]);

  const handleClear = () => {
    setData({
      assets: '',
      liabilities: '',
      equity: '',
      revenue: '',
      netIncome: '',
      costOfGoods: '',
    });
  };

  const handleDownload = () => {
    const report = `Rapport des Ratios Financiers
-----------------------------
Données :
- Actifs : ${data.assets || 0}
- Passifs : ${data.liabilities || 0}
- Capitaux Propres : ${data.equity || 0}
- Chiffre d'Affaires : ${data.revenue || 0}
- Bénéfice Net : ${data.netIncome || 0}
- Coût des Ventes : ${data.costOfGoods || 0}

Ratios :
- Ratio de Liquidité : ${ratios.currentRatio}
- Ratio Dette/Capitaux : ${ratios.debtToEquity}
- Marge Brute : ${ratios.grossMargin}%
- Marge Nette : ${ratios.profitMargin}%
- Rendement des Capitaux Propres (ROE) : ${ratios.roe}%
`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ratios-financiers-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-end gap-2 px-1">
        <button
          onClick={handleDownload}
          className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Download className="w-3 h-3" /> Télécharger
        </button>
        <button
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> Effacer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Calculator className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Saisie des données</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {[
              { id: 'assets', label: 'Actifs Circulants', icon: <DollarSign className="w-3 h-3" /> },
              { id: 'liabilities', label: 'Passifs Circulants', icon: <DollarSign className="w-3 h-3" /> },
              { id: 'equity', label: 'Capitaux Propres', icon: <DollarSign className="w-3 h-3" /> },
              { id: 'revenue', label: 'Chiffre d\'Affaires', icon: <TrendingUp className="w-3 h-3" /> },
              { id: 'netIncome', label: 'Bénéfice Net', icon: <TrendingUp className="w-3 h-3" /> },
              { id: 'costOfGoods', label: 'Coût des Ventes', icon: <Percent className="w-3 h-3" /> },
            ].map((field) => (
              <div key={field.id} className="space-y-2">
                <label htmlFor={field.id} className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-1">
                  {field.icon} {field.label}
                </label>
                <div className="relative">
                  <input
                    id={field.id}
                    type="number"
                    value={data[field.id as keyof typeof data]}
                    onChange={(e) => setData({ ...data, [field.id]: e.target.value })}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold">€</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 px-1 mb-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Ratios calculés</h3>
          </div>

          {[
            { label: 'Ratio de Liquidité', value: ratios.currentRatio, suffix: '', desc: 'Capacité à rembourser les dettes à court terme.' },
            { label: 'Ratio d\'Endettement', value: ratios.debtToEquity, suffix: '', desc: 'Proportion de dette par rapport aux capitaux propres.' },
            { label: 'Marge Brute', value: ratios.grossMargin, suffix: '%', desc: 'Rentabilité directe après coût des ventes.' },
            { label: 'Marge Bénéficiaire Nette', value: ratios.profitMargin, suffix: '%', desc: 'Pourcentage de bénéfice par euro de vente.' },
            { label: 'Retour sur Capitaux Propres (ROE)', value: ratios.roe, suffix: '%', desc: 'Rentabilité des investissements des actionnaires.' },
          ].map((r) => (
            <div key={r.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] flex items-center justify-between group hover:border-indigo-500/30 transition-all shadow-sm">
              <div className="space-y-1">
                <div className="text-sm font-black text-slate-900 dark:text-white">{r.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-500 max-w-xs">{r.desc}</div>
              </div>
              <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {r.value}{r.suffix}
              </div>
            </div>
          ))}

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl shadow-sm">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm dark:text-white">Interprétation</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Un <strong>Ratio de Liquidité</strong> &gt; 1 est généralement considéré comme sain. Un <strong>ROE</strong> élevé indique une gestion efficace du capital. Ces indicateurs varient selon le secteur d'activité.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
