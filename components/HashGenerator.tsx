import { useState } from 'react';
import { Shield, Copy, Check, RefreshCcw } from 'lucide-react';

export function HashGenerator() {
  const [inputText, setInputText] = useState('');
  const [hashes, setHashes] = useState<{ [key: string]: string }>({
    'SHA-256': '',
    'SHA-512': '',
  });
  const [copied, setCopied] = useState<string | null>(null);

  const generateHashes = async (text: string) => {
    setInputText(text);
    if (!text) {
      setHashes({ 'SHA-256': '', 'SHA-512': '' });
      return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    const hashAlgorithms = ['SHA-256', 'SHA-512'];
    const newHashes: { [key: string]: string } = {};

    for (const algo of hashAlgorithms) {
      const hashBuffer = await crypto.subtle.digest(algo, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      newHashes[algo] = hashHex;
    }

    setHashes(newHashes);
  };

  const copyToClipboard = (text: string, algo: string) => {
    navigator.clipboard.writeText(text);
    setCopied(algo);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Texte à hasher
        </label>
        <textarea
          value={inputText}
          onChange={(e) => generateHashes(e.target.value)}
          placeholder="Entrez votre texte ici..."
          className="w-full h-32 p-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all dark:text-white"
        />
      </div>

      <div className="grid gap-6">
        {Object.entries(hashes).map(([algo, hash]) => (
          <div key={algo} className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold tracking-widest">
                {algo}
              </span>
              <button
                onClick={() => copyToClipboard(hash, algo)}
                disabled={!hash}
                className="flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                {copied === algo ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copier
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-sm break-all bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300">
              {hash || 'En attente de texte...'}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl flex items-start gap-4 border border-blue-100 dark:border-blue-900/30">
        <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-bold mb-1">Note sur la sécurité</p>
          Le hashage est effectué localement dans votre navigateur. Votre texte n'est jamais envoyé à un serveur.
        </div>
      </div>
    </div>
  );
}
