import { useState, useMemo } from 'react';
import { Search, Info, Copy, Check, AlertCircle, Settings2, List } from 'lucide-react';

export function RegExTester() {
  const [regexStr, setRegexStr] = useState('(\\w+)\\s(\\d+)');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('apple 100\nbanana 200\norange 300');
  const [copied, setCopied] = useState(false);

  const { matches, error, executionTime } = useMemo(() => {
    if (!regexStr) return { matches: [], error: null, executionTime: 0 };
    const start = performance.now();
    try {
      const re = new RegExp(regexStr, flags);
      const matches: any[] = [];
      let match;

      if (flags.includes('g')) {
        let count = 0;
        // Prevent infinite loops with empty matches
        re.lastIndex = 0;
        while ((match = re.exec(testText)) !== null && count < 1000) {
          matches.push({
            index: match.index,
            text: match[0],
            groups: match.slice(1)
          });
          count++;
          if (match.index === re.lastIndex) re.lastIndex++;
        }
      } else {
        match = testText.match(re);
        if (match) {
          matches.push({
            index: match.index || 0,
            text: match[0],
            groups: match.slice(1)
          });
        }
      }
      return { matches, error: null, executionTime: performance.now() - start };
    } catch (e: any) {
      return { matches: [], error: e.message, executionTime: 0 };
    }
  }, [regexStr, flags, testText]);

  const highlightedText = useMemo(() => {
    if (!testText || matches.length === 0) return testText;

    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, i) => {
      // Add text before match
      result.push(testText.slice(lastIndex, match.index));
      // Add highlighted match
      result.push(
        <mark key={i} className="bg-indigo-500/30 text-indigo-900 dark:text-indigo-100 rounded-sm px-0.5 border-b-2 border-indigo-500">
          {match.text}
        </mark>
      );
      lastIndex = match.index + match.text.length;
    });
    result.push(testText.slice(lastIndex));
    return result;
  }, [testText, matches]);

  const availableFlags = [
    { char: 'g', label: 'global', desc: 'Recherche toutes les correspondances' },
    { char: 'i', label: 'insensitive', desc: 'Ignore la casse' },
    { char: 'm', label: 'multiline', desc: '^ et $ correspondent aux lignes' },
    { char: 's', label: 'dotAll', desc: '. correspond aussi aux retours à la ligne' },
    { char: 'u', label: 'unicode', desc: 'Support unicode complet' },
    { char: 'y', label: 'sticky', desc: 'Recherche à partir de lastIndex' },
  ];

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
  };

  const handleCopyRegex = () => {
    navigator.clipboard.writeText(`/${regexStr}/${flags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Search className="w-3 h-3" /> Expression Régulière
              </div>
              <button
                onClick={handleCopyRegex}
                className={`text-[10px] font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <div className="flex gap-2">
              <div className="flex-grow relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">/</span>
                 <input
                  type="text"
                  value={regexStr}
                  onChange={(e) => setRegexStr(e.target.value)}
                  className="w-full pl-8 pr-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-lg focus:border-indigo-500 outline-none transition-all dark:text-white"
                  placeholder="[a-z]+"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">/</span>
              </div>
              <div className="flex items-center h-full px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-indigo-500 font-bold min-w-[3rem] justify-center">
                {flags || <span className="text-slate-300">_</span>}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {availableFlags.map(f => (
                <button
                  key={f.char}
                  onClick={() => toggleFlag(f.char)}
                  title={f.desc}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${flags.includes(f.char) ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                >
                  {f.char}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 text-sm font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de test</label>
              <div className="text-[10px] font-bold text-slate-400">{testText.length} caractères</div>
            </div>
            <div className="relative h-80">
               <div className="absolute inset-0 p-6 font-mono text-lg leading-relaxed break-all overflow-auto whitespace-pre-wrap pointer-events-none opacity-100 no-scrollbar">
                {highlightedText}
              </div>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full h-full p-6 bg-transparent border border-slate-200 dark:border-slate-800 rounded-3xl font-mono text-lg leading-relaxed focus:border-indigo-500 outline-none transition-all text-transparent caret-slate-900 dark:caret-white resize-none"
                placeholder="Entrez votre texte de test ici..."
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2rem] shadow-xl text-white space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Résultats ({matches.length})</h3>
               <div className="text-[10px] font-bold text-slate-500">{executionTime.toFixed(2)}ms</div>
            </div>

            <div className="space-y-4 overflow-auto flex-grow pr-2 no-scrollbar">
              {matches.length > 0 ? (
                matches.map((m, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Match {i + 1}</span>
                      <span className="text-[10px] font-mono text-white/40">Index: {m.index}</span>
                    </div>
                    <div className="font-mono text-lg break-all text-white">{m.text}</div>
                    {m.groups.length > 0 && (
                      <div className="pt-3 border-t border-white/5 space-y-2">
                        {m.groups.map((g: string, j: number) => (
                          <div key={j} className="flex gap-3 text-xs">
                            <span className="text-white/20 font-bold min-w-[4rem]">Group {j + 1}:</span>
                            <span className="font-mono text-emerald-400 break-all">{g || 'null'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-24 text-center space-y-4">
                   <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                     <Settings2 className="w-8 h-8 text-white/10" />
                   </div>
                   <p className="text-white/40 font-medium">Aucune correspondance trouvée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] space-y-6">
         <h4 className="font-black flex items-center gap-2">
           <List className="w-5 h-5 text-indigo-500" /> Aide mémoire rapide
         </h4>
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-indigo-500 text-sm font-bold font-mono">.</code>
              <p className="text-xs text-slate-500 leading-relaxed">N'importe quel caractère sauf retour à la ligne.</p>
            </div>
            <div className="space-y-2">
              <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-indigo-500 text-sm font-bold font-mono">\d, \w, \s</code>
              <p className="text-xs text-slate-500 leading-relaxed">Chiffre [0-9], Mot [A-Za-z0-9_], Espace.</p>
            </div>
            <div className="space-y-2">
              <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-indigo-500 text-sm font-bold font-mono">+, *, ?</code>
              <p className="text-xs text-slate-500 leading-relaxed">1 ou plus, 0 ou plus, 0 ou 1.</p>
            </div>
            <div className="space-y-2">
              <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-indigo-500 text-sm font-bold font-mono">^, $</code>
              <p className="text-xs text-slate-500 leading-relaxed">Début de ligne, Fin de ligne.</p>
            </div>
         </div>
      </div>
    </div>
  );
}
