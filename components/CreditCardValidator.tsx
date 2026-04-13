import { useState, useMemo } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Copy, Trash2, ShieldCheck, Info } from 'lucide-react';

type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'discover' | 'jcb' | 'diners' | 'maestro' | 'unknown';

export function CreditCardValidator() {
  const [cardNumber, setCardNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const cleanNumber = cardNumber.replace(/\D/g, '');

  const network = useMemo((): CardNetwork => {
    if (!cleanNumber) return 'unknown';

    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6(?:011|5|4[4-9]|22(?:12[6-9]|1[3-9]|[2-8]|9[01]|92[0-5]))/.test(cleanNumber)) return 'discover';
    if (/^35(?:2[89]|[3-8][0-9])/.test(cleanNumber)) return 'jcb';
    if (/^3(?:0[0-5]|[689])/.test(cleanNumber)) return 'diners';
    if (/^(5[0678]|6)/.test(cleanNumber)) return 'maestro';

    return 'unknown';
  }, [cleanNumber]);

  const isValid = useMemo(() => {
    if (!cleanNumber || cleanNumber.length < 13) return null;

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

  const formatCardNumber = (val: string) => {
    const raw = val.replace(/\D/g, '');
    const chunks = raw.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : raw;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCardNumber(formatCardNumber(val));
  };

  const handleCopy = () => {
    if (!cleanNumber) return;
    navigator.clipboard.writeText(cleanNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const networkLabels: Record<CardNetwork, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    jcb: 'JCB',
    diners: 'Diners Club',
    maestro: 'Maestro',
    unknown: 'Inconnu'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="card-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
              Numéro de carte
            </label>
            <button
              onClick={() => setCardNumber('')}
              disabled={!cardNumber}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1 rounded-full transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>

          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <CreditCard className="w-6 h-6" />
            </div>
            <input
              id="card-input"
              type="text"
              value={cardNumber}
              onChange={handleInputChange}
              placeholder="0000 0000 0000 0000"
              className={`w-full p-6 pl-16 bg-slate-50 dark:bg-slate-900 border ${
                isValid === true ? 'border-emerald-500 ring-emerald-500/10' :
                isValid === false ? 'border-rose-500 ring-rose-500/10' :
                'border-slate-200 dark:border-slate-800'
              } rounded-[2rem] outline-none focus:ring-4 transition-all text-2xl font-black font-mono tracking-wider dark:text-white`}
              maxLength={23} // 19 digits + 4 spaces
            />
          </div>

          <div className="flex gap-3">
             <button
              onClick={handleCopy}
              disabled={!cleanNumber}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold transition-all ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-500/50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? 'Copié' : 'Copier le numéro'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col items-center text-center space-y-4 ${
            isValid === true ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
            isValid === false ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20 text-rose-600 dark:text-rose-400' :
            'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-400'
          }`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-2 ${
              isValid === true ? 'bg-emerald-100 dark:bg-emerald-900/30' :
              isValid === false ? 'bg-rose-100 dark:bg-rose-900/30' :
              'bg-white dark:bg-slate-800'
            }`}>
              {isValid === true ? <CheckCircle2 className="w-10 h-10" /> :
               isValid === false ? <AlertCircle className="w-10 h-10" /> :
               <CreditCard className="w-10 h-10" />}
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black uppercase tracking-tight">
                {isValid === true ? 'Carte Valide' :
                 isValid === false ? 'Carte Invalide' :
                 'En attente de saisie'}
              </h3>
              <p className="text-sm font-medium opacity-70">
                {isValid === true ? 'Le numéro respecte l\'algorithme de Luhn.' :
                 isValid === false ? 'Le numéro ne respecte pas l\'algorithme de Luhn.' :
                 'Saisissez au moins 13 chiffres pour valider.'}
              </p>
            </div>

            {cleanNumber && (
              <div className="pt-4 w-full border-t border-current/10 flex flex-col items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">Réseau Détecté</span>
                <span className="text-lg font-black">{networkLabels[network]}</span>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 flex items-start gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
             </div>
             <div className="space-y-2">
                <h4 className="font-bold dark:text-white">Sécurité locale</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                  Le traitement est effectué entièrement dans votre navigateur. Aucun numéro de carte n'est envoyé sur nos serveurs.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Educational Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Qu'est-ce que l'algorithme de Luhn ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Également appelé formule "modulo 10", c'est une somme de contrôle simple utilisée pour valider divers numéros d'identification, comme les numéros de cartes bancaires ou les numéros SIREN/SIRET en France.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Est-ce sûr ?
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Oui. Cet outil vérifie uniquement la validité mathématique du numéro. Il ne vérifie pas si la carte est active, le solde du compte, ou la date d'expiration. Aucune donnée n'est stockée.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-indigo-500" /> Réseaux supportés
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'outil détecte automatiquement les principaux réseaux : Visa, Mastercard, American Express, Discover, JCB, Diners Club et Maestro sur la base des premiers chiffres (IIN).
          </p>
        </div>
      </div>
    </div>
  );
}
