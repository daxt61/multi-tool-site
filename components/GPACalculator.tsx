import { useState, useMemo } from 'react';
import { Plus, Trash2, GraduationCap, Calculator, Info, BookOpen, ChevronRight, RotateCcw, Copy, Check } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  grade: string;
  credits: string;
}

const GRADE_POINTS_4: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0.0
};

const GRADE_POINTS_5: Record<string, number> = {
  'A+': 5.0, 'A': 5.0, 'A-': 4.5,
  'B+': 4.0, 'B': 3.5, 'B-': 3.0,
  'C+': 2.5, 'C': 2.0, 'C-': 1.5,
  'D+': 1.0, 'D': 0.5, 'F': 0.0
};

const DEFAULT_COURSES: Course[] = [
  { id: '1', name: 'Mathématiques', grade: 'A', credits: '3' },
  { id: '2', name: 'Physique', grade: 'B+', credits: '4' },
  { id: '3', name: 'Informatique', grade: 'A-', credits: '3' },
];

export function GPACalculator() {
  const [courses, setCourses] = useState<Course[]>(DEFAULT_COURSES);
  const [scale, setScale] = useState<4 | 5>(4);
  const [copied, setCopied] = useState(false);

  const { gpa, totalCredits } = useMemo(() => {
    let totalPoints = 0;
    let totalCreds = 0;
    const pointsMap = scale === 4 ? GRADE_POINTS_4 : GRADE_POINTS_5;

    courses.forEach(course => {
      const credits = parseFloat(course.credits);
      const points = pointsMap[course.grade] ?? 0;
      if (!isNaN(credits)) {
        totalPoints += points * credits;
        totalCreds += credits;
      }
    });

    return {
      gpa: totalCreds > 0 ? totalPoints / totalCreds : 0,
      totalCredits: totalCreds
    };
  }, [courses, scale]);

  const addCourse = () => {
    const newCourse: Course = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      grade: 'A',
      credits: '3'
    };
    setCourses([...courses, newCourse]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: string) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const reset = () => {
    setCourses(DEFAULT_COURSES);
  };

  const copyResult = () => {
    const text = `Mon GPA est de ${gpa.toFixed(2)} / ${scale}.0 (${totalCredits} crédits)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Liste des cours</h3>
            <div className="flex gap-4">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setScale(4)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${scale === 4 ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  4.0
                </button>
                <button
                  onClick={() => setScale(5)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${scale === 5 ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  5.0
                </button>
              </div>
              <button
                onClick={reset}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Réinitialiser
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="flex gap-3 items-center animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex-grow grid grid-cols-12 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={course.name}
                      onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                      placeholder="Nom du cours"
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-slate-400 dark:text-white"
                    />
                  </div>
                  <div className="col-span-3">
                    <select
                      value={course.grade}
                      onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold p-1 outline-none focus:border-indigo-500 transition-all dark:text-white"
                    >
                      {Object.keys(scale === 4 ? GRADE_POINTS_4 : GRADE_POINTS_5).map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      value={course.credits}
                      onChange={(e) => updateCourse(course.id, 'credits', e.target.value)}
                      placeholder="Crédits"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold p-1 outline-none focus:border-indigo-500 transition-all text-center dark:text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={() => removeCourse(course.id)}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  disabled={courses.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addCourse}
            className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-indigo-500 hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2 font-bold text-sm"
          >
            <Plus className="w-4 h-4" /> Ajouter un cours
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-center flex flex-col items-center justify-center space-y-4 shadow-xl shadow-indigo-500/10 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <button
              onClick={copyResult}
              className={`absolute top-6 right-6 p-3 rounded-2xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40 hover:text-white hover:bg-white/20'}`}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>

            <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Votre GPA</div>
            <div className="text-7xl font-black text-white font-mono tracking-tighter">
              {gpa.toFixed(2)}
            </div>
            <div className="text-indigo-400 font-black text-sm uppercase tracking-widest">
              sur {scale}.0
            </div>
            <div className="pt-4 border-t border-white/10 w-full mt-4">
               <div className="text-white/40 text-[10px] font-black uppercase tracking-widest">Total Crédits</div>
               <div className="text-xl font-black text-white font-mono">{totalCredits}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
                <Info className="w-5 h-5" />
             </div>
             <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               Le GPA (Grade Point Average) est une moyenne pondérée par les crédits. Entrez vos notes et le nombre de crédits correspondant pour chaque matière.
             </p>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Comment est calculé le GPA ?</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le GPA est calculé en divisant le nombre total de points de qualité obtenus par le nombre total d'heures de crédit suivies.
          </p>
          <ul className="space-y-2">
            {['Pondération par crédits', 'Échelle 4.0 ou 5.0', 'Reconnu internationalement'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <ChevronRight className="w-4 h-4 text-indigo-500" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Échelle 4.0 vs 5.0</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'échelle 4.0 est le standard aux USA. L'échelle 5.0 est parfois utilisée pour inclure des cours "Honors" ou "AP" avec des points bonus.
          </p>
        </div>

        <div className="space-y-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600">
            <Calculator className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black">Points de qualité</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Chaque note correspond à une valeur numérique (A=4, B=3, etc.). On multiplie cette valeur par les crédits du cours pour obtenir les points de qualité.
          </p>
        </div>
      </div>
    </div>
  );
}
