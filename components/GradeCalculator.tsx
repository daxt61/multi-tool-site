import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Calculator, GraduationCap, Target, Info, Check, Copy, RotateCcw, Download } from 'lucide-react';

interface GradeEntry {
  id: string;
  grade: string;
  weight: string;
}

export function GradeCalculator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [grades, setGrades] = useState<GradeEntry[]>(initialData?.grades || [
    { id: '1', grade: '', weight: '1' }
  ]);
  const [targetAverage, setTargetAverage] = useState<string>(initialData?.targetAverage || '10');
  const [finalWeight, setFinalWeight] = useState<string>(initialData?.finalWeight || '1');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ grades, targetAverage, finalWeight });
  }, [grades, targetAverage, finalWeight, onStateChange]);

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

    // Final grade needed calculation
    // (CurrentWeightedSum + FinalGrade * FinalWeight) / (TotalWeight + FinalWeight) = TargetAverage
    // FinalGrade = (TargetAverage * (TotalWeight + FinalWeight) - CurrentWeightedSum) / FinalWeight
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

  const addGrade = () => {
    setGrades([...grades, { id: crypto.randomUUID(), grade: '', weight: '1' }]);
  };

  const removeGrade = (id: string) => {
    if (grades.length > 1) {
      setGrades(grades.filter(g => g.id !== id));
    } else {
      setGrades([{ id: '1', grade: '', weight: '1' }]);
    }
  };

  const updateGrade = (id: string, field: 'grade' | 'weight', value: string) => {
    setGrades(grades.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(stats.currentAverage.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setGrades([{ id: '1', grade: '', weight: '1' }]);
    setTargetAverage('10');
    setFinalWeight('1');
  };

  const handleDownload = () => {
    const content = `Calculateur de Notes :
Moyenne Actuelle : ${stats.currentAverage.toFixed(2)} / 20

Notes :
${grades.map((g, i) => `${i + 1}. Note: ${g.grade || '0'}/20, Coef: ${g.weight || '1'}`).join('\n')}

Objectif :
Moyenne visée : ${targetAverage}/20
Coefficient du prochain examen : ${finalWeight}
Note nécessaire : ${stats.needed !== null ? stats.needed.toFixed(2) : 'N/A'}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" /> Vos Notes
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={stats.validGradesCount === 0}
                  className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  <Download className="w-3 h-3" /> Télécharger
                </button>
                <button
                  onClick={handleReset}
                  className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
                >
                  <Trash2 className="w-3 h-3" /> Effacer
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {grades.map((entry, index) => (
                <div key={entry.id} className="flex gap-3 items-end animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className="flex-1 space-y-2">
                    {index === 0 && <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Note (/20)</label>}
                    <input
                      type="number"
                      value={entry.grade}
                      onChange={(e) => updateGrade(entry.id, 'grade', e.target.value)}
                      placeholder="15"
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    {index === 0 && <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Coef</label>}
                    <input
                      type="number"
                      value={entry.weight}
                      onChange={(e) => updateGrade(entry.id, 'weight', e.target.value)}
                      placeholder="1"
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  <button
                    onClick={() => removeGrade(entry.id)}
                    className="p-4 text-slate-400 hover:text-rose-500 transition-colors"
                    aria-label="Supprimer la note"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addGrade}
              className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-bold hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Ajouter une note
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" /> Objectif de Moyenne
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="target-average" className="text-[10px] font-bold text-slate-400 uppercase px-1">Moyenne visée</label>
                <input
                  id="target-average"
                  type="number"
                  value={targetAverage}
                  onChange={(e) => setTargetAverage(e.target.value)}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="12"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="final-weight" className="text-[10px] font-bold text-slate-400 uppercase px-1">Coef du prochain examen</label>
                <input
                  id="final-weight"
                  type="number"
                  value={finalWeight}
                  onChange={(e) => setFinalWeight(e.target.value)}
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
              onClick={handleCopy}
              className={`absolute top-6 right-6 p-3 rounded-2xl transition-all ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20'
              }`}
              title="Copier la moyenne"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Moyenne Actuelle</div>
            <div className="text-6xl md:text-8xl font-black text-white font-mono tracking-tighter">
              {stats.currentAverage.toFixed(2)}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              / 20
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-4">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Analyse de l'objectif</div>

            {stats.needed !== null ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Note nécessaire au prochain exam :</span>
                  <span className={`text-2xl font-black font-mono ${stats.needed > 20 ? 'text-rose-500' : stats.needed > 15 ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {stats.needed.toFixed(2)}
                  </span>
                </div>
                {stats.needed > 20 && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl text-xs text-rose-600 dark:text-rose-400 font-bold">
                    Attention : L'objectif semble inatteignable avec ce coefficient (supérieur à 20/20).
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
              <p className="text-sm text-slate-500 italic">Configurez un objectif pour voir l'analyse.</p>
            )}
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Cet outil calcule une moyenne pondérée. Si tous vos examens ont la même importance, laissez les coefficients à 1. La note nécessaire est calculée pour atteindre exactement la moyenne visée.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
