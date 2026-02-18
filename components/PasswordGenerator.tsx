import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

export function PasswordGenerator() {
  const [mode, setMode] = useState<'generate' | 'verify'>('generate');
  const [password, setPassword] = useState('');
  const [verifyInput, setVerifyInput] = useState('');
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

  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Vide', color: 'bg-slate-200', icon: ShieldAlert };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (pwd.length >= 16) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    // Map 0-7 score to 6 levels
    if (score <= 2) return { score: 1, label: 'Très faible', color: 'bg-rose-600', icon: ShieldAlert };
    if (score <= 3) return { score: 2, label: 'Faible', color: 'bg-rose-400', icon: ShieldAlert };
    if (score <= 4) return { score: 3, label: 'Moyen', color: 'bg-amber-500', icon: Shield };
    if (score <= 5) return { score: 4, label: 'Bon', color: 'bg-lime-500', icon: ShieldCheck };
    if (score <= 6) return { score: 5, label: 'Fort', color: 'bg-emerald-500', icon: ShieldCheck };
    return { score: 6, label: 'Très fort', color: 'bg-indigo-600', icon: ShieldCheck };
  };

  const currentPassword = mode === 'generate' ? password : verifyInput;
  const strength = getStrength(currentPassword);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Mode Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit mx-auto sm:mx-0">
        <button
          onClick={() => setMode('generate')}
          className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${mode === 'generate' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Générer
        </button>
        <button
          onClick={() => setMode('verify')}
          className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${mode === 'verify' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Vérifier
        </button>
      </div>

      {/* Display Area */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group transition-all border-b-4 border-indigo-500/20">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <input
            type={mode === 'generate' ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => mode === 'verify' && setVerifyInput(e.target.value)}
            readOnly={mode === 'generate'}
            autoComplete="off"
            placeholder={mode === 'verify' ? 'Entrez un mot de passe à tester...' : ''}
            className={`flex-1 bg-transparent text-3xl md:text-5xl font-mono text-white outline-none tracking-tight w-full text-center md:text-left selection:bg-indigo-500/30 ${mode === 'verify' ? 'placeholder:text-white/10 placeholder:text-2xl' : ''}`}
          />
          <div className="flex gap-3">
            {mode === 'generate' ? (
              <>
                <button
                  onClick={generatePassword}
                  className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95"
                  title="Régénérer"
                  aria-label="Régénérer le mot de passe"
                >
                  <RefreshCw className="w-6 h-6" />
                </button>
                <button
                  onClick={copyToClipboard}
                  className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                  {copied ? 'Copié' : 'Copier'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setVerifyInput('')}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 font-black"
              >
                Effacer
              </button>
            )}
          </div>
        </div>

        {currentPassword && (
          <div className="mt-10 pt-10 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest text-white ${strength.color} transition-colors`}>
                <strength.icon className="w-4 h-4" /> {strength.label}
              </div>
              <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden flex gap-0.5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className={`h-full flex-1 transition-all duration-500 ${i <= strength.score ? strength.color : 'bg-white/5'}`}
                  />
                ))}
              </div>
            </div>
            <div className="text-white/40 font-bold text-sm tracking-widest uppercase">
              {currentPassword.length} caractères
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings or Hints */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          {mode === 'generate' ? (
            <>
              <div className="space-y-6">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="length-range" className="text-xs font-black uppercase tracking-widest text-slate-400">Longueur</label>
                  <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{length}</span>
                </div>
                <input
                  id="length-range"
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
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 block mb-4">Critères de sécurité</label>
              <div className="space-y-3">
                {[
                  { label: 'Au moins 12 caractères', met: verifyInput.length >= 12 },
                  { label: 'Mélange de majuscules et minuscules', met: /[a-z]/.test(verifyInput) && /[A-Z]/.test(verifyInput) },
                  { label: 'Contient des chiffres', met: /[0-9]/.test(verifyInput) },
                  { label: 'Contient des symboles spéciaux', met: /[^a-zA-Z0-9]/.test(verifyInput) },
                  { label: 'Longueur idéale (16+)', met: verifyInput.length >= 16 },
                ].map((hint, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${hint.met ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                    {hint.met ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    <span className="text-sm font-bold">{hint.label}</span>
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
