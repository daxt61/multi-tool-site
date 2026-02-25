import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Info, AlertCircle, Copy, Check, Trash2, SlidersHorizontal } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6})');
  const [flags, setFlags] = useState('g');
  const [testText, setTestText] = useState('Contactez-nous à support@example.com ou info@test.org pour plus d\'informations.');
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const availableFlags = [
    { id: 'g', name: 'Global', desc: 'Recherche globale' },
    { id: 'i', name: 'Case Insensitive', desc: 'Ignore la casse' },
    { id: 'm', name: 'Multiline', desc: 'Début/fin de ligne (^/$)' },
    { id: 's', name: 'Dot All', desc: '. inclut les retours à la ligne' },
    { id: 'u', name: 'Unicode', desc: 'Support unicode complet' },
  ];

  const toggleFlag = (flagId: string) => {
    setFlags(prev => prev.includes(flagId) ? prev.replace(flagId, '') : prev + flagId);
  };

  const escapeHTML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const result = useMemo(() => {
    if (!regex) return { matches: [], html: escapeHTML(testText), error: null };
    try {
      const re = new RegExp(regex, flags);
      const matches: RegExpExecArray[] = [];
      let html = escapeHTML(testText);

      if (flags.includes('g')) {
        let match;
        // eslint-disable-next-line no-cond-assign
        while ((match = re.exec(testText)) !== null) {
          if (match.index === re.lastIndex) re.lastIndex++; // Prevent infinite loops
          matches.push(match);
        }
      } else {
        const match = re.exec(testText);
        if (match) matches.push(match);
      }

      // Build highlighted HTML
      // To highlight, we need to work with the original text positions but escape the content
      let lastIndex = 0;
      let highlightedHtml = '';

      // Sort matches by index to process them in order
      const sortedMatches = [...matches].sort((a, b) => a.index - b.index);

      // Remove overlapping or internal matches to keep it simple
      const nonOverlappingMatches: RegExpExecArray[] = [];
      let currentEnd = -1;
      for (const m of sortedMatches) {
        if (m.index >= currentEnd) {
          nonOverlappingMatches.push(m);
          currentEnd = m.index + m[0].length;
        }
      }

      nonOverlappingMatches.forEach((match) => {
        highlightedHtml += `<span class="text-transparent">${escapeHTML(testText.substring(lastIndex, match.index))}</span>`;
        highlightedHtml += `<mark class="bg-indigo-500/30 text-transparent rounded-sm ring-1 ring-indigo-500/50">${escapeHTML(match[0])}</mark>`;
        lastIndex = match.index + match[0].length;
      });
      highlightedHtml += `<span class="text-transparent">${escapeHTML(testText.substring(lastIndex))}</span>`;
      highlightedHtml += '\n'; // Add trailing newline for synchronization

      return { matches, html: highlightedHtml, error: null };
    } catch (e: any) {
      return { matches: [], html: escapeHTML(testText), error: e.message };
    }
  }, [regex, flags, testText]);

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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Configuration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
                </button>
                <button
                  onClick={() => {setRegex(''); setFlags('g');}}
                  className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <span className="font-mono text-lg">/</span>
              </div>
              <input
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                placeholder="votre-regex-ici"
                className={`w-full pl-10 pr-20 py-4 bg-slate-50 dark:bg-slate-900 border ${result.error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20'} rounded-2xl outline-none focus:ring-2 transition-all font-mono text-lg dark:text-slate-200`}
              />
              <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                <span className="font-mono text-lg">/{flags}</span>
              </div>
            </div>
            {result.error && (
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold px-1 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {result.error}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de Test</label>
              <div className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">
                {result.matches.length} correspondance{result.matches.length > 1 ? 's' : ''}
              </div>
            </div>
            <div className="relative h-[300px] w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              {/* Backdrop for highlighting */}
              <div
                ref={backdropRef}
                className="absolute inset-0 p-8 font-mono text-lg leading-relaxed whitespace-pre-wrap break-words pointer-events-none overflow-auto select-none"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: result.html }}
              />
              {/* Main textarea */}
              <textarea
                ref={textareaRef}
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                onScroll={handleScroll}
                placeholder="Entrez votre texte à tester ici..."
                className="absolute inset-0 w-full h-full p-8 bg-transparent text-slate-900 dark:text-slate-200 font-mono text-lg leading-relaxed outline-none resize-none overflow-auto"
                spellCheck="false"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Flags Section */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 px-1 mb-4">
              <SlidersHorizontal className="w-4 h-4 text-indigo-500" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Drapeaux (Flags)</h4>
            </div>
            <div className="space-y-2">
              {availableFlags.map((f) => (
                <button
                  key={f.id}
                  onClick={() => toggleFlag(f.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${flags.includes(f.id) ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-transparent text-slate-500 hover:border-slate-200 dark:hover:border-slate-700'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-black font-mono">{f.id}</span>
                    <span className="text-xs font-bold">{f.name}</span>
                  </div>
                  <span className="text-[10px] opacity-60 italic">{f.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 px-1 mb-4">
              <Info className="w-4 h-4 text-indigo-500" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aide Mémoire Rapide</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '.', desc: 'Tout caractère' },
                { label: '\\d', desc: 'Chiffre' },
                { label: '\\w', desc: 'Caractère de mot' },
                { label: '\\s', desc: 'Espace' },
                { label: '*', desc: '0 ou plus' },
                { label: '+', desc: '1 ou plus' },
                { label: '?', desc: '0 ou 1' },
                { label: '^', desc: 'Début ligne' },
                { label: '$', desc: 'Fin ligne' },
                { label: '|', desc: 'Ou' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-indigo-500 font-mono font-bold text-sm">{item.label}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Section */}
      <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Search className="w-32 h-32" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-black mb-4 tracking-tight">Comment fonctionne cet outil ?</h3>
          <p className="text-slate-400 leading-relaxed mb-6">
            L'expression régulière est compilée en temps réel. Les correspondances sont surlignées dynamiquement dans le texte de test.
            Nous utilisons une superposition de couches (backdrop) pour vous permettre d'éditer le texte normalement tout en visualisant les résultats avec précision.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-sm text-slate-300">Validation syntaxique instantanée</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-sm text-slate-300">Zéro transfert serveur (100% privé)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
