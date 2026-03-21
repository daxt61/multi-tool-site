import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Info, AlertCircle, Copy, Check, Flag, Loader2 } from 'lucide-react';

interface SerializedMatch {
  index: number;
  groups?: { [key: string]: string };
  0: string;
  [key: number]: string;
}

const workerCode = `
  self.onmessage = (e) => {
    const { regex, flags, testText, timeout } = e.data;
    try {
      const re = new RegExp(regex, flags.includes('g') ? flags : flags + 'g');
      const matches = [];
      const startTime = Date.now();

      const matchAll = testText.matchAll(re);
      for (const match of matchAll) {
        if (Date.now() - startTime > timeout) {
          self.postMessage({ error: 'Timeout de l\\'exécution (ReDoS possible)' });
          return;
        }

        const serialized = {
          index: match.index,
          0: match[0]
        };

        if (match.groups) {
          // @ts-ignore
          serialized.groups = { ...match.groups };
        }

        for (let i = 1; i < match.length; i++) {
          // @ts-ignore
          serialized[i] = match[i];
        }

        matches.push(serialized);
        if (matches.length > 1000) break; // Safety limit
      }

      self.postMessage({ matches, processedText: testText });
    } catch (e) {
      self.postMessage({ error: e.message });
    }
  };
`;

export function RegExTester() {
  const [regex, setRegex] = useState('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\\.([a-zA-Z]{2,})');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('Contactez-nous à support@example.com ou sales@test.org pour plus d\'informations.');
  const [copied, setCopied] = useState(false);
  const [matches, setMatches] = useState<SerializedMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedText, setLastProcessedText] = useState('');

  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const timeoutId = useRef<any>(null);

  useEffect(() => {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.onmessage = (e) => {
      const { matches, error, processedText } = e.data;
      if (error) {
        setError(error);
        setMatches([]);
      } else {
        setError(null);
        setMatches(matches);
        setLastProcessedText(processedText);
      }
      setIsProcessing(false);
    };

    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  useEffect(() => {
    if (timeoutId.current) clearTimeout(timeoutId.current);

    setIsProcessing(true);
    timeoutId.current = setTimeout(() => {
      if (workerRef.current && regex) {
        workerRef.current.postMessage({
          regex,
          flags,
          testText,
          timeout: 500
        });
      } else {
        setIsProcessing(false);
        setMatches([]);
        setError(null);
      }
    }, 200);

    return () => clearTimeout(timeoutId.current);
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
    // Only render highlights if they match the current testText
    if (error || !regex || matches.length === 0 || testText !== lastProcessedText) {
      return <span className="text-transparent whitespace-pre-wrap break-words">{testText}</span>;
    }

    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, i) => {
      const start = match.index;
      const end = start + match[0].length;

      if (start > lastIndex) {
        segments.push(
          <span key={`text-${i}`} className="text-transparent">
            {testText.substring(lastIndex, start)}
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
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="regex-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
              <div className="flex items-center gap-4">
                {isProcessing && <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />}
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
              <div className="text-xs font-bold text-slate-400">
                {matches.length} match{matches.length > 1 ? 'es' : ''} trouvé{matches.length > 1 ? 's' : ''}
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
                className="absolute inset-0 w-full h-full p-4 bg-transparent border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none dark:text-white selection:bg-indigo-500/20"
                placeholder="Saisissez le texte à tester..."
              />
            </div>
          </div>
        </div>

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
