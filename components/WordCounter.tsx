import { useState } from 'react';
import { Copy, Check, Trash2, Hash, Type, FileText, AlignLeft, Clock, MessageSquare } from 'lucide-react';

export function WordCounter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);

  const stats = {
    characters: text.length,
    words: text.trim() === '' ? 0 : text.trim().split(/\s+/).length,
    lines: text === '' ? 0 : text.split('\n').length,
    sentences: text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
    readingTime: Math.ceil((text.trim() === '' ? 0 : text.trim().split(/\s+/).length) / 200),
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Texte</label>
          <div className="flex gap-2">
            <button onClick={handleCopy} className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'Copié' : 'Copier'}
            </button>
            <button onClick={() => setText('')} className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Commencez à taper..."
          className="w-full h-80 p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: <Hash className="w-4 h-4" />, label: 'Caractères', value: stats.characters },
          { icon: <Type className="w-4 h-4" />, label: 'Mots', value: stats.words },
          { icon: <FileText className="w-4 h-4" />, label: 'Lignes', value: stats.lines },
          { icon: <AlignLeft className="w-4 h-4" />, label: 'Phrases', value: stats.sentences },
          { icon: <Clock className="w-4 h-4" />, label: 'Lecture', value: `${stats.readingTime}m` },
        ].map((stat) => (
          <div key={stat.label} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
            <div className="text-indigo-500 dark:text-indigo-400">{stat.icon}</div>
            <div className="text-2xl font-black font-mono tracking-tight dark:text-white">{stat.value}</div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setText(text.toUpperCase())}
          className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
        >
          MAJUSCULES
        </button>
        <button
          onClick={() => setText(text.toLowerCase())}
          className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
        >
          minuscules
        </button>
        <button
          onClick={() => setText(text.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))}
          className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
        >
          Capitaliser
        </button>
      </div>
    </div>
  );
}
