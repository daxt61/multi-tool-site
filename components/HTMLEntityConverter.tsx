import { useState } from 'react';
import { Code, Copy, Check, Trash2, ArrowRightLeft } from 'lucide-react';

export function HTMLEntityConverter() {
  const [text, setText] = useState('');
  const [entities, setEntities] = useState('');
  const [copied, setCopied] = useState<'text' | 'entities' | null>(null);

  const encode = (str: string) => {
    // Hardened to escape common XSS characters including quotes
    return str.replace(/[\u00A0-\u9999<>&"']/g, (i) => `&#${i.charCodeAt(0)};`);
  };

  const decode = (str: string) => {
    try {
      const parser = new DOMParser();
      const dom = parser.parseFromString(`<!doctype html><body>${str}`, 'text/html');
      return dom.body.textContent || '';
    } catch {
      return 'Erreur de décodage';
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    setEntities(encode(val));
  };

  const handleEntitiesChange = (val: string) => {
    setEntities(val);
    setText(decode(val));
  };

  const copyToClipboard = (val: string, type: 'text' | 'entities') => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowRightLeft className="w-8 h-8" />
          </div>
        </div>

        {/* Section Texte */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Code className="w-4 h-4" /> Texte Simple
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(text, 'text')}
                className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${copied === 'text' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied === 'text' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => {setText(''); setEntities('');}}
                aria-label="Effacer tout"
                className="text-xs font-bold px-3 py-1.5 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Entrez votre texte ici (ex: <script> & 'Hello')"
            className="w-full h-96 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none shadow-sm"
          />
        </div>

        {/* Section Entités */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="entities-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Code className="w-4 h-4" /> Entités HTML
            </label>
            <button
              onClick={() => copyToClipboard(entities, 'entities')}
              className={`text-xs font-bold px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${copied === 'entities' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              {copied === 'entities' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === 'entities' ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            id="entities-input"
            value={entities}
            onChange={(e) => handleEntitiesChange(e.target.value)}
            placeholder="Les entités apparaîtront ici (ex: &#60;&#115;&#99;...)"
            className="w-full h-96 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 break-all resize-none shadow-sm"
          />
        </div>
      </div>

      <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
          <Check className="w-4 h-4" /> Pourquoi utiliser les entités HTML ?
        </h4>
        <p className="text-sm text-indigo-700 dark:text-indigo-400/80 leading-relaxed">
          Les entités HTML sont utilisées pour afficher des caractères réservés (comme &lt; et &gt;) qui pourraient être interprétés comme du code HTML par le navigateur. Elles permettent également d'afficher des caractères invisibles ou non-standard de manière sécurisée, prévenant ainsi certaines attaques XSS.
        </p>
      </div>
    </div>
  );
}
