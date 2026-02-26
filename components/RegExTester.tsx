import React, { useState, useMemo, useDeferredValue } from 'react';
import { Search, Flag, AlertCircle, Info, Copy, Check } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-z]+)');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Lorem ipsum dolor sit amet, consectetur adipiscing elit.');
  const [copied, setCopied] = useState(false);

  const deferredRegex = useDeferredValue(regex);
  const deferredFlags = useDeferredValue(flags);
  const deferredText = useDeferredValue(text);

  const { matches, error, highlightedText } = useMemo(() => {
    if (!deferredRegex) return { matches: [], error: null, highlightedText: [] };

    try {
      // Sentinel: Validate flags to prevent errors with matchAll
      const isGlobal = deferredFlags.includes('g');
      const reg = new RegExp(deferredRegex, deferredFlags);

      let matches: RegExpMatchArray[] = [];
      if (isGlobal) {
        matches = Array.from(deferredText.matchAll(reg));
      } else {
        const match = deferredText.match(reg);
        if (match) matches = [match];
      }

      // Generate highlighted backdrop
      const segments: React.ReactNode[] = [];
      let lastIndex = 0;

      matches.forEach((match, i) => {
        const index = match.index!;
        const matchedText = match[0];

        // Non-matching segment
        if (index > lastIndex) {
          segments.push(
            <span key={`text-${lastIndex}`} className="text-transparent">
              {deferredText.slice(lastIndex, index)}
            </span>
          );
        }

        // Matching segment
        segments.push(
          <span
            key={`match-${i}`}
            className="bg-indigo-500/20 rounded-sm ring-1 ring-indigo-500/30 text-transparent"
          >
            {matchedText}
          </span>
        );

        lastIndex = index + matchedText.length;
      });

      // Remaining text
      if (lastIndex < deferredText.length) {
        segments.push(
          <span key={`text-${lastIndex}`} className="text-transparent">
            {deferredText.slice(lastIndex)}
          </span>
        );
      }

      return { matches, error: null, highlightedText: segments };
    } catch (e: any) {
      return { matches: [], error: e.message, highlightedText: [<span key="error" className="text-transparent">{deferredText}</span>] };
    }
  }, [deferredRegex, deferredFlags, deferredText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* RegEx Input */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="regex-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
          <button
            onClick={handleCopy}
            className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            id="regex-input"
            type="text"
            value={regex}
            onChange={(e) => setRegex(e.target.value)}
            placeholder="/[a-z]+/"
            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-mono font-bold"
          />
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'g', name: 'Global', desc: 'Recherche toutes les occurrences' },
            { id: 'i', name: 'Insensible à la casse', desc: 'Ignore les majuscules/minuscules' },
            { id: 'm', name: 'Multi-ligne', desc: '^ et $ correspondent aux débuts/fins de ligne' },
            { id: 's', name: 'Dot-all', desc: '. correspond aussi aux sauts de ligne' },
            { id: 'u', name: 'Unicode', desc: 'Support complet de l\'Unicode' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => toggleFlag(f.id)}
              title={f.desc}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                flags.includes(f.id)
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-lg shadow-indigo-500/10'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <Flag className="w-3 h-3" />
              {f.id}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Text Area with Highlighting */}
      <div className="space-y-4">
        <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte de test</label>
        <div className="relative min-h-[300px] w-full bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Backdrop for highlighting */}
          <div
            className="absolute inset-0 p-8 font-mono text-base leading-relaxed whitespace-pre-wrap break-words pointer-events-none select-none border border-transparent"
            aria-hidden="true"
          >
            {highlightedText}
          </div>
          {/* Real textarea */}
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Saisissez votre texte ici pour tester l'expression régulière..."
            className="relative w-full h-full min-h-[300px] p-8 bg-transparent font-mono text-base leading-relaxed outline-none resize-none dark:text-white caret-indigo-500 border border-transparent"
            spellCheck="false"
          />
        </div>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold dark:text-white">Résultats</h4>
              <p className="text-xs text-slate-500">{matches.length} correspondance{matches.length > 1 ? 's' : ''} trouvée{matches.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          {matches.length > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
              {matches.slice(0, 10).map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="font-mono text-sm truncate max-w-[200px]">{m[0]}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Index: {m.index}</span>
                </div>
              ))}
              {matches.length > 10 && (
                <p className="text-center text-[10px] text-slate-400 py-2">Et {matches.length - 10} autres...</p>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-600/10">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-6 h-6 opacity-50" />
            <h4 className="font-bold">Aide RegEx</h4>
          </div>
          <ul className="text-xs space-y-3 text-indigo-100">
            <li className="flex gap-2">
              <span className="font-mono font-bold text-white bg-white/20 px-1.5 rounded">.</span>
              <span>N'importe quel caractère</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono font-bold text-white bg-white/20 px-1.5 rounded">*</span>
              <span>0 ou plus occurrences</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono font-bold text-white bg-white/20 px-1.5 rounded">+</span>
              <span>1 ou plus occurrences</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono font-bold text-white bg-white/20 px-1.5 rounded">\d</span>
              <span>N'importe quel chiffre</span>
            </li>
            <li className="flex gap-2">
              <span className="font-mono font-bold text-white bg-white/20 px-1.5 rounded">\w</span>
              <span>Caractère alphanumérique</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
