import { useState, useEffect } from 'react';
import { Shield, Key, Copy, Check, Trash2, Info, AlertCircle, Clock, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function PasswordStrengthMeter({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState(initialData?.password || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    onStateChange?.({ password });
  }, [password]);

  const calculateEntropy = (pwd: string) => {
    if (!pwd) return 0;
    let charsetSize = 0;
    if (/[a-z]/.test(pwd)) charsetSize += 26;
    if (/[A-Z]/.test(pwd)) charsetSize += 26;
    if (/[0-9]/.test(pwd)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(pwd)) charsetSize += 33;

    return Math.floor(pwd.length * Math.log2(charsetSize || 1));
  };

  const entropy = calculateEntropy(password);

  const getStrength = (e: number) => {
    if (e === 0) return { label: 'N/A', color: 'bg-slate-200', text: 'text-slate-400', width: '0%' };
    if (e < 28) return { label: t('passwordgenerator.strength.very_weak'), color: 'bg-rose-500', text: 'text-rose-500', width: '20%' };
    if (e < 36) return { label: t('passwordgenerator.strength.weak'), color: 'bg-orange-500', text: 'text-orange-500', width: '40%' };
    if (e < 60) return { label: t('passwordgenerator.strength.medium'), color: 'bg-amber-500', text: 'text-amber-500', width: '60%' };
    if (e < 128) return { label: t('passwordgenerator.strength.strong'), color: 'bg-emerald-500', text: 'text-emerald-500', width: '80%' };
    return { label: t('passwordgenerator.strength.unbreakable'), color: 'bg-indigo-500', text: 'text-indigo-500', width: '100%' };
  };

  const strength = getStrength(entropy);

  const getTimeToCrack = (e: number) => {
    if (e === 0) return 'N/A';
    const combinations = Math.pow(2, e);
    const speed = 1e10; // 10 billion guesses per second
    const seconds = combinations / speed;

    if (seconds < 1) return t('wordcounter.time.less_than_second');
    if (seconds < 60) return t('wordcounter.time.seconds', { count: Math.floor(seconds) });
    if (seconds < 3600) return t('wordcounter.time.minutes', { count: Math.floor(seconds / 60) });
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} ${t('passwordstrength.hours') || 'hours'}`;
    if (seconds < 31536000) return `${Math.floor(seconds / 86400)} ${t('passwordstrength.days') || 'days'}`;
    if (seconds < 3153600000) return `${Math.floor(seconds / 31536000)} ${t('passwordstrength.years') || 'years'}`;
    return t('passwordstrength.centuries') || 'Centuries';
  };

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <label htmlFor="password-input" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">{t('passwordgenerator.length')}</label>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!password}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                copied ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              } disabled:opacity-50`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('common.copied') : t('common.copy')}
            </button>
            <button
              onClick={() => setPassword('')}
              disabled={!password}
              className="p-2 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:bg-rose-100 disabled:opacity-50 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <input
          id="password-input"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter a password to test..."
          className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-xl font-mono text-center dark:text-slate-200"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{t('passwordgenerator.entropy_calc')}</h3>
            <span className={`text-sm font-black ${strength.text}`}>{strength.label}</span>
          </div>

          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${strength.color} transition-all duration-500 ease-out`}
              style={{ width: strength.width }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="space-y-1">
              <div className="text-2xl font-black font-mono dark:text-white">{entropy}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('passwordgenerator.entropy_bits')}</div>
            </div>
            <div className="space-y-1 text-right">
              <div className="text-2xl font-black font-mono dark:text-white">{password.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('wordcounter.stat.characters')}</div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-[2.5rem] space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-indigo-500 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Time to Crack
          </h3>
          <div className="space-y-1">
            <div className="text-3xl font-black text-slate-900 dark:text-white break-words leading-tight">
              {getTimeToCrack(entropy)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Estimated time to crack at 10 billion guesses/sec</p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/50">
            <Zap className="w-5 h-5 text-indigo-500" />
            <p className="text-[10px] font-medium leading-relaxed">
              Entropy measures bits of unpredictability. 128+ bits is considered unbreakable with current technology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
