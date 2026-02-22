import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Info, Copy, Check, Settings2, AlertCircle } from 'lucide-react';

export function RegExTester() {
  const [regexSource, setRegexSource] = useState('(\\b\\w+\\b)');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Testez vos expressions régulières ici en temps réel.');
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const results = useMemo(() => {
    if (!regexSource) return { matches: [], error: null };
    try {
      const re = new RegExp(regexSource, flags.includes('g') ? flags : flags + 'g');
      const matches = Array.from(text.matchAll(re));
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [regexSource, flags, text]);

  const highlightedText = useMemo(() => {
    const escapeMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
    };
    const escape = (str: string) => str.replace(/[<>&]/g, c => escapeMap[c] || c);

    if (results.error || !regexSource || results.matches.length === 0) {
      return escape(text);
    }

    try {
      let lastIndex = 0;
      const parts = [];

      // We use matchAll results to build the highlighted string
      for (const match of results.matches) {
        const index = match.index!;
        const matchedText = match[0];

        // Add preceding text
        parts.push(escape(text.slice(lastIndex, index)));

        // Add highlighted text
        parts.push(`<mark class="bg-indigo-500/30 text-transparent border-b-2 border-indigo-500 rounded-sm">${escape(matchedText)}</mark>`);

        lastIndex = index + matchedText.length;
      }

      parts.push(escape(text.slice(lastIndex)));

      return parts.join('') + '\n'; // Add newline to match textarea behavior
    } catch (e) {
      return escape(text);
    }
  }, [text, results, regexSource]);

  useEffect(() => {
    const handleScroll = () => {
      if (backdropRef.current && textareaRef.current) {
        backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    };
    const textarea = textareaRef.current;
    textarea?.addEventListener('scroll', handleScroll);
    return () => textarea?.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Controls */}
        <div className="lg:col-span-12 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Search className="w-3 h-3" /> Expression Régulière
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xl">/</span>
                  <input
                    type="text"
                    value={regexSource}
                    onChange={(e) => setRegexSource(e.target.value)}
                    className={`w-full pl-8 pr-16 py-4 bg-white dark:bg-slate-800 border ${results.error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl font-mono text-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white`}
                    placeholder="[a-z0-9]+"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xl">/{flags}</span>
                </div>
                {results.error && (
                  <div className="flex items-center gap-2 text-rose-500 text-xs font-bold px-1 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-3 h-3" /> {results.error}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
                  <Settings2 className="w-3 h-3" /> Drapeaux (Flags)
                </label>
                <div className="flex gap-2">
                  {['g', 'i', 'm', 's', 'u'].map(f => (
                    <button
                      key={f}
                      onClick={() => toggleFlag(f)}
                      className={`w-10 h-10 rounded-xl font-bold transition-all border ${
                        flags.includes(f)
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                      }`}
                      title={f === 'g' ? 'Global' : f === 'i' ? 'Insensible à la casse' : f === 'm' ? 'Multiligne' : f === 's' ? 'DotAll' : 'Unicode'}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Text Area with Highlighting */}
        <div className="lg:col-span-8 space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte de test</label>
          <div className="relative h-[500px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden">
            {/* Backdrop for highlighting */}
            <div
              ref={backdropRef}
              className="absolute inset-0 p-8 font-mono text-lg leading-relaxed break-words whitespace-pre-wrap pointer-events-none text-transparent overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: highlightedText }}
            />
            {/* Actual interactive textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="absolute inset-0 w-full h-full p-8 bg-transparent font-mono text-lg leading-relaxed break-words outline-none resize-none dark:text-slate-300 selection:bg-indigo-500/20"
              placeholder="Entrez votre texte ici..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* Stats & Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/10">
            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
              <Check className="w-6 h-6 p-1 bg-white/20 rounded-lg" /> Résultats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="font-bold opacity-70">Occurrences</span>
                <span className="text-2xl font-black font-mono">{results.matches.length}</span>
              </div>
              {results.matches.length > 0 && (
                 <button
                   onClick={() => {
                     navigator.clipboard.writeText(results.matches.map(m => m[0]).join('\n'));
                     setCopied(true);
                     setTimeout(() => setCopied(false), 2000);
                   }}
                   className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                     copied ? 'bg-emerald-500' : 'bg-white/10 hover:bg-white/20'
                   }`}
                 >
                   {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                   {copied ? 'Copié !' : 'Copier les matchs'}
                 </button>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-4">
            <h4 className="font-bold flex items-center gap-2 dark:text-white">
              <Info className="w-4 h-4 text-indigo-500" /> Aide mémoire
            </h4>
            <div className="text-xs space-y-3 font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
              <div className="flex justify-between"><code className="text-indigo-600">.</code> <span>N'importe quel caractère</span></div>
              <div className="flex justify-between"><code className="text-indigo-600">\w</code> <span>Caractère de mot</span></div>
              <div className="flex justify-between"><code className="text-indigo-600">\d</code> <span>Chiffre</span></div>
              <div className="flex justify-between"><code className="text-indigo-600">+</code> <span>1 ou plus</span></div>
              <div className="flex justify-between"><code className="text-indigo-600">*</code> <span>0 ou plus</span></div>
              <div className="flex justify-between"><code className="text-indigo-600">?</code> <span>0 ou 1 (optionnel)</span></div>
              <div className="flex justify-between"><code className="text-indigo-600">\b</code> <span>Limite de mot</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
