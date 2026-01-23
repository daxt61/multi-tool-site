import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function HashGenerator() {
  const [text, setText] = useState('');
  const [hashes, setHashes] = useState({ sha256: '', sha512: '' });
  const [copied, setCopied] = useState<string | null>(null);

  const generateHashes = async (input: string) => {
    setText(input);
    if (!input) {
      setHashes({ sha256: '', sha512: '' });
      return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    const sha256Buffer = await crypto.subtle.digest('SHA-256', data);
    const sha512Buffer = await crypto.subtle.digest('SHA-512', data);

    const bufferToHex = (buffer: ArrayBuffer) => {
      return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    };

    setHashes({
      sha256: bufferToHex(sha256Buffer),
      sha512: bufferToHex(sha512Buffer)
    });
  };

  const copyToClipboard = (hash: string, type: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Texte à hasher
        </label>
        <textarea
          value={text}
          onChange={(e) => generateHashes(e.target.value)}
          placeholder="Entrez votre texte ici..."
          className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-gray-700">SHA-256</span>
            <button
              onClick={() => copyToClipboard(hashes.sha256, 'sha256')}
              disabled={!hashes.sha256}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {copied === 'sha256' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'sha256' ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm break-all border border-gray-200">
            {hashes.sha256 || <span className="text-gray-400">Le hash apparaîtra ici...</span>}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-gray-700">SHA-512</span>
            <button
              onClick={() => copyToClipboard(hashes.sha512, 'sha512')}
              disabled={!hashes.sha512}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {copied === 'sha512' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'sha512' ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm break-all border border-gray-200">
            {hashes.sha512 || <span className="text-gray-400">Le hash apparaîtra ici...</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
