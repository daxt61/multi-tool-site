import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function WordCounter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words: text.trim() === '' ? 0 : text.trim().split(/\s+/).length,
    lines: text === '' ? 0 : text.split('\n').length,
    sentences: text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
    paragraphs: text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length,
    readingTime: Math.ceil((text.trim() === '' ? 0 : text.trim().split(/\s+/).length) / 200), // Average reading speed: 200 words/min
    speakingTime: Math.ceil((text.trim() === '' ? 0 : text.trim().split(/\s+/).length) / 130) // Average speaking speed: 130 words/min
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tapez ou collez votre texte ici..."
        className="w-full h-64 p-4 border border-gray-300 dark:border-gray-700 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.characters}</div>
          <div className="text-sm opacity-90">Caractères</div>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.charactersNoSpaces}</div>
          <div className="text-sm opacity-90">Sans espaces</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.words}</div>
          <div className="text-sm opacity-90">Mots</div>
        </div>
        
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.lines}</div>
          <div className="text-sm opacity-90">Lignes</div>
        </div>
        
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.sentences}</div>
          <div className="text-sm opacity-90">Phrases</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.paragraphs}</div>
          <div className="text-sm opacity-90">Paragraphes</div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.readingTime} min</div>
          <div className="text-sm opacity-90">Lecture</div>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-orange-500 text-white p-6 rounded-lg">
          <div className="text-3xl font-bold">{stats.speakingTime} min</div>
          <div className="text-sm opacity-90">Parole</div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => setText(text.toUpperCase())}
          className="flex-1 min-w-[120px] py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold transition-colors"
        >
          MAJUSCULES
        </button>
        <button
          onClick={() => setText(text.toLowerCase())}
          className="flex-1 min-w-[120px] py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold transition-colors"
        >
          minuscules
        </button>
        <button
          onClick={() => setText(text.replace(/\b\w+/g, (word) =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ))}
          className="flex-1 min-w-[120px] py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-semibold transition-colors"
        >
          Capitaliser
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 min-w-[120px] py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
        <button
          onClick={() => setText('')}
          className="py-3 px-6 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
        >
          Effacer
        </button>
      </div>
    </div>
  );
}
