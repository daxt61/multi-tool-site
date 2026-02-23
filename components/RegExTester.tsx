import { useState, useMemo, useRef } from 'react';
import { Search, Copy, Check, Trash2, Info } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-z0-9_.-]+)@([a-z0-9_.-]+)\\.([a-z]{2,5})');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Contactez-nous à support@exemple.com ou sales.dept@boite-a-outils.fr');
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    if (!regex) return [];
    try {
      const re = new RegExp(regex, flags.includes('g') ? flags : flags + 'g');
      return Array.from(text.matchAll(re));
    } catch (e) {
      return [];
    }
  }, [regex, flags, text]);

  const highlightedText = useMemo(() => {
    if (!regex || matches.length === 0) return text;

    try {
      const re = new RegExp(regex, flags.includes('g') ? flags : flags + 'g');
      let lastIndex = 0;
      const parts = [];

      // Use matchAll but we need to handle the parts between matches
      const allMatches = Array.from(text.matchAll(re));

      allMatches.forEach((match, i) => {
        const start = match.index!;
        const end = start + match[0].length;

        // Add text before match
        parts.push(text.slice(lastIndex, start));

        // Add highlighted match
        parts.push(
          <mark key={i} className="bg-indigo-200 dark:bg-indigo-500/40 text-transparent rounded-sm px-0.5 -mx-0.5">
            {match[0]}
          </mark>
        );

        lastIndex = end;
      });

      parts.push(text.slice(lastIndex));
      return parts;
    } catch (e) {
      return text;
    }
  }, [regex, flags, text, matches]);

  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="regex-input" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Expression Régulière</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="text-slate-400 font-mono">/</span>
            </div>
            <input
              id="regex-input"
              type="text"
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              className="w-full pl-8 pr-12 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
              placeholder="votre_regex_ici"
            />
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <span className="text-slate-400 font-mono">/</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="flags-input" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Flags</label>
          <input
            id="flags-input"
            type="text"
            value={flags}
            onChange={(e) => setFlags(e.target.value.replace(/[^gimuy]/g, ''))}
            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-center"
            placeholder="gim"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="test-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de test</label>
          <button
            onClick={() => setText('')}
            className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Effacer
          </button>
        </div>

        <div className="relative min-h-[300px] font-mono text-sm leading-relaxed">
          {/* Backdrop for highlighting */}
          <div
            ref={backdropRef}
            className="absolute inset-0 p-6 pointer-events-none whitespace-pre-wrap break-words overflow-auto text-slate-900/0 dark:text-white/0 select-none border border-transparent"
            aria-hidden="true"
          >
            {highlightedText}
          </div>

          {/* Real textarea */}
          <textarea
            id="test-text"
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onScroll={handleScroll}
            className="absolute inset-0 w-full h-full p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200 dark:border-slate-800 resize-none focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-900 dark:text-white caret-indigo-500 bg-transparent"
            placeholder="Entrez le texte à tester..."
            spellCheck="false"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-bold flex items-center gap-2 dark:text-white">
            <Search className="w-4 h-4 text-indigo-500" />
            Correspondances ({matches.length})
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-auto pr-2 custom-scrollbar">
            {matches.length > 0 ? (
              matches.map((match, i) => (
                <div key={i} className="p-4 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Match {i + 1}</span>
                    <span className="text-[10px] text-slate-400">Index: {match.index}</span>
                  </div>
                  <p className="font-mono break-all dark:text-slate-200">{match[0]}</p>
                  {match.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 space-y-1">
                      {Array.from(match).slice(1).map((group, gi) => (
                        <div key={gi} className="flex gap-2 items-baseline">
                          <span className="text-[10px] font-bold text-slate-400">G{gi + 1}:</span>
                          <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 break-all">{group || 'null'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">Aucune correspondance trouvée.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold flex items-center gap-2 dark:text-white">
            <Info className="w-4 h-4 text-indigo-500" />
            Aide-mémoire rapide
          </h3>
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 text-sm">
            <div className="flex justify-between">
              <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">.</code>
              <span className="text-slate-500">N'importe quel caractère</span>
            </div>
            <div className="flex justify-between">
              <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">\d</code>
              <span className="text-slate-500">Un chiffre</span>
            </div>
            <div className="flex justify-between">
              <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">\w</code>
              <span className="text-slate-500">Caractère de mot</span>
            </div>
            <div className="flex justify-between">
              <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">+</code>
              <span className="text-slate-500">1 ou plus</span>
            </div>
            <div className="flex justify-between">
              <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">*</code>
              <span className="text-slate-500">0 ou plus</span>
            </div>
            <div className="flex justify-between">
              <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded font-bold">?</code>
              <span className="text-slate-500">0 ou 1 (optionnel)</span>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleCopy}
                className="w-full py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-indigo-700 active:scale-95"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copier la Regex
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
