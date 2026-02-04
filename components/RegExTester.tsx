import React, { useState, useMemo } from 'react';
import { Search, Info, Copy, Check, Trash2 } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-z0-9._%+-]+)@([a-z0-9.-]+\\.[a-z]{2,})');
  const [flags, setFlags] = useState('gi');
  const [text, setText] = useState('Contact us at support@example.com or info@test.org for more details.');
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => {
    if (!regex) return { matches: [], error: null };
    try {
      const re = new RegExp(regex, flags);
      const matches = Array.from(text.matchAll(re));
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [regex, flags, text]);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(results.matches.map(m => Array.from(m)), null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedText = useMemo(() => {
    if (!regex || results.error || results.matches.length === 0) return text;

    try {
      const re = new RegExp(regex, flags);
      let lastIndex = 0;
      const parts: React.ReactNode[] = [];

      // Use matchAll to get all matches and their indices
      const allMatches = Array.from(text.matchAll(re));

      allMatches.forEach((match, i) => {
        const start = match.index!;
        const end = start + match[0].length;

        // Add text before match
        if (start > lastIndex) {
          parts.push(text.substring(lastIndex, start));
        }

        // Add highlighted match
        parts.push(
          <mark key={i} className="bg-indigo-500/30 text-indigo-900 dark:text-indigo-100 rounded px-0.5 border-b-2 border-indigo-500">
            {match[0]}
          </mark>
        );

        lastIndex = end;
      });

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts;
    } catch (e) {
      return text;
    }
  }, [text, regex, flags, results.matches, results.error]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Expression Régulière</label>
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <span className="font-mono">/</span>
              </div>
              <input
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                className="w-full pl-8 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                placeholder="regex ici..."
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                <span className="font-mono">/</span>
              </div>
            </div>
            <input
              type="text"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              className="w-20 px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-center dark:text-white"
              placeholder="flags"
              title="Flags (g, i, m, s, u, y)"
            />
          </div>
          {results.error && (
            <p className="text-xs font-bold text-rose-500 px-1">Erreur: {results.error}</p>
          )}
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Statistiques</label>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{results.matches.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Matchs</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-black dark:text-white">{results.matches.reduce((acc, m) => acc + (m.length > 1 ? m.length - 1 : 0), 0)}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Groupes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Text Area & Highlighting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de Test</label>
            <button onClick={() => setText('')} className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300"
            placeholder="Entrez votre texte ici pour tester le regex..."
          />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Résultat Visuel</label>
          <div className="w-full h-80 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-y-auto font-mono text-sm leading-relaxed whitespace-pre-wrap break-all dark:text-slate-300">
            {highlightedText}
          </div>
        </div>
      </div>

      {/* Group Details */}
      {results.matches.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Détails des captures</label>
            <button
              onClick={handleCopy}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier JSON'}
            </button>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {results.matches.slice(0, 5).map((match, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full">MATCH {i + 1}</span>
                  <span className="text-xs font-mono text-slate-400">index: {match.index}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Plein Match</span>
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 font-mono text-sm truncate dark:text-white">
                      {match[0]}
                    </div>
                  </div>
                  {match.length > 1 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Groupes</span>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(match).slice(1).map((group, j) => (
                          <div key={j} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800 text-xs font-mono">
                            ${j + 1}: {group || 'null'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {results.matches.length > 5 && (
              <div className="p-4 text-center text-xs text-slate-400 font-bold">
                Et {results.matches.length - 5} autres matchs...
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAQ/Guide */}
      <div className="pt-12 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-500">
            <Info className="w-4 h-4" />
            <h4 className="font-bold text-sm dark:text-white">Guide Rapide</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Entrez votre expression régulière sans les délimiteurs "/" et réglez les drapeaux (g, i, m) séparément. Les correspondances s'affichent en temps réel dans le panneau de droite.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-500">
            <Search className="w-4 h-4" />
            <h4 className="font-bold text-sm dark:text-white">Drapeaux Communs</h4>
          </div>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <li><code className="text-indigo-500 font-bold">g</code>: Global (tous les matchs)</li>
            <li><code className="text-indigo-500 font-bold">i</code>: Insensible à la casse</li>
            <li><code className="text-indigo-500 font-bold">m</code>: Multi-ligne</li>
          </ul>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-500">
            <Search className="w-4 h-4" />
            <h4 className="font-bold text-sm dark:text-white">Aide Mémoire</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            <code className="text-indigo-500">.</code> (tout), <code className="text-indigo-500">\d</code> (chiffre), <code className="text-indigo-500">\w</code> (mot), <code className="text-indigo-500">[a-z]</code> (plage), <code className="text-indigo-500">+</code> (1 ou +), <code className="text-indigo-500">*</code> (0 ou +).
          </p>
        </div>
      </div>
    </div>
  );
}
