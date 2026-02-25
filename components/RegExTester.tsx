import React, { useState, useMemo, useDeferredValue, useRef, useEffect } from 'react';
import { Search, Info, Copy, Check, Trash2, Settings2, AlertCircle, Sparkles } from 'lucide-react';

export function RegExTester() {
  const [pattern, setPattern] = useState('([a-z0-9._%+-]+)@([a-z0-9.-]+\\.[a-z]{2,})');
  const [flags, setFlags] = useState('gi');
  const [testText, setTestText] = useState('Contactez-nous à support@exemple.com ou sales.dept@test-site.org pour plus d\'informations.');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // ⚡ Bolt Optimization: useDeferredValue for expensive regex operations
  const deferredPattern = useDeferredValue(pattern);
  const deferredFlags = useDeferredValue(flags);
  const deferredTestText = useDeferredValue(testText);

  const results = useMemo(() => {
    if (!deferredPattern) return { matches: [], error: null };
    try {
      const regex = new RegExp(deferredPattern, deferredFlags.includes('g') ? deferredFlags : deferredFlags + 'g');
      const matches = Array.from(deferredTestText.matchAll(regex));
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [deferredPattern, deferredFlags, deferredTestText]);

  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pattern);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearAll = () => {
    setPattern('');
    setTestText('');
  };

  // Generate highlighted segments for the backdrop
  const highlightedContent = useMemo(() => {
    if (!deferredPattern || results.error || results.matches.length === 0) {
      return <span className="text-transparent">{deferredTestText}</span>;
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    results.matches.forEach((match, i) => {
      const start = match.index!;
      const end = start + match[0].length;

      // Add non-matching segment
      if (start > lastIndex) {
        segments.push(
          <span key={`text-${lastIndex}`} className="text-transparent">
            {deferredTestText.slice(lastIndex, start)}
          </span>
        );
      }

      // Add matching segment
      segments.push(
        <mark
          key={`match-${i}`}
          className="bg-indigo-500/20 dark:bg-indigo-400/30 rounded-sm text-transparent border-b-2 border-indigo-500/50"
        >
          {match[0]}
        </mark>
      );

      lastIndex = end;
    });

    // Add remaining text
    if (lastIndex < deferredTestText.length) {
      segments.push(
        <span key={`text-${lastIndex}`} className="text-transparent">
          {deferredTestText.slice(lastIndex)}
        </span>
      );
    }

    return segments;
  }, [deferredTestText, results]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Pattern Input Section */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-grow space-y-2">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="regex-pattern" className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}
                  aria-label="Copier le pattern"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
                </button>
                <button
                  onClick={clearAll}
                  className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 hover:bg-rose-100 transition-all flex items-center gap-1"
                  aria-label="Tout effacer"
                >
                  <Trash2 className="w-3 h-3" /> Effacer
                </button>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                id="regex-pattern"
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="/votre-regex/"
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-lg"
              />
            </div>
          </div>

          <div className="w-full md:w-48 space-y-2">
            <label htmlFor="regex-flags" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Settings2 className="w-3 h-3" /> Drapeaux (Flags)
            </label>
            <input
              id="regex-flags"
              type="text"
              value={flags}
              onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))}
              placeholder="gi"
              className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 transition-all font-mono text-lg text-center"
            />
          </div>
        </div>

        {results.error && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Regex invalide : {results.error}</span>
          </div>
        )}
      </div>

      {/* Test Area Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="regex-test-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de Test</label>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
             <span className="flex items-center gap-1.5">
               <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
               {results.matches.length} correspondance{results.matches.length > 1 ? 's' : ''}
             </span>
          </div>
        </div>

        <div className="relative group">
          {/* Backdrop for highlighting */}
          <div
            ref={backdropRef}
            className="absolute inset-0 w-full h-80 p-8 border border-transparent font-mono text-lg leading-relaxed whitespace-pre-wrap break-words overflow-auto pointer-events-none select-none"
            aria-hidden="true"
            style={{
               boxSizing: 'border-box',
               scrollbarWidth: 'none',
               msOverflowStyle: 'none'
            }}
          >
            {highlightedContent}
            {/* Add an extra character to handle trailing newlines */}
            <span className="text-transparent"> </span>
          </div>

          <textarea
            id="regex-test-text"
            ref={textareaRef}
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            onScroll={handleScroll}
            placeholder="Entrez le texte à tester ici..."
            className="w-full h-80 p-8 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-mono text-lg leading-relaxed dark:text-slate-300 relative z-10 bg-transparent resize-none"
            style={{ boxSizing: 'border-box' }}
          />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
          <h4 className="font-bold flex items-center gap-2 dark:text-white">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Aide-mémoire
          </h4>
          <ul className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-medium">
            <li className="flex justify-between"><span><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">.</code></span> <span>N'importe quel caractère</span></li>
            <li className="flex justify-between"><span><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">\d</code></span> <span>Un chiffre (0-9)</span></li>
            <li className="flex justify-between"><span><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">\w</code></span> <span>Lettre, chiffre ou _</span></li>
            <li className="flex justify-between"><span><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">+</code></span> <span>1 ou plus</span></li>
            <li className="flex justify-between"><span><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">*</code></span> <span>0 ou plus</span></li>
          </ul>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
          <h4 className="font-bold flex items-center gap-2 dark:text-white">
            <Settings2 className="w-4 h-4 text-indigo-500" /> Flags communs
          </h4>
          <ul className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-medium">
            <li className="flex justify-between"><span><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">g</code></span> <span>Global (toutes les occ.)</span></li>
            <li className="flex justify-between"><span><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">i</code></span> <span>Insensible à la casse</span></li>
            <li className="flex justify-between"><span><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">m</code></span> <span>Multi-ligne (^ et $ partout)</span></li>
            <li className="flex justify-between"><span><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">s</code></span> <span>DotAll (. inclut \n)</span></li>
          </ul>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3">
          <h4 className="font-bold flex items-center gap-2 dark:text-white">
            <Info className="w-4 h-4 text-indigo-500" /> Confidentialité
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Toutes les expressions régulières et les textes de test sont traités localement dans votre navigateur. Aucune donnée n'est envoyée à nos serveurs.
          </p>
        </div>
      </div>
    </div>
  );
}
