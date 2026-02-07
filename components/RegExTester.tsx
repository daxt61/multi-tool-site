import { useState, useMemo, useDeferredValue } from 'react';
import { Copy, Check, Trash2, Search, Info, AlertCircle, List, Code, Settings2 } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-z0-9._%+-]+)@([a-z0-9.-]+\\.[a-z]{2,})');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Contact us at support@example.com or info@test.org');
  const [copied, setCopied] = useState(false);

  const deferredRegex = useDeferredValue(regex);
  const deferredText = useDeferredValue(text);
  const deferredFlags = useDeferredValue(flags);

  const results = useMemo(() => {
    if (!deferredRegex) return { matches: [], error: null };
    try {
      const re = new RegExp(deferredRegex, deferredFlags);
      const matches = [];
      let match;

      if (deferredFlags.includes('g')) {
        while ((match = re.exec(deferredText)) !== null) {
          matches.push({
            value: match[0],
            index: match.index,
            groups: match.slice(1)
          });
          // Prevent infinite loops with zero-width matches
          if (match.index === re.lastIndex) {
            re.lastIndex++;
          }
          if (matches.length > 1000) break; // Safety limit
        }
      } else {
        match = re.exec(deferredText);
        if (match) {
          matches.push({
            value: match[0],
            index: match.index,
            groups: match.slice(1)
          });
        }
      }

      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [deferredRegex, deferredText, deferredFlags]);

  const handleCopyRegex = () => {
    navigator.clipboard.writeText(`/${regex}/${flags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightMatches = () => {
    if (!deferredText || results.error || results.matches.length === 0) return deferredText;

    const parts = [];
    let lastIndex = 0;

    results.matches.forEach((match, i) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(deferredText.substring(lastIndex, match.index));
      }
      // Add highlighted match
      parts.push(
        <mark key={i} className="bg-indigo-200 dark:bg-indigo-500/40 text-indigo-900 dark:text-indigo-100 rounded px-0.5 border-b-2 border-indigo-500">
          {match.value}
        </mark>
      );
      lastIndex = match.index + match.value.length;
    });

    // Add remaining text
    if (lastIndex < deferredText.length) {
      parts.push(deferredText.substring(lastIndex));
    }

    return parts;
  };

  const availableFlags = [
    { char: 'g', label: 'global', desc: 'Recherche globale' },
    { char: 'i', label: 'insensitive', desc: 'Ignorer la casse' },
    { char: 'm', label: 'multiline', desc: 'Multi-ligne' },
    { char: 's', label: 'dotAll', desc: 'Le point inclut \\n' },
    { char: 'u', label: 'unicode', desc: 'Support Unicode' },
    { char: 'y', label: 'sticky', desc: 'Recherche collante' },
  ];

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Code className="w-3 h-3" /> Expression Régulière
            </label>
            <button
              onClick={handleCopyRegex}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier Regex'}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">/</div>
            <input
              type="text"
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              placeholder="votre-regex"
              className={`w-full pl-8 pr-20 py-4 bg-slate-50 dark:bg-slate-900 border ${results.error ? 'border-rose-500/50 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-2xl outline-none focus:ring-2 transition-all font-mono text-indigo-600 dark:text-indigo-400`}
            />
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 font-mono">
              /{flags}
            </div>
          </div>
          {results.error && (
            <div className="flex items-center gap-2 text-rose-500 text-xs font-medium px-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3 h-3" /> {results.error}
            </div>
          )}

          <div className="pt-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Drapeaux (Flags)</label>
            <div className="flex flex-wrap gap-2">
              {availableFlags.map(f => (
                <button
                  key={f.char}
                  onClick={() => toggleFlag(f.char)}
                  title={f.desc}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    flags.includes(f.char)
                      ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  }`}
                >
                  {f.char} <span className="opacity-50 font-normal ml-1">({f.label})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Search className="w-3 h-3" /> Texte de test
            </label>
            <button onClick={() => setText('')} className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Entrez le texte à tester ici..."
            className="w-full h-[180px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm leading-relaxed dark:text-slate-300 font-mono"
          />
        </div>
      </div>

      {/* Results Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-500" /> Prévisualisation
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded">
              {results.matches.length} correspondance{results.matches.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-6 h-[300px] overflow-y-auto font-mono text-sm whitespace-pre-wrap leading-relaxed dark:text-slate-300">
            {highlightMatches()}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <List className="w-4 h-4 text-indigo-500" /> Groupes & Captures
            </h3>
          </div>
          <div className="p-6 h-[300px] overflow-y-auto space-y-4">
            {results.matches.length > 0 ? (
              results.matches.map((match, i) => (
                <div key={i} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-indigo-500 uppercase">Match {i + 1}</span>
                    <span className="text-[10px] font-mono text-slate-400">Index: {match.index}</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 break-all">
                    {match.value}
                  </div>
                  {match.groups.length > 0 && (
                    <div className="pt-2 grid gap-1">
                      {match.groups.map((group, gi) => (
                        <div key={gi} className="flex gap-2 text-[11px]">
                          <span className="text-slate-400 font-mono">Group {gi + 1}:</span>
                          <span className="text-indigo-600 dark:text-indigo-400 font-mono break-all">{group || 'null'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                <Search className="w-8 h-8 opacity-20" />
                <p className="text-xs font-medium italic">Aucune capture à afficher</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" /> Aide-mémoire
          </h4>
          <ul className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-mono">
            <li><span className="text-indigo-500">.</span> - Tout caractère</li>
            <li><span className="text-indigo-500">\d</span> - Chiffre</li>
            <li><span className="text-indigo-500">\w</span> - Alphanumérique</li>
            <li><span className="text-indigo-500">\s</span> - Espace</li>
            <li><span className="text-indigo-500">*</span> - 0 ou plus</li>
            <li><span className="text-indigo-500">+</span> - 1 ou plus</li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Saisissez votre expression régulière en haut à gauche. Les correspondances sont surlignées en temps réel dans le texte de test. Vous pouvez analyser les groupes de capture détaillés dans le panneau de droite.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-500" /> Sécurité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            <strong>Privé & Sécurisé:</strong> Tout le traitement s'effectue dans votre navigateur. Aucune donnée n'est envoyée à nos serveurs. Nous limitons également le nombre de correspondances pour éviter les plantages du navigateur.
          </p>
        </div>
      </div>
    </div>
  );
}
