import { useState, useMemo } from 'react';
import { Copy, Check, FileText, Settings2, RefreshCw } from 'lucide-react';

export function LoremIpsumGenerator() {
  const [count, setCount] = useState(3);
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [copied, setCopied] = useState(false);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2147483647));

  const loremWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
    'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
    'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
  ];

  const generatedText = useMemo(() => {
    // Simple pseudo-random using seed to allow "refreshing" without losing state
    let localSeed = seed || 1;
    const nextRandom = () => {
      localSeed = (localSeed * 16807) % 2147483647;
      return localSeed / 2147483647;
    };

    const generateSentence = () => {
      const length = Math.floor(nextRandom() * 10) + 8;
      const words = [];
      for (let i = 0; i < length; i++) {
        words.push(loremWords[Math.floor(nextRandom() * loremWords.length)]);
      }
      return words.join(' ').charAt(0).toUpperCase() + words.join(' ').slice(1) + '.';
    };

    const generateParagraph = () => {
      const sentenceCount = Math.floor(nextRandom() * 4) + 4;
      const sentences = [];
      for (let i = 0; i < sentenceCount; i++) {
        sentences.push(generateSentence());
      }
      return sentences.join(' ');
    };

    if (type === 'words') {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(loremWords[Math.floor(nextRandom() * loremWords.length)]);
      }
      return words.join(' ');
    } else if (type === 'sentences') {
      const sentences = [];
      for (let i = 0; i < count; i++) {
        sentences.push(generateSentence());
      }
      return sentences.join(' ');
    } else {
      const paragraphs = [];
      for (let i = 0; i < count; i++) {
        paragraphs.push(generateParagraph());
      }
      return paragraphs.join('\n\n');
    }
  }, [count, type, seed]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          <div className="flex items-center gap-2 px-1">
            <Settings2 className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Configuration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">Quantité</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="flex-grow h-1.5 rounded-lg appearance-none cursor-pointer bg-white dark:bg-slate-800 accent-indigo-600"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-16 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-black text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">Format</label>
              <div className="flex p-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                {[
                  { id: 'paragraphs', label: 'Paragraphes' },
                  { id: 'sentences', label: 'Phrases' },
                  { id: 'words', label: 'Mots' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setType(opt.id as any)}
                    className={`flex-grow py-2.5 rounded-xl text-xs font-bold transition-all ${type === opt.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-4">
          <button
            onClick={copyToClipboard}
            className={`flex-grow flex flex-col items-center justify-center gap-3 p-8 rounded-[2.5rem] transition-all border group active:scale-[0.98] ${copied ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20' : 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700'}`}
          >
            {copied ? <Check className="w-8 h-8 animate-in zoom-in" /> : <Copy className="w-8 h-8 group-hover:scale-110 transition-transform" />}
            <span className="font-black tracking-tight">{copied ? 'Copié !' : 'Tout Copier'}</span>
          </button>

          <button
            onClick={() => setSeed(Math.floor(Math.random() * 2147483647))}
            className="flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-500 hover:border-slate-300 dark:hover:border-slate-700 transition-all active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" /> Régénérer
          </button>
        </div>
      </div>

      {/* Output Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Généré</h3>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Aperçu de {count} {type === 'paragraphs' ? 'paragraphes' : type === 'sentences' ? 'phrases' : 'mots'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-sm min-h-[300px]">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-lg font-medium selection:bg-indigo-100 dark:selection:bg-indigo-900/50">
              {generatedText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
