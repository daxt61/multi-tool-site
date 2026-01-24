import React, { useState } from 'react';
import { Shield, Copy, Check, RefreshCw } from 'lucide-react';

export function HashGenerator() {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState('SHA-256');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const generateHash = async (text: string, algo: string) => {
    if (!text) {
      setOutput('');
      return;
    }
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest(algo, msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setOutput(hashHex);
  };

  const handleInput = (val: string) => {
    setInput(val);
    generateHash(val, algorithm);
  };

  const handleAlgoChange = (algo: string) => {
    setAlgorithm(algo);
    generateHash(input, algo);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Texte d'entrée
        </label>
        <textarea
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Entrez le texte à hacher..."
          className="w-full h-32 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].map((algo) => (
          <button
            key={algo}
            onClick={() => handleAlgoChange(algo)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              algorithm === algo
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {algo}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Résultat ({algorithm})
          </label>
          {output && (
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          )}
        </div>
        <div className="relative group">
          <div className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl break-all font-mono text-sm text-gray-800 dark:text-gray-200 min-h-[80px]">
            {output || <span className="text-gray-400">Le résultat apparaîtra ici...</span>}
          </div>
          {output && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Shield className="w-5 h-5 text-indigo-500/20" />
            </div>
          )}
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl">
        <p className="text-sm text-amber-800 dark:text-amber-400 flex gap-2">
          <Shield className="w-5 h-5 shrink-0" />
          Note : Le hachage est effectué localement dans votre navigateur. Aucune donnée n'est envoyée au serveur.
        </p>
      </div>
    </div>
  );
}
