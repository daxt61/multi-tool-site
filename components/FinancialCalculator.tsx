import { useState, useMemo, useEffect } from 'react';
import { Landmark, TrendingUp, Wallet, Banknote, Calendar, Percent, Info, Trash2, Download, Table as TableIcon } from 'lucide-react';

export function FinancialCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [principal, setPrincipal] = useState<string>(initialData?.principal || '1000');
  const [contribution, setContribution] = useState<string>(initialData?.contribution || '100');
  const [frequency, setFrequency] = useState<'monthly' | 'annually'>(initialData?.frequency || 'monthly');
  const [rate, setRate] = useState<string>(initialData?.rate || '5');
  const [years, setYears] = useState<string>(initialData?.years || '10');
  const [compounding, setCompounding] = useState<number>(initialData?.compounding || 12);

  useEffect(() => {
    onStateChange?.({ principal, contribution, frequency, rate, years, compounding });
  }, [principal, contribution, frequency, rate, years, compounding, onStateChange]);

  const results = useMemo(() => {
    const P = parseFloat(principal) || 0;
    const PMT = parseFloat(contribution) || 0;
    const r = (parseFloat(rate) || 0) / 100;
    const t = parseFloat(years) || 0;
    const n = compounding;

    const data = [];
    let currentBalance = P;
    let totalContributions = P;

    for (let year = 1; year <= t; year++) {
      let yearlyInterest = 0;
      if (frequency === 'monthly') {
        for (let month = 1; month <= 12; month++) {
          const interest = currentBalance * (r / n);
          currentBalance += interest + PMT;
          totalContributions += PMT;
          yearlyInterest += interest;
        }
      } else {
        const interest = currentBalance * r;
        currentBalance += interest + PMT;
        totalContributions += PMT;
        yearlyInterest = interest;
      }

      data.push({
        year,
        balance: currentBalance,
        contributions: totalContributions,
        interest: currentBalance - totalContributions
      });
    }

    return {
      finalBalance: currentBalance,
      totalContributions,
      totalInterest: currentBalance - totalContributions,
      yearlyBreakdown: data
    };
  }, [principal, contribution, frequency, rate, years, compounding]);

  const handleClear = () => {
    setPrincipal('');
    setContribution('');
    setRate('');
    setYears('');
  };

  const handleDownload = () => {
    let content = `Calculateur d'Intérêts Composés\n\n`;
    content += `Capital Initial: ${principal} €\n`;
    content += `Contribution: ${contribution} € (${frequency === 'monthly' ? 'mensuel' : 'annuel'})\n`;
    content += `Taux: ${rate} %\n`;
    content += `Durée: ${years} ans\n\n`;
    content += `Résultats:\n`;
    content += `Valeur Finale: ${results.finalBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €\n`;
    content += `Total Versé: ${results.totalContributions.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €\n`;
    content += `Total Intérêts: ${results.totalInterest.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €\n\n`;
    content += `Année | Solde | Versé | Intérêts\n`;
    results.yearlyBreakdown.forEach(row => {
      content += `${row.year} | ${row.balance.toFixed(2)} | ${row.contributions.toFixed(2)} | ${row.interest.toFixed(2)}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-compounds-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Settings */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="principal" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Banknote className="w-3 h-3" /> Capital Initial
              </label>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <div className="relative">
              <input
                id="principal"
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="w-full p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl text-3xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="1000"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">€</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label htmlFor="contribution" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Wallet className="w-3 h-3" /> Contribution
                </label>
                <div className="relative">
                  <input
                    id="contribution"
                    type="number"
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="100"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">€</span>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Fréquence
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as 'monthly' | 'annually')}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold focus:border-indigo-500 outline-none transition-all dark:text-white cursor-pointer"
                >
                  <option value="monthly">Mensuel</option>
                  <option value="annually">Annuel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label htmlFor="rate" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Percent className="w-3 h-3" /> Taux annuel
                </label>
                <div className="relative">
                  <input
                    id="rate"
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    placeholder="5"
                    step="0.1"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                </div>
              </div>
              <div className="space-y-3">
                <label htmlFor="years" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Durée (ans)
                </label>
                <input
                  id="years"
                  type="number"
                  value={years}
                  onChange={(e) => setYears(e.target.value)}
                  className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Valeur Totale Finale</p>
            <div className="text-6xl md:text-7xl font-black text-white font-mono tracking-tighter">
              {results.finalBalance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </div>
            <div className="flex justify-center gap-8 pt-6 border-t border-white/5">
              <div className="text-center">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Versé</div>
                <div className="text-lg font-bold text-white">{results.totalContributions.toLocaleString('fr-FR')} €</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Intérêts</div>
                <div className="text-lg font-bold text-indigo-400">+{results.totalInterest.toLocaleString('fr-FR')} €</div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <TableIcon className="w-4 h-4" /> Détail annuel
            </h3>
            <button
              onClick={handleDownload}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" /> Télécharger Rapport
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Année</th>
                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Solde</th>
                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Total Versé</th>
                    <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Intérêts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.yearlyBreakdown.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-400"># {row.year}</td>
                      <td className="px-6 py-4 font-bold dark:text-white font-mono">{row.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">{row.contributions.toLocaleString('fr-FR')} €</td>
                      <td className="px-6 py-4 text-indigo-500 dark:text-indigo-400 font-bold font-mono">+{row.interest.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h4 className="font-bold dark:text-white">Puissance de l'Intérêt</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'intérêt composé permet à votre argent de croître de manière exponentielle car les intérêts générés s'ajoutent à votre capital pour générer de nouveaux intérêts.
          </p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <Landmark className="w-6 h-6" />
          </div>
          <h4 className="font-bold dark:text-white">Fréquence de Capitalisation</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Plus les intérêts sont calculés et ajoutés au capital souvent, plus la valeur finale est élevée. Cet outil utilise une capitalisation mensuelle.
          </p>
        </div>
        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Info className="w-6 h-6" />
          </div>
          <h4 className="font-bold dark:text-white">Note Importante</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ces calculs sont des estimations basées sur des taux fixes et ne prennent pas en compte l'inflation, la fiscalité ou les frais de gestion bancaires.
          </p>
        </div>
      </div>
    </div>
  );
}
