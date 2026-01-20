import { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export function Base64Tool() {
  const [text, setText] = useState('');
  const [base64, setBase64] = useState('');

  const encode = (input: string) => {
    try {
      return btoa(unescape(encodeURIComponent(input)));
    } catch (e) {
      return 'Erreur d\'encodage';
    }
  };

  const decode = (input: string) => {
    try {
      return decodeURIComponent(escape(atob(input)));
    } catch (e) {
      return 'Erreur de décodage';
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    setBase64(encode(value));
  };

  const handleBase64Change = (value: string) => {
    setBase64(value);
    setText(decode(value));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Text Input */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-semibold text-lg">Texte</label>
            <button
              onClick={() => handleTextChange('')}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Effacer
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Entrez du texte à encoder..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <div className="mt-2 text-sm text-gray-600">
            {text.length} caractères
          </div>
        </div>

        {/* Base64 Output */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-semibold text-lg">Base64</label>
            <button
              onClick={() => handleBase64Change('')}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Effacer
            </button>
          </div>
          <textarea
            value={base64}
            onChange={(e) => handleBase64Change(e.target.value)}
            placeholder="Ou entrez du Base64 à décoder..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm break-all"
          />
          <div className="mt-2 text-sm text-gray-600">
            {base64.length} caractères
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setBase64(encode(text))}
          className="py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-5 h-5" />
          Encoder en Base64
        </button>
        <button
          onClick={() => setText(decode(base64))}
          className="py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-pink-700 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Décoder depuis Base64
        </button>
      </div>

      <div className="mt-6 bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
        <p className="font-semibold mb-2">À propos du Base64</p>
        <p>
          Le Base64 est un système d'encodage qui convertit des données binaires en texte ASCII.
          Il est couramment utilisé pour encoder des données dans les emails, les URLs, et les fichiers de configuration.
        </p>
      </div>
    </div>
  );
}
