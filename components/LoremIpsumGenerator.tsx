import { useState, useMemo, useCallback } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';

export function LoremIpsumGenerator() {
  const [count, setCount] = useState(3);
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [copied, setCopied] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  // Sentinel: Secure random helper using crypto.getRandomValues with rejection sampling
  const getSecureRandom = useCallback((range: number): number => {
    if (range <= 0) return 0;
    const array = new Uint32Array(1);
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % range);

    let randomVal;
    do {
      window.crypto.getRandomValues(array);
      randomVal = array[0];
    } while (randomVal >= limit);

    return randomVal % range;
  }, []);

  const generateSentence = () => {
    const length = getSecureRandom(10) + 8;
    const words = [];
    for (let i = 0; i < length; i++) {
      words.push(loremWords[getSecureRandom(loremWords.length)]);
    }
    return words.join(' ').charAt(0).toUpperCase() + words.join(' ').slice(1) + '.';
  };

  const generateParagraph = () => {
    const sentenceCount = getSecureRandom(4) + 4;
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence());
    }
    return sentences.join(' ');
  };

  const text = useMemo(() => {
    const generateText = () => {
      if (type === 'words') {
        const words = [];
        for (let i = 0; i < count; i++) {
          words.push(loremWords[getSecureRandom(loremWords.length)]);
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
    };
    return generateText();
  }, [count, type, refreshTrigger, getSecureRandom]);

  const handleRegenerate = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <label htmlFor="lorem-count" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              Nombre
            </label>
            <input
              id="lorem-count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="lorem-type" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">
              Type
            </label>
            <select
              id="lorem-type"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white cursor-pointer"
            >
              <option value="paragraphs">Paragraphes</option>
              <option value="sentences">Phrases</option>
              <option value="words">Mots</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleRegenerate}
            className="flex-1 py-4 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 font-black active:scale-95"
          >
            <RefreshCw className="w-5 h-5" />
            Régénérer
          </button>
          <button
            onClick={copyToClipboard}
            className={`flex-[2] py-4 rounded-2xl transition-all flex items-center justify-center gap-2 font-black active:scale-95 ${
              copied
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700'
            }`}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copié !' : 'Copier le texte'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 max-h-[500px] overflow-y-auto shadow-sm">
        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-lg">
          {text}
        </p>
      </div>
    </div>
  );
}
