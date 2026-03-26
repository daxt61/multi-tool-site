import React, { useState } from 'react';
import { Copy, Check, Trash2, Link as LinkIcon } from 'lucide-react';

export function URLEncoder() {
  const [decoded, setDecoded] = useState('');
  const [encoded, setEncoded] = useState('');
  const [copiedDecoded, setCopiedDecoded] = useState(false);
  const [copiedEncoded, setCopiedEncoded] = useState(false);

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

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const clear = () => {
    setDecoded('');
    setEncoded('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="url-decoded" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <LinkIcon className="w-3 h-3" /> URL / Texte décodé
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(decoded, setCopiedDecoded)}
                disabled={!decoded}
                className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all disabled:opacity-50"
                aria-label="Copier le texte décodé"
              >
                {copiedDecoded ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={clear}
                disabled={!decoded && !encoded}
                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
                aria-label="Tout effacer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            id="url-decoded"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL à encoder..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="url-encoded" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <LinkIcon className="w-3 h-3" /> URL / Texte encodé
            </label>
            <button
              onClick={() => copyToClipboard(encoded, setCopiedEncoded)}
              disabled={!encoded}
              className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all disabled:opacity-50"
              aria-label="Copier le texte encodé"
            >
              {copiedEncoded ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="url-encoded"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé à décoder..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] font-mono text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white resize-none break-all"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20">
        <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4">À quoi ça sert ?</h3>
        <p className="text-indigo-900/70 dark:text-indigo-300/70 leading-relaxed text-sm">
          L'encodage d'URL (ou Percent-encoding) est utilisé pour placer des caractères spéciaux dans une URL de manière sécurisée. Les caractères réservés comme les espaces, les accents ou les symboles de ponctuation sont convertis en séquences commençant par <code>%</code> suivies de leur code hexadécimal.
        </p>
      </div>
    </div>
  );
}
