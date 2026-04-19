import { useState, useMemo } from 'react';
import { GraduationCap, Plus, Trash2, Calculator, Info, Check, Copy, RefreshCcw, TrendingUp } from 'lucide-react';

interface GradeRow {
  id: string;
  letter: string;
  credits: string;
}

const GPA_MAP: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0
};

export function GPAConverter() {
  const [rows, setRows] = useState<GradeRow[]>([
    { id: '1', letter: 'A', credits: '3' }
  ]);
  const [scale, setScale] = useState<4 | 5>(4);
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;

    rows.forEach(row => {
      const points = GPA_MAP[row.letter] || 0;
      const credits = parseFloat(row.credits) || 0;

      // On a 5.0 scale, everything is usually shifted by 1 or handled differently (honors)
      // For simplicity here, we'll just scale the 4.0 result
      const scaledPoints = scale === 5 ? (points * 1.25) : points;

      totalPoints += scaledPoints * credits;
      totalCredits += credits;
    });

    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return {
      gpa: gpa.toFixed(2),
      totalCredits
    };
  }, [rows, scale]);

  const addRow = () => {
    setRows([...rows, { id: crypto.randomUUID(), letter: 'A', credits: '3' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof GradeRow, value: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(stats.gpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" /> Vos Résultats
              </h3>
              <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
                {[4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s as 4 | 5)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${scale === s ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Scale {s}.0
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {rows.map((row) => (
                <div key={row.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                  <select
                    value={row.letter}
                    onChange={(e) => updateRow(row.id, 'letter', e.target.value)}
                    className="flex-1 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                  >
                    {Object.keys(GPA_MAP).map(l => <option key={l} value={l}>{l} ({GPA_MAP[l].toFixed(1)})</option>)}
                  </select>
                  <div className="w-32 relative">
                    <input
                      type="number"
                      value={row.credits}
                      onChange={(e) => updateRow(row.id, 'credits', e.target.value)}
                      placeholder="Credits"
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold font-mono outline-none focus:border-indigo-500 transition-all dark:text-white"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">Cr.</span>
                  </div>
                  <button
                    onClick={() => removeRow(row.id)}
                    className="p-4 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addRow}
              className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 font-bold hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Ajouter un cours
            </button>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 shrink-0">
              <Info className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Le GPA (Grade Point Average) est une moyenne pondérée par les crédits. Chaque lettre correspond à un nombre de points précis. Ce convertisseur supporte les échelles standards de 4.0 et 5.0.
            </p>
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-slate-900 dark:bg-black p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 flex flex-col items-center justify-center space-y-4 min-h-[300px] relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <button
              onClick={handleCopy}
              className={`absolute top-6 right-6 p-3 rounded-2xl transition-all ${
                copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20'
              }`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Votre GPA Global</div>
            <div className="text-7xl md:text-9xl font-black text-white font-mono tracking-tighter">
              {stats.gpa}
            </div>
            <div className="text-indigo-400 font-black text-xl md:text-2xl uppercase tracking-widest">
              / {scale}.0
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-4">
            <div className="flex justify-between items-center">
               <span className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Crédits Totaux
               </span>
               <span className="text-2xl font-black font-mono dark:text-white">{stats.totalCredits}</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div
                  className="h-full bg-indigo-600 transition-all duration-1000"
                  style={{ width: `${(parseFloat(stats.gpa) / scale) * 100}%` }}
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
