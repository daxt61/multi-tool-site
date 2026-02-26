import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Shield, ShieldAlert, ShieldCheck, Eye, EyeOff, Lock, Unlock } from 'lucide-react';

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
  }, [mode, length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrength = () => {
    if (!password) return { score: 0, label: 'Aucun', color: 'bg-slate-200', text: 'text-slate-400', icon: <ShieldAlert className="w-4 h-4" /> };

    let score = 0;
    const requirements = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /[0-9]/.test(password),
      symbols: /[^a-zA-Z0-9]/.test(password),
      extraLength: password.length >= 20
    };

    if (requirements.length) score++;
    if (requirements.uppercase) score++;
    if (requirements.lowercase) score++;
    if (requirements.numbers) score++;
    if (requirements.symbols) score++;
    if (requirements.extraLength) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, label: 'Très faible', color: 'bg-rose-500', text: 'text-rose-500', icon: <ShieldAlert className="w-4 h-4" />, requirements };
      case 2:
        return { score, label: 'Faible', color: 'bg-orange-500', text: 'text-orange-500', icon: <ShieldAlert className="w-4 h-4" />, requirements };
      case 3:
        return { score, label: 'Moyen', color: 'bg-amber-500', text: 'text-amber-500', icon: <Shield className="w-4 h-4" />, requirements };
      case 4:
        return { score, label: 'Bon', color: 'bg-lime-500', text: 'text-lime-500', icon: <Shield className="w-4 h-4" />, requirements };
      case 5:
        return { score, label: 'Fort', color: 'bg-emerald-500', text: 'text-emerald-500', icon: <ShieldCheck className="w-4 h-4" />, requirements };
      case 6:
        return { score, label: 'Très fort', color: 'bg-indigo-600', text: 'text-indigo-600', icon: <ShieldCheck className="w-4 h-4" />, requirements };
      default:
        return { score, label: 'Inconnu', color: 'bg-slate-200', text: 'text-slate-400', icon: <ShieldAlert className="w-4 h-4" />, requirements };
    }
  };

  const strength = getStrength();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Mode Switcher */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setMode('generate')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'generate' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Générer
        </button>
        <button
          onClick={() => { setMode('verify'); setPassword(''); }}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'verify' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Vérifier
        </button>
      </div>

      {/* Display Area */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="flex-1 relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => mode === 'verify' && setPassword(e.target.value)}
              readOnly={mode === 'generate'}
              autoComplete="off"
              className={`w-full bg-transparent text-3xl md:text-5xl font-mono text-white outline-none tracking-tight text-center md:text-left selection:bg-indigo-500/30 ${mode === 'verify' ? 'cursor-text border-b border-white/10 focus:border-indigo-500 transition-colors pb-2' : ''}`}
              placeholder={mode === 'verify' ? "Saisissez un mot de passe..." : ""}
            />
            {mode === 'verify' && (
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {mode === 'generate' ? (
              <button
                onClick={generatePassword}
                className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95"
                title="Régénérer"
                aria-label="Régénérer le mot de passe"
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            ) : (
              <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                {strength.score >= 5 ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
              </div>
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
          <div className="mt-10 pt-10 border-t border-white/10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest text-white transition-colors duration-500 ${strength.color}`}>
                  {strength.icon} {strength.label}
                </div>
                <div className="h-2 w-48 bg-white/10 rounded-full overflow-hidden flex gap-0.5 p-0.5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 rounded-sm transition-all duration-500 ${i <= strength.score ? strength.color : 'bg-white/5'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-white/40 font-bold text-sm tracking-widest uppercase">
                {password.length} caractères
              </div>
            </div>

            {mode === 'verify' && strength.requirements && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: '12+ Caract.', met: strength.requirements.length },
                  { label: 'Majuscule', met: strength.requirements.uppercase },
                  { label: 'Minuscule', met: strength.requirements.lowercase },
                  { label: 'Chiffre', met: strength.requirements.numbers },
                  { label: 'Symbole', met: strength.requirements.symbols },
                  { label: '20+ Caract.', met: strength.requirements.extraLength },
                ].map((req, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${req.met ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/30'}`}>
                    {req.met ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current opacity-30" />}
                    {req.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {mode === 'generate' ? (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
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
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-6">
            <h3 className="text-xl font-black dark:text-white mb-4">Conseils de sécurité</h3>
            <ul className="space-y-4">
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Utilisez au moins <strong>12 caractères</strong>. Plus le mot de passe est long, plus il est difficile à craquer par force brute.
                </p>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Mélangez <strong>majuscules, minuscules, chiffres et symboles</strong> pour augmenter la complexité.
                </p>
              </li>
              <li className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Évitez les mots du dictionnaire, les suites logiques (1234) ou les informations personnelles (date de naissance).
                </p>
              </li>
            </ul>
          </div>
        )}

        {/* Info */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden flex flex-col justify-center">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
           <ShieldCheck className="w-12 h-12 mb-6 opacity-50" />
           <h3 className="text-2xl font-black mb-4">Confidentialité totale</h3>
           <p className="text-indigo-100 font-medium leading-relaxed">
             Que vous génériez ou vérifiiez un mot de passe, tous les calculs sont effectués localement sur votre navigateur. <strong>Aucune donnée n'est envoyée à nos serveurs.</strong>
           </p>
        </div>
      </div>
    </div>
  );
}
