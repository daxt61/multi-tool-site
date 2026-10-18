import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, GraduationCap, Target, Info, Check, Copy, Download, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Kbd } from './ui/Kbd';

interface GradeEntry {
  id: string;
  grade: string;
  weight: string;
}

export function GradeCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const firstGradeInputRef = useRef<HTMLInputElement>(null);

  const [grades, setGrades] = useState<GradeEntry[]>(initialData?.grades || [
    { id: '1', grade: '', weight: '1' }
  ]);
  const [targetAverage, setTargetAverage] = useState<string>(initialData?.targetAverage || '10');
  const [finalWeight, setFinalWeight] = useState<string>(initialData?.finalWeight || '1');
  const [activePresetId, setActivePresetId] = useState<string | null>(initialData?.activePresetId || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ grades, targetAverage, finalWeight, activePresetId });
  }, [grades, targetAverage, finalWeight, activePresetId, onStateChange]);

  const PRESETS = {
    high_school: {
      grades: [
        { id: '1', grade: '14', weight: '1' },
        { id: '2', grade: '12', weight: '2' },
        { id: '3', grade: '16', weight: '3' },
      ],
      targetAverage: '14',
      finalWeight: '2',
    },
    university: {
      grades: [
        { id: '1', grade: '11', weight: '2' },
        { id: '2', grade: '13', weight: '3' },
        { id: '3', grade: '9', weight: '1' },
        { id: '4', grade: '15', weight: '4' },
      ],
      targetAverage: '12',
      finalWeight: '3',
    },
    final_exam: {
      grades: [
        { id: '1', grade: '10', weight: '1' },
        { id: '2', grade: '12', weight: '1' },
      ],
      targetAverage: '13',
      finalWeight: '4',
    },
  };

  const stats = useMemo(() => {
    let totalWeightedGrade = 0;
    let totalWeight = 0;
    let validGradesCount = 0;

    grades.forEach(entry => {
      const g = parseFloat(entry.grade);
      const w = parseFloat(entry.weight);
      if (!isNaN(g) && !isNaN(w)) {
        totalWeightedGrade += g * w;
        totalWeight += w;
        validGradesCount++;
      }
    });

    const currentAverage = totalWeight > 0 ? totalWeightedGrade / totalWeight : 0;

    const target = parseFloat(targetAverage);
    const fw = parseFloat(finalWeight);
    let needed = null;

    if (!isNaN(target) && !isNaN(fw) && fw > 0) {
      needed = (target * (totalWeight + fw) - totalWeightedGrade) / fw;
    }

    return {
      currentAverage,
      totalWeight,
      validGradesCount,
      needed
    };
  }, [grades, targetAverage, finalWeight]);

  const loadPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    setGrades(preset.grades.map(g => ({ ...g, id: crypto.randomUUID() })));
    setTargetAverage(preset.targetAverage);
    setFinalWeight(preset.finalWeight);
    setActivePresetId(presetKey);
    toast.success(t('gradecalc.preset_loaded', 'Loaded grade preset!'));
  };

  const addGrade = () => {
    setGrades(prev => [...prev, { id: crypto.randomUUID(), grade: '', weight: '1' }]);
    setActivePresetId(null);
  };

  const removeGrade = (id: string) => {
    setGrades(prev => prev.length > 1 ? prev.filter(g => g.id !== id) : [{ id: '1', grade: '', weight: '1' }]);
    setActivePresetId(null);
  };

  const updateGrade = (id: string, field: 'grade' | 'weight', value: string) => {
    setGrades(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
    setActivePresetId(null);
  };

  const handleCopy = useCallback(() => {
    const formattedAverage = stats.currentAverage.toFixed(2);
    navigator.clipboard.writeText(formattedAverage);
    setCopied(true);
    toast.success(t('gradecalc.toast_copied', 'Copied current average ({{avg}}/20) to clipboard!', { avg: formattedAverage }));
    setTimeout(() => setCopied(false), 2000);
  }, [stats.currentAverage, t]);

  const handleReset = useCallback(() => {
    setGrades([{ id: '1', grade: '', weight: '1' }]);
    setTargetAverage('10');
    setFinalWeight('1');
    setActivePresetId(null);
    toast.success(t('gradecalc.toast_reset', 'Grades reset!'));
    setTimeout(() => firstGradeInputRef.current?.focus(), 0);
  }, [t]);

  const handleDownload = () => {
    const content = `${t('gradecalc.download_title', 'Grade Calculator Summary')}:
${t('gradecalc.current_average', 'Current Average')}: ${stats.currentAverage.toFixed(2)} / 20

${t('gradecalc.grades_list', 'Grades')}:
${grades.map((g, i) => `${i + 1}. Note: ${g.grade || '0'}/20, Coef: ${g.weight || '1'}`).join('\n')}

${t('gradecalc.target_title', 'Target Objective')}:
${t('gradecalc.target_average', 'Target Average')}: ${targetAverage}/20
${t('gradecalc.next_exam_weight', 'Next Exam Coefficient')}: ${finalWeight}
${t('gradecalc.needed_grade', 'Grade Needed')}: ${stats.needed !== null ? stats.needed.toFixed(2) : 'N/A'}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('common.downloaded', 'Downloaded summary!'));
  };

  const handlersRef = useRef({ handleReset, handleCopy });
  useEffect(() => {
    handlersRef.current = { handleReset, handleCopy };
  }, [handleReset, handleCopy]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      const activeElement = document.activeElement;
      const isEditable =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isEditable && e.key !== 'Escape') return;

      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handlersRef.current.handleReset();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handlersRef.current.handleCopy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Quick Start Presets */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t('gradecalc.presets_title', 'Quick Start Presets:')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={activePresetId === 'high_school'}
            onClick={() => loadPreset('high_school')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'high_school'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('gradecalc.preset_high_school', 'Standard High School')}
          </button>
          <button
            type="button"
            aria-pressed={activePresetId === 'university'}
            onClick={() => loadPreset('university')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'university'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('gradecalc.preset_university', 'University Semester')}
          </button>
          <button
            type="button"
            aria-pressed={activePresetId === 'final_exam'}
            onClick={() => loadPreset('final_exam')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activePresetId === 'final_exam'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 border border-indigo-600'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
            }`}
          >
            {t('gradecalc.preset_final_exam', 'Weighted Final Exam')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('gradecalc.your_grades', 'Your Grades')}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={stats.validGradesCount === 0}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <Download className="w-3 h-3" aria-hidden="true" /> {t('common.download', 'Download')}
                </button>
                <div className="flex items-center gap-1">
                  <Kbd modifier={null} className="hidden sm:inline-flex border-rose-200 dark:border-rose-800 text-rose-400 dark:bg-slate-900">Esc</Kbd>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                  >
                    <Trash2 className="w-3 h-3" aria-hidden="true" /> {t('common.clear', 'Clear')}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {grades.map((entry, index) => (
                <div key={entry.id} className="flex gap-3 items-end animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex-1 space-y-2">
                    <label htmlFor={`grade-${index}`} className="text-[10px] font-bold text-slate-400 uppercase px-1 cursor-pointer">
                      {t('gradecalc.grade_label', 'Grade (/20)')} #{index + 1}
                    </label>
                    <input
                      id={`grade-${index}`}
                      ref={index === 0 ? firstGradeInputRef : undefined}
                      type="number"
                      value={entry.grade}
                      onChange={(e) => updateGrade(entry.id, 'grade', e.target.value)}
                      placeholder="15"
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <label htmlFor={`weight-${index}`} className="text-[10px] font-bold text-slate-400 uppercase px-1 cursor-pointer">
                      {t('gradecalc.coef_label', 'Coef')}
                    </label>
                    <input
                      id={`weight-${index}`}
                      type="number"
                      value={entry.weight}
                      onChange={(e) => updateGrade(entry.id, 'weight', e.target.value)}
                      placeholder="1"
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGrade(entry.id)}
                    className="p-4 text-slate-400 hover:text-rose-500 transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none rounded-2xl"
                    aria-label={t('gradecalc.remove_grade', 'Remove grade')}
                  >
                    <Trash2 className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addGrade}
              className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-bold hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <Plus className="w-5 h-5" aria-hidden="true" /> {t('gradecalc.add_grade', 'Add a grade')}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" aria-hidden="true" /> {t('gradecalc.target_objective', 'Target Objective')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="target-average" className="text-[10px] font-bold text-slate-400 uppercase px-1 cursor-pointer">
                  {t('gradecalc.target_average', 'Target Average')}
                </label>
                <input
                  id="target-average"
                  type="number"
                  value={targetAverage}
                  onChange={(e) => {
                    setTargetAverage(e.target.value);
                    setActivePresetId(null);
                  }}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="12"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="final-weight" className="text-[10px] font-bold text-slate-400 uppercase px-1 cursor-pointer">
                  {t('gradecalc.next_exam_coef', 'Next Exam Coef')}
                </label>
                <input
                  id="final-weight"
                  type="number"
                  value={finalWeight}
                  onChange={(e) => {
                    setFinalWeight(e.target.value);
                    setActivePresetId(null);
                  }}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden text-center group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <button
              type="button"
              onClick={handleCopy}
              className={`absolute top-6 right-6 p-3 rounded-2xl transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none flex items-center gap-1.5 ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
              }`}
              aria-label={t('gradecalc.copy_average', 'Copy current average')}
              title={t('gradecalc.copy_average', 'Copy current average')}
            >
              {copied ? <Check className="w-5 h-5" aria-hidden="true" /> : <Copy className="w-5 h-5" aria-hidden="true" />}
              {!copied && <Kbd modifier={null} className="hidden sm:inline-flex w-4 h-4 bg-white/20 text-white border-white/30 text-[10px]">C</Kbd>}
            </button>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              {t('gradecalc.current_average', 'Current Average')}
            </div>
            <div className="text-6xl md:text-8xl font-black text-white font-mono tracking-tighter">
              {stats.currentAverage.toFixed(2)}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              / 20
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-4">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
              {t('gradecalc.target_analysis', 'Target Analysis')}
            </div>

            {stats.needed !== null ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">
                    {t('gradecalc.needed_next_exam', 'Grade needed on next exam')}:
                  </span>
                  <span className={`text-2xl font-black font-mono ${stats.needed > 20 ? 'text-rose-500' : stats.needed > 15 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {stats.needed.toFixed(2)}
                  </span>
                </div>
                {stats.needed > 20 && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-xs text-rose-600 dark:text-rose-400 font-bold">
                    {t('gradecalc.warning_unreachable', 'Warning: Target is unreachable with this coefficient (> 20/20).')}
                  </div>
                )}
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${stats.needed > 20 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                    style={{ width: `${Math.min(100, Math.max(0, (stats.needed / 20) * 100))}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">
                {t('gradecalc.configure_objective_hint', 'Configure a target objective to see analysis.')}
              </p>
            )}
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
              <Info className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t('gradecalc.info_text', 'This tool calculates a weighted average. If all exams have equal weight, leave coefficients set to 1. The grade needed is computed to hit your target average exactly.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
