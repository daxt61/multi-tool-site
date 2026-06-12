import { useState, useCallback } from 'react';
import { Landmark, Copy, Check, RefreshCw, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSecureRandomInt } from './ui/crypto';

interface CountryConfig {
  code: string;
  name: string;
  length: number;
  format: string; // Placeholder for internal generation logic
}

const COUNTRIES: CountryConfig[] = [
  { code: 'FR', name: 'France', length: 27, format: 'FRkk BBBB BGGG GGCC CCCC CCCC CKK' },
  { code: 'DE', name: 'Germany', length: 22, format: 'DEkk BBBB BBBB CCCC CCCC CC' },
  { code: 'GB', name: 'United Kingdom', length: 22, format: 'GBkk BBBB GGGG GGCC CCCC CC' },
  { code: 'IT', name: 'Italy', length: 27, format: 'ITkk XBBB BBGG GGGX CCCC CCCC CCC' },
  { code: 'ES', name: 'Spain', length: 24, format: 'ESkk BBBB GGGG KKCC CCCC CCCC' },
  { code: 'BE', name: 'Belgium', length: 16, format: 'BEkk BBBB CCCC CCCC' },
  { code: 'CH', name: 'Switzerland', length: 21, format: 'CHkk BBBB BCCC CCCC CCCC C' },
];

export function IBANGenerator() {
  const { t } = useTranslation();
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [iban, setIban] = useState('');
  const [copied, setCopied] = useState(false);

  const generateRandomDigits = (length: number) => {
    let res = '';
    for (let i = 0; i < length; i++) {
      res += getSecureRandomInt(10).toString();
    }
    return res;
  };

  const generateRandomChars = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < length; i++) {
      res += chars.charAt(getSecureRandomInt(chars.length));
    }
    return res;
  };

  const calculateCheckDigits = (ibanWithoutCheck: string) => {
    // Move first 4 chars to the end
    const rearranged = ibanWithoutCheck.substring(4) + ibanWithoutCheck.substring(0, 4);

    // Replace letters with numbers (A=10, B=11, ..., Z=35)
    let numeric = '';
    for (let i = 0; i < rearranged.length; i++) {
      const code = rearranged.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        numeric += (code - 55).toString();
      } else {
        numeric += rearranged[i];
      }
    }

    // MOD 97
    let remainder = 0;
    for (let i = 0; i < numeric.length; i += 7) {
      const chunk = remainder.toString() + numeric.substring(i, i + 7);
      remainder = parseInt(chunk, 10) % 97;
    }

    const checkDigits = (98 - remainder).toString().padStart(2, '0');
    return checkDigits;
  };

  const handleGenerate = useCallback(() => {
    let bban = '';
    if (country.code === 'FR') {
      const bank = generateRandomDigits(5);
      const branch = generateRandomDigits(5);
      const account = generateRandomDigits(11);
      const rib = generateRandomDigits(2);
      bban = bank + branch + account + rib;
    } else if (country.code === 'DE') {
      const bank = generateRandomDigits(8);
      const account = generateRandomDigits(10);
      bban = bank + account;
    } else if (country.code === 'GB') {
      const bank = generateRandomChars(4);
      const sortCode = generateRandomDigits(6);
      const account = generateRandomDigits(8);
      bban = bank + sortCode + account;
    } else {
      bban = generateRandomDigits(country.length - 4);
    }

    const ibanBase = country.code + '00' + bban;
    const checkDigits = calculateCheckDigits(ibanBase);
    const finalIban = country.code + checkDigits + bban;

    // Format with spaces
    setIban(finalIban.match(/.{1,4}/g)?.join(' ') || finalIban);
  }, [country]);

  const handleCopy = () => {
    if (!iban) return;
    navigator.clipboard.writeText(iban.replace(/\s/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800">
          <div className="space-y-4">
            <label htmlFor="iban-country" className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">{t('iban_gen.country_label')}</label>
            <select
              id="iban-country"
              value={country.code}
              onChange={(e) => setCountry(COUNTRIES.find(c => c.code === e.target.value) || COUNTRIES[0])}
              className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20 transition-all"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> {t('iban_gen.generate_btn')}
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400">Result</label>
            {iban && (
              <button
                onClick={handleCopy}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border ${
                  copied
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                    : 'text-slate-500 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            )}
          </div>

          <div className="bg-slate-900 dark:bg-black p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 min-h-[140px] flex items-center justify-center border border-slate-800">
            {iban ? (
              <div className="text-2xl md:text-3xl font-mono font-black text-white tracking-wider text-center break-all">
                {iban}
              </div>
            ) : (
              <div className="text-slate-500 italic text-sm">{t('iban_gen.placeholder')}</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex items-start gap-4">
        <div className="p-3 bg-white dark:bg-slate-800 text-indigo-600 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          <Landmark className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('iban_gen.about_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('iban_gen.about_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
