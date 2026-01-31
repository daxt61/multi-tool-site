import { useState } from 'react';
import { ArrowRight, ArrowLeft, Trash2, Copy, Check, FileText, Binary } from 'lucide-react';

export function BinaryTextConverter() {
  const [text, setText] = useState('');
  const [binary, setBinary] = useState('');
  const [copied, setCopied] = useState<'text' | 'binary' | null>(null);

  const textToBinary = (input: string) => {
    return input
      .split('')
      .map((char) => {
        const bin = char.charCodeAt(0).toString(2);
        return bin.padStart(8, '0');
      })
      .join(' ');
  };

  const binaryToText = (input: string) => {
    try {
      return input
        .split(/\s+/)
        .map((bin) => {
          if (!bin) return '';
          return String.fromCharCode(parseInt(bin, 2));
        })
        .join('');
    } catch {
      return 'Erreur de décodage binaire';
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Text Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(text, 'text')}
                disabled={!text}
                className={`p-2 rounded-xl transition-all ${copied === 'text' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 disabled:opacity-50'}`}
              >
                {copied === 'text' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handleClear}
                className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Entrez du texte ici..."
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Binary Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Binaire</label>
            </div>
            <button
              onClick={() => handleCopy(binary, 'binary')}
              disabled={!binary}
              className={`p-2 rounded-xl transition-all ${copied === 'binary' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-indigo-500 bg-slate-50 dark:bg-slate-800 disabled:opacity-50'}`}
            >
              {copied === 'binary' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <textarea
            value={binary}
            onChange={(e) => handleBinaryChange(e.target.value)}
            placeholder="01001000 01100101 01101100 01101100 01101111"
            className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 resize-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => setBinary(textToBinary(text))}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
        >
          <ArrowRight className="w-5 h-5" /> Texte vers Binaire
        </button>
        <button
          onClick={() => setText(binaryToText(binary))}
          className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" /> Binaire vers Texte
        </button>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
        <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
          <Binary className="w-4 h-4" /> Informations
        </h4>
        <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
          Le binaire est le langage fondamental des ordinateurs, composé uniquement de 0 et de 1. Cet outil convertit chaque caractère en sa représentation binaire 8 bits (octet) basée sur l'encodage ASCII/UTF-8.
        </p>
      </div>
    </div>
  );
}
