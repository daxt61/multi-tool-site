import { useState, useMemo, useEffect } from 'react';
import { Search, Info, AlertCircle, Check, Copy, Hash, Settings2, Trash2, Code } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-z]+)');
  const [flags, setFlags] = useState('gi');
  const [text, setText] = useState('Le renard brun et rapide saute par-dessus le chien paresseux.');
  const [copied, setCopied] = useState(false);

  const availableFlags = [
    { char: 'g', name: 'Global', desc: 'Recherche globale' },
    { char: 'i', name: 'Insensible', desc: 'Casse insensible' },
    { char: 'm', name: 'Multiligne', desc: 'Ancres ^ et $ sur chaque ligne' },
    { char: 's', name: 'DotAll', desc: '. inclut les sauts de ligne' },
    { char: 'u', name: 'Unicode', desc: 'Support unicode complet' },
    { char: 'y', name: 'Sticky', desc: 'Recherche à partir de lastIndex' },
  ];

  const results = useMemo(() => {
    if (!regex) return { matches: [], error: null };

    try {
      const re = new RegExp(regex, flags);
      const matches: { index: number; content: string; groups: string[] }[] = [];
      let match;

      if (flags.includes('g')) {
        let count = 0;
        // eslint-disable-next-line no-cond-assign
        while ((match = re.exec(text)) !== null && count < 1000) {
          matches.push({
            index: match.index,
            content: match[0],
            groups: match.slice(1)
          });
          if (match.index === re.lastIndex) re.lastIndex++; // Prevent infinite loops
          count++;
        }
      } else {
        match = re.exec(text);
        if (match) {
          matches.push({
            index: match.index,
            content: match[0],
            groups: match.slice(1)
          });
        }
      }

      return { matches, error: null };
    } catch (e) {
      return { matches: [], error: (e as Error).message };
    }
  }, [regex, flags, text]);

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`/${regex}/${flags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
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
              {copied ? 'Copié' : 'Copier Regex'}
            </button>
          </div>
          <div className="flex gap-4 items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-4 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <span className="text-slate-400 font-mono text-xl">/</span>
            <input
              type="text"
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              placeholder="votre-regex"
              className="flex-1 bg-transparent font-mono text-xl outline-none dark:text-white"
            />
            <span className="text-slate-400 font-mono text-xl">/</span>
            <input
              type="text"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              className="w-20 bg-transparent font-mono text-xl text-indigo-500 outline-none"
              placeholder="flags"
            />
          </div>
          {results.error && (
            <div className="flex items-center gap-2 text-rose-500 text-sm font-bold px-2">
              <AlertCircle className="w-4 h-4" />
              {results.error}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {availableFlags.map((flag) => (
            <button
              key={flag.char}
              onClick={() => toggleFlag(flag.char)}
              title={flag.desc}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                flags.includes(flag.char)
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/30'
              }`}
            >
              {flag.char}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Text Input & Highlighting */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de test</label>
            <div className="flex items-center gap-4">
               <span className="text-xs font-bold text-slate-400">{results.matches.length} correspondance(s)</span>
               <button onClick={() => setText('')} className="text-rose-500 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="relative min-h-[300px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="absolute inset-0 w-full h-full p-8 bg-transparent text-transparent caret-slate-900 dark:caret-white font-mono text-lg resize-none z-10 outline-none"
              spellCheck={false}
            />
            <div className="absolute inset-0 w-full h-full p-8 font-mono text-lg whitespace-pre-wrap break-words pointer-events-none dark:text-slate-300">
              {text.split('').map((char, i) => {
                const match = results.matches.find(m => i >= m.index && i < m.index + m.content.length);
                if (match) {
                  return <span key={i} className="bg-indigo-500/20 border-b-2 border-indigo-500 text-indigo-900 dark:text-indigo-200">{char}</span>;
                }
                return char;
              })}
              {text === '' && <span className="text-slate-300 dark:text-slate-600">Entrez du texte pour tester votre expression...</span>}
            </div>
          </div>
        </div>

        {/* Results / Groups */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 min-h-full">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <Settings2 className="w-4 h-4" /> Groupes de capture
              </h3>

              <div className="space-y-4">
                {results.matches.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-3">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium text-slate-400">Aucune correspondance</p>
                  </div>
                ) : (
                  results.matches.slice(0, 10).map((match, i) => (
                    <div key={i} className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl space-y-3 group transition-all hover:border-indigo-500/30">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-indigo-500">Match #{i + 1}</span>
                          <span className="text-[10px] font-bold text-slate-400">Index: {match.index}</span>
                       </div>
                       <div className="font-mono text-sm bg-slate-50 dark:bg-slate-900 p-2 rounded-lg break-all">
                          {match.content}
                       </div>
                       {match.groups.length > 0 && (
                         <div className="pt-2 space-y-2 border-t border-slate-50 dark:border-slate-700">
                            {match.groups.map((group, gi) => (
                              <div key={gi} className="flex gap-2">
                                 <span className="text-[10px] font-black text-slate-400">G{gi + 1}</span>
                                 <span className="text-[10px] font-mono dark:text-slate-400 break-all">{group || 'null'}</span>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                  ))
                )}
                {results.matches.length > 10 && (
                   <p className="text-center text-[10px] font-bold text-slate-400">
                     Affichage des 10 premières correspondances sur {results.matches.length}
                   </p>
                )}
              </div>
           </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
         <div className="space-y-4">
            <h4 className="font-bold flex items-center gap-2"><Code className="w-4 h-4 text-indigo-500" /> Syntaxe</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Utilisez les caractères spéciaux comme <code>. * + ? ^ $</code> pour construire vos motifs. Les parenthèses <code>()</code> créent des groupes de capture.
            </p>
         </div>
         <div className="space-y-4">
            <h4 className="font-bold flex items-center gap-2"><Hash className="w-4 h-4 text-indigo-500" /> Sécurité</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Nous limitons le nombre de correspondances à 1000 et gérons les boucles infinies pour protéger les performances de votre navigateur.
            </p>
         </div>
         <div className="space-y-4">
            <h4 className="font-bold flex items-center gap-2"><Info className="w-4 h-4 text-indigo-500" /> Aide</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Passez la souris sur les drapeaux (flags) pour voir leur description. Les résultats s'affichent en temps réel au fur et à mesure de votre saisie.
            </p>
         </div>
      </div>
    </div>
  );
}
