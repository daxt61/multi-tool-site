import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Activity, Info, Copy, Check, Trash2, HelpCircle, BookOpen, ChevronRight, Scale, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function BMICalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const weightRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const [weight, setWeight] = useState(initialData?.weight || '70');
  const [height, setHeight] = useState(initialData?.height || '170');
  const [unit, setUnit] = useState<'metric' | 'imperial'>(initialData?.unit || 'metric');
  const [useNewFormula, setUseNewFormula] = useState(initialData?.useNewFormula ?? false);

  useEffect(() => {
    onStateChange?.({ weight, height, unit, useNewFormula });
  }, [weight, height, unit, useNewFormula]);
  const [copied, setCopied] = useState(false);
  const [copiedIdeal, setCopiedIdeal] = useState(false);

  const { bmi, idealWeightRange } = useMemo(() => {
    let weightKg = parseFloat(weight);
    let heightM = parseFloat(height);

    if (isNaN(weightKg) || isNaN(heightM) || heightM === 0) {
      return { bmi: 0, idealWeightRange: null };
    }

    if (unit === 'imperial') {
      weightKg = weightKg * 0.453592;
      heightM = heightM * 0.0254;
    } else {
      heightM = heightM / 100;
    }

    let bmiValue = 0;
    if (useNewFormula) {
      // New BMI formula: 1.3 * weight / (height^2.5)
      bmiValue = 1.3 * weightKg / Math.pow(heightM, 2.5);
    } else {
      // Standard BMI formula: weight / height^2
      bmiValue = weightKg / (heightM * heightM);
    }

    // Ideal weight range based on BMI 18.5 - 25
    // For simplicity, we keep standard BMI range for ideal weight calculation
    const lowKg = 18.5 * (heightM * heightM);
    const highKg = 25 * (heightM * heightM);

    if (unit === 'imperial') {
      return {
        bmi: bmiValue,
        idealWeightRange: {
          low: lowKg / 0.453592,
          high: highKg / 0.453592,
          unit: 'lb'
        }
      };
    }

    return {
      bmi: bmiValue,
      idealWeightRange: {
        low: lowKg,
        high: highKg,
        unit: 'kg'
      }
    };
  }, [weight, height, unit]);

  const category = useMemo(() => {
    if (bmi === 0) return { id: 'na', label: t('common.na'), color: 'bg-slate-200', text: 'text-slate-500', glow: 'bg-indigo-500/10' };
    if (bmi < 18.5) return { id: 'underweight', label: t('bmi.underweight'), color: 'bg-blue-500', text: 'text-blue-500', glow: 'bg-blue-500/20' };
    if (bmi < 25) return { id: 'normal', label: t('bmi.normal'), color: 'bg-emerald-500', text: 'text-emerald-500', glow: 'bg-emerald-500/20' };
    if (bmi < 30) return { id: 'overweight', label: t('bmi.overweight'), color: 'bg-amber-500', text: 'text-amber-500', glow: 'bg-amber-500/20' };
    return { id: 'obesity', label: t('bmi.obesity'), color: 'bg-rose-500', text: 'text-rose-500', glow: 'bg-rose-500/20' };
  }, [bmi, t]);

  const handleCopy = useCallback(() => {
    if (bmi === 0) return;
    const text = `${t('bmi.your_bmi')} : ${bmi.toFixed(1)} (${category.label})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [bmi, category.label, t]);

  const handleCopyIdeal = useCallback(() => {
    if (!idealWeightRange) return;
    const text = `${t('bmi.ideal_weight')} : ${idealWeightRange.low.toFixed(1)} - ${idealWeightRange.high.toFixed(1)} ${idealWeightRange.unit}`;
    navigator.clipboard.writeText(text);
    setCopiedIdeal(true);
    setTimeout(() => setCopiedIdeal(false), 2000);
  }, [idealWeightRange, t]);

  const handleDownload = useCallback(() => {
    if (bmi === 0) return;
    const content = `${t('bmi.download_report')} :
- ${t('bmi.weight')} : ${weight} ${unit === 'metric' ? 'kg' : 'lb'}
- ${t('bmi.height')} : ${height} ${unit === 'metric' ? 'cm' : 'in'}
- ${t('bmi.your_bmi')} : ${bmi.toFixed(1)}
- ${t('common.quality')} : ${category.label}
${idealWeightRange ? `- ${t('bmi.ideal_weight')} : ${idealWeightRange.low.toFixed(1)} - ${idealWeightRange.high.toFixed(1)} ${idealWeightRange.unit}` : ''}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-imc-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [bmi, weight, unit, height, category.label, idealWeightRange, t]);

  const handleUnitChange = useCallback((newUnit: 'metric' | 'imperial') => {
    if (newUnit === unit) return;

    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (!isNaN(w) && !isNaN(h)) {
      if (newUnit === 'imperial') {
        // Metric to Imperial
        setWeight((w * 2.20462).toFixed(1));
        setHeight((h / 2.54).toFixed(1));
      } else {
        // Imperial to Metric
        setWeight((w / 2.20462).toFixed(1));
        setHeight((h * 2.54).toFixed(1));
      }
    }
    setUnit(newUnit);
  }, [unit, weight, height]);

  const handleClear = useCallback(() => {
    setWeight('');
    setHeight('');
    weightRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (isInputFocused) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleUnitChange(unit === 'metric' ? 'imperial' : 'metric');
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClear, handleCopy, handleUnitChange, unit]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex justify-between items-center px-1">
             <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
              <button
                onClick={() => handleUnitChange('metric')}
                aria-pressed={unit === 'metric'}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === 'metric' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                {t('bmi.metric')}
              </button>
              <button
                onClick={() => handleUnitChange('imperial')}
                aria-pressed={unit === 'imperial'}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === 'imperial' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                {t('bmi.imperial')}
              </button>
              <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 mx-1">S</kbd>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleDownload}
                disabled={bmi === 0}
                aria-label={t('bmi.download_report')}
                className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Download className="w-3 h-3" /> {t('common.download')}
              </button>
              <div className="flex gap-2 items-center">
                <kbd className="hidden sm:inline-flex items-center justify-center px-1.5 py-0.5 border border-rose-200 dark:border-rose-800 rounded text-[10px] font-bold text-rose-400 bg-white dark:bg-slate-900">Esc</kbd>
                <button
                  onClick={handleClear}
                  disabled={!weight && !height}
                  aria-label={t('bmi.clear_fields')}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                >
                  <Trash2 className="w-3 h-3" /> {t('common.clear')}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
              <div className="space-y-1">
                <div id="new-formula-label" className="text-xs font-bold dark:text-white">{t('bmi.new_formula')}</div>
                <div className="text-[10px] text-slate-400">{t('bmi.formula_by')}</div>
              </div>
              <button
                role="switch"
                aria-checked={useNewFormula}
                aria-labelledby="new-formula-label"
                onClick={() => setUseNewFormula(!useNewFormula)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${useNewFormula ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useNewFormula ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="space-y-3">
              <label htmlFor="weight" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">{t('bmi.weight')} ({unit === 'metric' ? 'kg' : 'lb'})</label>
              <input
                id="weight"
                ref={weightRef}
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleClear();
                  }
                }}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder={unit === 'metric' ? '70' : '154'}
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="height" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 cursor-pointer">{t('bmi.height')} ({unit === 'metric' ? 'cm' : 'in'})</label>
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleClear();
                  }
                }}
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder={unit === 'metric' ? '170' : '67'}
              />
            </div>
          </div>

          {idealWeightRange && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/20 flex items-center justify-between gap-4 group/ideal">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm shrink-0">
                    <Scale className="w-6 h-6" />
                 </div>
                 <div>
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">{t('bmi.ideal_weight')}</div>
                    <div className="text-lg font-black text-indigo-900 dark:text-indigo-300 font-mono">
                      {idealWeightRange.low.toFixed(1)} - {idealWeightRange.high.toFixed(1)} {idealWeightRange.unit}
                    </div>
                 </div>
               </div>
               <button
                  onClick={handleCopyIdeal}
                  className={`p-2 rounded-xl transition-all z-20 ${copiedIdeal ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-500 opacity-0 group-hover/ideal:opacity-100 focus-visible:opacity-100'}`}
                  aria-label={t('bmi.copy_ideal')}
                >
                  {copiedIdeal ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex-grow bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-4 shadow-xl shadow-indigo-500/10 relative group overflow-hidden">
             <div className={`absolute top-0 right-0 w-32 h-32 ${category.glow} rounded-full -mr-16 -mt-16 blur-3xl transition-colors duration-500`}></div>

            <button
              onClick={handleCopy}
              disabled={bmi === 0}
              className={`absolute top-6 right-6 p-3 rounded-2xl transition-all border z-20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none flex items-center gap-2 ${
                copied
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                  : "bg-white/10 text-white/40 border-transparent hover:text-white hover:bg-white/20 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
              } disabled:opacity-0`}
              title={t('bmi.copy_result')}
              aria-label={t('bmi.copy_result')}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {!copied && <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 border border-white/20 rounded text-[10px] font-bold bg-white/5">C</kbd>}
            </button>
            <div className="space-y-4 relative z-10" aria-live="polite" aria-atomic="true">
              <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('bmi.your_bmi')}</div>
              <div className="text-6xl md:text-8xl font-black text-white font-mono tracking-tighter">
                {bmi > 0 ? bmi.toFixed(1) : '0.0'}
              </div>
              <div className={`px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest ${category.color} text-white shadow-lg inline-block`}>
                {category.label}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                <Info className="w-5 h-5" />
             </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               {t('bmi.disclaimer')}
             </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 px-2 flex items-center gap-2">
          <Activity className="w-4 h-4" /> {t('bmi.oms_classification')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'underweight', label: t('bmi.underweight'), range: '< 18.5', color: 'bg-blue-500' },
            { id: 'normal', label: t('bmi.normal'), range: '18.5 - 25', color: 'bg-emerald-500' },
            { id: 'overweight', label: t('bmi.overweight'), range: '25 - 30', color: 'bg-amber-500' },
            { id: 'obesity', label: t('bmi.obesity'), range: '> 30', color: 'bg-rose-500' },
          ].map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-500 border ${
                category.id === item.id
                  ? `bg-white dark:bg-slate-800 border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.02] ring-2 ring-indigo-500/20`
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60'
              }`}
            >
              <div>
                <div className={`text-[10px] font-black uppercase mb-1 tracking-wider ${category.id === item.id ? 'text-indigo-500' : 'text-slate-400'}`}>{item.label}</div>
                <div className="font-mono font-black text-slate-900 dark:text-white">{item.range}</div>
              </div>
              <div className={`w-3 h-3 rounded-full ${item.color} ${category.id === item.id ? 'animate-pulse' : ''}`}></div>
            </div>
          ))}
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('bmi.what_is_bmi')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bmi.bmi_desc')}
          </p>
          <ul className="space-y-2">
            {[t('bmi.formula_standard'), t('bmi.formula_oms'), t('bmi.formula_adult')].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-4 h-4 text-indigo-500" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('bmi.ideal_weight_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bmi.ideal_weight_desc')}
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">{t('bmi.new_formula_title')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('bmi.new_formula_desc')}
          </p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-black mb-4">{t('bmi.health_tips')}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h5 className="font-bold text-sm text-emerald-600">{t('bmi.healthy_diet')}</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('bmi.healthy_diet_desc')}</p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold text-sm text-indigo-600">{t('bmi.physical_activity')}</h5>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('bmi.physical_activity_desc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
