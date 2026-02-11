import { useState, useMemo } from 'react';
import { Search, Settings2, Info, AlertCircle, CheckCircle2, List } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-z0-9_\\.-]+)@([\\da-z\\.-]+)\\.([a-z\\.]{2,6})');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('Contact us at support@example.com or sales@test.org');
  const [error, setError] = useState<string | null>(null);

  const availableFlags = [
    { char: 'g', label: 'global', desc: 'Recherche globale' },
    { char: 'i', label: 'ignoreCase', desc: 'Ignore la casse' },
    { char: 'm', label: 'multiline', desc: 'Recherche multiligne' },
    { char: 's', label: 'dotAll', desc: 'Le point (.) inclut les sauts de ligne' },
    { char: 'u', label: 'unicode', desc: 'Support Unicode' },
    { char: 'y', label: 'sticky', desc: 'Recherche à partir de lastIndex' }
  ];

  const results = useMemo(() => {
    if (!regex) {
      setError(null);
      return null;
    }

    try {
      const re = new RegExp(regex, flags);
      setError(null);

      const matches = [];
      let match;

      // Safety limit for match count
      const MAX_MATCHES = 1000;

      if (flags.includes('g')) {
        let iterations = 0;
        while ((match = re.exec(testText)) !== null && iterations < MAX_MATCHES) {
          matches.push({
            index: match.index,
            text: match[0],
            groups: match.slice(1)
          });
          // Prevent infinite loops with zero-width matches
          if (match.index === re.lastIndex) re.lastIndex++;
          iterations++;
        }
      } else {
        match = re.exec(testText);
        if (match) {
          matches.push({
            index: match.index,
            text: match[0],
            groups: match.slice(1)
          });
        }
      }

      return matches;
    } catch (e: any) {
      setError(e.message);
      return null;
    }
  }, [regex, flags, testText]);

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
  };

  const highlightedText = useMemo(() => {
    if (!results || results.length === 0) return testText;

    let lastIndex = 0;
    const parts = [];

    results.forEach((match, i) => {
      // Add text before match
      parts.push(testText.slice(lastIndex, match.index));
      // Add highlighted match
      parts.push(
        <mark key={i} className="bg-indigo-500/30 text-indigo-900 dark:text-indigo-200 rounded px-0.5 border-b-2 border-indigo-500">
          {match.text}
        </mark>
      );
      lastIndex = match.index + match.text.length;
    });

    parts.push(testText.slice(lastIndex));
    return parts;
  }, [testText, results]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
             <div className="flex items-center gap-2 px-1">
                <Search className="w-4 h-4 text-indigo-500" />
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
             </div>

             <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 font-mono text-xl">/</div>
                <input
                  type="text"
                  value={regex}
                  onChange={(e) => setRegex(e.target.value)}
                  className={`w-full pl-8 pr-20 py-4 bg-white dark:bg-slate-800 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white`}
                  placeholder="[a-z]+"
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 font-mono text-xl">/{flags}</div>
             </div>

             {error && (
               <div className="flex items-start gap-2 text-rose-500 text-xs font-bold px-1 animate-in fade-in slide-in-from-top-1">
                 <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                 <span>{error}</span>
               </div>
             )}

             <div className="flex flex-wrap gap-2">
                {availableFlags.map(f => (
                  <button
                    key={f.char}
                    onClick={() => toggleFlag(f.char)}
                    title={f.desc}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      flags.includes(f.char)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {f.char} <span className="opacity-50 font-medium hidden sm:inline">{f.label}</span>
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-3">
             <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte de test</label>
             <div className="relative min-h-[300px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
                <div className="absolute inset-0 p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all pointer-events-none text-transparent z-0">
                  {highlightedText}
                </div>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="absolute inset-0 w-full h-full p-6 bg-transparent font-mono text-sm leading-relaxed outline-none resize-none z-10 text-slate-900 dark:text-slate-300 caret-slate-900 dark:caret-white"
                  spellCheck={false}
                />
             </div>
          </div>
        </div>

        {/* Results Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black rounded-[2rem] p-8 text-white min-h-[200px] flex flex-col shadow-xl shadow-indigo-500/10">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
                <List className="w-4 h-4" /> Résultats ({results?.length || 0})
             </h3>

             {results && results.length > 0 ? (
               <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                  {results.map((match, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-400">Match {i + 1}</span>
                          <span className="text-[10px] font-mono text-white/40">index: {match.index}</span>
                       </div>
                       <div className="font-mono text-sm text-white break-all">{match.text}</div>
                       {match.groups.length > 0 && (
                         <div className="space-y-1.5 pt-2 border-t border-white/5">
                            {match.groups.map((group, j) => (
                              <div key={j} className="flex gap-2 text-[10px]">
                                 <span className="text-white/30 font-bold">Group {j + 1}:</span>
                                 <span className="text-indigo-300 font-mono break-all">{group || 'null'}</span>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                  ))}
               </div>
             ) : (
               <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4 opacity-30 py-12">
                  <Search className="w-12 h-12" />
                  <p className="text-sm font-bold">Aucune correspondance</p>
               </div>
             )}
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-[2rem] space-y-4">
             <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Info className="w-5 h-5" />
                <h4 className="text-sm font-black uppercase tracking-widest">Aide rapide</h4>
             </div>
             <div className="space-y-3">
                {[
                  { char: '.', desc: 'N\'importe quel caractère' },
                  { char: '\\d', desc: 'N\'importe quel chiffre' },
                  { char: '\\w', desc: 'Caractère alphanumérique' },
                  { char: '+', desc: '1 ou plus' },
                  { char: '*', desc: '0 ou plus' },
                  { char: '?', desc: '0 ou 1' },
                ].map(item => (
                  <div key={item.char} className="flex justify-between items-center text-xs">
                    <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold text-indigo-600">{item.char}</code>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">{item.desc}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
