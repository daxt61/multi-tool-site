import { useState, useMemo, useDeferredValue, useRef } from 'react';
import { Search, Copy, Check, Trash2, Info, Flag, AlertCircle } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-zA-Z0-9._%-]+)@([a-zA-Z0-9.-]+)\\.([a-z]{2,})');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('Contactez-nous à support@example.com ou info@test.org');
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const deferredRegex = useDeferredValue(regex);
  const deferredFlags = useDeferredValue(flags);
  const deferredText = useDeferredValue(testText);

  const results = useMemo(() => {
    if (!deferredRegex) return { matches: [], error: null };
    try {
      // Ensure global flag is present for matchAll
      const activeFlags = deferredFlags.includes('g') ? deferredFlags : deferredFlags + 'g';
      const re = new RegExp(deferredRegex, activeFlags);
      const matches = Array.from(deferredText.matchAll(re));
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [deferredRegex, deferredFlags, deferredText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const syncScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const renderHighlightedText = () => {
    if (results.error || !deferredRegex || results.matches.length === 0) {
      return <span className="text-transparent">{testText}</span>;
    }

    const highlights: React.ReactNode[] = [];
    let lastIndex = 0;

    results.matches.forEach((match, i) => {
      const index = match.index!;
      const text = match[0];

      // Add non-matching text
      if (index > lastIndex) {
        highlights.push(
          <span key={`text-${lastIndex}`} className="text-transparent">
            {testText.slice(lastIndex, index)}
          </span>
        );
      }

      // Add matching text
      highlights.push(
        <mark key={`match-${i}`} className="bg-indigo-500/30 dark:bg-indigo-400/40 text-transparent rounded-sm ring-1 ring-indigo-500/50">
          {text}
        </mark>
      );

      lastIndex = index + text.length;
    });

    // Add remaining text
    if (lastIndex < testText.length) {
      highlights.push(
        <span key={`text-end`} className="text-transparent">
          {testText.slice(lastIndex)}
        </span>
      );
    }

    return highlights;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="regex-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <span className="font-mono text-xl">/</span>
            </div>
            <input
              id="regex-input"
              type="text"
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              className="w-full pl-10 pr-24 py-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
              placeholder="votre-regex-ici..."
            />
            <div className="absolute inset-y-0 right-4 flex items-center gap-2">
              <span className="text-slate-400 font-mono">/</span>
              <input
                type="text"
                value={flags}
                onChange={(e) => setFlags(e.target.value.replace(/[^gimuy]/g, ''))}
                className="w-12 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-mono font-bold text-indigo-600 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="flags"
                title="g, i, m, u, y"
              />
            </div>
          </div>
          {results.error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium animate-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4" />
              {results.error}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Drapeaux (Flags)</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'g', name: 'Global', desc: 'Recherche toutes les occurrences' },
              { id: 'i', name: 'Insensible', desc: 'Ignore la casse' },
              { id: 'm', name: 'Multiligne', desc: '^ et $ matchent les lignes' },
              { id: 's', name: 'DotAll', desc: '. matche aussi les retours ligne' },
            ].map(flag => (
              <button
                key={flag.id}
                onClick={() => setFlags(prev => prev.includes(flag.id) ? prev.replace(flag.id, '') : prev + flag.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${flags.includes(flag.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
                title={flag.desc}
              >
                {flag.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Test Area */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="test-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de Test</label>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">
              {results.matches.length} correspondance{results.matches.length > 1 ? 's' : ''}
            </span>
            <button onClick={() => setTestText('')} className="text-slate-400 hover:text-rose-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative min-h-[300px] bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
          {/* Highlighting Backdrop */}
          <div
            ref={backdropRef}
            className="absolute inset-0 p-8 font-mono text-lg leading-relaxed whitespace-pre-wrap break-words pointer-events-none overflow-auto border border-transparent"
            aria-hidden="true"
          >
            {renderHighlightedText()}
          </div>

          {/* Interactive Textarea */}
          <textarea
            ref={textareaRef}
            id="test-text"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            onScroll={syncScroll}
            className="absolute inset-0 w-full h-full p-8 bg-transparent font-mono text-lg leading-relaxed whitespace-pre-wrap break-words outline-none resize-none dark:text-slate-300"
            placeholder="Entrez votre texte ici pour tester la regex..."
            spellCheck="false"
          />
        </div>
      </div>

      {/* Info Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold flex items-center gap-2 dark:text-white">
            <Search className="w-4 h-4 text-indigo-500" /> Aide-mémoire
          </h4>
          <ul className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-medium">
            <li><code className="text-indigo-500 font-bold">.</code> - N'importe quel caractère</li>
            <li><code className="text-indigo-500 font-bold">\d</code> - Un chiffre [0-9]</li>
            <li><code className="text-indigo-500 font-bold">\w</code> - Caractère de mot [a-zA-Z0-9_]</li>
            <li><code className="text-indigo-500 font-bold">\s</code> - Espace blanc</li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold flex items-center gap-2 dark:text-white">
            <Flag className="w-4 h-4 text-indigo-500" /> Quantificateurs
          </h4>
          <ul className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-medium">
            <li><code className="text-indigo-500 font-bold">*</code> - 0 ou plus</li>
            <li><code className="text-indigo-500 font-bold">+</code> - 1 ou plus</li>
            <li><code className="text-indigo-500 font-bold">?</code> - 0 ou 1</li>
            <li><code className="text-indigo-500 font-bold">{'{n}'}</code> - Exactement n</li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold flex items-center gap-2 dark:text-white">
            <Info className="w-4 h-4 text-indigo-500" /> Groupes
          </h4>
          <ul className="text-xs space-y-2 text-slate-500 dark:text-slate-400 font-medium">
            <li><code className="text-indigo-500 font-bold">(...)</code> - Groupe de capture</li>
            <li><code className="text-indigo-500 font-bold">(?:...)</code> - Groupe non-capturant</li>
            <li><code className="text-indigo-500 font-bold">[abc]</code> - Un des caractères</li>
            <li><code className="text-indigo-500 font-bold">[^abc]</code> - Aucun des caractères</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
