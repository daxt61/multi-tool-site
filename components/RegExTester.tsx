import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Settings2, AlertCircle, CheckCircle2, Copy, Trash2, Info } from 'lucide-react';

export function RegExTester() {
  const [regexStr, setRegexStr] = useState('([a-z0-9_\\.-]+)@([\\da-z\\.-]+)\\.([a-z\\.]{2,6})');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('Contactez-nous à support@example.com ou sales.dept@my-company.org pour plus d\'infos.');
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const availableFlags = [
    { char: 'g', label: 'Global', desc: 'Ne s\'arrête pas au premier match' },
    { char: 'i', label: 'Insensible à la casse', desc: 'Ignore les majuscules/minuscules' },
    { char: 'm', label: 'Multiligne', desc: '^ et $ matchent le début/fin de ligne' },
    { char: 's', label: 'Single line', desc: '. matche aussi les retours à la ligne' },
    { char: 'u', label: 'Unicode', desc: 'Support complet de l\'Unicode' },
  ];

  const { regex, error, matches } = useMemo(() => {
    try {
      if (!regexStr) return { regex: null, error: null, matches: [] };
      const r = new RegExp(regexStr, flags);
      const m = Array.from(testText.matchAll(r));
      return { regex: r, error: null, matches: m };
    } catch (e: any) {
      return { regex: null, error: e.message, matches: [] };
    }
  }, [regexStr, flags, testText]);

  const toggleFlag = (f: string) => {
    setFlags(prev => prev.includes(f) ? prev.replace(f, '') : prev + f);
  };

  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const escapeHtml = (text: string) => {
    return text.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    } as any)[m]);
  };

  const highlightedText = useMemo(() => {
    if (!regex || error || !testText) return escapeHtml(testText);

    let lastIndex = 0;
    const parts: string[] = [];

    // We use a simplified version for the backdrop that just highlights the full matches
    // Note: matchAll with 'g' flag is important here.
    const matchesArray = Array.from(testText.matchAll(new RegExp(regexStr, flags.includes('g') ? flags : flags + 'g')));

    matchesArray.forEach((match, i) => {
      const index = match.index!;
      parts.push(escapeHtml(testText.slice(lastIndex, index)));
      parts.push(`<mark class="bg-indigo-500/30 dark:bg-indigo-400/40 text-transparent rounded-sm px-0.5 border-b-2 border-indigo-500">${escapeHtml(match[0])}</mark>`);
      lastIndex = index + match[0].length;
    });

    parts.push(escapeHtml(testText.slice(lastIndex)));
    return parts.join('');
  }, [testText, regex, regexStr, flags, error]);

  const handleCopy = () => {
    navigator.clipboard.writeText(`/${regexStr}/${flags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* RegEx Input Section */}
      <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Expression Régulière</h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`p-2 rounded-lg transition-all ${copied ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              title="Copier le RegEx"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {setRegexStr(''); setFlags('g');}}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
              title="Réinitialiser"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-lg">/</div>
            <input
              value={regexStr}
              onChange={(e) => setRegexStr(e.target.value)}
              placeholder="votre_regex"
              className={`w-full pl-8 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-2xl outline-none focus:ring-2 transition-all font-mono text-lg dark:text-slate-200`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-lg">/{flags}</div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-500 text-xs font-bold px-4 py-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {availableFlags.map(f => (
            <button
              key={f.char}
              onClick={() => toggleFlag(f.char)}
              title={f.desc}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                flags.includes(f.char)
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-indigo-500/50'
              }`}
            >
              {f.char}
            </button>
          ))}
        </div>
      </div>

      {/* Test Text Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de test</label>
            <div className="text-[10px] font-bold text-indigo-500 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
              {matches.length} correspondance{matches.length > 1 ? 's' : ''}
            </div>
          </div>

          <div className="relative group min-h-[300px] h-[400px]">
            {/* Backdrop for highlighting */}
            <div
              ref={backdropRef}
              className="absolute inset-0 p-6 bg-slate-50 dark:bg-slate-900 border border-transparent rounded-[2rem] font-mono text-sm leading-relaxed whitespace-pre-wrap break-words overflow-auto pointer-events-none no-scrollbar"
              dangerouslySetInnerHTML={{ __html: highlightedText + '\n' }}
            />

            {/* Real Textarea */}
            <textarea
              ref={textareaRef}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              onScroll={handleScroll}
              placeholder="Entrez le texte à tester ici..."
              className="absolute inset-0 w-full h-full p-6 bg-transparent border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-300 resize-none caret-indigo-500"
            />
          </div>
        </div>

        {/* Sidebar / Match Details */}
        <div className="space-y-6">
          <div className="p-8 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] h-full flex flex-col">
            <div className="flex items-center gap-3 text-slate-400 mb-6">
              <Settings2 className="w-5 h-5" />
              <h3 className="font-black uppercase tracking-widest text-xs">Détails des captures</h3>
            </div>

            <div className="flex-grow overflow-auto space-y-4 max-h-[400px] pr-2 custom-scrollbar">
              {matches.length > 0 ? (
                matches.slice(0, 50).map((match, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-indigo-500">MATCH {i + 1}</span>
                      <span className="text-[10px] text-slate-400 font-mono">index: {match.index}</span>
                    </div>
                    <div className="font-mono text-xs break-all text-slate-700 dark:text-slate-300">
                      {match[0]}
                    </div>
                    {match.length > 1 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                        {Array.from(match).slice(1).map((group, j) => (
                          <div key={j} className="flex gap-2 text-[10px]">
                            <span className="text-slate-400 font-bold">G{j + 1}:</span>
                            <span className="text-indigo-400 truncate">{group || 'null'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-4">
                    <Info className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-400">Aucune correspondance trouvée</p>
                </div>
              )}
              {matches.length > 50 && (
                <p className="text-[10px] text-center text-slate-400 italic mt-2">Affichage limité aux 50 premiers résultats</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
          <Info className="w-4 h-4" /> Aide-mémoire rapide
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { tag: '.', desc: 'N\'importe quel caractère' },
            { tag: '\\d', desc: 'Un chiffre [0-9]' },
            { tag: '\\w', desc: 'Mot [a-zA-Z0-9_]' },
            { tag: '\\s', desc: 'Espace blanc' },
            { tag: '+', desc: '1 ou plus' },
            { tag: '*', desc: '0 ou plus' },
            { tag: '?', desc: '0 ou 1 (optionnel)' },
            { tag: '^ / $', desc: 'Début / Fin' },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1">
              <code className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">{item.tag}</code>
              <p className="text-[10px] text-indigo-800/60 dark:text-indigo-400/60 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
