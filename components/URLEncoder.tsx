import { useState } from 'react';
import { ArrowRight, ArrowLeft, Copy, Check, Trash2, Link as LinkIcon, Globe } from 'lucide-react';
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

  const handleClear = () => {
    setDecoded('');
    setEncoded('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <AdPlaceholder size="banner" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <Globe className="w-8 h-8" />
          </div>
        </div>

        {/* Section Décodée */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="decoded-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> URL / Texte Décodé
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(decoded, 'decoded')}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-2 ${copied === 'decoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {copied === 'decoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 'decoded' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={handleClear}
                aria-label="Effacer tout"
                className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            id="decoded-input"
            value={decoded}
            onChange={(e) => handleDecodedChange(e.target.value)}
            placeholder="Entrez votre URL ou texte ici..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Section Encodée */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="encoded-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> URL / Texte Encodé
            </label>
            <button
              onClick={() => copyToClipboard(encoded, 'encoded')}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-2 ${copied === 'encoded' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              {copied === 'encoded' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === 'encoded' ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            id="encoded-input"
            value={encoded}
            onChange={(e) => handleEncodedChange(e.target.value)}
            placeholder="Le texte encodé apparaîtra ici..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none break-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => handleDecodedChange(decoded)}
          className="group py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          Encoder maintenant
        </button>
        <button
          onClick={() => handleEncodedChange(encoded)}
          className="group py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-lg hover:opacity-90 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3"
        >
          <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          Décoder maintenant
        </button>
      </div>

      <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-indigo-500" /> Pourquoi encoder une URL ?
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            L'encodage d'URL (ou Percent-encoding) remplace les caractères non-ASCII par un format qui peut être transmis sur Internet. C'est essentiel pour les paramètres de recherche, les noms de fichiers et les chemins d'URL contenant des caractères spéciaux ou des espaces.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-emerald-500" /> Sécurisé & Privé
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Toutes les opérations d'encodage et de décodage sont effectuées localement dans votre navigateur à l'aide de fonctions JavaScript natives. Aucune donnée n'est envoyée à nos serveurs, garantissant une confidentialité totale pour vos URLs et données sensibles.
          </p>
        </div>
      </div>

      <AdPlaceholder size="medium" />
    </div>
  );
}
