import { useState } from 'react';
import { CreditCard, CheckCircle2, XCircle, Info, Copy, Check, Trash2 } from 'lucide-react';

export function LuhnValidator() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const isValidLuhn = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 2) return null;

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

  const status = isValidLuhn(input);

  const handleCopy = () => {
    if (!input) return;
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-8 md:p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="luhn-input" className="text-xs font-black uppercase tracking-widest text-slate-400">
              Numéro à vérifier
            </label>
            <div className="flex gap-4">
              <button
                onClick={handleCopy}
                disabled={!input}
                className={`text-xs font-bold flex items-center gap-1 transition-colors ${copied ? 'text-emerald-500' : 'text-indigo-500 hover:text-indigo-600 disabled:opacity-50'}`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Effacer
              </button>
            </div>
          </div>

          <div className="relative group">
            <input
              id="luhn-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: 4539 7154 2638 4920"
              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 text-2xl font-mono outline-none focus:border-indigo-500 transition-all dark:text-white"
              autoComplete="off"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <CreditCard className="w-6 h-6 text-slate-300" />
            </div>
          </div>
        </div>

        {input && (
          <div className={`p-6 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 ${
            status === true
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
              : status === false
              ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
          }`}>
            {status === true ? (
              <>
                <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
                <div>
                  <div className="font-black text-lg">Numéro Valide</div>
                  <div className="text-sm opacity-80">Ce numéro respecte l'algorithme de Luhn.</div>
                </div>
              </>
            ) : status === false ? (
              <>
                <XCircle className="w-8 h-8 flex-shrink-0" />
                <div>
                  <div className="font-black text-lg">Numéro Invalide</div>
                  <div className="text-sm opacity-80">La somme de contrôle est incorrecte. Vérifiez d'éventuelles erreurs de saisie.</div>
                </div>
              </>
            ) : (
              <>
                <Info className="w-8 h-8 flex-shrink-0" />
                <div>
                  <div className="font-black text-lg">Saisie trop courte</div>
                  <div className="text-sm opacity-80">Veuillez entrer au moins 2 chiffres pour la vérification.</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white space-y-4">
          <h3 className="text-xl font-black flex items-center gap-2">
            <Info className="w-5 h-5" /> Qu'est-ce que l'algorithme de Luhn ?
          </h3>
          <p className="text-indigo-100 text-sm leading-relaxed">
            Aussi connu sous le nom de formule "modulo 10", il s'agit d'une formule de somme de contrôle simple utilisée pour valider divers numéros d'identification, tels que les numéros de cartes de crédit (Visa, Mastercard), les numéros IMEI de téléphones mobiles, ou encore les numéros SIREN/SIRET en France.
          </p>
          <p className="text-indigo-100 text-sm leading-relaxed">
            Il n'est pas destiné à être une fonction de hachage cryptographiquement sécurisée, mais plutôt à protéger contre les erreurs de saisie accidentelles.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-indigo-500" /> Utilisations courantes
          </h3>
          <ul className="space-y-3">
            {[
              "Cartes de crédit (Visa, Mastercard, Amex)",
              "Numéros IMEI (Téléphones portables)",
              "Numéros SIREN & SIRET (Entreprises françaises)",
              "Numéros de sécurité sociale (certains pays)",
              "Numéros de comptes bancaires"
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
