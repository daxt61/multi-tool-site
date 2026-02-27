import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Settings, AlertCircle, Copy, Check, Info } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-z0-9_.-]+)@([a-z0-9.-]+)\\.([a-z]{2,8})');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Contactez-nous à support@example.com ou info@test.org pour plus d\'informations.');
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { matches, error, highlightedHtml } = useMemo(() => {
    if (!regex) return { matches: [], error: null, highlightedHtml: text };

    try {
      const re = new RegExp(regex, flags.includes('g') ? flags : flags + 'g');
      const foundMatches = Array.from(text.matchAll(re));

      // We need to escape HTML in the text and matches for the backdrop
      const escapeHtml = (str: string) => {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };

      let html = '';
      let currentPos = 0;

      foundMatches.forEach((match, i) => {
        const start = match.index!;
        const end = start + match[0].length;

        // Text before match
        html += escapeHtml(text.slice(currentPos, start));
        // Match with highlight
        html += `<span class="bg-indigo-500/30 border-b-2 border-indigo-500 text-transparent">${escapeHtml(match[0])}</span>`;

        currentPos = end;
      });

      // Remaining text
      html += escapeHtml(text.slice(currentPos));
      // Handle trailing newline for sync
      if (text.endsWith('\n')) html += '\n';

      return {
        matches: foundMatches,
        error: null,
        highlightedHtml: html
      };
    } catch (e: any) {
      return { matches: [], error: e.message, highlightedHtml: text };
    }
  }, [regex, flags, text]);

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

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* RegEx Input Section */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-3 text-indigo-500">
            <Search className="w-5 h-5" />
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Expression Régulière</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {['g', 'i', 'm', 's', 'u'].map(f => (
              <button
                key={f}
                onClick={() => toggleFlag(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                  flags.includes(f)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
                title={`Flag: ${f}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
            <span className="font-mono text-xl">/</span>
          </div>
          <input
            type="text"
            value={regex}
            onChange={(e) => setRegex(e.target.value)}
            className={`w-full pl-8 pr-12 py-4 bg-white dark:bg-slate-800 border ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl text-xl font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white`}
            placeholder="[a-z]+"
          />
          <div className="absolute inset-y-0 right-4 flex items-center gap-2">
            <span className="font-mono text-xl text-slate-400">/{flags}</span>
            <button
              onClick={handleCopy}
              className={`p-2 rounded-xl transition-all ${copied ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              title="Copier l'expression"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-500 text-sm font-bold animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Main Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <label htmlFor="regex-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de test</label>
            <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md">
              {matches.length} correspondance{matches.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="relative h-96 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
            {/* Highlighting Backdrop */}
            <div
              ref={backdropRef}
              className="absolute inset-0 p-6 font-mono text-base leading-relaxed whitespace-pre-wrap break-all pointer-events-none select-none overflow-auto scrollbar-hide"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              aria-hidden="true"
            />
            {/* Actual Textarea */}
            <textarea
              ref={textareaRef}
              id="regex-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onScroll={handleScroll}
              className="absolute inset-0 w-full h-full p-6 bg-transparent font-mono text-base leading-relaxed whitespace-pre-wrap break-all outline-none resize-none dark:text-white caret-indigo-500"
              spellCheck="false"
              placeholder="Saisissez votre texte ici pour tester l'expression..."
            />
          </div>
        </div>

        {/* Results / Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 h-full">
            <div className="flex items-center gap-2 text-indigo-500 mb-6">
              <Settings className="w-4 h-4" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Détails des captures</h3>
            </div>

            <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-2 custom-scrollbar">
              {matches.length > 0 ? (
                matches.map((match, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2 animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-indigo-500 uppercase">Match {i + 1}</span>
                      <span className="text-[10px] font-mono text-slate-400">Pos: {match.index}</span>
                    </div>
                    <div className="font-mono text-sm dark:text-white break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      {match[0]}
                    </div>
                    {match.length > 1 && (
                      <div className="space-y-1 mt-2">
                        {Array.from(match).slice(1).map((group, gi) => (
                          <div key={gi} className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold text-slate-400">G{gi + 1}:</span>
                            <span className="text-xs font-mono text-indigo-400 truncate">{group || '(vide)'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300">
                    <Search className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">Aucune correspondance trouvée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-2xl flex gap-4 items-start">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-indigo-900 dark:text-indigo-100">Aide-mémoire rapide</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-2 font-mono">
            <div><span className="font-black text-indigo-600 dark:text-indigo-400">.</span> n'importe quel car.</div>
            <div><span className="font-black text-indigo-600 dark:text-indigo-400">\d</span> chiffre [0-9]</div>
            <div><span className="font-black text-indigo-600 dark:text-indigo-400">+</span> 1 ou plus</div>
            <div><span className="font-black text-indigo-600 dark:text-indigo-400">*</span> 0 ou plus</div>
            <div><span className="font-black text-indigo-600 dark:text-indigo-400">?</span> 0 ou 1</div>
            <div><span className="font-black text-indigo-600 dark:text-indigo-400">\s</span> espace</div>
            <div><span className="font-black text-indigo-600 dark:text-indigo-400">^</span> début</div>
            <div><span className="font-black text-indigo-600 dark:text-indigo-400">$</span> fin</div>
          </div>
        </div>
      </div>
    </div>
  );
}
