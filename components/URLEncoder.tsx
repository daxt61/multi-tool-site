import { useState, lazy, Suspense } from 'react';
import { ArrowRight, ArrowLeft, Copy, Check, Trash2, Link as LinkIcon, Info } from 'lucide-react';

const AdPlaceholder = lazy(() => import("./AdPlaceholder").then(m => ({ default: m.AdPlaceholder })));

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
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'decoded') {
      setCopiedDecoded(true);
      setTimeout(() => setCopiedDecoded(false), 2000);
    } else {
      setCopiedEncoded(true);
      setTimeout(() => setCopiedEncoded(false), 2000);
    }
  };

  const handleClear = () => {
    setDecoded('');
    setEncoded('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Suspense fallback={null}>
        <AdPlaceholder size="banner" className="mb-6" />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Decoded Section */}
        <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 flex flex-col">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">URL / Texte décodé</h3>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleCopy(decoded, 'decoded')}
                disabled={!decoded}
                className={`text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-30 ${copiedDecoded ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
              >
                {copiedDecoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedDecoded ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL..."
            className="w-full h-64 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-mono text-sm dark:text-slate-300"
          />
        </section>

        {/* Encoded Section */}
        <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6 flex flex-col">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">URL / Texte encodé</h3>
            </div>
            <button
              onClick={() => handleCopy(encoded, 'encoded')}
              disabled={!encoded}
              className={`text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-30 ${copiedEncoded ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
            >
              {copiedEncoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedEncoded ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé..."
            className="w-full h-64 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none font-mono text-sm dark:text-slate-300 break-all"
          />
        </section>
      </div>

      <div className="flex justify-center">
        <button
          onClick={handleClear}
          disabled={!decoded && !encoded}
          className="px-8 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-slate-500 hover:border-rose-500 hover:text-rose-500 transition-all flex items-center gap-2 disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
        >
          <Trash2 className="w-5 h-5" /> Effacer tout
        </button>
      </div>

      {/* Info Section */}
      <Suspense fallback={null}>
        <AdPlaceholder size="medium" className="mt-6" />
      </Suspense>

      <section className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Info className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">À quoi ça sert ?</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-1">
          L'encodage d'URL (ou percent-encoding) convertit les caractères spéciaux d'une URL en un format qui peut être transmis de manière sûre sur Internet. C'est essentiel pour inclure des espaces ou des caractères non-ASCII dans les paramètres de recherche.
        </p>
      </section>
    </div>
  );
}
