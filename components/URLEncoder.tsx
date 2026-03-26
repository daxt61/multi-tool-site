import { useState } from 'react';
import { Copy, Check, Trash2, Link, FileText } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

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

  const handleCopy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleClear = () => {
    setDecoded('');
    setEncoded('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Decoded */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <label htmlFor="decoded-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte / URL Décodé</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(decoded, setCopiedDecoded)}
                disabled={!decoded}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copiedDecoded ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copiedDecoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedDecoded ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={handleClear}
                disabled={!decoded && !encoded}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono"
          />
        </div>

        {/* Encoded */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Link className="w-4 h-4 text-indigo-500" />
              <label htmlFor="encoded-input" className="text-xs font-black uppercase tracking-widest text-slate-400">Texte / URL Encodé</label>
            </div>
            <button
              onClick={() => handleCopy(encoded, setCopiedEncoded)}
              disabled={!encoded}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copiedEncoded ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copiedEncoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedEncoded ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            id="encoded-input"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Entrez du texte encodé à décoder..."
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono break-all"
          />
        </div>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-8 rounded-[2rem] flex items-start gap-6 mt-12">
        <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
          <Link className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white text-lg">À quoi sert l'encodage d'URL ?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'encodage d'URL (ou Percent-encoding) remplace les caractères non autorisés dans une URL par un "%" suivi de leur équivalent hexadécimal. Cela garantit que l'URL est correctement interprétée par tous les navigateurs et serveurs web, notamment pour les caractères spéciaux comme les espaces, les accents ou les symboles de ponctuation.
          </p>
        </div>
      </div>
    </div>
  );
}
