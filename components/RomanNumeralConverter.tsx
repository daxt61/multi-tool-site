import React, { useState } from 'react';
import { Copy, Check, Trash2, ArrowRightLeft, Hash, Type, Info, AlertCircle } from 'lucide-react';

export function RomanNumeralConverter() {
  const [arabic, setArabic] = useState('2024');
  const [roman, setRoman] = useState('MMXXIV');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'arabic' | 'roman' | null>(null);

  const romanMap: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];

  const toRoman = (num: number): string => {
    if (num <= 0 || num > 3999) return '';
    let result = '';
    for (const [value, char] of romanMap) {
      while (num >= value) {
        result += char;
        num -= value;
      }
    }
    return result;
  };

  const fromRoman = (str: string): number => {
    str = str.toUpperCase().trim();
    if (!str) return 0;

    // Basic validation regex for standard Roman numerals
    const regex = /^(M{0,3})(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;
    if (!regex.test(str)) return -1;

    let result = 0;
    let i = 0;
    for (const [value, char] of romanMap) {
      while (str.startsWith(char, i)) {
        result += value;
        i += char.length;
      }
    }
    return i === str.length ? result : -1;
  };

  const handleArabicChange = (val: string) => {
    setArabic(val);
    setError(null);
    if (!val) {
      setRoman('');
      return;
    }
    const num = parseInt(val);
    if (isNaN(num)) {
      setError('Veuillez entrer un nombre valide');
      setRoman('');
    } else if (num <= 0 || num > 3999) {
      setError('Le nombre doit être entre 1 et 3999');
      setRoman('');
    } else {
      setRoman(toRoman(num));
    }
  };

  const handleRomanChange = (val: string) => {
    setRoman(val.toUpperCase());
    setError(null);
    if (!val) {
      setArabic('');
      return;
    }
    const num = fromRoman(val);
    if (num === -1) {
      setError('Chiffre romain invalide');
      setArabic('');
    } else {
      setArabic(num.toString());
    }
  };

  const copyToClipboard = (text: string, type: 'arabic' | 'roman') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleClear = () => {
    setArabic('');
    setRoman('');
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-800 p-4 rounded-2xl flex items-center gap-3 text-rose-600 dark:text-rose-400 font-bold animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative items-start">
        <div className="hidden md:flex absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 text-indigo-600">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
        </div>

        {/* Arabic Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="arabic-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-4 h-4 text-indigo-500" /> Nombre Arabe
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(arabic, 'arabic')}
                disabled={!arabic}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'arabic' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied === 'arabic' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'arabic' ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={handleClear}
                className="text-xs font-bold px-3 py-1 rounded-full text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <input
              id="arabic-input"
              type="number"
              value={arabic}
              onChange={(e) => handleArabicChange(e.target.value)}
              className="w-full bg-transparent text-5xl font-black font-mono outline-none dark:text-white text-center md:text-left"
              placeholder="2024"
            />
          </div>
        </div>

        {/* Roman Input */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="roman-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-500" /> Chiffre Romain
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(roman, 'roman')}
                disabled={!roman}
                className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${
                  copied === 'roman' ? 'bg-emerald-500 text-white' : 'text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                } disabled:opacity-50`}
              >
                {copied === 'roman' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied === 'roman' ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>
          <div className="p-8 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
            <input
              id="roman-input"
              type="text"
              value={roman}
              onChange={(e) => handleRomanChange(e.target.value)}
              className="w-full bg-transparent text-5xl font-black font-mono outline-none text-indigo-600 dark:text-indigo-400 text-center md:text-left uppercase"
              placeholder="MMXXIV"
            />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6 shadow-sm">
        <div className="flex items-center gap-3 px-1">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl">
            <Info className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-black dark:text-white">Règles des chiffres romains</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Le système de numération romaine est un système additif et soustractif utilisé dans la Rome antique. Il utilise sept lettres de l'alphabet latin :
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                ['I', '1'], ['V', '5'], ['X', '10'], ['L', '50'],
                ['C', '100'], ['D', '500'], ['M', '1000']
              ].map(([r, a]) => (
                <div key={r} className="bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-700">
                  <div className="font-black text-indigo-600 dark:text-indigo-400">{r}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{a}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Quelques règles :</h4>
            <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-4">
              <li>Une lettre ne peut être répétée plus de 3 fois consécutivement (ex: 4 s'écrit <span className="font-bold text-indigo-500">IV</span> et non <span className="line-through">IIII</span>).</li>
              <li>Placée à droite d'une lettre de valeur supérieure, on l'ajoute (ex: <span className="font-bold text-indigo-500">VI</span> = 6).</li>
              <li>Placée à gauche d'une lettre de valeur supérieure, on la soustrait (ex: <span className="font-bold text-indigo-500">IV</span> = 4).</li>
              <li>Le système standard s'arrête à 3999 (MMMCMXCIX).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
