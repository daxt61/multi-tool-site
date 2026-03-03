import { useState, useCallback } from 'react';
import { Copy, Check, Trash2, ArrowRight, ArrowLeft, Link as LinkIcon, Info, ShieldCheck } from 'lucide-react';

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

  const handleCopy = useCallback((text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleClearAll = () => {
    setDecoded('');
    setEncoded('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* URL/Texte décodé */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="url-decoded" className="text-xs font-black uppercase tracking-widest text-slate-400">URL/Texte décodé</label>
            <button
              onClick={() => handleCopy(decoded, setCopiedDecoded)}
              disabled={!decoded}
              className={`text-xs font-bold flex items-center gap-1 transition-colors ${copiedDecoded ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'} disabled:opacity-50`}
            >
              {copiedDecoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedDecoded ? 'Copié' : 'Copier'}
            </button>
          </div>
          <div className="relative">
            <textarea
              id="url-decoded"
              value={decoded}
              onChange={(e) => handleDecodedChange(e.target.value)}
              placeholder="Entrez du texte ou une URL à encoder..."
              className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
              aria-label="URL ou texte décodé"
            />
          </div>
        </div>

        {/* URL/Texte encodé */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="url-encoded" className="text-xs font-black uppercase tracking-widest text-slate-400">URL/Texte encodé</label>
            <button
              onClick={() => handleCopy(encoded, setCopiedEncoded)}
              disabled={!encoded}
              className={`text-xs font-bold flex items-center gap-1 transition-colors ${copiedEncoded ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'} disabled:opacity-50`}
            >
              {copiedEncoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedEncoded ? 'Copié' : 'Copier'}
            </button>
          </div>
          <div className="relative">
            <textarea
              id="url-encoded"
              value={encoded}
              onChange={(e) => handleEncodedChange(e.target.value)}
              placeholder="Ou collez du texte encodé pour le décoder..."
              className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 break-all resize-none"
              aria-label="URL ou texte encodé"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-center gap-4">
        <button
          onClick={handleClearAll}
          className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          Tout effacer
        </button>
        <div className="flex-1 max-w-sm hidden md:block"></div>
        <div className="bg-indigo-50 dark:bg-indigo-900/10 px-6 py-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 flex items-center gap-4">
          <ShieldCheck className="w-6 h-6 text-indigo-500 shrink-0" />
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 leading-snug">
            Vos données ne sont jamais envoyées à un serveur. L'encodage et le décodage se font localement dans votre navigateur.
          </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-indigo-500" /> Qu'est-ce que l'encodage URL ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'encodage URL (ou percent-encoding) convertit les caractères spéciaux dans une URL pour s'assurer qu'ils sont transmis correctement sur Internet.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-indigo-500" /> Utilisation en temps réel
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Tapez dans l'un des deux champs et l'autre se mettra à jour instantanément. Pratique pour préparer des paramètres de requête ou nettoyer des liens complexes.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> À savoir
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Cet outil utilise les fonctions standards de JavaScript <code>encodeURIComponent</code> et <code>decodeURIComponent</code> pour garantir la conformité aux standards du web.
          </p>
        </div>
      </div>
    </div>
  );
}
