import { useState } from 'react';
import { Check, AlertCircle, Copy } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function JSONFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError('JSON invalide : ' + (e as Error).message);
      setOutput('');
    }
  };

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
    } catch (e) {
      setError('JSON invalide : ' + (e as Error).message);
      setOutput('');
    }
  };

  const validateJSON = () => {
    try {
      JSON.parse(input);
      setError('');
      return true;
    } catch (e) {
      setError('JSON invalide : ' + (e as Error).message);
      return false;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            JSON à formatter
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none font-mono text-sm"
            placeholder='{"key": "value"}'
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-gray-700">
              Résultat
            </label>
            {output && (
              <button
                onClick={copyToClipboard}
                className="text-blue-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copié !' : 'Copier'}
              </button>
            )}
          </div>
          <textarea
            value={output}
            readOnly
            className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none font-mono text-sm bg-gray-50"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {!error && output && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-500" />
          <span className="text-green-700">JSON valide !</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={formatJSON}
          className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
        >
          Formatter (Pretty)
        </button>
        <button
          onClick={minifyJSON}
          className="flex-1 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-semibold"
        >
          Minifier (Compact)
        </button>
        <button
          onClick={validateJSON}
          className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold"
        >
          Valider JSON
        </button>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
