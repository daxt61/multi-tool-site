import { useState } from 'react';
import { Copy, Check, RefreshCw, Type, AlignLeft, FileText } from 'lucide-react';

export function LoremIpsumGenerator() {
  const [count, setCount] = useState(3);
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [copied, setCopied] = useState(false);
  const [text, setText] = useState(() => {
    // Initial generation
    const words = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
      'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
      'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
      'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
      'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
      'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
      'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
      'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
    ];

    const generateSentence = () => {
      const length = Math.floor(Math.random() * 10) + 8;
      const ws = [];
      for (let i = 0; i < length; i++) {
        ws.push(words[Math.floor(Math.random() * words.length)]);
      }
      const joined = ws.join(' ');
      return joined.charAt(0).toUpperCase() + joined.slice(1) + '.';
    };

    const paragraphs = [];
    for (let i = 0; i < 3; i++) {
      const sentenceCount = Math.floor(Math.random() * 4) + 4;
      const sentences = [];
      for (let j = 0; j < sentenceCount; j++) {
        sentences.push(generateSentence());
      }
      paragraphs.push(sentences.join(' '));
    }
    return paragraphs.join('\n\n');
  });

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

  const generateSentence = () => {
    const length = Math.floor(Math.random() * 10) + 8;
    const words = [];
    for (let i = 0; i < length; i++) {
      words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
    }
    const joined = words.join(' ');
    return joined.charAt(0).toUpperCase() + joined.slice(1) + '.';
  };

  const generateParagraph = () => {
    const sentenceCount = Math.floor(Math.random() * 4) + 4;
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence());
    }
    return sentences.join(' ');
  };

  const handleGenerate = () => {
    let result = '';
    if (type === 'words') {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
      }
      result = words.join(' ');
    } else if (type === 'sentences') {
      const sentences = [];
      for (let i = 0; i < count; i++) {
        sentences.push(generateSentence());
      }
      result = sentences.join(' ');
    } else {
      const paragraphs = [];
      for (let i = 0; i < count; i++) {
        paragraphs.push(generateParagraph());
      }
      result = paragraphs.join('\n\n');
    }
    setText(result);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Type className="w-3 h-3" /> Nombre
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <AlignLeft className="w-3 h-3" /> Type
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['paragraphs', 'sentences', 'words'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                    type === t ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t === 'paragraphs' ? 'Para' : t === 'sentences' ? 'Phrases' : 'Mots'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="h-14 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Générer
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-500" />
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Généré</label>
          </div>
          <button
            onClick={copyToClipboard}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              copied ? 'bg-emerald-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-lg shadow-slate-900/10'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié !' : 'Copier tout'}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 min-h-[300px] shadow-sm">
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
