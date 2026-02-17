import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

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
    generatePassword();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrength = () => {
    if (!password) return { score: 0, label: 'Vide', color: 'bg-slate-200', icon: <ShieldAlert className="w-4 h-4" /> };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    // Normalizing to 6 levels
    const finalScore = Math.min(Math.floor((score / 7) * 6), 6);

    const levels = [
      { label: 'Très Faible', color: 'bg-rose-600', icon: <ShieldAlert className="w-4 h-4" /> },
      { label: 'Faible', color: 'bg-rose-500', icon: <ShieldAlert className="w-4 h-4" /> },
      { label: 'Moyen', color: 'bg-orange-500', icon: <Shield className="w-4 h-4" /> },
      { label: 'Bon', color: 'bg-amber-500', icon: <Shield className="w-4 h-4" /> },
      { label: 'Fort', color: 'bg-emerald-500', icon: <ShieldCheck className="w-4 h-4" /> },
      { label: 'Très Fort', color: 'bg-indigo-600', icon: <ShieldCheck className="w-4 h-4" /> },
    ];

    return { score: finalScore, ...levels[Math.max(0, finalScore - 1)] };
  };

  const strength = getStrength();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Mode Switcher */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mx-auto">
        <button
          onClick={() => setMode('generate')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            mode === 'generate' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'
          }`}
        >
          Générer
        </button>
        <button
          onClick={() => { setMode('verify'); setPassword(''); }}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            mode === 'verify' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500'
          }`}
        >
          Vérifier
        </button>
      </div>

      {/* Display Area */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <input
            type={mode === 'generate' ? "text" : "password"}
            value={password}
            onChange={(e) => mode === 'verify' && setPassword(e.target.value)}
            readOnly={mode === 'generate'}
            autoComplete="off"
            placeholder={mode === 'verify' ? "Entrez un mot de passe..." : ""}
            className={`flex-1 bg-transparent text-3xl md:text-5xl font-mono text-white outline-none tracking-tight w-full text-center md:text-left selection:bg-indigo-500/30 ${mode === 'verify' ? 'placeholder:text-white/20' : ''}`}
          />
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
              className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg ${
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
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest text-white transition-colors duration-500 ${strength.color}`}>
                {strength.icon} {strength.label}
              </div>
              <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${strength.color}`}
                  style={{ width: `${(strength.score / 6) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-white/40 font-bold text-sm tracking-widest uppercase">
              {password.length} caractères
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings / Checklist */}
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
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Critères de sécurité</label>
              <div className="space-y-3">
                {[
                  { label: 'Au moins 8 caractères', met: password.length >= 8 },
                  { label: 'Au moins 12 caractères (Recommandé)', met: password.length >= 12 },
                  { label: 'Contient des majuscules', met: /[A-Z]/.test(password) },
                  { label: 'Contient des minuscules', met: /[a-z]/.test(password) },
                  { label: 'Contient des chiffres', met: /[0-9]/.test(password) },
                  { label: 'Contient des symboles spéciaux', met: /[^a-zA-Z0-9]/.test(password) },
                ].map((crit) => (
                  <div key={crit.label} className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl transition-all">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      crit.met ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-300'
                    }`}>
                      <Check className={`w-4 h-4 transition-transform ${crit.met ? 'scale-100' : 'scale-0'}`} />
                    </div>
                    <span className={`text-sm font-bold transition-colors ${crit.met ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                      {crit.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden flex flex-col justify-center">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
           <ShieldCheck className="w-12 h-12 mb-6 opacity-50" />
           <h3 className="text-2xl font-black mb-4">Sécurité maximale</h3>
           <p className="text-indigo-100 font-medium leading-relaxed">
             Nous utilisons <code>window.crypto</code> pour générer des mots de passe avec une entropie élevée. Vos clés ne quittent jamais votre appareil et ne sont jamais enregistrées.
           </p>
        </div>
      </div>
    </div>
  );
}
