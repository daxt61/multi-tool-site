import { useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';

export function UUIDGenerator() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateUUID = () => {
    // Use the native and secure crypto.randomUUID if available
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    // Secure fallback for browsers not supporting randomUUID
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);

    // Set version 4 (13th bit is 4)
    array[6] = (array[6] & 0x0f) | 0x40;
    // Set variant (17th bit is 10)
    array[8] = (array[8] & 0x3f) | 0x80;

    const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  };

  const generateUUIDs = () => {
    const newUuids = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(generateUUID());
    }
    setUuids(newUuids);
    setCopiedIndex(null);
  };

  const copyToClipboard = (uuid: string, index: number) => {
    navigator.clipboard.writeText(uuid);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre d'UUIDs à générer
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
          <div className="pt-7">
            <button
              onClick={generateUUIDs}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Générer
            </button>
          </div>
        </div>

        {uuids.length > 1 && (
          <button
            onClick={copyAll}
            className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            {copiedIndex === -1 ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copiedIndex === -1 ? 'Tous copiés !' : 'Copier tous les UUIDs'}
          </button>
        )}
      </div>

      {uuids.length > 0 ? (
        <div className="space-y-3">
          {uuids.map((uuid, index) => (
            <div
              key={index}
              className="bg-white border border-gray-300 p-4 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <code className="font-mono text-gray-800">{uuid}</code>
              <button
                onClick={() => copyToClipboard(uuid, index)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copier"
              >
                {copiedIndex === index ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 p-12 rounded-lg text-center text-gray-500">
          Cliquez sur "Générer" pour créer des UUIDs
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">Qu'est-ce qu'un UUID ?</p>
        <p>
          Un UUID (Universally Unique Identifier) est un identifiant unique de 128 bits utilisé
          pour identifier des informations de manière unique dans les systèmes informatiques.
        </p>
      </div>
    </div>
  );
}
