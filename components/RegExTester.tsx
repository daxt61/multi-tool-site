import { useState, useMemo, useDeferredValue, useEffect, useRef } from 'react';
import { Search, Copy, Check, Trash2, Info, AlertCircle, Settings2, Eye } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Contactez-nous à support@example.com ou sales@test.org pour plus d\'informations.');
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const deferredRegex = useDeferredValue(regex);
  const deferredText = useDeferredValue(text);
  const deferredFlags = useDeferredValue(flags);

  const { matches, error, highlightedHtml } = useMemo(() => {
    const escape = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (!deferredRegex) return { matches: [], error: null, highlightedHtml: escape(deferredText) };
    try {
      const re = new RegExp(deferredRegex, deferredFlags.includes('g') ? deferredFlags : deferredFlags + 'g');
      const allMatches = Array.from(deferredText.matchAll(re));

      // Create highlighted HTML for the backdrop
      let lastIndex = 0;
      let html = '';

      allMatches.forEach((match, i) => {
        const index = match.index!;
        html += escape(deferredText.slice(lastIndex, index));
        html += `<mark class="bg-indigo-500/30 dark:bg-indigo-400/40 text-transparent rounded-sm border-b-2 border-indigo-500/50">${escape(match[0])}</mark>`;
        lastIndex = index + match[0].length;
      });
      html += escape(deferredText.slice(lastIndex));
      // Add a trailing newline if needed to match textarea behavior
      if (deferredText.endsWith('\n')) html += '\n';

      return {
        matches: allMatches,
        error: null,
        highlightedHtml: html
      };
    } catch (e: any) {
      return {
        matches: [],
        error: e.message,
        highlightedHtml: escape(deferredText)
      };
    }
  }, [deferredRegex, deferredText, deferredFlags]);

  // Sync scroll between textarea and backdrop
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

  const availableFlags = [
    { char: 'g', label: 'Global', desc: 'Recherche globale' },
    { char: 'i', label: 'Case Insensitive', desc: 'Ignore la casse' },
    { char: 'm', label: 'Multiline', desc: 'Début/fin de ligne (^ $)' },
    { char: 's', label: 'DotAll', desc: '. inclut les retours à la ligne' },
    { char: 'u', label: 'Unicode', desc: 'Support complet de l\'Unicode' },
  ];

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* RegEx Input Area */}
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="regex-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
                aria-label="Copier la regex"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiée' : 'Copier'}
              </button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <span className="text-xl font-mono">/</span>
              </div>
              <input
                id="regex-input"
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                className="w-full pl-8 pr-12 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="([a-z]+)"
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                <span className="text-xl font-mono">/{flags}</span>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold px-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3" /> {error}
              </div>
            )}
          </div>

          <div className="md:w-72 space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Flags</label>
            <div className="flex flex-wrap gap-2">
              {availableFlags.map(f => (
                <button
                  key={f.char}
                  onClick={() => toggleFlag(f.char)}
                  title={f.desc}
                  className={`px-3 py-2 rounded-xl font-mono font-bold text-sm transition-all border ${
                    flags.includes(f.char)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {f.char}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Text Input with Highlight Backdrop */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="test-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de Test</label>
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{matches.length} correspondances</span>
               <button
                onClick={() => setText('')}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                aria-label="Effacer le texte"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="relative h-[400px] w-full">
            {/* Backdrop for highlighting */}
            <div
              ref={backdropRef}
              className="absolute inset-0 p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap break-all pointer-events-none overflow-auto border border-transparent select-none text-transparent"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
            {/* Real Textarea */}
            <textarea
              id="test-text"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onScroll={handleScroll}
              spellCheck="false"
              className="absolute inset-0 w-full h-full p-6 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none bg-transparent break-all"
              placeholder="Entrez votre texte ici pour tester l'expression..."
            />
          </div>
        </div>

        {/* Matches List */}
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Correspondances</label>
          <div className="h-[400px] overflow-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-2">
            {matches.length > 0 ? (
              matches.map((match, i) => (
                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-right-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-indigo-500 uppercase">Match {i + 1}</span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">pos: {match.index}</span>
                  </div>
                  <code className="text-sm font-mono font-bold dark:text-white break-all">{match[0]}</code>
                  {match.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                      {Array.from(match).slice(1).map((group, j) => (
                        group && (
                          <div key={j} className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400">G{j+1}:</span>
                            <code className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 break-all">{group}</code>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                 <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300">
                    <Eye className="w-6 h-6" />
                 </div>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucune correspondance</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide rapide
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Saisissez votre expression régulière sans les délimiteurs <code>/</code>. Les drapeaux (flags) peuvent être activés sur la droite. Les correspondances s'affichent en temps réel dans le texte et dans la liste latérale.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-indigo-500" /> Groupes de capture
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Utilisez les parenthèses <code>(...)</code> pour créer des groupes de capture. Ils apparaîtront sous chaque correspondance dans la liste de droite pour une analyse détaillée.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> Sécurité & Privauté
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Tout le traitement RegEx est effectué localement dans votre navigateur. Aucune donnée n'est envoyée à un serveur externe, garantissant la confidentialité de vos tests.
          </p>
        </div>
      </div>
    </div>
  );
}
