import { useState, useId } from 'react';
import { Link as LinkIcon, Copy, Check, Trash2, Globe, FileText } from 'lucide-react';

export function URLEncoder() {
  const [decoded, setDecoded] = useState('');
  const [encoded, setEncoded] = useState('');
  const [copied, setCopied] = useState<'decoded' | 'encoded' | null>(null);

  const decodedId = useId();
  const encodedId = useId();

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
              <label htmlFor={decodedId} className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">URL/Texte décodé</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(decoded, 'decoded')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'decoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
                aria-label="Copier le texte décodé"
              >
                {copied === 'decoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'decoded' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={handleClear}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
                aria-label="Tout effacer"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            id={decodedId}
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez du texte ou une URL..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Encoded Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-500" />
              <label htmlFor={encodedId} className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">URL/Texte encodé</label>
            </div>
            <button
              onClick={() => handleCopy(encoded, 'encoded')}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'encoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              aria-label="Copier le texte encodé"
            >
              {copied === 'encoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'encoded' ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            id={encodedId}
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Ou entrez du texte encodé..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none break-all"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 pt-8 border-t border-slate-100 dark:border-slate-800">
        <div className="flex-1 space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-indigo-500" /> À quoi ça sert ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'encodage d'URL (ou Percent-encoding) remplace les caractères non autorisés par un "%" suivi de leur équivalent hexadécimal. C'est essentiel pour transmettre des données en toute sécurité dans les URLs, comme les paramètres de recherche ou les formulaires.
          </p>
        </div>
        <div className="flex-1 space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> Confidentialité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Comme tous nos outils, l'encodage et le décodage se font exclusivement dans votre navigateur. Aucune donnée n'est envoyée à nos serveurs.
          </p>
        </div>
      </div>
    </div>
  );
}
