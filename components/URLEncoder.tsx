import { useState } from 'react';
import { Copy, Check, Trash2, Link as LinkIcon, Type } from 'lucide-react';

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

  const handleCopy = (text: string, type: 'decoded' | 'encoded') => {
    navigator.clipboard.writeText(text);
    if (type === 'decoded') {
      setCopiedDecoded(true);
      setTimeout(() => setCopiedDecoded(false), 2000);
    } else {
      setCopiedEncoded(true);
      setTimeout(() => setCopiedEncoded(false), 2000);
    }
  };

  const handleClear = (type: 'decoded' | 'encoded') => {
    if (type === 'decoded') {
      setDecoded('');
      setEncoded('');
    } else {
      setEncoded('');
      setDecoded('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Decoded Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label htmlFor="decoded-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">URL/Texte décodé</label>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleCopy(decoded, 'decoded')}
                disabled={!decoded}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${copiedDecoded ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                aria-label="Copier le texte décodé"
              >
                {copiedDecoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedDecoded ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => handleClear('decoded')}
                disabled={!decoded}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Effacer le texte décodé"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            id="decoded-input"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL à encoder..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm dark:text-white"
          />
        </div>

        {/* Encoded Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-indigo-500" />
              <label htmlFor="encoded-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">URL/Texte encodé</label>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleCopy(encoded, 'encoded')}
                disabled={!encoded}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${copiedEncoded ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                aria-label="Copier le texte encodé"
              >
                {copiedEncoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedEncoded ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => handleClear('encoded')}
                disabled={!encoded}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Effacer le texte encodé"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            id="encoded-input"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé à décoder..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm break-all dark:text-white"
          />
        </div>
      </div>

      <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <h3 className="text-2xl font-black mb-4">À quoi ça sert ?</h3>
        <p className="text-indigo-100 font-medium leading-relaxed max-w-2xl">
          L'encodage d'URL (ou percent-encoding) est un mécanisme permettant d'encoder des informations dans un URI.
          Les caractères qui ne sont pas autorisés dans une URL sont remplacés par un <code>%</code> suivi de leur équivalent hexadécimal.
          Cet outil effectue la conversion en temps réel pendant que vous tapez.
        </p>
      </div>
    </div>
  );
}
