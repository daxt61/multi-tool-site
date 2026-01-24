import { useState } from 'react';
import { Split, ArrowRight } from 'lucide-react';

export function DiffChecker() {
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');

  const getDiff = () => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);
    const diff = [];

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';

      if (line1 === line2) {
        diff.push({ type: 'unchanged', text: line1 });
      } else {
        if (line1 && !line2) {
          diff.push({ type: 'removed', text: line1 });
        } else if (!line1 && line2) {
          diff.push({ type: 'added', text: line2 });
        } else {
          diff.push({ type: 'removed', text: line1 });
          diff.push({ type: 'added', text: line2 });
        }
      }
    }
    return diff;
  };

  const diffResult = getDiff();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Texte Original
          </label>
          <textarea
            value={text1}
            onChange={(e) => setText1(e.target.value)}
            placeholder="Entrez le texte original..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nouveau Texte
          </label>
          <textarea
            value={text2}
            onChange={(e) => setText2(e.target.value)}
            placeholder="Entrez le nouveau texte..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
          <Split className="w-5 h-5 text-gray-600" />
          <span className="font-semibold text-gray-700">Différences (Ligne par ligne)</span>
        </div>
        <div className="p-6 font-mono text-sm space-y-1 overflow-x-auto">
          {text1 === '' && text2 === '' ? (
            <p className="text-gray-400 text-center italic">Les résultats de la comparaison s'afficheront ici...</p>
          ) : (
            diffResult.map((item, index) => (
              <div
                key={index}
                className={`flex gap-4 px-2 py-1 rounded ${
                  item.type === 'added' ? 'bg-green-100 text-green-800' :
                  item.type === 'removed' ? 'bg-red-100 text-red-800' :
                  'text-gray-600'
                }`}
              >
                <span className="w-4 select-none opacity-50">
                  {item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' '}
                </span>
                <span className="whitespace-pre-wrap">{item.text || ' '}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          Légende
        </h3>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>Ajouté</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>Supprimé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-200 rounded"></div>
            <span>Inchangé</span>
          </div>
        </div>
      </div>
    </div>
  );
}
