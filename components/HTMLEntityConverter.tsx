import { useState } from 'react';
import { Copy, Check, Trash2, Code, Type } from 'lucide-react';

export function HTMLEntityConverter() {
  const [text, setText] = useState('');
  const [entities, setEntities] = useState('');
  const [copied, setCopied] = useState<'text' | 'entities' | null>(null);

  const encodeHTML = (str: string) => {
    return str.replace(/[\u00A0-\u9999<>&]/g, (i) => {
      return '&#' + i.charCodeAt(0) + ';';
    });
  };

  const decodeHTML = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.documentElement.textContent || '';
  };

  const handleTextChange = (val: string) => {
    setText(val);
    setEntities(encodeHTML(val));
  };

  const handleEntitiesChange = (val: string) => {
    setEntities(val);
    setText(decodeHTML(val));
  };

  const copyToClipboard = (val: string, type: 'text' | 'entities') => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Raw Text */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Brut</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(text, 'text')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'text' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
                aria-label="Copier le texte brut"
              >
                {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'text' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => {setText(''); setEntities('');}}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
                aria-label="Effacer"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* HTML Entities */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Entités HTML</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(entities, 'entities')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'entities' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
                aria-label="Copier les entités HTML"
              >
                {copied === 'entities' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'entities' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            value={entities}
            onChange={(e) => handleEntitiesChange(e.target.value)}
            placeholder="&lt;p&gt;Exemple&lt;/p&gt;"
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 p-6 rounded-3xl">
        <h4 className="text-indigo-900 dark:text-indigo-300 font-bold mb-2 flex items-center gap-2">
          <Code className="w-4 h-4" /> À quoi ça sert ?
        </h4>
        <p className="text-sm text-indigo-700/80 dark:text-indigo-400/80 leading-relaxed">
          Convertissez des caractères spéciaux en entités HTML (ex: &lt; devient &amp;lt;) pour les afficher en toute sécurité dans le code HTML, ou décodez des entités existantes en texte lisible.
        </p>
      </div>
    </div>
  );
}
