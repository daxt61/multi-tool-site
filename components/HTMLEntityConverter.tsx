import { useState } from 'react';
import { Code, Copy, Check, Trash2, ArrowRightLeft, Type, Info } from 'lucide-react';

export function HTMLEntityConverter() {
  const [text, setText] = useState('');
  const [entities, setEntities] = useState('');
  const [copied, setCopied] = useState<'text' | 'entities' | null>(null);

  const encode = (str: string) => {
    return str.replace(/[\u00A0-\u9999<>&]/g, (i) => `&#${i.charCodeAt(0)};`);
  };

  const decode = (str: string) => {
    const parser = new DOMParser();
    const dom = parser.parseFromString(`<!doctype html><body>${str}`, 'text/html');
    return dom.body.textContent || '';
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
              <label htmlFor="text-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Texte</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(text, 'text')}
                disabled={!text}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'text'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'text' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => {setText(''); setEntities('');}}
                disabled={!text && !entities}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Entrez votre texte ici (ex: Hello & World)"
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Entities Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-500" />
              <label htmlFor="entities-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Entités HTML</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(entities, 'entities')}
                disabled={!entities}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'entities'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {copied === 'entities' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'entities' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            id="entities-input"
            value={entities}
            onChange={(e) => handleEntitiesChange(e.target.value)}
            placeholder="Les entités apparaîtront ici (ex: &#72;&#101;...)"
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 break-all resize-none"
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
            <Info className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-slate-900 dark:text-white">À propos des entités HTML</h4>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
          Les entités HTML sont utilisées pour afficher des caractères réservés en HTML (comme &lt; et &gt;)
          ou des caractères qui ne sont pas présents sur un clavier standard. Elles commencent par une esperluette (&amp;)
          et se terminent par un point-virgule (;).
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <code className="text-indigo-500 font-bold">&amp;lt;</code>
            <span className="text-xs text-slate-400 ml-2">signifie &lt;</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <code className="text-indigo-500 font-bold">&amp;gt;</code>
            <span className="text-xs text-slate-400 ml-2">signifie &gt;</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <code className="text-indigo-500 font-bold">&amp;amp;</code>
            <span className="text-xs text-slate-400 ml-2">signifie &amp;</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
            <code className="text-indigo-500 font-bold">&amp;quot;</code>
            <span className="text-xs text-slate-400 ml-2">signifie "</span>
          </div>
        </div>
      </div>
    </div>
  );
}
