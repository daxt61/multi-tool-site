import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Info, AlertCircle, Copy, Check, Flag, Trash2, Loader2 } from 'lucide-react';

// Serialized match result from the worker
interface SerializedMatch {
  index: number;
  0: string;
  groups?: Record<string, string>;
}

const WORKER_CODE = `
  self.onmessage = (e) => {
    const { regex, flags, text } = e.data;
    try {
      const safeFlags = flags.includes('g') ? flags : flags + 'g';
      const re = new RegExp(regex, safeFlags);
      const matches = [];
      let match;

      // Limit to 1000 matches to prevent browser crash
      let count = 0;
      for (const m of text.matchAll(re)) {
        matches.push({
          index: m.index,
          0: m[0],
          groups: m.groups
        });
        if (++count >= 1000) break;
      }

      self.postMessage({ matches, error: null });
    } catch (err) {
      self.postMessage({ matches: [], error: err.message });
    }
  };
`;

export function RegExTester() {
  const [regex, setRegex] = useState('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\\.([a-zA-Z]{2,})');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('Contactez-nous à support@example.com ou sales@test.org pour plus d\'informations.');
  const [matches, setMatches] = useState<SerializedMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const workerUrlRef = useRef<string | null>(null);
  const executionTimerId = useRef<any>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Track the text that was actually processed by the worker to keep UI in sync
  const [lastProcessedText, setLastProcessedText] = useState(testText);

  useEffect(() => {
    const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    workerUrlRef.current = url;

    return () => {
      if (workerRef.current) workerRef.current.terminate();
      if (workerUrlRef.current) URL.revokeObjectURL(workerUrlRef.current);
    };
  }, []);

  const spawnWorker = () => {
    if (workerRef.current) workerRef.current.terminate();
    if (executionTimerId.current) clearTimeout(executionTimerId.current);

    const worker = new Worker(workerUrlRef.current!);

    worker.onmessage = (e) => {
      if (executionTimerId.current) clearTimeout(executionTimerId.current);
      const { matches, error } = e.data;
      setMatches(matches);
      setError(error);
      setIsProcessing(false);
    };

    workerRef.current = worker;
    return worker;
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!regex) {
        setMatches([]);
        setError(null);
        setIsProcessing(false);
        return;
      }

      setIsProcessing(true);
      setLastProcessedText(testText);
      const worker = spawnWorker();

      worker.postMessage({ regex, flags, text: testText });

      // Sentinel: Set a 500ms execution timeout to prevent ReDoS
      executionTimerId.current = setTimeout(() => {
        worker.terminate();
        setError('Le traitement a pris trop de temps (ReDoS possible).');
        setIsProcessing(false);
      }, 500);

    }, 200); // 200ms debounce

    return () => {
      clearTimeout(timer);
      if (executionTimerId.current) clearTimeout(executionTimerId.current);
    };
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
    // Only render highlights if we have matches and the text hasn't changed since processing
    if (error || !regex || matches.length === 0) {
      return <span className="text-transparent whitespace-pre-wrap break-words">{testText}</span>;
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;
    // We use the text that was actually processed for highlighting to avoid offset issues while typing
    const displayRefText = lastProcessedText;

    matches.forEach((match, i) => {
      const start = match.index;
      const end = start + match[0].length;

      if (start > lastIndex) {
        segments.push(
          <span key={`text-${i}`} className="text-transparent">
            {displayRefText.substring(lastIndex, start)}
          </span>
        );
      }

      segments.push(
        <mark key={`match-${i}`} className="bg-indigo-500/30 text-transparent rounded-sm ring-1 ring-indigo-500/50">
          {match[0]}
        </mark>
      );

      lastIndex = end;
    });

    if (lastIndex < displayRefText.length) {
      segments.push(
        <span key="text-end" className="text-transparent">
          {displayRefText.substring(lastIndex)}
        </span>
      );
    }

    // Add any extra text that was typed after the last process
    if (testText.length > displayRefText.length) {
        segments.push(
            <span key="extra-text" className="text-transparent">
                {testText.substring(displayRefText.length)}
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
              <div className="flex gap-2">
                <button onClick={handleCopy} className="text-xs font-bold text-indigo-500 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full hover:bg-indigo-100 transition-all">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
                </button>
                <button
                  onClick={() => {setRegex(''); setMatches([]); setError(null);}}
                  disabled={!regex}
                  className="text-xs font-bold text-rose-500 flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full hover:bg-rose-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3 h-3" /> Effacer
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
                className={`w-full pl-8 pr-20 py-4 bg-white dark:bg-slate-900 border ${error ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-2xl font-mono text-lg outline-none focus:ring-2 transition-all dark:text-white`}
                placeholder="Entrez votre regex ici..."
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-mono text-lg">/{flags}</span>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold px-1 animate-in slide-in-from-top-1">
                <AlertCircle className="w-3 h-3" /> {error}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4 relative">
             <div className="flex justify-between items-center px-1">
              <label htmlFor="test-text" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de Test</label>
              <div className="flex items-center gap-3">
                {isProcessing && <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />}
                <div className="text-xs font-bold text-slate-400">
                  {matches.length} match{matches.length > 1 ? 'es' : ''} trouvé{matches.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="relative min-h-[300px] font-mono text-base leading-relaxed">
              <div
                ref={backdropRef}
                className="absolute inset-0 p-4 pointer-events-none whitespace-pre-wrap break-words overflow-auto no-scrollbar border border-transparent"
                aria-hidden="true"
              >
                {renderHighlightedText()}
              </div>

              <textarea
                id="test-text"
                ref={textareaRef}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                onScroll={syncScroll}
                className="absolute inset-0 w-full h-full p-4 bg-transparent border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white selection:bg-indigo-500/20"
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
              <div className="flex gap-3 items-center">
                <code className="bg-white/10 px-2 py-0.5 rounded text-white min-w-[2.5rem] text-center">.</code>
                <span>N'importe quel caractère</span>
              </div>
              <div className="flex gap-3 items-center">
                <code className="bg-white/10 px-2 py-0.5 rounded text-white min-w-[2.5rem] text-center">\d</code>
                <span>Un chiffre (0-9)</span>
              </div>
              <div className="flex gap-3 items-center">
                <code className="bg-white/10 px-2 py-0.5 rounded text-white min-w-[2.5rem] text-center">\w</code>
                <span>Un mot (a-z, A-Z, 0-9, _)</span>
              </div>
              <div className="flex gap-3 items-center">
                <code className="bg-white/10 px-2 py-0.5 rounded text-white min-w-[2.5rem] text-center">+</code>
                <span>1 ou plusieurs occurrences</span>
              </div>
              <div className="flex gap-3 items-center">
                <code className="bg-white/10 px-2 py-0.5 rounded text-white min-w-[2.5rem] text-center">*</code>
                <span>0 ou plusieurs occurrences</span>
              </div>
              <div className="flex gap-3 items-center">
                <code className="bg-white/10 px-2 py-0.5 rounded text-white min-w-[2.5rem] text-center">^</code>
                <span>Début de ligne</span>
              </div>
              <div className="flex gap-3 items-center">
                <code className="bg-white/10 px-2 py-0.5 rounded text-white min-w-[2.5rem] text-center">$</code>
                <span>Fin de ligne</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
