import { useState, useEffect, useMemo } from 'react';
import { CreditCard, Check, Copy, Trash2, ShieldCheck, ShieldAlert, Info, Globe, AlertCircle } from 'lucide-react';

export function IBANValidator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [iban, setIban] = useState(initialData?.iban || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ iban });
  }, [iban, onStateChange]);

  const validation = useMemo(() => {
    if (!iban.trim()) return null;

    const cleanIban = iban.replace(/\s/g, '').toUpperCase();

    // Basic length and format check
    if (cleanIban.length < 14 || cleanIban.length > 34) {
      return { isValid: false, message: 'Longueur d\'IBAN invalide (doit être entre 14 et 34 caractères).' };
    }

    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(cleanIban)) {
      return { isValid: false, message: 'Format d\'IBAN invalide.' };
    }

    // MOD-97 algorithm
    // 1. Move the first four characters to the end
    const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);

    // 2. Replace letters with numbers (A=10, B=11, ..., Z=35)
    const numeric = rearranged.split('').map((char: string) => {
      const code = char.charCodeAt(0);
      return code >= 65 && code <= 90 ? (code - 55).toString() : char;
    }).join('');

    // 3. Perform modulo 97 (using BigInt for large numbers)
    try {
      const isValid = BigInt(numeric) % 97n === 1n;
      return {
        isValid,
        message: isValid ? 'IBAN valide' : 'IBAN invalide (échec de la somme de contrôle MOD-97).',
        countryCode: cleanIban.slice(0, 2),
        formatted: cleanIban.match(/.{1,4}/g)?.join(' ')
      };
    } catch (e) {
      return { isValid: false, message: 'Erreur lors du calcul de validation.' };
    }
  }, [iban]);

  const handleCopy = () => {
    if (!iban) return;
    navigator.clipboard.writeText(iban.replace(/\s/g, '').toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setIban('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="space-y-6">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="iban-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">
            Numéro IBAN
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              disabled={!iban}
              className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3 h-3" /> Effacer
            </button>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <CreditCard className={`w-6 h-6 ${validation ? (validation.isValid ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-400'}`} />
          </div>
          <input
            id="iban-input"
            type="text"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            placeholder="FR76 3000 6000 0112 3456 7890 123"
            className={`w-full pl-16 pr-6 py-6 bg-slate-50 dark:bg-slate-900 border-2 ${
              validation
                ? (validation.isValid ? 'border-emerald-500/30 focus:border-emerald-500' : 'border-rose-500/30 focus:border-rose-50')
                : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500'
            } rounded-[2rem] text-2xl font-black font-mono outline-none transition-all dark:text-white placeholder:text-slate-300`}
          />
          {iban && (
            <button
              onClick={handleCopy}
              className={`absolute inset-y-4 right-4 px-4 rounded-2xl transition-all flex items-center gap-2 font-bold text-sm ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          )}
        </div>
      </div>

      {validation && (
        <div className={`p-8 rounded-[2.5rem] border-2 animate-in fade-in slide-in-from-top-4 duration-500 ${
          validation.isValid
            ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-500/20 text-emerald-900 dark:text-emerald-100'
            : 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-500/20 text-rose-900 dark:text-rose-100'
        }`}>
          <div className="flex items-start gap-6">
            <div className={`p-4 rounded-2xl ${validation.isValid ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'}`}>
              {validation.isValid ? <ShieldCheck className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black">{validation.message}</h3>
              {validation.isValid && (
                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold uppercase tracking-widest text-slate-500">Pays : {validation.countryCode}</span>
                  </div>
                  <div className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold font-mono">{validation.formatted}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12 border-t border-slate-100 dark:border-slate-800">
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" /> Algorithme MOD-97
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La validation utilise l'algorithme de la norme ISO 7064 (Modulo 97-10). Un IBAN est valide si le reste de la division du numéro (converti en entiers) par 97 est égal à 1.
          </p>
        </div>
        <div className="space-y-4">
          <h4 className="font-bold dark:text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" /> Format International
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            L'IBAN (International Bank Account Number) commence par un code pays de deux lettres, suivi de deux chiffres de contrôle, puis du numéro de compte national (BBAN). Sa longueur varie selon les pays (27 en France).
          </p>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex items-start gap-4">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <p className="font-bold mb-1">Avertissement de sécurité</p>
          Cet outil vérifie uniquement la validité <strong>structurelle</strong> de l'IBAN via la somme de contrôle. Il ne garantit pas que le compte existe réellement ou qu'il appartient à une personne spécifique.
        </div>
      </div>
    </div>
  );
}
