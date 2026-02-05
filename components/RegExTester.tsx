import { useState, useMemo } from 'react';
import { Search, Info, Copy, Check, AlertCircle, List } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('');
  const [copied, setCopied] = useState(false);

  const availableFlags = [
    { char: 'g', label: 'global' },
    { char: 'i', label: 'insensitive' },
    { char: 'm', label: 'multiline' },
    { char: 's', label: 'single line' },
    { char: 'u', label: 'unicode' },
    { char: 'y', label: 'sticky' },
  ];

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  const results = useMemo(() => {
    if (!regex) return { matches: [], error: null };
    try {
      const re = new RegExp(regex, flags);
      if (!flags.includes('g')) {
        const match = testText.match(re);
        // match returns an array with index and input properties if it's not global
        // We wrap it to match the structure of matchAll results
        return { matches: match ? [match] : [], error: null };
      }
      const matches = Array.from(testText.matchAll(re));
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [regex, flags, testText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedText = useMemo(() => {
    if (!regex || results.error || results.matches.length === 0) return testText;

    if (results.matches.length > 1000) return "Trop de correspondances (>1000). Veuillez affiner votre regex.";

    let lastIndex = 0;
    const parts: (string | JSX.Element)[] = [];

    results.matches.forEach((match, i) => {
      const start = match.index!;
      const end = start + match[0].length;

      // Handle zero-length matches to prevent infinite loops (though matchAll handles this,
      // our rendering logic might need care)
      if (start === end && start === lastIndex && i > 0) return;

      if (start > lastIndex) {
        parts.push(testText.substring(lastIndex, start));
      }

      parts.push(
        <mark
          key={i}
          className="bg-indigo-500/30 dark:bg-indigo-500/50 text-inherit rounded-sm border-b-2 border-indigo-500"
          title={`Match ${i + 1}`}
        >
          {match[0]}
        </mark>
      );

      lastIndex = end;
    });

    parts.push(testText.substring(lastIndex));
    return parts;
  }, [testText, results, regex]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Regex Input Area */}
      <section className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</h3>
          </div>
          <button
            onClick={handleCopy}
            className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier Regex'}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-mono text-xl">/</span>
            <input
              type="text"
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              placeholder="votre-regex-ici"
              className={`w-full pl-8 pr-12 py-4 bg-slate-50 dark:bg-slate-900 border ${results.error ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-200 dark:border-slate-800'} rounded-2xl font-mono text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-mono text-xl">/</span>
          </div>

          <div className="flex flex-wrap gap-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl h-fit">
            {availableFlags.map(f => (
              <button
                key={f.char}
                onClick={() => toggleFlag(f.char)}
                title={f.label}
                className={`w-10 h-10 rounded-xl font-mono font-bold transition-all ${flags.includes(f.char) ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {f.char}
              </button>
            ))}
          </div>
        </div>

        {results.error && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium border border-rose-100 dark:border-rose-900/30">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {results.error}
          </div>
        )}
      </section>

      {/* Test String Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte de test</label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Entrez le texte à tester..."
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Rendu des correspondances</label>
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
              {results.matches.length} correspondances
            </span>
          </div>
          <div className="w-full h-80 p-8 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-auto text-lg leading-relaxed dark:text-slate-300 font-mono whitespace-pre-wrap break-all shadow-inner">
            {highlightedText}
          </div>
        </div>
      </div>

      {/* Capture Groups */}
      {results.matches.length > 0 && (
        <section className="pt-8 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <List className="w-4 h-4" /> Groupes de capture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.matches.slice(0, 50).map((match, i) => (
              <div key={i} className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Match {i + 1}</span>
                  <span className="text-[10px] font-mono text-slate-400">index: {match.index}</span>
                </div>
                <div className="space-y-2">
                  {Array.from(match).map((group, gi) => (
                    <div key={gi} className="flex gap-3 items-start group">
                      <span className="w-5 h-5 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-black shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {gi}
                      </span>
                      <code className="text-sm font-bold break-all dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700">
                        {group || <span className="text-slate-400 italic">null</span>}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {results.matches.length > 50 && (
              <div className="flex items-center justify-center p-8 text-slate-400 text-sm font-bold italic">
                ... et {results.matches.length - 50} autres correspondances
              </div>
            )}
          </div>
        </section>
      )}

      {/* Educational Content */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-black dark:text-white flex items-center gap-2 uppercase tracking-widest text-xs text-slate-400">
            <Info className="w-4 h-4 text-indigo-500" /> Guide
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Saisissez votre expression régulière entre les barres obliques. Sélectionnez les drapeaux (flags) à droite pour modifier le comportement de recherche. Les correspondances seront surlignées en temps réel dans la zone de rendu.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-black dark:text-white flex items-center gap-2 uppercase tracking-widest text-xs text-slate-400">
            <AlertCircle className="w-4 h-4 text-indigo-500" /> Sécurité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Tout le traitement est effectué localement dans votre navigateur. Les expressions complexes peuvent être lentes sur de très gros textes. L'affichage est limité aux 1000 premières correspondances pour préserver les performances.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-black dark:text-white flex items-center gap-2 uppercase tracking-widest text-xs text-slate-400">
            <List className="w-4 h-4 text-indigo-500" /> Groupes
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le groupe 0 représente la correspondance entière. Les groupes suivants (1, 2, ...) correspondent aux parenthèses capturantes dans votre expression. Les groupes nommés ne sont pas encore supportés dans cet affichage simplifié.
          </p>
        </div>
      </div>
    </div>
  );
}
