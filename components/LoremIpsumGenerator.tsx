import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function LoremIpsumGenerator() {
  const [count, setCount] = useState(3);
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [copied, setCopied] = useState(false);

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
    return words.join(' ').charAt(0).toUpperCase() + words.join(' ').slice(1) + '.';
  };

  const generateParagraph = () => {
    const sentenceCount = Math.floor(Math.random() * 4) + 4;
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence());
    }
    return sentences.join(' ');
  };

  const generateText = () => {
    if (type === 'words') {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
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

  const text = generateText();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white"
            >
              <option value="paragraphs">Paragraphes</option>
              <option value="sentences">Phrases</option>
              <option value="words">Mots</option>
            </select>
          </div>
        </div>

        <button
          onClick={copyToClipboard}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copié !' : 'Copier le texte'}
        </button>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-6 max-h-96 overflow-y-auto">
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
}
