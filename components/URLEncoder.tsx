import { useState } from 'react';
import { ArrowRight, ArrowLeft, Copy, Check } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function URLEncoder() {
  const [decoded, setDecoded] = useState('');
  const [encoded, setEncoded] = useState('');
  const [copied, setCopied] = useState<'decoded' | 'encoded' | null>(null);

  const copyToClipboard = (text: string, type: 'decoded' | 'encoded') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

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

  return (
    <div className="max-w-4xl mx-auto">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="decoded-url" className="font-semibold text-slate-700 dark:text-slate-200">URL/Texte décodé</label>
            <button
              onClick={() => copyToClipboard(decoded, 'decoded')}
              disabled={!decoded}
              className={`p-1.5 rounded-md transition-all ${copied === 'decoded' ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'} disabled:opacity-0`}
              aria-label="Copier le texte décodé"
              title="Copier"
            >
              {copied === 'decoded' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="decoded-url"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL..."
            className="w-full h-64 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm resize-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="encoded-url" className="font-semibold text-slate-700 dark:text-slate-200">URL/Texte encodé</label>
            <button
              onClick={() => copyToClipboard(encoded, 'encoded')}
              disabled={!encoded}
              className={`p-1.5 rounded-md transition-all ${copied === 'encoded' ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'} disabled:opacity-0`}
              aria-label="Copier le texte encodé"
              title="Copier"
            >
              {copied === 'encoded' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            id="encoded-url"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé..."
            className="w-full h-64 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm break-all resize-none"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setEncoded(encode(decoded))}
          className="py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
        >
          <ArrowRight className="w-5 h-5" />
          Encoder l'URL
        </button>
        <button
          onClick={() => setDecoded(decode(encoded))}
          className="py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <ArrowLeft className="w-5 h-5" />
          Décoder l'URL
        </button>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
