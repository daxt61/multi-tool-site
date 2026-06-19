import { useState, useEffect, useMemo } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Key, AlertTriangle, CheckCircle2, XCircle, Info, Zap, Fingerprint, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function PasswordAnalyzer() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const analysis = useMemo(() => {
    if (!password) return null;

    const length = password.length;
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    const checks = [
      { id: 'length', label: 'At least 12 characters', passed: length >= 12 },
      { id: 'lower', label: 'Lowercase letters', passed: hasLower },
      { id: 'upper', label: 'Uppercase letters', passed: hasUpper },
      { id: 'number', label: 'Numbers', passed: hasNumber },
      { id: 'symbol', label: 'Special characters', passed: hasSymbol },
      { id: 'pattern', label: 'No repeating patterns', passed: !/(.)\1{2,}/.test(password) },
      { id: 'common', label: 'Not a common sequence', passed: !/123|qwerty|abc|password/i.test(password) },
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
    if (score < 40) return { label: 'Weak', color: 'text-rose-500', bg: 'bg-rose-500', icon: ShieldAlert };
    if (score < 70) return { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-500', icon: Shield };
    return { label: 'Strong', color: 'text-emerald-500', bg: 'bg-emerald-500', icon: ShieldCheck };
  };

  const status = analysis ? getStatus(analysis.score) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-4">
        <label htmlFor="pwd-analyzer" className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-500" /> Enter password to analyze
        </label>
        <div className="relative">
          <input
            id="pwd-analyzer"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-xl font-mono text-center dark:text-slate-200"
            placeholder="••••••••••••"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
          >
            {showPassword ? <Lock className="w-5 h-5" /> : <Fingerprint className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {analysis ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem]">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1">Security Score</h3>
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
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entropy (bits)</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="text-xl font-black font-mono dark:text-white">{analysis.length}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Length</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-2">Analysis Checks</h3>
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
           <p className="text-slate-400 font-medium">Enter a password to start the security analysis.</p>
        </div>
      )}

      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-8 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 flex gap-6">
        <div className="hidden sm:flex w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl items-center justify-center text-indigo-500 shadow-sm flex-shrink-0">
          <Zap className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold dark:text-white">Why Entropy Matters?</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Entropy is a measure of a password's unpredictability. A password with 128 bits of entropy is practically uncrackable by today's supercomputers. Length is often more important than complexity; a long phrase is usually better than a short random string.
          </p>
        </div>
      </div>
    </div>
  );
}
