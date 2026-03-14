import { useState } from 'react';
import { Copy, Check, Trash2, ArrowRight, ArrowLeft, Link as LinkIcon, Globe } from 'lucide-react';
import { AdPlaceholder } from './AdPlaceholder';

export function URLEncoder() {
  const [decoded, setDecoded] = useState('');
  const [encoded, setEncoded] = useState('');
  const [copied, setCopied] = useState<'decoded' | 'encoded' | null>(null);

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
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setDecoded('');
    setEncoded('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Décodé */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="url-decoded" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Globe className="w-3 h-3" /> Décodé (Standard)
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(decoded, 'decoded')}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${copied === 'decoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied === 'decoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 'decoded' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="url-decoded"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL standard..."
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono"
          />
        </div>

        {/* Encodé */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="url-encoded" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <LinkIcon className="w-3 h-3" /> Encodé (URL Safe)
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(encoded, 'encoded')}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${copied === 'encoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied === 'encoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 'encoded' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="url-encoded"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Entrez du texte encodé..."
            className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono break-all"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center pt-4">
        <button
          onClick={() => handleDecodedChange(decoded)}
          className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3"
        >
          <ArrowRight className="w-5 h-5" /> Encoder l'URL
        </button>
        <button
          onClick={() => handleEncodedChange(encoded)}
          className="px-10 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all active:scale-95 flex items-center gap-3"
        >
          <ArrowLeft className="w-5 h-5" /> Décoder l'URL
        </button>
        <button
          onClick={handleClear}
          aria-label="Effacer tout"
          className="px-8 py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-2xl font-black text-lg hover:bg-rose-100 transition-all active:scale-95 flex items-center gap-3"
        >
          <Trash2 className="w-5 h-5" /> Effacer tout
        </button>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
