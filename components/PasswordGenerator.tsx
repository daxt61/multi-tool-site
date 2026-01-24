import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';

export function PasswordGenerator() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let charset = '';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (charset === '') {
      setPassword('');
      return;
    }

    let newPassword = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(array[i] % charset.length);
    }
    setPassword(newPassword);
    setCopied(false);
  };

  useEffect(() => {
    generatePassword();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrength = () => {
    if (!password) return { label: '', color: 'bg-gray-200', icon: <ShieldAlert /> };
    let score = 0;
    if (password.length >= 12) score++;
    if (password.length >= 20) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 3) return { label: 'Faible', color: 'bg-red-500', icon: <ShieldAlert className="w-5 h-5" /> };
    if (score <= 5) return { label: 'Moyen', color: 'bg-yellow-500', icon: <Shield className="w-5 h-5" /> };
    return { label: 'Fort', color: 'bg-green-500', icon: <ShieldCheck className="w-5 h-5" /> };
  };

  const strength = getStrength();

  useEffect(() => {
    generatePassword();
  }, []);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Password display */}
      <div className="bg-gray-900 dark:bg-black p-8 rounded-[2.5rem] mb-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32 transition-colors group-hover:bg-indigo-600/20"></div>

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <input
            type="text"
            value={password}
            readOnly
            placeholder="Génération..."
            className="flex-1 bg-transparent text-3xl md:text-4xl font-mono text-white outline-none tracking-wider w-full text-center md:text-left"
          />
          <div className="flex gap-2">
            <button
              onClick={generatePassword}
              className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95"
              title="Régénérer"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!password}
              className={`p-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-bold ${
                copied ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
              }`}
            >
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>

        {password && (
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2 text-white/60 font-bold uppercase tracking-widest text-xs">
                {strength.icon} Sécurité : {strength.label}
              </div>
              <span className="text-white/40 font-mono text-xs">{password.length} caractères</span>
            </div>
            <div className="bg-white/5 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                style={{
                  width: strength.label === 'Faible' ? '33%' : strength.label === 'Moyen' ? '66%' : '100%'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <label className="font-bold text-gray-900 dark:text-white text-lg">Longueur</label>
            <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-4 py-1 rounded-full font-mono font-bold text-xl">
              {length}
            </span>
          </div>
          <input
            type="range"
            min="4"
            max="64"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between mt-3 text-xs font-bold text-gray-400 uppercase tracking-tighter">
            <span>4</span>
            <span>64</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {[
            { id: 'upper', label: 'Majuscules', sub: 'A-Z', state: includeUppercase, setState: setIncludeUppercase },
            { id: 'lower', label: 'Minuscules', sub: 'a-z', state: includeLowercase, setState: setIncludeLowercase },
            { id: 'numbers', label: 'Chiffres', sub: '0-9', state: includeNumbers, setState: setIncludeNumbers },
            { id: 'symbols', label: 'Symboles', sub: '#@$!', state: includeSymbols, setState: setIncludeSymbols },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => opt.setState(!opt.state)}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                opt.state
                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-600/20 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'
              }`}
            >
              <div className="text-left">
                <div className="font-bold">{opt.label}</div>
                <div className="text-xs opacity-60 font-mono">{opt.sub}</div>
              </div>
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                opt.state ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 dark:border-gray-600'
              }`}>
                {opt.state && <Check className="w-4 h-4 stroke-[3]" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 rounded-2xl border border-indigo-100 dark:border-indigo-500/10 flex items-start gap-4">
        <div className="p-2 bg-white dark:bg-gray-800 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <p className="text-indigo-700 dark:text-indigo-300/80 text-sm font-medium leading-relaxed">
          Vos mots de passe sont générés localement dans votre navigateur en utilisant une source d'aléas cryptographiquement sûre. <strong>Aucune donnée n'est envoyée à nos serveurs.</strong>
        </p>
      </div>
    </div>
  );
}
