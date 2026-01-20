import { useState } from 'react';
import { Copy, RefreshCw, Check } from 'lucide-react';

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
    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(newPassword);
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrength = () => {
    if (!password) return { label: '', color: '' };
    let score = 0;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { label: 'Faible', color: 'bg-red-500' };
    if (score <= 4) return { label: 'Moyen', color: 'bg-yellow-500' };
    return { label: 'Fort', color: 'bg-green-500' };
  };

  const strength = getStrength();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Password display */}
      <div className="bg-gray-900 text-white p-6 rounded-lg mb-6">
        <div className="flex items-center gap-3 mb-3">
          <input
            type="text"
            value={password}
            readOnly
            placeholder="Cliquez sur Générer"
            className="flex-1 bg-transparent text-2xl font-mono outline-none"
          />
          <button
            onClick={copyToClipboard}
            disabled={!password}
            className="p-3 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            title="Copier"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        {password && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${strength.color}`}
                style={{
                  width: strength.label === 'Faible' ? '33%' : strength.label === 'Moyen' ? '66%' : '100%'
                }}
              />
            </div>
            <span className="text-sm">{strength.label}</span>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <label className="font-semibold">Longueur: {length}</label>
          </div>
          <input
            type="range"
            min="4"
            max="64"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={includeUppercase}
            onChange={(e) => setIncludeUppercase(e.target.checked)}
            className="w-5 h-5"
          />
          <span>Majuscules (A-Z)</span>
        </label>

        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={includeLowercase}
            onChange={(e) => setIncludeLowercase(e.target.checked)}
            className="w-5 h-5"
          />
          <span>Minuscules (a-z)</span>
        </label>

        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={includeNumbers}
            onChange={(e) => setIncludeNumbers(e.target.checked)}
            className="w-5 h-5"
          />
          <span>Chiffres (0-9)</span>
        </label>

        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
          <input
            type="checkbox"
            checked={includeSymbols}
            onChange={(e) => setIncludeSymbols(e.target.checked)}
            className="w-5 h-5"
          />
          <span>Symboles (!@#$%^&*)</span>
        </label>
      </div>

      {/* Generate button */}
      <button
        onClick={generatePassword}
        className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-5 h-5" />
        Générer un mot de passe
      </button>
    </div>
  );
}
