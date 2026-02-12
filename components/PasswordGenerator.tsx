import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Shield, ShieldAlert, ShieldCheck, X } from 'lucide-react';

interface StrengthRequirements {
  length: boolean;
  veryLong: boolean;
  lower: boolean;
  upper: boolean;
  number: boolean;
  symbol: boolean;
}

interface StrengthInfo {
  label: string;
  color: string;
  width: string;
  score: number;
  requirements: StrengthRequirements;
}

export function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [excludeChars, setExcludeChars] = useState('');
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

    if (excludeChars) {
      try {
        const re = new RegExp(`[${excludeChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`, 'g');
        charset = charset.replace(re, '');
      } catch (e) {
        // Silent fail for invalid regex characters
      }
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
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, excludeChars]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrength = (): StrengthInfo => {
    const requirements: StrengthRequirements = {
      length: password.length >= 12,
      veryLong: password.length >= 20,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^a-zA-Z0-9]/.test(password),
    };

    if (!password) return { label: 'Vide', color: 'bg-slate-200', width: '0%', score: 0, requirements };

    let score = 0;
    if (requirements.length) score++;
    if (requirements.veryLong) score++;
    if (requirements.lower) score++;
    if (requirements.upper) score++;
    if (requirements.number) score++;
    if (requirements.symbol) score++;

    const configs = [
      { label: 'Très Faible', color: 'bg-rose-600', width: '16.6%' },
      { label: 'Faible', color: 'bg-rose-400', width: '33.3%' },
      { label: 'Moyen', color: 'bg-amber-500', width: '50%' },
      { label: 'Bon', color: 'bg-blue-500', width: '66.6%' },
      { label: 'Fort', color: 'bg-emerald-500', width: '83.3%' },
      { label: 'Excellent', color: 'bg-indigo-600', width: '100%' },
    ];

    const config = configs[score - 1] || configs[0];
    return { ...config, score, requirements };
  };

  const strength = getStrength();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Display Area */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <input
            type="text"
            value={password}
            readOnly
            autoComplete="off"
            className="flex-1 bg-transparent text-3xl md:text-5xl font-mono text-white outline-none tracking-tight w-full text-center md:text-left selection:bg-indigo-500/30"
          />
          <div className="flex gap-3">
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
          </div>
        </div>

        {password && (
          <div className="mt-10 pt-10 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-widest text-white ${strength.color} transition-all duration-500`}>
                {strength.score <= 2 ? <ShieldAlert className="w-3 h-3" /> : strength.score <= 4 ? <Shield className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                {strength.label}
              </div>
              <div className="h-2 w-48 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ease-out ${strength.color}`}
                  style={{ width: strength.width }}
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
        {/* Settings */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'upper', label: 'Majuscules', state: includeUppercase, setState: setIncludeUppercase },
              { id: 'lower', label: 'Minuscules', state: includeLowercase, setState: setIncludeLowercase },
              { id: 'numbers', label: 'Chiffres', state: includeNumbers, setState: setIncludeNumbers },
              { id: 'symbols', label: 'Symboles', state: includeSymbols, setState: setIncludeSymbols },
              { id: 'similar', label: 'Exclure similaires', state: excludeSimilar, setState: setExcludeSimilar },
            ].map((opt) => (
              <button
                key={opt.id}
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

          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 px-1">Exclure caractères spécifiques</label>
            <div className="relative">
              <input
                type="text"
                value={excludeChars}
                onChange={(e) => setExcludeChars(e.target.value)}
                placeholder="Ex: @#$%"
                className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-sm focus:border-indigo-500 outline-none transition-all dark:text-white"
              />
              {excludeChars && (
                <button
                  onClick={() => setExcludeChars('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Requirements & Hints */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] space-y-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 px-1">Exigences & Sécurité</h3>

          <div className="space-y-3">
            {[
              { key: 'length', label: 'Au moins 12 caractères', met: strength.requirements.length },
              { key: 'veryLong', label: 'Idéalement 20+ caractères', met: strength.requirements.veryLong },
              { key: 'upper', label: 'Contient des majuscules', met: strength.requirements.upper },
              { key: 'lower', label: 'Contient des minuscules', met: strength.requirements.lower },
              { key: 'number', label: 'Contient des chiffres', met: strength.requirements.number },
              { key: 'symbol', label: 'Contient des symboles', met: strength.requirements.symbol },
            ].map((req) => (
              <div key={req.key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${req.met ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                  {req.met ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                </div>
                <span className={`text-sm font-bold ${req.met ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{req.label}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 leading-relaxed italic">
              Nous utilisons l'API Web Crypto native pour garantir une entropie maximale. Vos mots de passe sont générés localement et ne transitent jamais sur le réseau.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
