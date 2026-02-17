import { useState } from 'react';
import { ShieldCheck, ShieldAlert, CreditCard, Info, Check, Copy } from 'lucide-react';

export function LuhnValidator() {
  const [number, setNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const validateLuhn = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return null;

    let sum = 0;
    let shouldDouble = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits.charAt(i));

      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      shouldDouble = !shouldDouble;
    }

    return sum % 10 === 0;
  };

  const isValid = validateLuhn(number);

  const getNumberType = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(digits)) return 'Mastercard';
    if (/^3[47]/.test(digits)) return 'American Express';
    if (digits.length === 15) return 'IMEI possible';
    return 'Inconnu';
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="cardNumber" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Numéro à vérifier</label>
          <button
            onClick={handleCopy}
            disabled={!number}
            className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600'} disabled:opacity-0`}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <CreditCard className="w-6 h-6" />
          </div>
          <input
            id="cardNumber"
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Entrez un numéro de carte, IMEI..."
            className="w-full pl-16 pr-6 py-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] text-2xl font-black font-mono outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
          />
        </div>

        {number && (
          <div className={`p-8 rounded-[2rem] border animate-in fade-in slide-in-from-top-4 duration-300 flex flex-col md:flex-row items-center gap-6 justify-between ${
            isValid
            ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20'
            : 'bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isValid ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              }`}>
                {isValid ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
              <div>
                <div className={`text-sm font-black uppercase tracking-widest ${
                  isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {isValid ? 'Valide' : 'Invalide'}
                </div>
                <div className="font-bold dark:text-white">
                  L'algorithme de Luhn {isValid ? 'confirme' : 'ne confirme pas'} la validité.
                </div>
              </div>
            </div>
            <div className="px-6 py-2 bg-white/50 dark:bg-black/20 rounded-xl text-sm font-bold border border-black/5 dark:border-white/5">
              Type détecté : <span className="text-indigo-600 dark:text-indigo-400">{getNumberType(number)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Qu'est-ce que l'algorithme de Luhn ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Également connu sous le nom de "formule modulo 10", c'est un test de somme de contrôle simple utilisé pour valider une variété de numéros d'identification, tels que les numéros de cartes de crédit et les numéros IMEI.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Sécurité
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Ce validateur s'exécute entièrement dans votre navigateur. Aucun numéro n'est envoyé sur un serveur. Nous vous recommandons néanmoins de ne jamais partager vos numéros de carte complets en ligne.
          </p>
        </div>
      </div>
    </div>
  );
}
