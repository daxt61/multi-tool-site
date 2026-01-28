import { useState, useMemo } from 'react';
import { Search, Copy, Check, Trash2, Terminal, AlertCircle } from 'lucide-react';

export function RegexTester() {
  const [pattern, setPattern] = useState('[a-z]+');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('Exemple de texte avec des mots.');
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => {
    if (!pattern) return { matches: [], error: null };
    try {
      const regex = new RegExp(pattern, flags);
      const matches = Array.from(testText.matchAll(regex));
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [pattern, flags, testText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pattern);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">/</div>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  className="w-full pl-8 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-lg outline-none focus:border-indigo-500 transition-all dark:text-white"
                  placeholder="[a-z]+"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">/</div>
              </div>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                className="w-20 px-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-lg outline-none focus:border-indigo-500 transition-all dark:text-white"
                placeholder="gim"
                title="Flags (g, i, m, s, u, y)"
              />
            </div>
            {results.error && (
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold px-1">
                <AlertCircle className="w-3 h-3" /> {results.error}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de Test</label>
              <button
                onClick={() => setTestText('')}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Texte sur lequel tester la regex..."
              className="w-full h-48 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl outline-none focus:border-indigo-500 transition-all dark:text-slate-300 resize-none"
            />
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 space-y-6 min-h-[400px]">
            <div className="flex items-center justify-between">
              <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Résultats</div>
              <div className="px-3 py-1 bg-white/10 rounded-full text-white text-xs font-black uppercase">
                {results.matches.length} correspondance{results.matches.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
              {results.matches.length > 0 ? (
                results.matches.map((match, i) => (
                  <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Match #{i + 1}</span>
                      <span className="text-[10px] font-mono text-slate-500">Index: {match.index}</span>
                    </div>
                    <div className="font-mono text-white break-all">{match[0]}</div>
                    {match.length > 1 && (
                      <div className="pt-2 border-t border-white/5 space-y-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Groupes :</div>
                        {Array.from(match).slice(1).map((group, j) => (
                          <div key={j} className="text-xs font-mono text-indigo-300 flex gap-2">
                            <span className="opacity-50">#{j + 1}</span> {group || "null"}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4 py-20">
                  <Search className="w-12 h-12 opacity-20" />
                  <p className="text-sm font-medium">Aucune correspondance trouvée</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Terminal className="w-6 h-6" />
             </div>
             <div className="space-y-1">
               <p className="text-sm text-slate-900 dark:text-white font-bold">Aide Mémoire</p>
               <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1 font-mono">
                 <span>. : tout</span>
                 <span>\d : chiffre</span>
                 <span>\w : mot</span>
                 <span>\s : espace</span>
                 <span>+ : 1 ou +</span>
                 <span>* : 0 ou +</span>
                 <span>? : optionnel</span>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
