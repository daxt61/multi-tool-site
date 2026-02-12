import React, { useState, useMemo, useEffect } from 'react';
import { Search, Info, Copy, Check, Settings, AlertCircle, List, Highlighter } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('[a-z]+');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('The quick brown fox jumps over the lazy dog.');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableFlags = [
    { char: 'g', label: 'global', desc: 'Recherche globale' },
    { char: 'i', label: 'ignoreCase', desc: 'Ignorer la casse' },
    { char: 'm', label: 'multiline', desc: 'Analyse multiligne' },
    { char: 's', label: 'dotAll', desc: 'Le point (.) inclut les sauts de ligne' },
    { char: 'u', label: 'unicode', desc: 'Support Unicode' },
    { char: 'y', label: 'sticky', desc: 'Recherche collante' },
  ];

  const results = useMemo(() => {
    if (!regex) return { matches: [], groups: [] };
    try {
      setError(null);
      const re = new RegExp(regex, flags);
      const matches = [];
      let match;

      if (flags.includes('g')) {
        while ((match = re.exec(testString)) !== null) {
          if (match.index === re.lastIndex) re.lastIndex++; // Prevent infinite loops
          matches.push(match);
        }
      } else {
        match = re.exec(testString);
        if (match) matches.push(match);
      }
      return { matches, error: null };
    } catch (e: any) {
      setError(e.message);
      return { matches: [], error: e.message };
    }
  }, [regex, flags, testString]);

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`/${regex}/${flags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedText = useMemo(() => {
    if (error || !regex || results.matches.length === 0) return testString;

    let lastIndex = 0;
    const parts: (string | JSX.Element)[] = [];

    results.matches.forEach((match, i) => {
      const start = match.index;
      const end = start + match[0].length;

      // Add text before match
      if (start > lastIndex) {
        parts.push(testString.substring(lastIndex, start));
      }

      // Add highlighted match
      parts.push(
        <span
          key={i}
          className="bg-indigo-500/20 border-b-2 border-indigo-500 text-indigo-900 dark:text-indigo-200"
          title={`Match ${i + 1}`}
        >
          {match[0]}
        </span>
      );

      lastIndex = end;
    });

    // Add remaining text
    if (lastIndex < testString.length) {
      parts.push(testString.substring(lastIndex));
    }

    return parts;
  }, [testString, results.matches, error, regex]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Regex Input */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
              <button
                onClick={handleCopy}
                className="text-xs font-bold text-indigo-500 flex items-center gap-1 hover:text-indigo-600 transition-colors"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier regex'}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 font-mono text-xl">/</div>
              <input
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                className={`w-full pl-10 pr-12 py-4 bg-white dark:bg-slate-800 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl text-xl font-mono focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white`}
                placeholder="[a-z]+"
              />
              <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-400 font-mono text-xl">/{flags}</div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl border border-rose-200 dark:border-rose-500/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Flags */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Flags</label>
              <div className="flex flex-wrap gap-2">
                {availableFlags.map((f) => (
                  <button
                    key={f.char}
                    onClick={() => toggleFlag(f.char)}
                    title={f.desc}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                      flags.includes(f.char)
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {f.char}
                    <span className="ml-2 text-[10px] opacity-70 font-normal">{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Matches Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2rem] space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
                <List className="w-5 h-5" />
              </div>
              <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Résultats ({results.matches.length})</h3>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {results.matches.map((match, i) => (
                <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Match #{i + 1}</span>
                    <span className="text-[10px] font-mono text-slate-400">Index: {match.index}-{match.index + match[0].length}</span>
                  </div>
                  <div className="font-mono text-sm dark:text-slate-200 break-all bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                    {match[0]}
                  </div>
                  {match.length > 1 && (
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Groupes de capture</div>
                      <div className="grid grid-cols-1 gap-1">
                        {Array.from(match).slice(1).map((group, gi) => (
                          <div key={gi} className="text-xs font-mono bg-indigo-50/50 dark:bg-indigo-500/5 p-1.5 rounded flex items-center gap-2">
                            <span className="text-indigo-400 font-bold">#{gi + 1}</span>
                            <span className="text-slate-600 dark:text-slate-300 truncate">{group || '(vide)'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {results.matches.length === 0 && !error && (
                <div className="py-12 text-center text-slate-400 italic text-sm">
                  Aucune correspondance trouvée
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test String Input */}
        <div className="flex flex-col h-full space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Chaîne de Test</label>
          </div>
          <div className="relative flex-grow min-h-[400px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
            <textarea
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              className="absolute inset-0 w-full h-full p-8 bg-transparent outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono resize-none text-transparent caret-slate-900 dark:caret-white z-10"
              placeholder="Entrez votre texte à tester..."
            />
            <div className="absolute inset-0 w-full h-full p-8 text-lg leading-relaxed font-mono pointer-events-none whitespace-pre-wrap break-all overflow-auto z-0 text-slate-600 dark:text-slate-400">
              {highlightedText}
            </div>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-3">
          <h4 className="font-bold flex items-center gap-2 dark:text-white">
            <Settings className="w-4 h-4 text-indigo-500" /> Utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Saisissez votre expression régulière sans les délimiteurs. Les drapeaux peuvent être activés en cliquant sur les boutons. Le texte de test sera surligné en temps réel.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold flex items-center gap-2 dark:text-white">
            <Info className="w-4 h-4 text-indigo-500" /> Aide-mémoire
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono text-slate-500">
            <div><span className="text-indigo-500">.</span> n'importe quel car.</div>
            <div><span className="text-indigo-500">\d</span> chiffre</div>
            <div><span className="text-indigo-500">\w</span> mot (Alphanum)</div>
            <div><span className="text-indigo-500">\s</span> espace</div>
            <div><span className="text-indigo-500">+</span> 1 ou plus</div>
            <div><span className="text-indigo-500">*</span> 0 ou plus</div>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="font-bold flex items-center gap-2 dark:text-white">
            <AlertCircle className="w-4 h-4 text-indigo-500" /> Groupes
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilisez des parenthèses <code className="text-indigo-500">( )</code> pour créer des groupes de capture. Ils apparaîtront dans les détails de chaque match.
          </p>
        </div>
      </div>
    </div>
  );
}
