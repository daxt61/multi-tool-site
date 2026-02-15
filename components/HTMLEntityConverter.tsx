import { useState } from 'react';
import { Code, Copy, Check, Trash2, ArrowRightLeft } from 'lucide-react';

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
    navigator.clipboard?.writeText(val);
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
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(text, 'text')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'text' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'text' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => {setText(''); setEntities('');}}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
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
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Entités HTML</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(entities, 'entities')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'entities' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
              >
                {copied === 'entities' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'entities' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            value={entities}
            onChange={(e) => handleEntitiesChange(e.target.value)}
            placeholder="Les entités apparaîtront ici (ex: &#72;&#101;...)"
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 break-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}
