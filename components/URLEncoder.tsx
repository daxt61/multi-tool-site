import { useState } from 'react';
import { ArrowRight, ArrowLeft, Link2, Trash2, Copy, Check, FileText } from 'lucide-react';

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

  const handleClear = () => {
    setDecoded('');
    setEncoded('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Decoded Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">URL / Texte Décodé</label>
            </div>
            <div className="flex gap-2">
               <button
                onClick={() => handleCopy(decoded, 'decoded')}
                disabled={!decoded}
                className={`p-2 rounded-xl transition-all ${copied === 'decoded' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 disabled:opacity-50'}`}
              >
                {copied === 'decoded' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleClear}
                className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL à encoder..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Encoded Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">URL / Texte Encodé</label>
            </div>
            <button
                onClick={() => handleCopy(encoded, 'encoded')}
                disabled={!encoded}
                className={`p-2 rounded-xl transition-all ${copied === 'encoded' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 disabled:opacity-50'}`}
              >
                {copied === 'encoded' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
          </div>
          <textarea
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé à décoder..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => handleDecodedChange(decoded)}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <ArrowRight className="w-5 h-5" /> Encoder
        </button>
        <button
          onClick={() => handleEncodedChange(encoded)}
          className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Décoder
        </button>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-bold text-slate-900 dark:text-white mb-2">À quoi ça sert ?</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          L'encodage URL (percent-encoding) remplace les caractères non autorisés dans une URL par un signe "%" suivi de deux chiffres hexadécimaux. C'est essentiel pour transmettre des données dans les paramètres de requête d'une URL en toute sécurité.
        </p>
      </div>
    </div>
  );
}
