import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function CaseConverter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState('');

  const conversions = {
    'camelCase': (t: string) => {
      const words = t.toLowerCase().split(/[\s_-]+/);
      return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'PascalCase': (t: string) => {
      const words = t.toLowerCase().split(/[\s_-]+/);
      return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    },
    'snake_case': (t: string) => t.toLowerCase().replace(/[\s-]+/g, '_'),
    'SCREAMING_SNAKE_CASE': (t: string) => t.toUpperCase().replace(/[\s-]+/g, '_'),
    'kebab-case': (t: string) => t.toLowerCase().replace(/[\s_]+/g, '-'),
    'SCREAMING-KEBAB-CASE': (t: string) => t.toUpperCase().replace(/[\s_]+/g, '-'),
    'Title Case': (t: string) => t.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    'Sentence case': (t: string) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(),
    'UPPERCASE': (t: string) => t.toUpperCase(),
    'lowercase': (t: string) => t.toLowerCase(),
    'aLtErNaTiNg CaSe': (t: string) => t.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''),
    'iNVERSE cASE': (t: string) => t.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('')
  };

  const copyToClipboard = (converted: string, type: string) => {
    navigator.clipboard.writeText(converted);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <AdPlaceholder size="banner" className="mb-6" />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Entrez votre texte ici..."
        className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(conversions).map(([name, converter]) => {
          const converted = text ? converter(text) : '';
          return (
            <div key={name} className="bg-white border border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-gray-700">{name}</span>
                <button
                  onClick={() => copyToClipboard(converted, name)}
                  disabled={!text}
                  className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                  title="Copier"
                >
                  {copied === name ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
              <div className="bg-gray-50 p-3 rounded font-mono text-sm min-h-[3rem] break-all">
                {converted || <span className="text-gray-400">Résultat...</span>}
              </div>
            </div>
          );
        })}
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
