import { useState } from 'react';
import {
  Copy, Check, Trash2, Search, Replace, CaseSensitive,
  Type, AlignLeft, Hash, Clock, Sliders
} from 'lucide-react';

export function TextFormatter() {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);

  const stats = {
    characters: text.length,
    words: text.trim() === '' ? 0 : text.trim().split(/\s+/).length,
    lines: text === '' ? 0 : text.split('\n').length,
    readingTime: Math.ceil((text.trim() === '' ? 0 : text.trim().split(/\s+/).length) / 200),
  };

  const formatters = [
    { name: 'MAJUSCULES', action: (t: string) => t.toUpperCase() },
    { name: 'minuscules', action: (t: string) => t.toLowerCase() },
    {
      name: 'Capitaliser Chaque Mot',
      action: (t: string) => t.replace(/\b\w+/g, (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
    },
    {
      name: 'Phrase',
      action: (t: string) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
    },
    {
      name: 'iNVERSER lA cASSE',
      action: (t: string) => t.split('').map(char => 
        char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
      ).join('')
    },
    { name: 'Supprimer Espaces', action: (t: string) => t.replace(/\s+/g, '') },
    { name: 'Nettoyer Espaces', action: (t: string) => t.replace(/\s+/g, ' ').trim() },
    { name: 'Inverser', action: (t: string) => t.split('').reverse().join('') },
    {
      name: 'camelCase',
      action: (t: string) => {
        const words = t.toLowerCase().split(/[\s_-]+/);
        if (words.length === 0) return '';
        return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      }
    },
    { name: 'snake_case', action: (t: string) => t.toLowerCase().replace(/[\s-]+/g, '_') },
    { name: 'kebab-case', action: (t: string) => t.toLowerCase().replace(/[\s_]+/g, '-') },
    { name: 'SCREAMING_SNAKE', action: (t: string) => t.toUpperCase().replace(/[\s-]+/g, '_') }
  ];

  const handleReplace = () => {
    if (!findText) return;
    const flags = isCaseSensitive ? 'g' : 'gi';
    const escapedFind = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedFind, flags);
    setText(text.replace(regex, replaceText));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Hash className="w-4 h-4" />, label: 'Caractères', value: stats.characters },
          { icon: <Type className="w-4 h-4" />, label: 'Mots', value: stats.words },
          { icon: <AlignLeft className="w-4 h-4" />, label: 'Lignes', value: stats.lines },
          { icon: <Clock className="w-4 h-4" />, label: 'Lecture', value: `~${stats.readingTime}m` },
        ].map((stat) => (
          <div key={stat.label} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4">
            <div className="text-indigo-500">{stat.icon}</div>
            <div>
              <div className="text-sm font-black font-mono dark:text-white">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Votre Texte</label>
            <div className="flex gap-2">
              <button onClick={handleCopy} className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${copied ? 'bg-emerald-500 text-white' : 'text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copié' : 'Copier'}
              </button>
              <button onClick={() => setText('')} className="text-xs font-bold px-4 py-2 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" /> Effacer
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tapez ou collez votre texte ici..."
            className="w-full h-[400px] p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 shadow-sm resize-none"
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Find and Replace */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 px-1 mb-2">
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chercher & Remplacer</h4>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Chercher..."
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Remplacer par..."
                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black transition-all border ${isCaseSensitive ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'}`}
                >
                  <CaseSensitive className="w-3.5 h-3.5" /> MAJ/min
                </button>
                <button
                  onClick={handleReplace}
                  className="flex-1 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <Replace className="w-3.5 h-3.5" /> Remplacer
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 space-y-4">
             <div className="flex items-center gap-2 px-1 mb-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-500" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actions Rapides</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {formatters.map((formatter, index) => (
                <button
                  key={index}
                  onClick={() => setText(formatter.action(text))}
                  className="w-full p-3 text-left bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-600 dark:text-slate-300 rounded-xl transition-all font-bold text-xs border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/30"
                >
                  {formatter.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
