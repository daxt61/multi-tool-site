import { useState, useCallback } from 'react';
import { ArrowRight, ArrowLeft, Copy, Check, Trash2, Type, Link as LinkIcon } from 'lucide-react';

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

  const handleCopy = useCallback((text: string, type: 'decoded' | 'encoded') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'decoded') {
      setCopiedDecoded(true);
      setTimeout(() => setCopiedDecoded(false), 2000);
    } else {
      setCopiedEncoded(true);
      setTimeout(() => setCopiedEncoded(false), 2000);
    }
  }, []);

  const clear = () => {
    setDecoded('');
    setEncoded('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-end">
        {(decoded || encoded) && (
          <button
            onClick={clear}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-all"
            aria-label="Tout effacer"
          >
            <Trash2 className="w-4 h-4" />
            Tout effacer
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <label htmlFor="decoded-input" className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Type className="w-4 h-4" /> URL / Texte décodé
            </label>
            {decoded && (
              <button
                onClick={() => handleCopy(decoded, 'decoded')}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-70 transition-all"
              >
                {copiedDecoded ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedDecoded ? 'Copié' : 'Copier'}
              </button>
            )}
          </div>
          <textarea
            id="decoded-input"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL à encoder..."
            className="w-full h-72 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-mono text-sm leading-relaxed resize-none shadow-inner"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <label htmlFor="encoded-input" className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> URL / Texte encodé
            </label>
            {encoded && (
              <button
                onClick={() => handleCopy(encoded, 'encoded')}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-70 transition-all"
              >
                {copiedEncoded ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedEncoded ? 'Copié' : 'Copier'}
              </button>
            )}
          </div>
          <textarea
            id="encoded-input"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé à décoder..."
            className="w-full h-72 p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 font-mono text-sm leading-relaxed resize-none shadow-inner break-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleDecodedChange(decoded)}
          className="group py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-[0.98]"
        >
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          Forcer l'Encodage
        </button>
        <button
          onClick={() => handleEncodedChange(encoded)}
          className="group py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl hover:border-indigo-500 transition-all font-bold flex items-center justify-center gap-3 shadow-sm active:scale-[0.98]"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Forcer le Décodage
        </button>
      </div>

      <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">À quoi ça sert ?</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          L'encodage d'URL convertit les caractères spéciaux en un format qui peut être transmis de manière sécurisée sur Internet.
          Par exemple, les espaces sont remplacés par <code>%20</code>. Cet outil utilise la fonction standard <code>encodeURIComponent</code> pour garantir une compatibilité maximale.
        </p>
      </div>
    </div>
  );
}
