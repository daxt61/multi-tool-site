import { useState } from 'react';
import { Copy, Check, Trash2, ArrowRightLeft, FileCode, Type } from 'lucide-react';

export function Base64Tool() {
  const [text, setText] = useState('');
  const [base64, setBase64] = useState('');
  const [copied, setCopied] = useState<'text' | 'base64' | null>(null);

  const encode = (input: string) => {
    try {
      if (!input) return '';
      return btoa(unescape(encodeURIComponent(input)));
    } catch (e) {
      return 'Erreur d\'encodage';
    }
  };

  const decode = (input: string) => {
    try {
      if (!input) return '';
      return decodeURIComponent(escape(atob(input)));
    } catch (e) {
      return 'Erreur de décodage';
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    setBase64(encode(value));
  };

  const handleBase64Change = (value: string) => {
    setBase64(value);
    setText(decode(value));
  };

  const copyToClipboard = (val: string, type: 'text' | 'base64') => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Text Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Clair</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(text, 'text')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'text' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'text' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => {setText(''); setBase64('');}}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Base64 Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Base64</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(base64, 'base64')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'base64' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied === 'base64' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'base64' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            value={base64}
            onChange={(e) => handleBase64Change(e.target.value)}
            placeholder="Le résultat Base64 apparaîtra ici..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 break-all resize-none"
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h4 className="font-bold text-slate-900 dark:text-white mb-4">À propos du Base64</h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Le Base64 est un schéma d'encodage binaire vers texte qui représente des données binaires dans un format de chaîne ASCII en les traduisant dans une représentation radix-64.
          C'est particulièrement utile pour transmettre des données qui pourraient être mal interprétées par certains protocoles (comme les caractères spéciaux dans les URLs ou les données binaires dans les e-mails).
        </p>
      </div>
    </div>
  );
}
