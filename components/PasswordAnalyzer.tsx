import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Key, CheckCircle2, XCircle, Zap, Fingerprint, Lock, Trash2, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function PasswordAnalyzer() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const analysis = useMemo(() => {
    if (!password) return null;

    const length = password.length;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    const checks = [
      { id: 'length', label: t('pwd_analyzer.check.length'), passed: length >= 12 },
      { id: 'lower', label: t('pwd_analyzer.check.lower'), passed: hasLower },
      { id: 'upper', label: t('pwd_analyzer.check.upper'), passed: hasUpper },
      { id: 'number', label: t('pwd_analyzer.check.number'), passed: hasNumber },
      { id: 'symbol', label: t('pwd_analyzer.check.symbol'), passed: hasSymbol },
      { id: 'pattern', label: t('pwd_analyzer.check.pattern'), passed: !/(.)\1{2,}/.test(password) },
      { id: 'common', label: t('pwd_analyzer.check.common'), passed: !/123|qwerty|abc|password/i.test(password) },
    ];

    let score = 0;
    if (length > 0) score += Math.min(length, 20) * 2;
    if (hasLower) score += 10;
    if (hasUpper) score += 15;
    if (hasNumber) score += 15;
    if (hasSymbol) score += 20;
    if (checks.find(c => c.id === 'pattern')?.passed) score += 10;
    if (checks.find(c => c.id === 'common')?.passed) score += 10;

    const entropy = Math.floor(length * Math.log2(
      (hasLower ? 26 : 0) + (hasUpper ? 26 : 0) + (hasNumber ? 10 : 0) + (hasSymbol ? 33 : 0) || 1
    ));

    return { score: Math.min(score, 100), checks, entropy, length };
  }, [password]);

  const getStatus = (score: number) => {
    if (score < 40) return { label: t('pwd_analyzer.status.weak'), color: 'text-rose-500', bg: 'bg-rose-500', icon: ShieldAlert };
    if (score < 70) return { label: t('pwd_analyzer.status.medium'), color: 'text-amber-500', bg: 'bg-amber-500', icon: Shield };
    return { label: t('pwd_analyzer.status.strong'), color: 'text-emerald-500', bg: 'bg-emerald-500', icon: ShieldCheck };
  };

  const status = analysis ? getStatus(analysis.score) : null;

  const handleClear = useCallback(() => {
    setPassword('');
    inputRef.current?.focus();
  }, []);

  const handleCopy = useCallback(() => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [password]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = document.activeElement?.id === 'pwd-analyzer';

      if (e.key === 'Escape' && isInputFocused) {
        handleClear();
        return;
      }

      if (e.altKey) {
        if (e.key.toLowerCase() === 'c') {
          e.preventDefault();
          handleCopy();
        } else if (e.key.toLowerCase() === 'v') {
          e.preventDefault();
          setShowPassword(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClear, handleCopy]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <label htmlFor="pwd-analyzer" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-500" /> {t('pwd_analyzer.label')}
        </label>
        <div className="relative group/input">
          <input
            id="pwd-analyzer"
            ref={inputRef}
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-6 px-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xl font-mono text-center dark:text-slate-200"
            placeholder={t('pwd_analyzer.placeholder')}
            aria-describedby={analysis ? "analysis-results" : undefined}
          />
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {password && (
              <>
                <button
                  onClick={handleClear}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg outline-none"
                  title={`${t('common.clear')} (Esc)`}
                  aria-label={t('common.clear')}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={handleCopy}
                  className={`p-2 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg outline-none ${copied ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-500'}`}
                  title={`${t('common.copy')} (C)`}
                  aria-label={t('common.copy')}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg outline-none"
            title={`${showPassword ? t('passwordgenerator.hide') : t('passwordgenerator.show')} (Alt+V)`}
            aria-label={showPassword ? t('passwordgenerator.hide_aria') : t('passwordgenerator.show_aria')}
          >
            {showPassword ? <Lock className="w-5 h-5" /> : <Fingerprint className="w-5 h-5" />}
          </button>

          <div className="absolute -bottom-6 left-0 right-0 flex justify-center gap-4 opacity-0 group-focus-within/input:opacity-100 transition-opacity pointer-events-none">
            {password && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><kbd className="px-1 py-0.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">Esc</kbd> {t('common.clear')}</span>}
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><kbd className="px-1 py-0.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[9px]">Alt</kbd> + <kbd className="px-1 py-0.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">V</kbd> {showPassword ? t('passwordgenerator.hide') : t('passwordgenerator.show')}</span>
            {password && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><kbd className="px-1 py-0.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 text-[9px]">Alt</kbd> + <kbd className="px-1 py-0.5 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">C</kbd> {t('common.copy')}</span>}
          </div>
        </div>
      </div>

      {analysis ? (
        <div id="analysis-results" className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem]">
            <div className="flex justify-between items-end" aria-live="polite" aria-atomic="true">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1">{t('pwd_analyzer.score_title')}</h3>
                <div className={`text-4xl font-black ${status?.color || ''}`}>{analysis.score}%</div>
              </div>
              <div className="text-right">
                {status && <status.icon className={`w-10 h-10 ${status.color} mb-1 ml-auto`} />}
                <span className={`font-bold ${status?.color || ''}`}>{status?.label}</span>
              </div>
            </div>

            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${status?.bg || ''} transition-all duration-1000 ease-out`}
                style={{ width: `${analysis.score}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="text-xl font-black font-mono dark:text-white">{analysis.entropy}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('pwd_analyzer.entropy_label')}</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="text-xl font-black font-mono dark:text-white">{analysis.length}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('pwd_analyzer.length_label')}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-2">{t('pwd_analyzer.checks_title')}</h3>
            <div className="space-y-2">
              {analysis.checks.map((check) => (
                <div
                  key={check.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    check.passed
                      ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-50 border-slate-100 dark:bg-slate-800/30 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-sm font-bold">{check.label}</span>
                  {check.passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5 opacity-20" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
           <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
           <p className="text-slate-400 font-medium">{t('pwd_analyzer.empty_hint')}</p>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-6">
        <div className="hidden sm:flex w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl items-center justify-center text-indigo-500 shadow-sm flex-shrink-0">
          <Zap className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">{t('pwd_analyzer.why_entropy_title')}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('pwd_analyzer.why_entropy_text')}
          </p>
        </div>
      </div>
    </div>
  );
}
