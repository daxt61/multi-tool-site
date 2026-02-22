import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Shield, ShieldAlert, ShieldCheck, Eye, EyeOff, Search } from 'lucide-react';

export function PasswordGenerator() {
  const [mode, setMode] = useState<'generate' | 'verify'>('generate');
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  const generatePassword = () => {
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeSimilar) {
      charset = charset.replace(/[il1Lo0O]/g, '');
    }

    if (charset === '') {
      setPassword('');
      return;
    }

    const getSecureRandomIndex = (range: number) => {
      const array = new Uint32Array(1);
      const maxUint32 = 0xffffffff;
      const limit = maxUint32 - (maxUint32 % range);
      let randomVal;
      do {
        window.crypto.getRandomValues(array);
        randomVal = array[0];
      } while (randomVal >= limit);
      return randomVal % range;
    };

    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(getSecureRandomIndex(charset.length));
    }
    setPassword(newPassword);
    setCopied(false);
  };

  useEffect(() => {
    if (mode === 'generate') {
      generatePassword();
    }
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, mode]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrength = () => {
    if (!password) return { score: 0, label: 'Vide', color: 'bg-slate-200', text: 'text-slate-400' };

    let score = 0;
    const criteria = {
      length: password.length >= 12,
      veryLong: password.length >= 16,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password),
    };

    score = Object.values(criteria).filter(Boolean).length;

    if (score <= 2) return { score, label: 'Très Faible', color: 'bg-rose-600', text: 'text-rose-600' };
    if (score === 3) return { score, label: 'Faible', color: 'bg-rose-400', text: 'text-rose-400' };
    if (score === 4) return { score, label: 'Moyen', color: 'bg-amber-500', text: 'text-amber-500' };
    if (score === 5) return { score, label: 'Fort', color: 'bg-emerald-500', text: 'text-emerald-500' };
    return { score, label: 'Très Fort', color: 'bg-emerald-600', text: 'text-emerald-600' };
  };

  const strength = getStrength();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Mode Switcher */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setMode('generate')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            mode === 'generate'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Générer
        </button>
        <button
          onClick={() => setMode('verify')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            mode === 'verify'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Vérifier
        </button>
      </div>

      {/* Display Area */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="flex-1 w-full relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => mode === 'verify' && setPassword(e.target.value)}
              readOnly={mode === 'generate'}
              autoComplete="off"
              className={`w-full bg-transparent text-3xl md:text-5xl font-mono text-white outline-none tracking-tight text-center md:text-left selection:bg-indigo-500/30 ${mode === 'verify' ? 'cursor-text border-b border-white/20 focus:border-indigo-500' : ''}`}
              placeholder={mode === 'verify' ? "Saisir un mot de passe..." : ""}
            />
            {mode === 'verify' && (
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors"
                aria-label={showPassword ? "Cacher" : "Montrer"}
              >
                {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {mode === 'generate' && (
              <button
                onClick={generatePassword}
                className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95"
                title="Régénérer"
                aria-label="Régénérer le mot de passe"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            )}
            <button
              onClick={copyToClipboard}
              disabled={!password}
              className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg disabled:opacity-50 disabled:active:scale-100 ${
                copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
              }`}
            >
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>

        {password && (
          <div className="mt-10 pt-10 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest text-white ${strength.color}`}>
                {strength.score <= 3 ? <ShieldAlert className="w-4 h-4" /> : strength.score <= 5 ? <Shield className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                {strength.label}
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                      i <= strength.score ? strength.color : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="text-white/40 font-bold text-sm tracking-widest uppercase">
              {password.length} caractères
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings / Requirements */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          {mode === 'generate' ? (
            <>
              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Longueur</label>
                  <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{length}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="64"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Majuscules', state: includeUppercase, setState: setIncludeUppercase },
                  { label: 'Minuscules', state: includeLowercase, setState: setIncludeLowercase },
                  { label: 'Chiffres', state: includeNumbers, setState: setIncludeNumbers },
                  { label: 'Symboles', state: includeSymbols, setState: setIncludeSymbols },
                  { label: 'Exclure similaires', state: excludeSimilar, setState: setExcludeSimilar },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => opt.setState(!opt.state)}
                    aria-pressed={opt.state}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      opt.state
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="font-bold text-sm">{opt.label}</span>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      opt.state ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {opt.state && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Analyse des critères</label>
              <div className="space-y-3">
                {[
                  { label: 'Au moins 12 caractères', met: password.length >= 12 },
                  { label: 'Au moins 16 caractères', met: password.length >= 16 },
                  { label: 'Lettres majuscules (A-Z)', met: /[A-Z]/.test(password) },
                  { label: 'Lettres minuscules (a-z)', met: /[a-z]/.test(password) },
                  { label: 'Chiffres (0-9)', met: /[0-9]/.test(password) },
                  { label: 'Symboles (!@#$...)', met: /[^A-Za-z0-9]/.test(password) },
                ].map((req) => (
                  <div
                    key={req.label}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                      req.met
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {req.met ? <Check className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 rounded-full" />}
                    <span className="font-bold text-sm">{req.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden flex flex-col justify-center">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
           <div className="relative z-10">
             {mode === 'generate' ? (
               <>
                 <ShieldCheck className="w-12 h-12 mb-6 opacity-50" />
                 <h3 className="text-2xl font-black mb-4">Sécurité maximale</h3>
                 <p className="text-indigo-100 font-medium leading-relaxed">
                   Nous utilisons <code>window.crypto</code> pour générer des mots de passe avec une entropie élevée. Vos clés ne quittent jamais votre appareil et ne sont jamais enregistrées.
                 </p>
               </>
             ) : (
               <>
                 <Search className="w-12 h-12 mb-6 opacity-50" />
                 <h3 className="text-2xl font-black mb-4">Analyse de robustesse</h3>
                 <p className="text-indigo-100 font-medium leading-relaxed">
                   Testez la force de vos mots de passe actuels. Notre algorithme vérifie la complexité, la longueur et la diversité des caractères pour garantir une protection optimale contre les attaques par force brute.
                 </p>
               </>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
