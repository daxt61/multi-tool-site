import { useState, useMemo, useEffect } from 'react';
import { Landmark, ArrowRight, DollarSign, Calendar, Percent, Plus, Trash2, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Loan {
  amount: number;
  rate: number;
  years: number;
  fees: number;
}

export function LoanComparison({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t, i18n: i18nInstance } = useTranslation();
  const [loan1, setLoan1] = useState<Loan>(initialData?.loan1 || { amount: 200000, rate: 3.5, years: 20, fees: 1000 });
  const [loan2, setLoan2] = useState<Loan>(initialData?.loan2 || { amount: 200000, rate: 3.8, years: 15, fees: 500 });

  useEffect(() => {
    onStateChange?.({ loan1, loan2 });
  }, [loan1, loan2, onStateChange]);

  const calculateLoan = (loan: Loan) => {
    const monthlyRate = (loan.rate / 100) / 12;
    const numberOfPayments = loan.years * 12;

    let monthlyPayment = 0;
    if (numberOfPayments > 0) {
      if (monthlyRate === 0) {
        monthlyPayment = loan.amount / numberOfPayments;
      } else {
        monthlyPayment = (loan.amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numberOfPayments));
      }
    }

    const totalCost = (monthlyPayment * numberOfPayments) + loan.fees;
    const totalInterest = totalCost - loan.amount - loan.fees;

    return {
      monthlyPayment,
      totalInterest,
      totalCost,
    };
  };

  const stats1 = useMemo(() => calculateLoan(loan1), [loan1]);
  const stats2 = useMemo(() => calculateLoan(loan2), [loan2]);

  const diff = useMemo(() => {
    return {
      monthly: stats1.monthlyPayment - stats2.monthlyPayment,
      interest: stats1.totalInterest - stats2.totalInterest,
      total: stats1.totalCost - stats2.totalCost,
    };
  }, [stats1, stats2]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(i18nInstance.language, { style: 'currency', currency: 'EUR' }).format(val);
  };

  const handleReset = () => {
    setLoan1({ amount: 200000, rate: 3.5, years: 20, fees: 1000 });
    setLoan2({ amount: 200000, rate: 3.8, years: 15, fees: 500 });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex justify-end px-1">
        <button
          onClick={handleReset}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> {t('common.reset')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Loan 1 */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 relative overflow-hidden">
          {stats1.totalCost < stats2.totalCost && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
              {t('unitprice.cheaper')}
            </div>
          )}
          <div className="flex items-center gap-3 text-indigo-500 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <h3 className="font-black uppercase tracking-widest text-sm text-slate-400">{t('loancomparison.loan_1')}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="loan1-amount" className="text-xs font-bold text-slate-500 px-1">{t('loancomparison.amount')}</label>
              <div className="relative">
                <input
                  id="loan1-amount"
                  type="number"
                  value={loan1.amount}
                  onChange={(e) => setLoan1({ ...loan1, amount: Number(e.target.value) })}
                  className="w-full p-4 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                />
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="loan1-rate" className="text-xs font-bold text-slate-500 px-1">{t('loancomparison.rate')}</label>
              <div className="relative">
                <input
                  id="loan1-rate"
                  type="number"
                  step="0.1"
                  value={loan1.rate}
                  onChange={(e) => setLoan1({ ...loan1, rate: Number(e.target.value) })}
                  className="w-full p-4 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                />
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="loan1-years" className="text-xs font-bold text-slate-500 px-1">{t('loancomparison.term')}</label>
              <div className="relative">
                <input
                  id="loan1-years"
                  type="number"
                  value={loan1.years}
                  onChange={(e) => setLoan1({ ...loan1, years: Number(e.target.value) })}
                  className="w-full p-4 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="loan1-fees" className="text-xs font-bold text-slate-500 px-1">{t('loancomparison.fees')}</label>
              <div className="relative">
                <input
                  id="loan1-fees"
                  type="number"
                  value={loan1.fees}
                  onChange={(e) => setLoan1({ ...loan1, fees: Number(e.target.value) })}
                  className="w-full p-4 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                />
                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
             <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">{t('loancomparison.monthly')}</span>
                <span className="text-lg font-black dark:text-white">{formatCurrency(stats1.monthlyPayment)}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">{t('loancomparison.total_interest')}</span>
                <span className="text-lg font-black dark:text-white">{formatCurrency(stats1.totalInterest)}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('loancomparison.total_cost')}</span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(stats1.totalCost)}</span>
             </div>
          </div>
        </div>

        {/* Loan 2 */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 relative overflow-hidden">
          {stats2.totalCost < stats1.totalCost && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
              {t('unitprice.cheaper')}
            </div>
          )}
          <div className="flex items-center gap-3 text-emerald-500 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
            <h3 className="font-black uppercase tracking-widest text-sm text-slate-400">{t('loancomparison.loan_2')}</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="loan2-amount" className="text-xs font-bold text-slate-500 px-1">{t('loancomparison.amount')}</label>
              <div className="relative">
                <input
                  id="loan2-amount"
                  type="number"
                  value={loan2.amount}
                  onChange={(e) => setLoan2({ ...loan2, amount: Number(e.target.value) })}
                  className="w-full p-4 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                />
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="loan2-rate" className="text-xs font-bold text-slate-500 px-1">{t('loancomparison.rate')}</label>
              <div className="relative">
                <input
                  id="loan2-rate"
                  type="number"
                  step="0.1"
                  value={loan2.rate}
                  onChange={(e) => setLoan2({ ...loan2, rate: Number(e.target.value) })}
                  className="w-full p-4 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                />
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="loan2-years" className="text-xs font-bold text-slate-500 px-1">{t('loancomparison.term')}</label>
              <div className="relative">
                <input
                  id="loan2-years"
                  type="number"
                  value={loan2.years}
                  onChange={(e) => setLoan2({ ...loan2, years: Number(e.target.value) })}
                  className="w-full p-4 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="loan2-fees" className="text-xs font-bold text-slate-500 px-1">{t('loancomparison.fees')}</label>
              <div className="relative">
                <input
                  id="loan2-fees"
                  type="number"
                  value={loan2.fees}
                  onChange={(e) => setLoan2({ ...loan2, fees: Number(e.target.value) })}
                  className="w-full p-4 pl-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                />
                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
             <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">{t('loancomparison.monthly')}</span>
                <span className="text-lg font-black dark:text-white">{formatCurrency(stats2.monthlyPayment)}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">{t('loancomparison.total_interest')}</span>
                <span className="text-lg font-black dark:text-white">{formatCurrency(stats2.totalInterest)}</span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{t('loancomparison.total_cost')}</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(stats2.totalCost)}</span>
             </div>
          </div>
        </div>
      </div>

      {/* Comparison Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 md:p-12 rounded-[2.5rem] shadow-sm space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
            <ArrowRight className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-black">{t('loancomparison.comparison_title')}</h3>
            <p className="text-slate-500 dark:text-slate-400">{t('loancomparison.comparison_desc')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`p-6 rounded-3xl border transition-all ${diff.monthly < 0 ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-900/30' : 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-900/30'}`}>
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t('loancomparison.monthly_diff')}</div>
            <div className={`text-2xl font-black ${diff.monthly < 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatCurrency(Math.abs(diff.monthly))}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-2">
              {diff.monthly < 0 ? t('loancomparison.loan_1_cheaper_monthly') : t('loancomparison.loan_2_cheaper_monthly')}
            </p>
          </div>

          <div className={`p-6 rounded-3xl border transition-all ${diff.interest < 0 ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-900/30' : 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-900/30'}`}>
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t('loancomparison.interest_diff')}</div>
            <div className={`text-2xl font-black ${diff.interest < 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatCurrency(Math.abs(diff.interest))}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-2">
              {diff.interest < 0 ? t('loancomparison.loan_1_cheaper_interest') : t('loancomparison.loan_2_cheaper_interest')}
            </p>
          </div>

          <div className={`p-6 rounded-3xl border transition-all ${diff.total < 0 ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-900/30' : 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-900/30'}`}>
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{t('loancomparison.total_diff')}</div>
            <div className={`text-2xl font-black ${diff.total < 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {formatCurrency(Math.abs(diff.total))}
            </div>
            <p className="text-xs font-medium text-slate-500 mt-2">
              {diff.total < 0 ? t('loancomparison.loan_1_better_deal') : t('loancomparison.loan_2_better_deal')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> {t('loancomparison.about_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('loancomparison.about_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Landmark className="w-4 h-4 text-indigo-500" /> {t('loancomparison.term_impact_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('loancomparison.term_impact_text')}
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" /> {t('loancomparison.fees_title')}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('loancomparison.fees_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
