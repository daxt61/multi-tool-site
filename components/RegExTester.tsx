import React, { useState, useMemo, useDeferredValue } from 'react';
import { Search, Settings2, Copy, Check, Info, AlertCircle } from 'lucide-react';

export function RegExTester() {
  const [regexStr, setRegexStr] = useState('(\\w+)');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('Hello World 2025!');
  const [copied, setCopied] = useState(false);

  const deferredTestText = useDeferredValue(testText);
  const deferredRegexStr = useDeferredValue(regexStr);

  const availableFlags = [
    { id: 'g', label: 'Global (g)', desc: 'Recherche toutes les occurrences' },
    { id: 'i', label: 'Insensible (i)', desc: 'Ignore la casse' },
    { id: 'm', label: 'Multiligne (m)', desc: '^ et $ correspondent aux débuts/fins de ligne' },
    { id: 's', label: 'DotAll (s)', desc: '. correspond aussi aux sauts de ligne' },
    { id: 'u', label: 'Unicode (u)', desc: 'Support complet de l\'Unicode' },
    { id: 'y', label: 'Sticky (y)', desc: 'Commence à l\'index lastIndex' },
  ];

  const regexResult = useMemo(() => {
    if (!deferredRegexStr) return { matches: [], error: null };
    try {
      const re = new RegExp(deferredRegexStr, flags);
      const matches = [];
      let match;

      if (flags.includes('g')) {
        while ((match = re.exec(deferredTestText)) !== null) {
          if (match.index === re.lastIndex) re.lastIndex++;
          matches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
      } else {
        match = re.exec(deferredTestText);
        if (match) {
          matches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
      }
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [deferredRegexStr, flags, deferredTestText]);

  const highlightedText = useMemo(() => {
    if (regexResult.error || !deferredRegexStr || regexResult.matches.length === 0) {
      return deferredTestText;
    }

    const segments = [];
    let lastIndex = 0;

    regexResult.matches.forEach((match, i) => {
      // Add text before match
      segments.push(deferredTestText.slice(lastIndex, match.index));
      // Add highlighted match
      segments.push(
        <mark
          key={i}
          className="bg-indigo-200 dark:bg-indigo-500/30 text-indigo-900 dark:text-indigo-100 rounded-sm px-0.5"
        >
          {match.text}
        </mark>
      );
      lastIndex = match.index + match.text.length;
    });

    segments.push(deferredTestText.slice(lastIndex));
    return segments;
  }, [deferredTestText, regexResult]);

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  const copyRegex = () => {
    navigator.clipboard?.writeText(`/${regexStr}/${flags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Configuration Section */}
      <section className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Search className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</h3>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">/</div>
            <input
              type="text"
              value={regexStr}
              onChange={(e) => setRegexStr(e.target.value)}
              placeholder="Entrez votre regex..."
              className="w-full pl-8 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono">/{flags}</div>
          </div>
          <button
            onClick={copyRegex}
            className="px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span className="text-sm">Copier</span>
          </button>
        </div>

        {regexResult.error && (
          <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {regexResult.error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {availableFlags.map(flag => (
            <button
              key={flag.id}
              onClick={() => toggleFlag(flag.id)}
              title={flag.desc}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                flags.includes(flag.id)
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300'
              }`}
            >
              {flag.label}
            </button>
          ))}
        </div>
      </section>

      {/* Editor Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de test</h3>
            </div>
            <div className="text-[10px] font-bold text-slate-400">
              {testText.length} caractères
            </div>
          </div>
          <div className="relative group h-96">
            <textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="absolute inset-0 w-full h-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-mono text-sm leading-relaxed text-transparent caret-slate-900 dark:caret-white z-10 bg-transparent"
              placeholder="Entrez le texte à tester ici..."
            />
            <div
              className="absolute inset-0 w-full h-full p-6 pointer-events-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-words overflow-y-auto bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem]"
              aria-hidden="true"
            >
              {highlightedText}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Résultats</h3>
            </div>
            <div className="text-[10px] font-bold text-indigo-500">
              {regexResult.matches.length} correspondances
            </div>
          </div>
          <div className="h-96 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-y-auto p-6 space-y-3">
            {regexResult.matches.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300">
                  <Search className="w-6 h-6" />
                </div>
                <p className="text-slate-400 text-sm font-medium">Aucune correspondance trouvée</p>
              </div>
            ) : (
              regexResult.matches.map((match, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 space-y-2 animate-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full">MATCH {i + 1}</span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">Index: {match.index}</span>
                  </div>
                  <div className="font-mono text-sm dark:text-slate-200 break-all">{match.text}</div>
                  {match.groups.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                      {match.groups.map((group, gi) => (
                        <div key={gi} className="flex gap-2 text-[10px]">
                          <span className="text-slate-400 font-bold">Groupe {gi + 1}:</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono">{group || 'null'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
