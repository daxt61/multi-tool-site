import { useState, useMemo } from 'react';
import { Search, Copy, Check, Trash2, Info, BookOpen } from 'lucide-react';

export function RegexTester() {
  const [pattern, setPattern] = useState('[a-z]+');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('Hello world! This is a regex test.');
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => {
    if (!pattern) return { matches: [], error: null };
    try {
      const regex = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      const matches = Array.from(testText.matchAll(regex));
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [pattern, flags, testText]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pattern);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regexGuide = [
    { char: '.', desc: 'N\'importe quel caractère' },
    { char: '\\d', desc: 'Un chiffre (0-9)' },
    { char: '\\w', desc: 'Caractère alphanumérique' },
    { char: '\\s', desc: 'Espace blanc' },
    { char: '[abc]', desc: 'Un des caractères a, b, ou c' },
    { char: '[^abc]', desc: 'Aucun des caractères a, b, ou c' },
    { char: 'a*', desc: 'Zéro ou plus de "a"' },
    { char: 'a+', desc: 'Un ou plus de "a"' },
    { char: 'a?', desc: 'Zéro ou un "a"' },
    { char: '^', desc: 'Début de ligne' },
    { char: '$', desc: 'Fin de ligne' },
    { char: '(...)', desc: 'Groupe de capture' },
  ];

  const highlightMatches = () => {
    if (results.error || !pattern || results.matches.length === 0) return testText;

    let lastIndex = 0;
    const parts = [];

    // Sort matches by index to handle them in order
    const sortedMatches = [...results.matches].sort((a, b) => a.index! - b.index!);

    sortedMatches.forEach((match, i) => {
      const index = match.index!;
      const text = match[0];

      // Add text before match
      if (index > lastIndex) {
        parts.push(testText.substring(lastIndex, index));
      }

      // Add highlighted match
      parts.push(
        <span key={i} className="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500 rounded-sm font-bold px-0.5">
          {text}
        </span>
      );

      lastIndex = index + text.length;
    });

    // Add remaining text
    if (lastIndex < testText.length) {
      parts.push(testText.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Input Area */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
                  </button>
                  <button onClick={() => setPattern('')} className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Effacer
                  </button>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-grow relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">/</div>
                  <input
                    type="text"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    placeholder="[a-z]+"
                    className="w-full pl-8 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">/</div>
                </div>
                <div className="w-full md:w-32">
                  <input
                    type="text"
                    value={flags}
                    onChange={(e) => setFlags(e.target.value)}
                    placeholder="flags"
                    className="w-full px-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-mono focus:border-indigo-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
              {results.error && (
                <div className="px-4 py-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold">
                  {results.error}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Texte de Test</label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Entrez votre texte ici..."
                className="w-full h-48 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300"
              />
            </div>
          </div>

          {/* Result Area */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Prévisualisation</label>
              <div className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
                {results.matches.length} correspondance(s)
              </div>
            </div>
            <div className="p-8 bg-slate-50 dark:bg-slate-950/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 min-h-[100px] whitespace-pre-wrap break-all text-lg leading-relaxed dark:text-slate-300 font-mono">
              {highlightMatches()}
            </div>
          </div>
        </div>

        {/* Sidebar Guide */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <BookOpen className="w-8 h-8 mb-4 opacity-50" />
            <h3 className="text-xl font-black mb-4">Guide Rapide</h3>
            <div className="space-y-3">
              {regexGuide.map((item, i) => (
                <div key={i} className="flex justify-between items-start gap-4 text-sm">
                  <code className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded whitespace-nowrap">{item.char}</code>
                  <span className="text-indigo-100 text-right">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Info className="w-4 h-4" /> Groupes de capture
            </h4>
            <div className="space-y-2">
              {results.matches.length > 0 ? (
                results.matches[0].map((match, i) => (
                  <div key={i} className="flex justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 text-sm">
                    <span className="text-slate-400 font-bold">Group {i}</span>
                    <code className="font-mono text-indigo-500">{match || 'null'}</code>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Aucune correspondance pour afficher les groupes.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
