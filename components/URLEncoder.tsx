import { useState } from 'react';
import { Copy, Check, Trash2, ArrowRightLeft, Link as LinkIcon, Type } from 'lucide-react';

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

  const copyToClipboard = (val: string, type: 'decoded' | 'encoded') => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setDecoded('');
    setEncoded('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Decoded Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label htmlFor="decoded-input" className="text-xs font-black uppercase tracking-widest text-slate-400">URL / Texte Décodé</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(decoded, 'decoded')}
                disabled={!decoded}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'decoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-50'}`}
              >
                {copied === 'decoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'decoded' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={handleClear}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
                aria-label="Effacer tout"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            id="decoded-input"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL à encoder..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        {/* Encoded Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-indigo-500" />
              <label htmlFor="encoded-input" className="text-xs font-black uppercase tracking-widest text-slate-400">URL / Texte Encodé</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(encoded, 'encoded')}
                disabled={!encoded}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'encoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-50'}`}
              >
                {copied === 'encoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'encoded' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="encoded-input"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé pour le décoder..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 break-all resize-none shadow-sm"
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4">À propos de l'encodage URL</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          L'encodage d'URL, également appelé encodage en pourcentage, est un mécanisme permettant d'encoder des informations dans un Uniform Resource Identifier (URI).
          Les caractères qui ne sont pas autorisés dans une URL sont remplacés par un '%' suivi de leur valeur hexadécimale.
          Par exemple, un espace devient <code>%20</code>.
        </p>
      </div>
    </div>
  );
}
