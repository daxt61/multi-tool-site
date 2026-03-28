import { useState, useMemo } from 'react';
import { Type, Copy, Check, RotateCcw, Languages, Info, FileText, Hash } from 'lucide-react';

type Language = 'fr' | 'en';

const units_fr = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const tens_fr = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingts', 'quatre-vingt-dix'];
const teens_fr = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

const units_en = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const tens_en = ['', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const teens_en = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

const convertToWords = (n: number, l: Language): string => {
  if (n === 0) return l === 'fr' ? 'zéro' : 'zero';
  if (n < 0) return (l === 'fr' ? 'moins ' : 'minus ') + convertToWords(Math.abs(n), l);

  const helper = (num: number, lang: Language): string => {
    let res = '';
    if (num >= 1000000000) {
      const bil = Math.floor(num / 1000000000);
      res += (bil > 1 ? helper(bil, lang) + ' ' : (lang === 'fr' ? 'un ' : 'one ')) + (lang === 'fr' ? (bil > 1 ? 'milliards' : 'milliard') : (bil > 1 ? 'billion' : 'billion')) + ' ' + helper(num % 1000000000, lang);
    } else if (num >= 1000000) {
      const mil = Math.floor(num / 1000000);
      res += (mil > 1 ? helper(mil, lang) + ' ' : (lang === 'fr' ? 'un ' : 'one ')) + (lang === 'fr' ? (mil > 1 ? 'millions' : 'million') : (mil > 1 ? 'million' : 'million')) + ' ' + helper(num % 1000000, lang);
    } else if (num >= 1000) {
      const th = Math.floor(num / 1000);
      if (lang === 'fr') {
        res += (th > 1 ? helper(th, lang) + ' ' : '') + 'mille ' + helper(num % 1000, lang);
      } else {
        res += helper(th, lang) + ' thousand ' + helper(num % 1000, lang);
      }
    } else if (num >= 100) {
      const h = Math.floor(num / 100);
      if (lang === 'fr') {
        res += (h > 1 ? helper(h, lang) + ' ' : '') + 'cent' + (h > 1 && num % 100 === 0 ? 's' : '') + ' ' + helper(num % 100, lang);
      } else {
        res += units_en[h] + ' hundred ' + helper(num % 100, lang);
      }
    } else if (num >= 20) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (lang === 'fr') {
        if (t === 7) res += 'soixante-' + (u === 1 ? 'et-onze' : teens_fr[u]);
        else if (t === 8) res += 'quatre-vingt' + (u === 0 ? 's' : '-' + units_fr[u]);
        else if (t === 9) res += 'quatre-vingt-' + teens_fr[u];
        else res += tens_fr[t] + (u === 1 ? '-et-un' : (u > 0 ? '-' + units_fr[u] : ''));
      } else {
        res += tens_en[t] + (u > 0 ? '-' + units_en[u] : '');
      }
    } else if (num >= 10) {
      res += lang === 'fr' ? teens_fr[num - 10] : teens_en[num - 10];
    } else {
      res += lang === 'fr' ? units_fr[num] : units_en[num];
    }
    return res.trim();
  };

  return helper(n, l);
};

export function NumberToWords() {
  const [number, setNumber] = useState<string>('123');
  const [lang, setLang] = useState<Language>('fr');
  const [copied, setCopied] = useState(false);

  const words = useMemo(() => {
    const n = parseInt(number);
    if (isNaN(n)) return '';
    if (n > 999999999999) return 'Nombre trop grand';
    return convertToWords(n, lang);
  }, [number, lang]);

  const handleClear = () => {
    setNumber('');
  };

  const handleCopy = () => {
    if (!words) return;
    navigator.clipboard.writeText(words);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="number-input" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Hash className="w-3 h-3" /> Nombre à convertir
            </label>
            <button
              onClick={handleClear}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Effacer
            </button>
          </div>
          <div className="relative">
            <input
              id="number-input"
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl text-3xl md:text-4xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
              placeholder="123"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 flex items-center gap-2">
              <Languages className="w-3 h-3" /> Langue de conversion
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLang('fr')}
                className={`py-4 rounded-2xl font-bold text-sm transition-all border ${
                  lang === 'fr'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                Français
              </button>
              <button
                onClick={() => setLang('en')}
                className={`py-4 rounded-2xl font-bold text-sm transition-all border ${
                  lang === 'en'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileText className="w-3 h-3" /> Résultat écrit
            </label>
            <button
              onClick={handleCopy}
              className={`text-xs font-bold px-3 py-1 rounded-full transition-all flex items-center gap-1 ${copied ? 'bg-emerald-50 text-emerald-600' : 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <div className="bg-slate-900 dark:bg-black p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-indigo-500/10 min-h-[250px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full -ml-16 -mt-16 blur-3xl"></div>
            <p className="text-xl md:text-2xl font-bold text-white text-center leading-relaxed">
              {words || '...'}
            </p>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Guide d'utilisation
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Saisissez simplement un nombre dans le champ de gauche. Le résultat s'affiche instantanément en toutes lettres dans la langue sélectionnée. Vous pouvez ensuite le copier en un clic.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Check className="w-4 h-4 text-indigo-500" /> Règles de Grammaire
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            En français, nous appliquons les règles de la réforme de l'orthographe de 1990 (usage systématique du trait d'union) et les accords du pluriel pour "cent", "vingt" et "milliard".
          </p>
        </div>
      </div>
    </div>
  );
}
