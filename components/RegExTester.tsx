import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Info, AlertCircle, Copy, Check, Settings2 } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-z0-9._%+-]+)@([a-z0-9.-]+\\.[a-z]{2,})');
  const [flags, setFlags] = useState('gi');
  const [testText, setTestText] = useState('Contactez-nous à support@example.com ou sales@test-corp.org pour plus d\'informations.');
  const [copied, setCopied] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const availableFlags = [
    { id: 'g', name: 'Global', desc: 'Recherche toutes les occurrences' },
    { id: 'i', name: 'Insensible à la casse', desc: 'Ignore les majuscules/minuscules' },
    { id: 'm', name: 'Multiligne', desc: '^ et $ correspondent aux débuts/fins de lignes' },
    { id: 's', name: 'Dotall', desc: '. correspond aussi aux sauts de ligne' },
    { id: 'u', name: 'Unicode', desc: 'Traite le motif comme une séquence de points de code Unicode' },
  ];

  const results = useMemo(() => {
    if (!regex) return { matches: [], error: null };
    try {
      const re = new RegExp(regex, flags.includes('g') ? flags : flags + 'g');
      const matches = Array.from(testText.matchAll(re));
      return { matches, error: null };
    } catch (e) {
      return { matches: [], error: (e as Error).message };
    }
  }, [regex, flags, testText]);

  const highlightedText = useMemo(() => {
    if (results.error || !regex || results.matches.length === 0) {
      return testText;
    }

    let lastIndex = 0;
    const parts: (string | React.ReactNode)[] = [];

    // Sort matches by index to handle them in order
    const sortedMatches = [...results.matches].sort((a, b) => (a.index || 0) - (b.index || 0));

    sortedMatches.forEach((match, i) => {
      const index = match.index || 0;
      if (index < lastIndex) return; // Skip overlapping matches if any (matchAll handles this usually)

      // Text before match
      parts.push(testText.slice(lastIndex, index));

      // The match itself with highlighting
      // We use a transparent span with a background to highlight,
      // keeping the actual text invisible in the backdrop to avoid sub-pixel rendering offsets
      parts.push(
        <mark
          key={i}
          className="bg-indigo-500/30 dark:bg-indigo-400/40 text-transparent rounded-sm px-0.5 -mx-0.5 border-b-2 border-indigo-500 dark:border-indigo-400"
        >
          {match[0]}
        </mark>
      );

      lastIndex = index + match[0].length;
    });

    parts.push(testText.slice(lastIndex));

    return parts;
  }, [testText, results, regex]);

  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  const copyMatches = () => {
    const text = results.matches.map(m => m[0]).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Search className="w-3 h-3" /> Expression Régulière
              </label>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 font-mono text-lg pointer-events-none">/</div>
              <input
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                className={`w-full pl-8 pr-16 py-4 bg-slate-50 dark:bg-slate-900 border ${results.error ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-800'} rounded-2xl outline-none focus:ring-2 ${results.error ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all font-mono text-lg dark:text-white`}
                placeholder="Votre regex ici..."
              />
              <div className="absolute inset-y-0 right-4 flex items-center text-slate-400 font-mono text-lg pointer-events-none">/{flags}</div>
            </div>
            {results.error && (
              <div className="flex items-start gap-2 text-rose-500 text-xs font-bold bg-rose-50 dark:bg-rose-500/10 p-3 rounded-xl animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Erreur de syntaxe : {results.error}</span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de Test</label>
              <div className="flex gap-2">
                <button
                  onClick={copyMatches}
                  disabled={results.matches.length === 0}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {results.matches.length} {results.matches.length > 1 ? 'correspondances' : 'correspondance'}
                </button>
              </div>
            </div>
            <div className="relative min-h-[300px] font-mono text-lg">
              {/* The backdrop for highlighting */}
              <div
                ref={backdropRef}
                className="absolute inset-0 p-8 text-transparent whitespace-pre-wrap break-words pointer-events-none overflow-auto border border-transparent"
                aria-hidden="true"
              >
                {highlightedText}
              </div>
              {/* The actual interactive textarea */}
              <textarea
                ref={textareaRef}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                onScroll={handleScroll}
                className="w-full h-[300px] p-8 bg-transparent border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none relative z-10 text-slate-900 dark:text-slate-300 placeholder:text-slate-400"
                placeholder="Collez votre texte ici pour tester..."
                spellCheck="false"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Drapeaux (Flags)
            </h3>
            <div className="space-y-3">
              {availableFlags.map((flag) => (
                <button
                  key={flag.id}
                  onClick={() => toggleFlag(flag.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border transition-all text-left group ${
                    flags.includes(flag.id)
                      ? 'bg-white dark:bg-slate-800 border-indigo-500/30 shadow-sm'
                      : 'border-transparent hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    flags.includes(flag.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {flags.includes(flag.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{flag.name}</span>
                      <code className="text-[10px] font-black bg-slate-200 dark:bg-slate-700 px-1 rounded text-slate-500 dark:text-slate-400">{flag.id}</code>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{flag.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2rem] p-8 text-white space-y-4 shadow-lg shadow-indigo-600/20">
            <h3 className="font-bold flex items-center gap-2">
              <Info className="w-5 h-5" /> Aide rapide
            </h3>
            <ul className="text-xs space-y-3 text-indigo-100 font-medium">
              <li className="flex gap-2">
                <span className="font-black text-white">.</span> Tout caractère sauf saut de ligne
              </li>
              <li className="flex gap-2">
                <span className="font-black text-white">\d</span> N'importe quel chiffre [0-9]
              </li>
              <li className="flex gap-2">
                <span className="font-black text-white">\w</span> Caractère alphanumérique [a-zA-Z0-9_]
              </li>
              <li className="flex gap-2">
                <span className="font-black text-white">\s</span> Espace, tabulation, saut de ligne
              </li>
              <li className="flex gap-2">
                <span className="font-black text-white">+</span> 1 ou plusieurs fois
              </li>
              <li className="flex gap-2">
                <span className="font-black text-white">*</span> 0 ou plusieurs fois
              </li>
              <li className="flex gap-2">
                <span className="font-black text-white">?</span> 0 ou 1 fois (optionnel)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Captured Groups Table */}
      {results.matches.length > 0 && results.matches[0].length > 1 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 animate-in slide-in-from-bottom-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Groupes Capturés (Dernière correspondance)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr>
                  <th className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Index</th>
                  <th className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Contenu</th>
                </tr>
              </thead>
              <tbody>
                {results.matches[results.matches.length - 1].map((group, i) => (
                  <tr key={i} className="bg-slate-50 dark:bg-slate-800/50">
                    <td className="px-4 py-3 rounded-l-xl border-y border-l border-slate-100 dark:border-slate-700 font-mono text-sm text-indigo-500 font-bold">
                      {i === 0 ? 'Match Complet' : `Groupe ${i}`}
                    </td>
                    <td className="px-4 py-3 rounded-r-xl border-y border-r border-slate-100 dark:border-slate-700 font-mono text-sm dark:text-slate-300">
                      {group || <span className="text-slate-400 italic">vide</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
