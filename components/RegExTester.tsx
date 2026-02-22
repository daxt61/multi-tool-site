import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Info, Check, Copy, AlertCircle } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-z]+)');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Bonjour tout le monde ! Voici un exemple de texte pour tester vos expressions régulières.');
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const availableFlags = [
    { id: 'g', label: 'Global (g)', desc: 'Recherche globale' },
    { id: 'i', label: 'Insensible (i)', desc: 'Ignore la casse' },
    { id: 'm', label: 'Multiligne (m)', desc: 'Début/fin de ligne' },
    { id: 's', label: 'DotAll (s)', desc: '. correspond aux sauts de ligne' },
    { id: 'u', label: 'Unicode (u)', desc: 'Support unicode complet' },
  ];

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  const { matches, error, highlightedHtml } = useMemo(() => {
    if (!regex) return { matches: [], error: null, highlightedHtml: text };
    try {
      const re = new RegExp(regex, flags);
      const allMatches = flags.includes('g')
        ? Array.from(text.matchAll(re))
        : [text.match(re)].filter(Boolean) as RegExpMatchArray[];

      // Escape HTML to prevent XSS
      const escapeHtml = (str: string) => str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[m] || m));

      let lastIndex = 0;
      let html = '';

      // Use only global matches for highlighting if 'g' is present
      // If 'g' is not present, matchAll only returns the first match
      for (const match of allMatches) {
        const index = match.index!;
        html += escapeHtml(text.slice(lastIndex, index));
        html += `<mark class="bg-indigo-500/30 dark:bg-indigo-400/40 text-slate-900 dark:text-white border-b-2 border-indigo-500 rounded-sm">${escapeHtml(match[0])}</mark>`;
        lastIndex = index + match[0].length;
        if (!flags.includes('g')) break;
      }
      html += escapeHtml(text.slice(lastIndex));
      // Handle trailing newlines for backdrop alignment
      if (text.endsWith('\n')) html += '\n';

      return { matches: allMatches, error: null, highlightedHtml: html };
    } catch (e: any) {
      return { matches: [], error: e.message, highlightedHtml: text };
    }
  }, [regex, flags, text]);

  const syncScroll = () => {
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="regex-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-mono font-bold text-lg">/</span>
              </div>
              <input
                id="regex-input"
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                className={`block w-full pl-8 pr-12 py-4 bg-white dark:bg-slate-900 border ${error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'} rounded-2xl font-mono text-lg outline-none focus:ring-4 transition-all`}
                placeholder="[a-z]+"
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-mono font-bold text-lg">/{flags}</span>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold px-1">
                <AlertCircle className="w-3 h-3" /> {error}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Flags</label>
            <div className="grid grid-cols-1 gap-2">
              {availableFlags.map((flag) => (
                <button
                  key={flag.id}
                  onClick={() => toggleFlag(flag.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    flags.includes(flag.id)
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{flag.label}</span>
                    <span className="text-[10px] opacity-70 font-medium">{flag.desc}</span>
                  </div>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    flags.includes(flag.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {flags.includes(flag.id) && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="test-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de test</label>
            <div className="text-xs font-bold text-slate-400">
              {matches.length} correspondance{matches.length > 1 ? 's' : ''}
            </div>
          </div>
          <div className="relative h-[400px] font-mono text-base leading-relaxed">
            {/* Backdrop for highlighting */}
            <div
              ref={backdropRef}
              className="absolute inset-0 p-6 pointer-events-none whitespace-pre-wrap break-words overflow-auto border border-transparent text-slate-900 dark:text-white"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              style={{
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit'
              }}
            />
            {/* Real Textarea */}
            <textarea
              id="test-text"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onScroll={syncScroll}
              className="absolute inset-0 w-full h-full p-6 bg-transparent text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none overflow-auto selection:bg-indigo-500/20"
              style={{
                boxSizing: 'border-box',
                color: 'transparent',
                caretColor: 'currentColor',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit'
              }}
              spellCheck="false"
            />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h4 className="font-bold mb-2 dark:text-white">Fonctionnement</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Saisissez votre expression régulière sans les délimiteurs <code>/</code>. Les correspondances sont surlignées en temps réel dans le texte ci-dessous.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h4 className="font-bold mb-2 dark:text-white">Capture de groupes</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Utilisez des parenthèses <code>()</code> pour définir des groupes de capture. Vous pouvez consulter le nombre total de correspondances en haut à droite de l'éditeur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
