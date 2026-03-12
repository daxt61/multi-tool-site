import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Info, AlertCircle, Copy, Check, Flag, Trash2, Clock } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\\.([a-zA-Z]{2,})');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('Contactez-nous à support@example.com ou sales@test.org pour plus d\'informations.');
  const [copied, setCopied] = useState(false);
  const [results, setResults] = useState<{ matches: any[], error: string | null, matchCount: number, isProcessing: boolean }>({
    matches: [],
    error: null,
    matchCount: 0,
    isProcessing: false
  });

  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Create worker for regex execution to prevent ReDoS from blocking the main thread
    const workerCode = `
      self.onmessage = function(e) {
        const { regex, flags, testText } = e.data;
        try {
          const safeFlags = flags.includes('g') ? flags : flags + 'g';
          const re = new RegExp(regex, safeFlags);
          const allMatches = Array.from(testText.matchAll(re)).map(m => ({
            index: m.index,
            0: m[0]
          }));
          self.postMessage({ matches: allMatches, error: null });
        } catch (e) {
          self.postMessage({ matches: [], error: e.message });
        }
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  useEffect(() => {
    if (!regex) {
      setResults({ matches: [], error: null, matchCount: 0, isProcessing: false });
      return;
    }

    setResults(prev => ({ ...prev, isProcessing: true }));

    const timeoutId = setTimeout(() => {
      // If it takes too long, terminate and restart worker
      workerRef.current?.terminate();

      const workerCode = `
        self.onmessage = function(e) {
          const { regex, flags, testText } = e.data;
          try {
            const safeFlags = flags.includes('g') ? flags : flags + 'g';
            const re = new RegExp(regex, safeFlags);
            const allMatches = Array.from(testText.matchAll(re)).map(m => ({
              index: m.index,
              0: m[0]
            }));
            self.postMessage({ matches: allMatches, error: null });
          } catch (e) {
            self.postMessage({ matches: [], error: e.message });
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      workerRef.current = new Worker(workerUrl);

      setResults({
        matches: [],
        error: "L'exécution de la RegEx est trop longue (ReDoS potentiel).",
        matchCount: 0,
        isProcessing: false
      });
    }, 500);

    workerRef.current!.onmessage = (e) => {
      clearTimeout(timeoutId);
      const { matches, error } = e.data;
      setResults({
        matches,
        error,
        matchCount: matches.length,
        isProcessing: false
      });
    };

    workerRef.current!.postMessage({ regex, flags, testText });

    return () => clearTimeout(timeoutId);
  }, [regex, flags, testText]);

  const syncScroll = () => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHighlightedText = () => {
    if (results.error || !regex || results.matches.length === 0) {
      return <span className="text-transparent whitespace-pre-wrap break-words">{testText}</span>;
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    results.matches.forEach((match, i) => {
      const start = match.index!;
      const end = start + match[0].length;

      // Add text before match
      if (start > lastIndex) {
        segments.push(
          <span key={`text-${i}`} className="text-transparent">
            {testText.substring(lastIndex, start)}
          </span>
        );
      }

      // Add highlighted match
      segments.push(
        <mark key={`match-${i}`} className="bg-indigo-500/30 text-transparent rounded-sm ring-1 ring-indigo-500/50">
          {match[0]}
        </mark>
      );

      lastIndex = end;
    });

    // Add remaining text
    if (lastIndex < testText.length) {
      segments.push(
        <span key="text-end" className="text-transparent">
          {testText.substring(lastIndex)}
        </span>
      );
    }

    return segments;
  };

  const availableFlags = [
    { char: 'g', name: 'Global' },
    { char: 'i', name: 'Insensible à la casse' },
    { char: 'm', name: 'Multiligne' },
    { char: 's', name: 'DotAll' },
    { char: 'u', name: 'Unicode' },
  ];

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Editor */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="regex-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
              <div className="flex gap-4">
                <button onClick={() => setRegex('')} className="text-xs font-bold text-rose-500 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Effacer
                </button>
                <button onClick={handleCopy} className="text-xs font-bold text-indigo-500 flex items-center gap-1">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
                </button>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-mono text-lg">/</span>
              </div>
              <input
                id="regex-input"
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                className={`w-full pl-8 pr-20 py-4 bg-white dark:bg-slate-900 border ${results.error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-2xl font-mono text-lg outline-none focus:ring-2 transition-all dark:text-white`}
                placeholder="Entrez votre regex ici..."
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-mono text-lg">/{flags}</span>
              </div>
            </div>
            {results.error && (
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold px-1 animate-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3" /> {results.error}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4 relative">
             <div className="flex justify-between items-center px-1">
              <label htmlFor="test-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de Test</label>
              <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                {results.isProcessing && <Clock className="w-3 h-3 animate-spin" />}
                {results.matchCount} match{results.matchCount > 1 ? 'es' : ''} trouvé{results.matchCount > 1 ? 's' : ''}
              </div>
            </div>

            <div className="relative min-h-[300px] font-mono text-base leading-relaxed">
              {/* Backdrop for highlighting */}
              <div
                ref={backdropRef}
                className="absolute inset-0 p-4 pointer-events-none whitespace-pre-wrap break-words overflow-auto no-scrollbar border border-transparent"
                aria-hidden="true"
              >
                {renderHighlightedText()}
              </div>

              {/* Actual Textarea */}
              <textarea
                id="test-text"
                ref={textareaRef}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                onScroll={syncScroll}
                className="absolute inset-0 w-full h-full p-4 bg-transparent border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white selection:bg-indigo-500/20"
                placeholder="Saisissez le texte à tester..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Flags & Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Flag className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Flags</h3>
            </div>
            <div className="space-y-2">
              {availableFlags.map((flag) => (
                <button
                  key={flag.char}
                  onClick={() => toggleFlag(flag.char)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    flags.includes(flag.char)
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <code className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-sm">{flag.char}</code>
                    <span className="font-bold text-sm">{flag.name}</span>
                  </div>
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    flags.includes(flag.char) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {flags.includes(flag.char) && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 space-y-6">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 opacity-50" />
              <h3 className="text-xl font-black">Aide Rapide</h3>
            </div>
            <div className="space-y-4 text-indigo-100 text-sm font-medium leading-relaxed">
              <div className="flex gap-3">
                <code className="bg-white/10 px-2 py-0.5 rounded text-white">.</code>
                <span>N'importe quel caractère</span>
              </div>
              <div className="flex gap-3">
                <code className="bg-white/10 px-2 py-0.5 rounded text-white">\d</code>
                <span>Un chiffre (0-9)</span>
              </div>
              <div className="flex gap-3">
                <code className="bg-white/10 px-2 py-0.5 rounded text-white">\w</code>
                <span>Un mot (a-z, A-Z, 0-9, _)</span>
              </div>
              <div className="flex gap-3">
                <code className="bg-white/10 px-2 py-0.5 rounded text-white">+</code>
                <span>1 ou plusieurs occurrences</span>
              </div>
              <div className="flex gap-3">
                <code className="bg-white/10 px-2 py-0.5 rounded text-white">*</code>
                <span>0 ou plusieurs occurrences</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
