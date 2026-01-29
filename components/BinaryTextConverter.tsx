import { useState } from 'react';
import { ArrowLeftRight, Copy, Check, Trash2, Binary, Type } from 'lucide-react';

export function BinaryTextConverter() {
  const [text, setText] = useState('');
  const [binary, setBinary] = useState('');
  const [copied, setCopied] = useState(false);

  const textToBinary = (str: string) => {
    return str
      .split('')
      .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
      .join(' ');
  };

  const binaryToText = (bin: string) => {
    try {
      return bin
        .split(/\s+/)
        .filter(b => b.length > 0)
        .map(b => String.fromCharCode(parseInt(b, 2)))
        .join('');
    } catch (e) {
      return 'Binaire invalide';
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    setBinary(textToBinary(value));
  };

  const handleBinaryChange = (value: string) => {
    setBinary(value);
    setText(binaryToText(value));
  };

  const handleCopy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setText('');
    setBinary('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Texte Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Type className="w-3 h-3" /> Texte
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300"
          />
        </div>

        {/* Binary Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Binary className="w-3 h-3" /> Binaire
            </label>
            <button
              onClick={() => handleCopy(binary)}
              className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <textarea
            value={binary}
            onChange={(e) => handleBinaryChange(e.target.value)}
            placeholder="01001000 01100101 01101100 01101100 01101111..."
            className="w-full h-64 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-lg leading-relaxed dark:text-slate-300 font-mono"
          />
        </div>
      </div>

      <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <ArrowLeftRight className="w-12 h-12 mb-6 opacity-50" />
        <h3 className="text-2xl font-black mb-4">Conversion Bidirectionnelle</h3>
        <p className="text-indigo-100 font-medium leading-relaxed max-w-lg">
          Convertissez instantanément du texte en binaire et vice-versa. Nous utilisons le standard UTF-8 pour assurer la compatibilité avec tous les caractères.
        </p>
      </div>
    </div>
  );
}
