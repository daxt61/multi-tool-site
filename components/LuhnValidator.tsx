import { useState, useMemo } from 'react';
import { ShieldCheck, ShieldAlert, Copy, Check, Trash2, Info, CreditCard, Smartphone } from 'lucide-react';

export function LuhnValidator() {
  const [number, setNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const cleanNumber = number.replace(/\s+/g, '');

  const isValid = useMemo(() => {
    if (!cleanNumber || !/^\d+$/.test(cleanNumber)) return null;

    let sum = 0;
    let shouldDouble = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber.charAt(i));

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  }, [cleanNumber]);

  const handleCopy = () => {
    if (!number) return;
    navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setNumber('');
    setCopied(false);
  };

  const getFormatType = (num: string) => {
    if (num.length === 15 && (num.startsWith('34') || num.startsWith('37'))) return 'American Express';
    if (num.length === 16 && (num.startsWith('4'))) return 'Visa';
    const prefix2 = parseInt(num.slice(0, 2));
    const prefix4 = parseInt(num.slice(0, 4));
    if (num.length === 16 && ((prefix2 >= 51 && prefix2 <= 55) || (prefix4 >= 2221 && prefix4 <= 2720))) return 'Mastercard';
    if (num.length === 15) return 'IMEI (15 chiffres)';
    if (num.length === 16) return 'Carte de Crédit (16 chiffres)';
    return null;
  };

  const formatType = getFormatType(cleanNumber);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Input Area */}
      <section className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Numéro à vérifier</h3>
            <p className="text-sm text-slate-500">Cartes bancaires, IMEI, Numéros SIREN...</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
            <button
              onClick={handleCopy}
              disabled={!number}
              className={`text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-30 ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'}`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>

        <div className="relative group">
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/[^\d\s]/g, ''))}
            placeholder="Ex: 4970 1012 3456 7890"
            className="w-full p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-3xl md:text-4xl font-black font-mono outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white tracking-widest placeholder:text-slate-200 dark:placeholder:text-slate-800"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
             {isValid === true && <ShieldCheck className="w-10 h-10 text-emerald-500 animate-in zoom-in duration-300" />}
             {isValid === false && <ShieldAlert className="w-10 h-10 text-rose-500 animate-in zoom-in duration-300" />}
          </div>
        </div>

        {cleanNumber && (
          <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
            {formatType && (
              <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-2">
                {formatType.includes('IMEI') ? <Smartphone className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                {formatType}
              </div>
            )}
            <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border ${
              isValid === true
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : isValid === false
                ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 text-slate-500'
            }`}>
              {isValid === true ? 'Valide selon l\'algorithme de Luhn' : isValid === false ? 'Invalide' : 'Format incorrect'}
            </div>
          </div>
        )}
      </section>

      {/* Info & Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Info className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">C'est quoi l'algorithme de Luhn ?</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-1">
            Aussi appelé formule "modulo 10", c'est une méthode de vérification de somme de contrôle simple utilisée pour valider divers numéros d'identification, comme les numéros de cartes bancaires, les codes IMEI de téléphones ou encore les numéros SIREN/SIRET.
          </p>
        </section>

        <section className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Sécurité et Confidentialité</h3>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-1">
            Toutes les vérifications sont effectuées localement dans votre navigateur. Aucun numéro saisi n'est envoyé ou stocké sur nos serveurs. Vous pouvez utiliser cet outil en toute sécurité, même hors ligne.
          </p>
        </section>
      </div>
    </div>
  );
}
