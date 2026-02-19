import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Info, AlertCircle, Check } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function RegExTester() {
  const [pattern, setPattern] = useState('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Contactez-nous à support@example.com ou info@test.fr');
  const [error, setError] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const matches = useMemo(() => {
    try {
      setError(null);
      if (!pattern) return [];
      // Ensure 'g' flag is present for matchAll
      const effectiveFlags = flags.includes('g') ? flags : flags + 'g';
      const regex = new RegExp(pattern, effectiveFlags);
      return Array.from(text.matchAll(regex));
    } catch (e) {
      setError((e as Error).message);
      return [];
    }
  }, [pattern, flags, text]);

  const escapeHTML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const highlightedText = useMemo(() => {
    if (error || !pattern || matches.length === 0) {
        return escapeHTML(text).replace(/\n/g, '<br/>');
    }

    let result = '';
    let lastIndex = 0;

    matches.forEach((match) => {
      const start = match.index!;
      const end = start + match[0].length;

      if (start > lastIndex) {
        result += escapeHTML(text.slice(lastIndex, start));
      }
      result += `<mark class="bg-indigo-500/30 dark:bg-indigo-400/40 text-transparent rounded-sm">${escapeHTML(text.slice(start, end))}</mark>`;
      lastIndex = end;
    });

    result += escapeHTML(text.slice(lastIndex));
    return result.replace(/\n/g, '<br/>');
  }, [text, matches, error, pattern]);

  useEffect(() => {
    const syncScroll = () => {
      if (backdropRef.current && textareaRef.current) {
        backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    };
    const textarea = textareaRef.current;
    textarea?.addEventListener('scroll', syncScroll);
    return () => textarea?.removeEventListener('scroll', syncScroll);
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6" />

      {/* RegEx Input */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Expression Régulière</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                <span className="font-mono text-lg">/</span>
              </div>
              <input
                type="text"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="w-full pl-8 pr-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="[a-z]+"
              />
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                <span className="font-mono text-lg">/</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Flags</label>
            <input
              type="text"
              value={flags}
              onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))}
              className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-lg outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="gi"
            />
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Test Area */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte de test</label>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-500">
            <Check className="w-4 h-4" />
            {matches.length} correspondance{matches.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="relative h-[300px] font-mono text-lg leading-relaxed">
          {/* Synchronized Backdrop for Highlighting */}
          <div
            ref={backdropRef}
            className="absolute inset-0 p-8 text-transparent pointer-events-none whitespace-pre-wrap break-all overflow-y-auto bg-slate-50 dark:bg-slate-900 border border-transparent rounded-[2rem]"
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            className="absolute inset-0 w-full h-full p-8 bg-transparent border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none overflow-y-auto break-all"
            placeholder="Entrez votre texte à tester ici..."
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-2xl flex gap-4 items-start">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-sm text-indigo-900 dark:text-indigo-300">
          <p className="font-bold mb-1 tracking-tight">Aide RegEx Rapide</p>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 opacity-80 font-medium">
            <li><code className="text-indigo-600 dark:text-indigo-400">.</code> : Tout caractère</li>
            <li><code className="text-indigo-600 dark:text-indigo-400">\d</code> : Un chiffre</li>
            <li><code className="text-indigo-600 dark:text-indigo-400">\w</code> : Alphanumérique</li>
            <li><code className="text-indigo-600 dark:text-indigo-400">\s</code> : Espace blanc</li>
            <li><code className="text-indigo-600 dark:text-indigo-400">+</code> : 1 ou plus</li>
            <li><code className="text-indigo-600 dark:text-indigo-400">*</code> : 0 ou plus</li>
            <li><code className="text-indigo-600 dark:text-indigo-400">?</code> : 0 ou 1</li>
            <li><code className="text-indigo-600 dark:text-indigo-400">^</code> : Début de ligne</li>
          </ul>
        </div>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
