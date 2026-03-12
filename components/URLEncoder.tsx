import { useState } from 'react';
import { Copy, Check, Trash2, Link as LinkIcon, Unlock, Lock } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function URLEncoder() {
  const [decoded, setDecoded] = useState('');
  const [encoded, setEncoded] = useState('');
  const [copiedField, setCopiedField] = useState<'decoded' | 'encoded' | null>(null);

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

  const copyToClipboard = (text: string, field: 'decoded' | 'encoded') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const clearAll = () => {
    setDecoded('');
    setEncoded('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6 opacity-50" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Decoded Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="url-decoded" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Unlock className="w-3 h-3 text-indigo-500" /> URL/Texte décodé
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(decoded, 'decoded')}
                disabled={!decoded}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copiedField === 'decoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'} disabled:opacity-50`}
              >
                {copiedField === 'decoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedField === 'decoded' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="url-decoded"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL à encoder..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-base leading-relaxed dark:text-slate-300 font-mono resize-none"
          />
        </div>

        {/* Encoded Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="url-encoded" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Lock className="w-3 h-3 text-indigo-500" /> URL/Texte encodé
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(encoded, 'encoded')}
                disabled={!encoded}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copiedField === 'encoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'} disabled:opacity-50`}
              >
                {copiedField === 'encoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedField === 'encoded' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="url-encoded"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé à décoder..."
            className="w-full h-80 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-base leading-relaxed dark:text-slate-300 font-mono break-all resize-none"
          />
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={clearAll}
          disabled={!decoded && !encoded}
          className="flex items-center gap-2 px-8 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-2xl font-bold transition-all disabled:opacity-50"
          aria-label="Effacer tout"
        >
          <Trash2 className="w-5 h-5" />
          Effacer tout
        </button>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-indigo-500" /> Pourquoi encoder ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'encodage d'URL convertit les caractères spéciaux en un format qui peut être transmis de manière sécurisée sur Internet. C'est essentiel pour les paramètres de recherche, les noms de fichiers et les données transmises via des requêtes HTTP.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Unlock className="w-4 h-4 text-indigo-500" /> Confidentialité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Tout le traitement est effectué directement dans votre navigateur. Aucune donnée n'est envoyée à nos serveurs, garantissant une confidentialité totale pour vos URLs et vos données.
          </p>
        </div>
      </div>

      <AdPlaceholder size="medium" className="mt-6 opacity-50" />
    </div>
  );
}
