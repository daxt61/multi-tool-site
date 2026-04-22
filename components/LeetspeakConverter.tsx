import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Trash2, Type, Download, Zap } from 'lucide-react';

type LeetLevel = 'basic' | 'medium' | 'ultra';

const LEET_MAPS: Record<LeetLevel, Record<string, string>> = {
  basic: {
    'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7'
  },
  medium: {
    'a': '4', 'b': '8', 'e': '3', 'g': '6', 'i': '1', 'o': '0', 's': '5', 't': '7', 'z': '2'
  },
  ultra: {
    'a': '4', 'b': '|3', 'c': '(', 'd': '|)', 'e': '3', 'f': '|=', 'g': '6', 'h': '|-|', 'i': '!', 'j': '_|', 'k': '|<', 'l': '1', 'm': '|\\/|', 'n': '|\\|', 'o': '0', 'p': '|*', 'q': '(_,)', 'r': '|2', 's': '$', 't': '7', 'u': '|_|', 'v': '\\/', 'w': '\\/\\/', 'x': '><', 'y': '`/', 'z': '2'
  }
};

export function LeetspeakConverter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [text, setText] = useState(initialData?.text || '');
  const [level, setLevel] = useState<LeetLevel>(initialData?.level || 'basic');
  const [copied, setCopied] = useState(false);

  const convertToLeet = useCallback((input: string, leetLevel: LeetLevel) => {
    const map = LEET_MAPS[leetLevel];
    return input.toLowerCase().split('').map(char => map[char] || char).join('');
  }, []);

  const leetText = convertToLeet(text, level);

  useEffect(() => {
    onStateChange?.({ text, level });
  }, [text, level, onStateChange]);

  const handleCopy = () => {
    if (!leetText) return;
    navigator.clipboard.writeText(leetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!leetText) return;
    const blob = new Blob([leetText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leetspeak-${level}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Level Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          {(['basic', 'medium', 'ultra'] as LeetLevel[]).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              aria-pressed={level === l}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none capitalize ${
                level === l
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Zap className={`w-4 h-4 ${level === l ? 'fill-current' : ''}`} />
              {l === 'basic' ? 'Basique' : l === 'medium' ? 'Moyen' : 'Ultra'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="leet-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Texte Normal</label>
            <button
              onClick={() => setText('')}
              disabled={!text}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            id="leet-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tapez votre texte ici..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg dark:text-slate-300 resize-none"
          />
        </div>

        {/* Output */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="leet-output" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">L3375P34|&lt;</label>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                disabled={!leetText}
                className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3 h-3" /> Télécharger
              </button>
              <button
                onClick={handleCopy}
                disabled={!leetText}
                className={`text-xs font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-transparent hover:bg-indigo-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <div
            id="leet-output"
            className="w-full h-64 p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl text-lg dark:text-white font-mono break-all overflow-y-auto"
          >
            {leetText || <span className="text-slate-400 italic">Le résultat apparaîtra ici...</span>}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Type className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">C'est quoi le Leetspeak ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Le leetspeak (ou « l33t ») est un système d'écriture utilisant des caractères alphanumériques qui ressemblent visuellement à d'autres caractères. Par exemple, le chiffre « 3 » remplace la lettre « E ». Il est souvent utilisé dans la culture internet et le gaming.
          </p>
        </div>
      </div>
    </div>
  );
}
