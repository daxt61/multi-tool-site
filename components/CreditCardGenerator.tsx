import { useState, useCallback } from 'react';
import { CreditCard, Copy, Check, RefreshCw, Info, Calendar, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

interface ProviderConfig {
  id: string;
  name: string;
  prefixes: string[];
  length: number;
}

const PROVIDERS: ProviderConfig[] = [
  { id: 'visa', name: 'Visa', prefixes: ['4'], length: 16 },
  { id: 'mastercard', name: 'Mastercard', prefixes: ['51', '52', '53', '54', '55'], length: 16 },
  { id: 'amex', name: 'American Express', prefixes: ['34', '37'], length: 15 },
  { id: 'discover', name: 'Discover', prefixes: ['6011'], length: 16 },
  { id: 'jcb', name: 'JCB', prefixes: ['3528', '3589'], length: 16 },
];

export function CreditCardGenerator() {
  const { t } = useTranslation();
  const [provider, setProvider] = useState(PROVIDERS[0]);
  const [card, setCard] = useState<any>(null);
  const [copied, setCopied] = useState('');

  const generateLuhn = (prefix: string, length: number) => {
    let ccNumber = prefix;
    while (ccNumber.length < length - 1) {
      ccNumber += getSecureRandomInt(10).toString();
    }

    let sum = 0;
    let shouldDouble = true;
    for (let i = ccNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(ccNumber[i], 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return ccNumber + checkDigit.toString();
  };

  const handleGenerate = useCallback(() => {
    const prefix = provider.prefixes[getSecureRandomInt(provider.prefixes.length)];
    const number = generateLuhn(prefix, provider.length);

    // Format number
    let formatted = number;
    if (provider.id === 'amex') {
      formatted = number.replace(/^(\d{4})(\d{6})(\d{5})$/, '$1 $2 $3');
    } else {
      formatted = number.match(/.{1,4}/g)?.join(' ') || number;
    }

    const month = (getSecureRandomInt(12) + 1).toString().padStart(2, '0');
    const year = (new Date().getFullYear() + getSecureRandomInt(5) + 1).toString().slice(-2);
    const cvv = (getSecureRandomInt(provider.id === 'amex' ? 9000 : 900) + (provider.id === 'amex' ? 1000 : 100)).toString();

    setCard({ number, formatted, expiry: `${month}/${year}`, cvv });
  }, [provider]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="space-y-4">
            <label htmlFor="cc-provider" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('cc_gen.provider_label')}</label>
            <div className="grid grid-cols-1 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p)}
                  className={`flex items-center justify-between p-4 rounded-2xl border font-bold transition-all ${
                    provider.id === p.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-indigo-500/50'
                  }`}
                >
                  {p.name}
                  <CreditCard className={`w-5 h-5 ${provider.id === p.id ? 'opacity-100' : 'opacity-20'}`} />
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> {t('cc_gen.generate_btn')}
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Card Preview</label>
          </div>

          <div className="relative group">
            {/* Visual Card */}
            <div className="aspect-[1.586/1] w-full bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl p-8 text-white shadow-2xl overflow-hidden flex flex-col justify-between border border-white/10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full -ml-24 -mb-24 blur-3xl" />

              <div className="flex justify-between items-start relative z-10">
                <div className="w-12 h-10 bg-gradient-to-br from-amber-200 to-amber-500 rounded-lg opacity-80" />
                <span className="font-black italic text-xl tracking-tighter opacity-50">{provider.name}</span>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="text-2xl md:text-3xl font-mono font-bold tracking-[0.2em]">
                  {card ? card.formatted : '•••• •••• •••• ••••'}
                </div>

                <div className="flex gap-8">
                  <div className="space-y-1">
                    <div className="text-[8px] uppercase tracking-widest opacity-40">Expiry</div>
                    <div className="font-mono font-bold">{card ? card.expiry : '••/••'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-[8px] uppercase tracking-widest opacity-40">CVV</div>
                    <div className="font-mono font-bold">{card ? card.cvv : '•••'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Copy Stats */}
            {card && (
              <div className="grid grid-cols-1 gap-2 mt-6">
                <button
                  onClick={() => copyToClipboard(card.number, 'number')}
                  className={`flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all group hover:border-indigo-500/30`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                    <span className="text-sm font-mono dark:text-slate-300">{card.formatted}</span>
                  </div>
                  {copied === 'number' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-300" />}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => copyToClipboard(card.expiry, 'expiry')}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all group hover:border-indigo-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                      <span className="text-sm font-mono dark:text-slate-300">{card.expiry}</span>
                    </div>
                    {copied === 'expiry' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-300" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(card.cvv, 'cvv')}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all group hover:border-indigo-500/30"
                  >
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                      <span className="text-sm font-mono dark:text-slate-300">{card.cvv}</span>
                    </div>
                    {copied === 'cvv' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-300" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Info className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('cc_gen.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('cc_gen.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
