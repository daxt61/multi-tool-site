import { useState } from 'react';
import { ArrowRight, ArrowLeft, Copy, Check, Trash2, Link as LinkIcon, Type } from 'lucide-react';
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
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClearAll = () => {
    setDecoded('');
    setEncoded('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <AdPlaceholder size="banner" className="mb-6" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        {/* Decoded Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label htmlFor="decoded-textarea" className="text-xs font-black uppercase tracking-widest text-slate-400">URL/Texte décodé</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(decoded, 'decoded')}
                disabled={!decoded}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'decoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50'}`}
              >
                {copied === 'decoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 'decoded' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
                aria-label="Tout effacer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            id="decoded-textarea"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Encoded Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-indigo-500" />
              <label htmlFor="encoded-textarea" className="text-xs font-black uppercase tracking-widest text-slate-400">URL/Texte encodé</label>
            </div>
            <button
              onClick={() => handleCopy(encoded, 'encoded')}
              disabled={!encoded}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'encoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50'}`}
            >
              {copied === 'encoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === 'encoded' ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            id="encoded-textarea"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 break-all resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleDecodedChange(decoded)}
          className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <ArrowRight className="w-5 h-5" />
          Encoder l'URL
        </button>
        <button
          onClick={() => handleEncodedChange(encoded)}
          className="py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Décoder l'URL
        </button>
      </div>

      <AdPlaceholder size="medium" className="mt-6" />
    </div>
  );
}
