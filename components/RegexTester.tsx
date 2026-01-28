import { useState, useMemo } from 'react';
import { Search, AlertCircle, CheckCircle2, Info } from 'lucide-react';

export function RegexTester() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');

  const results = useMemo(() => {
    if (!pattern) return { matches: [], error: null };
    try {
      const regex = new RegExp(pattern, flags);
      const matches = Array.from(testString.matchAll(regex));
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [pattern, flags, testString]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Expression Régulière</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">/</span>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}"
                className="w-full pl-8 pr-8 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">/</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Flags</label>
            <input
              type="text"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              placeholder="gim"
              className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>
        </div>

        {results.error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5" />
            Regex invalide : {results.error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte de test</label>
          <textarea
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            placeholder="Entrez le texte à tester ici..."
            className="w-full h-48 p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold flex items-center gap-2 dark:text-white">
              <Search className="w-4 h-4 text-indigo-500" />
              Résultats ({results.matches.length} correspondances)
            </h4>
          </div>

          <div className="space-y-3">
            {results.matches.slice(0, 5).map((match, i) => (
              <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Match {i + 1}</div>
                <div className="font-mono text-indigo-600 dark:text-indigo-400 break-all">{match[0]}</div>
                {match.length > 1 && (
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Array.from(match).slice(1).map((group, j) => (
                      <div key={j} className="text-[10px] text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-100 dark:border-slate-800 truncate">
                        Groupe {j + 1}: {group || 'null'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {results.matches.length > 5 && (
              <div className="text-center text-xs text-slate-400 font-bold italic">
                + {results.matches.length - 5} autres correspondances...
              </div>
            )}
            {results.matches.length === 0 && !results.error && pattern && (
              <div className="text-center py-8 text-slate-400 font-medium italic">
                Aucune correspondance trouvée.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">Aide Regex</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <div><span className="font-bold text-indigo-500">.</span> N'importe quel caractère</div>
            <div><span className="font-bold text-indigo-500">\d</span> Chiffre (0-9)</div>
            <div><span className="font-bold text-indigo-500">\w</span> Caractère alphanum.</div>
            <div><span className="font-bold text-indigo-500">\s</span> Espace blanc</div>
            <div><span className="font-bold text-indigo-500">*</span> 0 ou plus</div>
            <div><span className="font-bold text-indigo-500">+</span> 1 ou plus</div>
            <div><span className="font-bold text-indigo-500">?</span> 0 ou 1</div>
            <div><span className="font-bold text-indigo-500">^</span> Début de ligne</div>
            <div><span className="font-bold text-indigo-500">$</span> Fin de ligne</div>
          </div>
        </div>
      </div>
    </div>
  );
}
