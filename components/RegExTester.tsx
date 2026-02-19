import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Flag, AlertCircle, Copy, Check, Trash2, Info } from 'lucide-react';

export function RegExTester() {
  const [regex, setRegex] = useState('([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Contactez-nous à support@example.com ou sales@example.org pour plus d\'informations.');
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const availableFlags = [
    { id: 'g', name: 'global', desc: 'Recherche globale' },
    { id: 'i', name: 'ignoreCase', desc: 'Ignorer la casse' },
    { id: 'm', name: 'multiline', desc: 'Multiligne' },
    { id: 's', name: 'dotAll', desc: 'Le point inclut les retours à la ligne' },
    { id: 'u', name: 'unicode', desc: 'Support Unicode' },
    { id: 'y', name: 'sticky', desc: 'Recherche collante' },
  ];

  const toggleFlag = (flag: string) => {
    setFlags(prev => prev.includes(flag) ? prev.replace(flag, '') : prev + flag);
  };

  const results = useMemo(() => {
    if (!regex) return { matches: [], error: null };
    try {
      const re = new RegExp(regex, flags);
      const matches = [];

      if (re.global) {
        const allMatches = text.matchAll(re);
        for (const match of allMatches) {
          matches.push({
            index: match.index,
            length: match[0].length,
            text: match[0],
            groups: match.slice(1)
          });
        }
      } else {
        const match = re.exec(text);
        if (match) {
          matches.push({
            index: match.index,
            length: match[0].length,
            text: match[0],
            groups: match.slice(1)
          });
        }
      }

      return { matches, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [regex, flags, text]);

  // Sync scroll between textarea and backdrop
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const highlightedText = useMemo(() => {
    if (results.error || results.matches.length === 0) return text;

    let lastIndex = 0;
    const parts = [];

    // Sort matches by index just in case
    const sortedMatches = [...results.matches].sort((a, b) => (a.index || 0) - (b.index || 0));

    sortedMatches.forEach((match, i) => {
      const index = match.index || 0;
      // Add text before match
      parts.push(text.substring(lastIndex, index));
      // Add highlighted match
      parts.push(
        <mark key={i} className="bg-indigo-500/20 text-transparent border-b-2 border-indigo-500 rounded-sm">
          {match.text}
        </mark>
      );
      lastIndex = index + match.length;
    });

    // Add remaining text
    parts.push(text.substring(lastIndex));
    return parts;
  }, [text, results.matches, results.error]);

  const handleCopy = () => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Configuration Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Expression Régulière</label>
              <button
                onClick={handleCopy}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                value={regex}
                onChange={(e) => setRegex(e.target.value)}
                placeholder="Insérez votre regex ici..."
                className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono text-lg dark:text-white"
              />
            </div>
            {results.error && (
              <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl text-sm font-bold border border-rose-100 dark:border-rose-900/40">
                <AlertCircle className="w-4 h-4" /> {results.error}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de test</label>
              <button onClick={() => setText('')} className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors">
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
            <div className="relative w-full h-80 overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-slate-800 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all bg-white dark:bg-slate-900">
              {/* Backdrop for highlighting */}
              <div
                ref={backdropRef}
                className="absolute inset-0 p-8 font-mono text-lg leading-relaxed whitespace-pre-wrap break-words pointer-events-none select-none text-slate-900 dark:text-slate-300"
                aria-hidden="true"
              >
                {highlightedText}
              </div>
              {/* Actual interactive textarea */}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onScroll={handleScroll}
                className="absolute inset-0 w-full h-full p-8 bg-transparent text-slate-900 dark:text-slate-300 font-mono text-lg leading-relaxed outline-none resize-none break-words overflow-y-auto selection:bg-indigo-500/30"
                placeholder="Collez votre texte à tester ici..."
                spellCheck="false"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Flag className="w-4 h-4" /> Drapeaux (Flags)
            </h4>
            <div className="space-y-2">
              {availableFlags.map(flag => (
                <button
                  key={flag.id}
                  onClick={() => toggleFlag(flag.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    flags.includes(flag.id)
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-black text-sm">{flag.id}</span>
                    <span className="text-[10px] font-bold uppercase opacity-60">{flag.name}</span>
                  </div>
                  <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                    flags.includes(flag.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {flags.includes(flag.id) && <Check className="w-4 h-4 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-4">
            <div className="text-xs font-black uppercase tracking-widest text-slate-400">Résultats</div>
            <div className="space-y-2">
              <div className="text-3xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {results.matches.length}
              </div>
              <p className="text-sm font-bold text-slate-500">Correspondances trouvées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide rapide
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Les expressions régulières (Regex) sont des motifs utilisés pour correspondre à des combinaisons de caractères dans des chaînes de caractères. Utilisez les drapeaux pour modifier le comportement de la recherche (ex: 'i' pour ignorer la casse).
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-500" /> Captures de groupes
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Vous pouvez utiliser des parenthèses <code>()</code> pour créer des groupes de capture. Les correspondances globales sont surlignées en bleu dans le texte de test.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-500" /> Sécurité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Tout le traitement est effectué localement dans votre navigateur. Vos expressions régulières et vos données de test ne sont jamais envoyées sur un serveur.
          </p>
        </div>
      </div>
    </div>
  );
}
