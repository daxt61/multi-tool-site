import { useState, useCallback, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Trash2, Copy, Check, Info, LinkIcon, Code, AlertCircle } from 'lucide-react';

const MAX_LENGTH = 100000;

export function URLEncoder({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [decoded, setDecoded] = useState(initialData?.decoded || '');
  const [encoded, setEncoded] = useState(initialData?.encoded || '');
  const [copiedDecoded, setCopiedDecoded] = useState(false);
  const [copiedEncoded, setCopiedEncoded] = useState(false);

  useEffect(() => {
    onStateChange?.({ decoded, encoded });
  }, [decoded, encoded]);

  // Derived error state for better maintainability and robustness
  // This ensures that the error is shown if EITHER field exceeds the limit.
  const error = (decoded.length > MAX_LENGTH || encoded.length > MAX_LENGTH)
    ? `L'entrée est trop longue. Limite de ${MAX_LENGTH.toLocaleString()} caractères.`
    : null;

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
    // Sentinel: skip expensive computation if input exceeds limit to prevent DoS
    if (value.length <= MAX_LENGTH) {
      setEncoded(encode(value));
    }
  };

  const handleEncodedChange = (value: string) => {
    setEncoded(value);
    // Sentinel: skip expensive computation if input exceeds limit to prevent DoS
    if (value.length <= MAX_LENGTH) {
      setDecoded(decode(value));
    }
  };

  const handleCopyDecoded = useCallback(() => {
    if (!decoded) return;
    navigator.clipboard.writeText(decoded);
    setCopiedDecoded(true);
    setTimeout(() => setCopiedDecoded(false), 2000);
  }, [decoded]);

  const handleCopyEncoded = useCallback(() => {
    if (!encoded) return;
    navigator.clipboard.writeText(encoded);
    setCopiedEncoded(true);
    setTimeout(() => setCopiedEncoded(false), 2000);
  }, [encoded]);

  const handleClear = useCallback(() => {
    setDecoded('');
    setEncoded('');
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Décodé */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="url-decoded" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <LinkIcon className="w-3 h-3 text-indigo-500 transition-transform group-hover:scale-110" /> URL/Texte décodé
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCopyDecoded}
                disabled={!decoded}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedDecoded
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copiedDecoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedDecoded ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={handleClear}
                disabled={!decoded && !encoded}
                aria-label="Effacer tout"
                className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-transparent transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            id="url-decoded"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL à encoder..."
            className={`w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border ${decoded.length > MAX_LENGTH ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-[2.5rem] outline-none focus:ring-2 ${decoded.length > MAX_LENGTH ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all text-lg leading-relaxed dark:text-slate-300 font-mono resize-none`}
          />
        </div>

        {/* Encodé */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="url-encoded" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 cursor-pointer">
              <Code className="w-3 h-3 text-indigo-500 transition-transform group-hover:scale-110" /> URL/Texte encodé
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleCopyEncoded}
                disabled={!encoded}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                  copiedEncoded
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-transparent hover:bg-slate-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copiedEncoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedEncoded ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="url-encoded"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Entrez du texte encodé à décoder..."
            className={`w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border ${encoded.length > MAX_LENGTH ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'} rounded-[2.5rem] outline-none focus:ring-2 ${encoded.length > MAX_LENGTH ? 'focus:ring-rose-500/20' : 'focus:ring-indigo-500/20'} transition-all text-lg leading-relaxed dark:text-slate-300 font-mono resize-none break-all`}
          />
        </div>
      </div>

      <div className="flex justify-center gap-6">
        <div className="hidden md:flex flex-col items-center gap-2 text-slate-300">
          <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
          <ArrowRight className="w-6 h-6 transition-transform hover:scale-110" />
          <ArrowLeft className="w-6 h-6 transition-transform hover:scale-110" />
          <div className="w-px h-12 bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      {/* Educational Content */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Pourquoi encoder ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'encodage d'URL (URL encoding) permet d'inclure des caractères spéciaux dans les adresses web sans corrompre le fonctionnement du navigateur.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-indigo-500" /> Live Update
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La conversion se fait en temps réel. Dès que vous modifiez l'un des deux champs, l'autre se met à jour automatiquement.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-indigo-500" /> Caractères spéciaux
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'outil gère parfaitement les caractères accentués, les espaces et les symboles comme ?, &, # ou %.
          </p>
        </div>
      </div>
    </div>
  );
}
