import React, { useState, useMemo, useRef } from 'react';
import { Search, Copy, Check, Info, Settings2, AlertCircle } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-z0-9_\\.-]+)@([\\da-z\\.-]+)\\.([a-z\\.]{2,6})');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Contactez-nous à support@example.com ou sales@company.org pour plus d\'informations.');
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const availableFlags = [
    { char: 'g', name: 'Global', desc: 'Ne s\'arrête pas au premier match' },
    { char: 'i', name: 'Insensible', desc: 'Ignore la casse' },
    { char: 'm', name: 'Multiligne', desc: '^ et $ matchent le début/fin de ligne' },
    { char: 's', name: 'Single line', desc: '. matche aussi les sauts de ligne' },
    { char: 'u', name: 'Unicode', desc: 'Support complet des caractères Unicode' },
    { char: 'y', name: 'Sticky', desc: 'Matche à partir de lastIndex' },
  ];

  const { matches, error, highlightedText } = useMemo(() => {
    if (!regex) return { matches: [], error: null, highlightedText: text };
    try {
      const re = new RegExp(regex, flags);
      const matches: RegExpExecArray[] = [];
      let match;

      // Safety check for empty matches to avoid infinite loops
      const safeRegex = regex === '' ? /(?:)/ : re;

      if (flags.includes('g')) {
        let lastIndex = -1;
        while ((match = safeRegex.exec(text)) !== null) {
          if (match.index === lastIndex) {
            safeRegex.lastIndex++;
          }
          lastIndex = match.index;
          matches.push(match);
          if (!flags.includes('g')) break;
          if (matches.length > 1000) break; // Safety break
        }
      } else {
        match = safeRegex.exec(text);
        if (match) matches.push(match);
      }

      // Generate highlighted HTML with proper escaping
      let lastIdx = 0;
      let html = '';
      matches.forEach((m) => {
        const start = m.index;
        const end = start + m[0].length;

        // Escape content before and inside mark
        const before = text.slice(lastIdx, start)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const matched = text.slice(start, end)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        html += before;
        html += `<mark class="bg-indigo-500/20 text-indigo-900 dark:text-indigo-100 rounded-sm">${matched}</mark>`;
        lastIdx = end;
      });

      html += text.slice(lastIdx)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Append a newline to handle textarea scrolling sync correctly
      html += '\n';

      return { matches, error: null, highlightedText: html };
    } catch (e: any) {
      return { matches: [], error: e.message, highlightedText: text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '\n' };
    }
  }, [regex, flags, text]);

  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-500" />
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
                </div>
                <button
                  onClick={handleCopy}
                  className={`text-[10px] font-black px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier Regex'}
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xl">/</span>
                <input
                  type="text"
                  value={regex}
                  onChange={(e) => setRegex(e.target.value)}
                  placeholder="votre_regex_ici"
                  className={`w-full pl-8 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border ${error ? 'border-rose-500/50 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-2xl outline-none focus:ring-4 font-mono text-lg transition-all dark:text-white`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 font-mono text-xl">
                  /{flags}
                </span>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-rose-500 text-xs font-bold px-1 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {error}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Settings2 className="w-4 h-4 text-indigo-500" />
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Flags</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableFlags.map((f) => (
                  <button
                    key={f.char}
                    onClick={() => toggleFlag(f.char)}
                    title={f.desc}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${flags.includes(f.char) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300'}`}
                  >
                    {f.char} <span className="ml-1 opacity-60 font-medium">({f.name})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] p-8 border border-indigo-100 dark:border-indigo-900/20 space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" />
            <h4 className="font-bold text-indigo-900 dark:text-indigo-100">Statistiques</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-700 dark:text-indigo-300">Matches trouvés</span>
              <span className="px-2 py-1 bg-white dark:bg-slate-900 rounded-lg text-xs font-black text-indigo-600">{matches.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de test</label>
        </div>
        <div className="relative min-h-[400px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
          <div
            ref={backdropRef}
            className="absolute inset-0 p-8 font-mono text-lg leading-relaxed whitespace-pre-wrap break-words pointer-events-none overflow-auto text-transparent"
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onScroll={handleScroll}
            spellCheck={false}
            className="absolute inset-0 w-full h-full p-8 bg-transparent font-mono text-lg leading-relaxed text-slate-800 dark:text-slate-200 outline-none resize-none overflow-auto caret-indigo-600"
            placeholder="Entrez votre texte ici pour tester l'expression régulière..."
          />
        </div>
      </div>
    </div>
  );
}
