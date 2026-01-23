import { useState } from 'react';

export function TextFormatter() {
  const [text, setText] = useState('');

  const formatters = [
    {
      name: 'MAJUSCULES',
      action: (t: string) => t.toUpperCase()
    },
    {
      name: 'minuscules',
      action: (t: string) => t.toLowerCase()
    },
    {
      name: 'Capitaliser Chaque Mot',
      action: (t: string) => t.replace(/\b\w+/g, (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
    },
    {
      name: 'Première lettre en majuscule',
      action: (t: string) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
    },
    {
      name: 'iNVERSER lA cASSE',
      action: (t: string) => t.split('').map(char => 
        char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
      ).join('')
    },
    {
      name: 'Supprimer espaces',
      action: (t: string) => t.replace(/\s+/g, '')
    },
    {
      name: 'Supprimer espaces multiples',
      action: (t: string) => t.replace(/\s+/g, ' ').trim()
    },
    {
      name: 'Inverser le texte',
      action: (t: string) => t.split('').reverse().join('')
    },
    {
      name: 'camelCase',
      action: (t: string) => {
        const words = t.toLowerCase().split(/\s+/);
        return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      }
    },
    {
      name: 'snake_case',
      action: (t: string) => t.toLowerCase().replace(/\s+/g, '_')
    },
    {
      name: 'kebab-case',
      action: (t: string) => t.toLowerCase().replace(/\s+/g, '-')
    },
    {
      name: 'SCREAMING_SNAKE_CASE',
      action: (t: string) => t.toUpperCase().replace(/\s+/g, '_')
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Tapez ou collez votre texte ici..."
        className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {formatters.map((formatter, index) => (
          <button
            key={index}
            onClick={() => setText(formatter.action(text))}
            className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all font-semibold text-sm"
          >
            {formatter.name}
          </button>
        ))}
      </div>

      <button
        onClick={() => setText('')}
        className="w-full mt-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
      >
        Effacer tout
      </button>
    </div>
  );
}
