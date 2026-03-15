import { useState } from 'react';
import { ArrowRight, ArrowLeft, Copy, Check, Trash2, Link as LinkIcon, Info } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-2" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Decoded Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="decoded-input" className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">URL/Texte décodé</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(decoded, 'decoded')}
                disabled={!decoded}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${copiedDecoded ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'} disabled:opacity-50`}
              >
                {copiedDecoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedDecoded ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={handleClear}
                disabled={!decoded && !encoded}
                className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            id="decoded-input"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed dark:text-slate-300 font-mono resize-none"
          />
        </div>

        {/* Encoded Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="encoded-input" className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">URL/Texte encodé</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(encoded, 'encoded')}
                disabled={!encoded}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${copiedEncoded ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'} disabled:opacity-50`}
              >
                {copiedEncoded ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedEncoded ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="encoded-input"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm leading-relaxed dark:text-slate-300 font-mono resize-none break-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setEncoded(encode(decoded))}
          className="h-16 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-5 h-5" />
          Encoder l'URL
        </button>
        <button
          onClick={() => setDecoded(decode(encoded))}
          className="h-16 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600 dark:border-indigo-500/50 rounded-2xl font-black text-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Décoder l'URL
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
            <LinkIcon className="w-5 h-5" />
          </div>
          <h4 className="font-bold dark:text-white text-sm">Pourquoi encoder ?</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            L'encodage URL remplace les caractères non sécurisés par un "%" suivi de deux chiffres hexadécimaux, garantissant que les URLs sont transmises correctement sur Internet.
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
            <Info className="w-5 h-5" />
          </div>
          <h4 className="font-bold dark:text-white text-sm">Caractères Réservés</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Certains caractères comme ?, &, =, / ont une signification spéciale dans une URL et doivent être encodés s'ils font partie des données.
          </p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-3">
          <AdPlaceholder size="medium" />
        </div>
      </div>
    </div>
  );
}
