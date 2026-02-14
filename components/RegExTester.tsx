import { useState, useMemo } from 'react';
import { Search, Info, Copy, Check, AlertCircle, Code, Settings2 } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-zA-Z0-9._%-]+)@([a-zA-Z0-9.-]+)\\.([a-zA-Z]{2,6})');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Contact us at support@example.com or info@test.org');
  const [copied, setCopied] = useState(false);

  const flagsList = [
    { id: 'g', name: 'Global', desc: 'Recherche globale' },
    { id: 'i', name: 'Insensible à la casse', desc: 'Ignore la casse' },
    { id: 'm', name: 'Multiligne', desc: '^ et $ correspondent aux lignes' },
    { id: 's', name: 'Dotall', desc: '. correspond aussi aux sauts de ligne' },
    { id: 'u', name: 'Unicode', desc: 'Support complet de l\'unicode' },
    { id: 'y', name: 'Sticky', desc: 'Recherche à partir de la position courante' },
  ];

  const results = useMemo(() => {
    if (!regex) return { matches: [], error: null };
    try {
      const re = new RegExp(regex, flags);
      const matches = [];
      let match;

      if (flags.includes('g')) {
        while ((match = re.exec(text)) !== null) {
          matches.push(match);
          if (match.index === re.lastIndex) re.lastIndex++; // Avoid infinite loop
        }
      } else {
        match = re.exec(text);
        if (match) matches.push(match);
      }

      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [regex, flags, text]);

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  const copyRegex = () => {
    navigator.clipboard.writeText(`/${regex}/${flags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedText = useMemo(() => {
    if (!results.matches.length || results.error) return text;

    let lastIndex = 0;
    const parts: (string | JSX.Element)[] = [];

    const sortedMatches = [...results.matches].sort((a, b) => a.index - b.index);

    sortedMatches.forEach((match, i) => {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <mark key={i} className="bg-indigo-500/30 text-indigo-900 dark:text-indigo-100 rounded-sm">
          {text.substring(match.index, match.index + match[0].length)}
        </mark>
      );
      lastIndex = match.index + match[0].length;
    });

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  }, [text, results.matches, results.error]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
              <button
                onClick={copyRegex}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <span className="text-xl font-mono">/</span>
              </div>
              <input
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                className="w-full pl-10 pr-20 py-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-lg transition-all"
                placeholder="votre-regex-ici"
              />
              <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <span className="text-xl font-mono">/{flags}</span>
              </div>
            </div>
            {results.error && (
              <div className="flex items-center gap-2 text-rose-500 text-sm font-bold px-2">
                <AlertCircle className="w-4 h-4" /> {results.error}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte de Test</label>
            <div className="relative min-h-[300px] font-mono text-lg leading-relaxed">
              <div className="absolute inset-0 p-8 pointer-events-none whitespace-pre-wrap break-all overflow-auto text-slate-900 dark:text-slate-100">
                {highlightedText}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-full min-h-[300px] p-8 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-transparent caret-slate-900 dark:caret-white resize-none bg-transparent relative z-10"
                placeholder="Entrez votre texte ici pour tester la regex..."
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Drapeaux (Flags)
            </h3>
            <div className="space-y-3">
              {flagsList.map(flag => (
                <button
                  key={flag.id}
                  onClick={() => toggleFlag(flag.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    flags.includes(flag.id)
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-xs font-black">{flag.name} ({flag.id})</div>
                    <div className="text-[10px] font-medium opacity-60">{flag.desc}</div>
                  </div>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    flags.includes(flag.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {flags.includes(flag.id) && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 bg-indigo-600 rounded-[2rem] text-white space-y-4">
            <h3 className="text-lg font-black flex items-center gap-2">
              <Search className="w-5 h-5" /> {results.matches.length} correspondances
            </h3>
            {results.matches.length > 0 && (
              <div className="space-y-3 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
                {results.matches.slice(0, 10).map((match, i) => (
                  <div key={i} className="p-3 bg-white/10 rounded-xl space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider opacity-60">
                      <span>Match {i + 1}</span>
                      <span>Index: {match.index}</span>
                    </div>
                    <div className="font-mono text-sm break-all">"{match[0]}"</div>
                    {match.length > 1 && (
                      <div className="space-y-1 pt-2 border-t border-white/10">
                        {Array.from(match).slice(1).map((group, gi) => (
                          <div key={gi} className="flex gap-2 text-[10px]">
                            <span className="opacity-50">G{gi + 1}:</span>
                            <span className="font-mono break-all">{String(group) || 'null'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {results.matches.length > 10 && (
                  <div className="text-center text-[10px] opacity-60 font-bold">
                    + {results.matches.length - 10} autres correspondances
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-3">
          <h4 className="font-black dark:text-white flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-500" /> Groupes de capture
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilisez les parenthèses <code>(...)</code> pour créer des groupes de capture. Les résultats apparaîtront dans la barre latérale pour chaque correspondance trouvée.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-black dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Échappement
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            N'oubliez pas d'échapper les caractères spéciaux comme <code>. * + ? ^ $ ( ) [ ] {'{'} {'}'} | \</code> si vous voulez les rechercher littéralement.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-black dark:text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" /> Performance
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Pour les textes très longs, privilégiez le drapeau global <code>g</code> avec parcimonie pour éviter les ralentissements du navigateur.
          </p>
        </div>
      </div>
    </div>
  );
}
