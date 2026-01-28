import { useState } from 'react';
import { Binary, Copy, Check, Trash2, ArrowLeftRight } from 'lucide-react';

export function BinaryTextConverter() {
  const [text, setText] = useState('');
  const [binary, setBinary] = useState('');
  const [copied, setCopied] = useState<'text' | 'binary' | null>(null);

  const textToBinary = (str: string) => {
    return str.split('').map(char => {
      const b = char.charCodeAt(0).toString(2);
      return '00000000'.slice(b.length) + b;
    }).join(' ');
  };

  const binaryToText = (bin: string) => {
    try {
      return bin.trim().split(/\s+/).map(b => {
        return String.fromCharCode(parseInt(b, 2));
      }).join('');
    } catch (e) {
      return '';
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" />
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
                onClick={() => handleCopy(text, 'text')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'text' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
                aria-label="Copier le texte"
              >
                {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'text' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={handleClear}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
                aria-label="Effacer tout"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Tapez votre texte ici..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-lg leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Binary Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Binaire</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(binary, 'binary')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied === 'binary' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}
                aria-label="Copier le binaire"
              >
                {copied === 'binary' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'binary' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            value={binary}
            onChange={(e) => handleBinaryChange(e.target.value)}
            placeholder="01001000 01100101 01101100 01101100 01101111"
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-sm">
          <Binary className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-1">À propos de cet outil</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Ce convertisseur transforme votre texte en code binaire (base 2) en utilisant le codage ASCII/UTF-8. Chaque caractère est représenté par un octet (8 bits).
          </p>
        </div>
      </div>
    </div>
  );
}
