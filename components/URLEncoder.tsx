import { useState } from 'react';
import { ArrowRight, ArrowLeft, Copy, Check, Trash2 } from 'lucide-react';
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

  const copyToClipboard = (text: string, type: 'decoded' | 'encoded') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const clearAll = () => {
    setDecoded('');
    setEncoded('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="decoded-input" className="text-xs font-black uppercase tracking-widest text-slate-400">URL/Texte décodé</label>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(decoded, 'decoded')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'decoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied === 'decoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'decoded' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={clearAll}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
                aria-label="Effacer tout"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            id="decoded-input"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="encoded-input" className="text-xs font-black uppercase tracking-widest text-slate-400">URL/Texte encodé</label>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(encoded, 'encoded')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'encoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied === 'encoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'encoded' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="encoded-input"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 break-all resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setEncoded(encode(decoded))}
          className="py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <ArrowRight className="w-5 h-5" />
          Encoder l'URL
        </button>
        <button
          onClick={() => setDecoded(decode(encoded))}
          className="py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Décoder l'URL
        </button>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
