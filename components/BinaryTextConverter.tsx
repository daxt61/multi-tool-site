import { useState } from 'react';
import { ArrowDownUp, Copy, Check, Trash2 } from 'lucide-react';

export function BinaryTextConverter() {
  const [text, setText] = useState('');
  const [binary, setBinary] = useState('');
  const [copied, setCopied] = useState<'text' | 'binary' | null>(null);

  const textToBinary = (str: string) => {
    return str
      .split('')
      .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join(' ');
  };

  const binaryToText = (bin: string) => {
    try {
      return bin
        .split(/\s+/)
        .filter(b => b.length > 0)
        .map((b) => String.fromCharCode(parseInt(b, 2)))
        .join('');
    } catch (e) {
      return 'Erreur de décodage';
    }
  };

  const handleTextChange = (val: string) => {
    setText(val);
    setBinary(textToBinary(val));
  };

  const handleBinaryChange = (val: string) => {
    setBinary(val);
    setText(binaryToText(val));
  };

  const handleCopy = (content: string, type: 'text' | 'binary') => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setText('');
    setBinary('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end px-1">
        <button
          onClick={handleClear}
          className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Effacer tout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Text Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte</label>
            <button
              onClick={() => handleCopy(text, 'text')}
              className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied === 'text' ? 'text-emerald-500' : 'text-indigo-500'}`}
            >
              {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === 'text' ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg dark:text-slate-300 resize-none"
          />
        </div>

        {/* Binary Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Binaire</label>
            <button
              onClick={() => handleCopy(binary, 'binary')}
              className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied === 'binary' ? 'text-emerald-500' : 'text-indigo-500'}`}
            >
              {copied === 'binary' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied === 'binary' ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            value={binary}
            onChange={(e) => handleBinaryChange(e.target.value)}
            placeholder="01000001 01000010..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 p-6 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-white dark:bg-slate-800 text-indigo-600 rounded-xl shadow-sm">
          <ArrowDownUp className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-indigo-900 dark:text-indigo-300 font-bold">Conversion Temps Réel</p>
          <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed">
            Convertissez instantanément du texte en binaire (ASCII/UTF-8) et vice versa. Chaque caractère est représenté par un octet (8 bits) séparé par un espace.
          </p>
        </div>
      </div>
    </div>
  );
}
