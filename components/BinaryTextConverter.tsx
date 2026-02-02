import React, { useState } from 'react';
import { Copy, Check, Trash2, ArrowRightLeft, Type, Binary } from 'lucide-react';

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
      const cleanBinary = input.replace(/[^01]/g, ' ');
      const binaries = cleanBinary.split(/\s+/).filter((b) => b.length > 0);
      return binaries
        .map((bin) => String.fromCharCode(parseInt(bin, 2)))
        .join('');
    } catch (e) {
      return 'Erreur de conversion';
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

  const copyToClipboard = (val: string, type: 'text' | 'binary') => {
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
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Texte Clair</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(text, 'text')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'text' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {copied === 'text' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{' '}
                {copied === 'text' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={() => {
                  setText('');
                  setBinary('');
                }}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Entrez votre texte ici..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed dark:text-slate-300 resize-none"
          />
        </div>

        {/* Binary Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Binaire</label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(binary, 'binary')}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'binary' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {copied === 'binary' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{' '}
                {copied === 'binary' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <textarea
            value={binary}
            onChange={(e) => handleBinaryChange(e.target.value)}
            placeholder="Le résultat binaire apparaîtra ici..."
            className="w-full h-[400px] p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono text-sm leading-relaxed text-indigo-600 dark:text-indigo-400 break-all resize-none"
          />
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Comprendre le langage des machines</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-4">
            <h3 className="font-bold text-indigo-600 dark:text-indigo-400">Qu'est-ce que le binaire ?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Le système binaire est un système de numération en base 2, utilisant uniquement les chiffres <strong>0</strong> et <strong>1</strong>. En informatique, ces "bits" (BInary digiTs) représentent les deux états d'un composant électronique : allumé (1) ou éteint (0).
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-indigo-600 dark:text-indigo-400">Le rôle de l'ASCII et de l'UTF-8</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Pour que les humains puissent lire du texte, chaque caractère est associé à un nombre via des standards comme <strong>ASCII</strong> ou <strong>UTF-8</strong>. Par exemple, la lettre 'A' majuscule correspond au nombre 65, qui s'écrit <code>01000001</code> en binaire.
            </p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Pourquoi 8 bits ?</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Un groupe de 8 bits forme un <strong>octet</strong> (byte). Avec 8 bits, on peut représenter 256 valeurs différentes (2^8), ce qui était suffisant à l'origine pour encoder toutes les lettres de l'alphabet latin, les chiffres et les symboles de ponctuation. Aujourd'hui, l'UTF-8 utilise plusieurs octets pour représenter des milliers de caractères, incluant les emojis et les alphabets non-latins.
          </p>
        </div>
      </div>
    </div>
  );
}
