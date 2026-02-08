import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, RefreshCw, AlertCircle, Info, ChevronRight, Binary } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+)\\.([a-zA-Z]{2,})');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Contact us at support@example.com or sales@test-site.org for more information.');
  const [copied, setCopied] = useState(false);

  const { matches, error } = useMemo(() => {
    if (!regex) return { matches: [], error: null };
    try {
      const re = new RegExp(regex, flags);
      const results = [];
      let match;

      if (flags.includes('g')) {
        let lastIndex = -1;
        while ((match = re.exec(text)) !== null) {
          if (re.lastIndex === lastIndex) {
            re.lastIndex++; // Avoid infinite loops with zero-width matches
          }
          lastIndex = re.lastIndex;
          results.push(match);
          if (results.length > 1000) break; // Safety limit
        }
      } else {
        match = re.exec(text);
        if (match) results.push(match);
      }

      return { matches: results, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [regex, flags, text]);

  const handleCopy = () => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
  };

  const highlightedText = useMemo(() => {
    if (error || !regex || matches.length === 0) return text;

    let lastIndex = 0;
    const parts: (string | React.ReactNode)[] = [];

    // Sort matches by index to handle them in order
    const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

    sortedMatches.forEach((match, i) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add highlighted match
      parts.push(
        <mark key={i} className="bg-indigo-500/30 text-indigo-900 dark:text-indigo-100 rounded px-0.5 border-b-2 border-indigo-500">
          {match[0]}
        </mark>
      );
      lastIndex = match.index + match[0].length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  }, [text, matches, error, regex]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
              <button onClick={handleCopy} className="text-slate-400 hover:text-indigo-500 transition-colors">
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <span className="font-mono text-lg">/</span>
              </div>
              <input
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                className="w-full pl-8 pr-20 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm focus:border-indigo-500 outline-none transition-all dark:text-white"
                placeholder="Votre regex..."
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="font-mono text-lg text-slate-400">/</span>
                <span className="font-mono text-sm text-indigo-500 font-bold">{flags}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { f: 'g', desc: 'Global' },
                { f: 'i', desc: 'Insensible à la casse' },
                { f: 'm', desc: 'Multi-ligne' },
                { f: 's', desc: 'Single-line (dotAll)' },
                { f: 'u', desc: 'Unicode' },
                { f: 'y', desc: 'Sticky' },
              ].map((flag) => (
                <button
                  key={flag.f}
                  onClick={() => toggleFlag(flag.f)}
                  title={flag.desc}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-all border ${
                    flags.includes(flag.f)
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {flag.f}
                </button>
              ))}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte de Test</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-medium text-sm dark:text-slate-300"
              placeholder="Collez le texte à tester ici..."
            />
          </div>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] text-white space-y-6 shadow-xl shadow-indigo-500/10 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Résultats</h3>
              <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">
                {matches.length} {matches.length > 1 ? 'Correspondances' : 'Correspondance'}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex-grow overflow-auto custom-scrollbar">
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                {highlightedText}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center gap-2 text-indigo-400">
                <Info className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Aide rapide</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { tag: '\\d', desc: 'Chiffre' },
                  { tag: '\\w', desc: 'Mot' },
                  { tag: '.', desc: 'Tout' },
                  { tag: '*', desc: '0 ou plus' },
                ].map(help => (
                  <div key={help.tag} className="flex items-center gap-2 text-[10px]">
                    <code className="px-1.5 py-0.5 bg-white/10 rounded text-indigo-300 font-bold">{help.tag}</code>
                    <span className="text-slate-500">{help.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
