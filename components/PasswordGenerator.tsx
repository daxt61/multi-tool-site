import { useState, useEffect } from 'react';
import { Copy, RefreshCw, Check, Shield, ShieldAlert, ShieldCheck, Key, BookOpen, Trash2 } from 'lucide-react';

const WORDS = [
  'bleu', 'rouge', 'vert', 'jaune', 'noir', 'blanc', 'orange', 'rose', 'gris', 'brun',
  'petit', 'grand', 'rapide', 'lent', 'fort', 'faible', 'chaud', 'froid', 'beau', 'jeune',
  'chat', 'chien', 'oiseau', 'lion', 'tigre', 'ours', 'loup', 'renard', 'lapin', 'singe',
  'maison', 'jardin', 'arbre', 'fleur', 'soleil', 'lune', 'etoile', 'mer', 'vent', 'pluie',
  'pomme', 'pain', 'eau', 'lait', 'cafe', 'the', 'sucre', 'sel', 'riz', 'pate',
  'livre', 'stylo', 'ecran', 'table', 'chaise', 'porte', 'fenetre', 'route', 'pont', 'ville',
  'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
  'calme', 'libre', 'heureux', 'nouveau', 'ancien', 'clair', 'sombre', 'doux', 'dur', 'leger',
  'avion', 'train', 'velo', 'voiture', 'bateau', 'fusée', 'moteur', 'vitesse', 'espace', 'temps',
  'musique', 'danse', 'peinture', 'cinema', 'theatre', 'poeme', 'histoire', 'reve', 'vie', 'coeur'
];

export function PasswordGenerator() {
  const [mode, setMode] = useState<'random' | 'passphrase'>('random');
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [wordCount, setWordCount] = useState(4);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);
  const [copied, setCopied] = useState(false);

  const getSecureRandomIndex = (range: number) => {
    const array = new Uint32Array(1);
    if (range >= 0x100000000) {
      window.crypto.getRandomValues(array);
      return array[0];
    }
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - (maxUint32 % range);
    let randomVal;
    do {
      window.crypto.getRandomValues(array);
      randomVal = array[0];
    } while (randomVal >= limit);
    return randomVal % range;
  };

  const generatePassword = () => {
    if (mode === 'random') {
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

      let newPassword = '';
      for (let i = 0; i < length; i++) {
        newPassword += charset.charAt(getSecureRandomIndex(charset.length));
      }
      setPassword(newPassword);
    } else {
      const selectedWords = [];
      for (let i = 0; i < wordCount; i++) {
        selectedWords.push(WORDS[getSecureRandomIndex(WORDS.length)]);
      }
      setPassword(selectedWords.join('-'));
    }
    setCopied(false);
  };

  useEffect(() => {
    generatePassword();
  }, [mode, length, wordCount, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStrength = () => {
    if (!password) return { label: '', color: 'bg-slate-200', icon: <ShieldAlert /> };

    if (mode === 'passphrase') {
      if (wordCount < 3) return { label: 'Faible', color: 'bg-rose-500', icon: <ShieldAlert className="w-4 h-4" /> };
      if (wordCount < 5) return { label: 'Moyen', color: 'bg-amber-500', icon: <Shield className="w-4 h-4" /> };
      return { label: 'Fort', color: 'bg-emerald-500', icon: <ShieldCheck className="w-4 h-4" /> };
    }

    let score = 0;
    if (password.length >= 12) score++;
    if (password.length >= 20) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 3) return { label: 'Faible', color: 'bg-rose-500', icon: <ShieldAlert className="w-4 h-4" /> };
    if (score <= 5) return { label: 'Moyen', color: 'bg-amber-500', icon: <Shield className="w-4 h-4" /> };
    return { label: 'Fort', color: 'bg-emerald-500', icon: <ShieldCheck className="w-4 h-4" /> };
  };

  const strength = getStrength();

  const handleClear = () => {
    setPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end px-1">
        <button
          onClick={handleClear}
          disabled={!password}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 className="w-3 h-3" /> Effacer
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode('random')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === 'random'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Key className="w-4 h-4" /> Aléatoire
          </button>
          <button
            onClick={() => setMode('passphrase')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === 'passphrase'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Memorable
          </button>
        </div>
      </div>

      {/* Display Area */}
      <div className="bg-slate-900 dark:bg-black p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <input
            type="text"
            value={password}
            readOnly
            className={`flex-1 bg-transparent font-mono text-white outline-none tracking-tight w-full text-center md:text-left selection:bg-indigo-500/30 ${
              password.length > 30 ? 'text-2xl md:text-3xl' : 'text-3xl md:text-5xl'
            }`}
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
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-white text-slate-900 hover:bg-slate-100'
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
                {strength.icon} {strength.label}
              </div>
              <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${strength.color}`}
                  style={{ width: strength.label === 'Faible' ? '33%' : strength.label === 'Moyen' ? '66%' : '100%' }}
                />
              </div>
            </div>
            <div className="text-white/40 font-bold text-sm tracking-widest uppercase">
              {mode === 'random' ? `${password.length} caractères` : `${wordCount} mots`}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8">
          {mode === 'random' ? (
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
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre de mots</label>
                <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{wordCount}</span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          )}

          {mode === 'random' && (
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
          )}

          {mode === 'passphrase' && (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
               <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                 Le mode <strong>Mémorable</strong> (Passphrase) génère une suite de mots aléatoires séparés par des tirets. Ces mots de passe sont souvent plus faciles à retenir tout en restant très sécurisés grâce à leur longueur.
               </p>
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
