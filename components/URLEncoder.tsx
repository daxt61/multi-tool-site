import { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function URLEncoder() {
  const [decoded, setDecoded] = useState('');
  const [encoded, setEncoded] = useState('');

  const encode = (text: string) => {
    try {
      return encodeURIComponent(text);
    } catch {
      return 'Erreur d\'encodage';
    }
  };

  const decode = (text: string) => {
    try {
      return decodeURIComponent(text);
    } catch {
      return 'Erreur de décodage';
    }
  };

  const handleDecodedChange = (value: string) => {
    setDecoded(value);
    setEncoded(encode(value));
  };

  const handleEncodedChange = (value: string) => {
    setEncoded(value);
    setDecoded(decode(value));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-semibold text-lg">URL/Texte décodé</label>
          </div>
          <textarea
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-semibold text-lg">URL/Texte encodé</label>
          </div>
          <textarea
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm break-all"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setEncoded(encode(decoded))}
          className="py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-5 h-5" />
          Encoder l'URL
        </button>
        <button
          onClick={() => setDecoded(decode(encoded))}
          className="py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Décoder l'URL
        </button>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
