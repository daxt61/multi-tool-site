import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Settings2, AlertCircle, Info, Copy, Check } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-z]+)');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Bienvenue sur la boîte à outils ! Voici quelques exemples de texte pour tester vos expressions régulières.');
  const [copied, setCopied] = useState(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const availableFlags = [
    { id: 'g', name: 'Global', desc: 'Recherche toutes les occurrences' },
    { id: 'i', name: 'Insensible', desc: 'Ignore la casse' },
    { id: 'm', name: 'Multiligne', desc: '^ et $ correspondent aux lignes' },
    { id: 's', name: 'DotAll', desc: '. correspond aussi aux retours à la ligne' },
    { id: 'u', name: 'Unicode', desc: 'Support complet de l\'unicode' },
  ];

  const handleFlagToggle = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  const results = useMemo(() => {
    if (!regex) return { matches: [], error: null };
    try {
      const re = new RegExp(regex, flags.includes('g') ? flags : flags + 'g');
      const matches = Array.from(text.matchAll(re));
      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [regex, flags, text]);

  // Synchronize scrolling
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

  // Helper for XSS protection when rendering highlights
  const escapeHtml = (unsafe: string) => {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const highlightedText = useMemo(() => {
    if (!regex || results.error) return escapeHtml(text);

    let lastIndex = 0;
    const parts: React.ReactNode[] = [];

    // Sort matches by index to handle them sequentially
    const sortedMatches = [...results.matches].sort((a, b) => a.index! - b.index!);

    sortedMatches.forEach((match, i) => {
      const index = match.index!;
      const matchText = match[0];

      // Add text before match
      if (index > lastIndex) {
        parts.push(escapeHtml(text.slice(lastIndex, index)));
      }

      // Add highlighted match
      parts.push(
        `<mark class="bg-indigo-500/30 text-transparent rounded-sm ring-1 ring-indigo-500/50">${escapeHtml(matchText)}</mark>`
      );

      lastIndex = index + matchText.length;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(escapeHtml(text.slice(lastIndex)));
    }

    return parts.join('') + '\n'; // Add newline to match textarea behavior
  }, [text, results.matches, results.error, regex]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings2 className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold dark:text-white">Configuration</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Expression Régulière</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">/</div>
                  <input
                    type="text"
                    value={regex}
                    onChange={(e) => setRegex(e.target.value)}
                    className="w-full pl-8 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Votre regex..."
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">/</div>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Drapeaux (Flags)</label>
                <div className="flex flex-wrap gap-2">
                  {availableFlags.map(flag => (
                    <button
                      key={flag.id}
                      onClick={() => handleFlagToggle(flag.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        flags.includes(flag.id)
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10'
                          : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                      title={flag.desc}
                    >
                      {flag.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleCopy}
                  className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copié !' : 'Copier la Regex'}
                </button>
              </div>
            </div>
          </div>

          {results.error && (
            <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl p-4 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <div className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed font-mono">
                {results.error}
              </div>
            </div>
          )}

          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Résultats</span>
              <span className="bg-white dark:bg-slate-800 px-2 py-1 rounded-lg text-xs font-black text-emerald-600">
                {results.matches.length}
              </span>
            </div>
            <p className="text-xs text-emerald-800/60 dark:text-emerald-400/60 leading-relaxed">
              {results.matches.length > 0
                ? `${results.matches.length} occurrence(s) trouvée(s) dans le texte.`
                : "Aucune occurrence trouvée avec cette expression."}
            </p>
          </div>
        </div>

        {/* Text Area Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold dark:text-white">Texte de test</h3>
            </div>

            <div className="relative flex-grow min-h-[400px]">
              {/* Backdrop for highlights */}
              <div
                ref={backdropRef}
                className="absolute inset-0 p-8 font-mono text-lg leading-relaxed break-words whitespace-pre-wrap pointer-events-none overflow-auto text-transparent border border-transparent box-border"
                dangerouslySetInnerHTML={{ __html: highlightedText }}
                aria-hidden="true"
              />
              {/* Actual Textarea */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onScroll={handleScroll}
                className="absolute inset-0 w-full h-full p-8 bg-transparent border border-slate-200 dark:border-slate-800 rounded-3xl resize-none font-mono text-lg leading-relaxed focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all dark:text-white break-words overflow-auto box-border"
                placeholder="Entrez votre texte à analyser ici..."
                spellCheck="false"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 flex gap-6 items-start">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-slate-400 shadow-sm shrink-0">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <p className="font-bold dark:text-white">Astuces Regex</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <li><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded text-indigo-500">.</code> : N'importe quel caractère</li>
              <li><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded text-indigo-500">\d</code> : Un chiffre</li>
              <li><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded text-indigo-500">\w</code> : Caractère alphanumérique</li>
            </ul>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <li><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded text-indigo-500">+</code> : 1 ou plus</li>
              <li><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded text-indigo-500">*</code> : 0 ou plus</li>
              <li><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded text-indigo-500">?</code> : 0 ou 1</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
