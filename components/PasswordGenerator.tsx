import { useState, useEffect, useCallback } from 'react';
import { Copy, RefreshCw, Check, Shield, ShieldAlert, ShieldCheck, Key, BookOpen, Trash2, Download } from 'lucide-react';

const WORDS = [
  'bleu', 'rouge', 'vert', 'jaune', 'noir', 'blanc', 'orange', 'rose', 'gris', 'brun', 'violet', 'marron', 'argent', 'or', 'indigo', 'turquoise', 'beige', 'ocre', 'cyan', 'lime',
  'petit', 'grand', 'rapide', 'lent', 'fort', 'faible', 'chaud', 'froid', 'beau', 'jeune', 'vieux', 'riche', 'pauvre', 'doux', 'dur', 'leger', 'lourd', 'propre', 'sale', 'neuf', 'ancien', 'haut', 'bas', 'large', 'etroit', 'rond', 'carre', 'plat', 'amer', 'sucre',
  'chat', 'chien', 'oiseau', 'lion', 'tigre', 'ours', 'loup', 'renard', 'lapin', 'singe', 'cheval', 'vache', 'cochon', 'poule', 'canard', 'souris', 'rat', 'serpent', 'tortue', 'grenouille', 'poisson', 'requin', 'baleine', 'dauphin', 'abeille', 'fourmi', 'mouche', 'papillon', 'araignee', 'hibou',
  'maison', 'jardin', 'arbre', 'fleur', 'soleil', 'lune', 'etoile', 'mer', 'vent', 'pluie', 'neige', 'glace', 'nuage', 'orage', 'foudre', 'terre', 'ciel', 'montagne', 'vallee', 'riviere', 'lac', 'ocean', 'foret', 'desert', 'plage', 'ile', 'rocher', 'sable', 'herbe', 'buisson',
  'pomme', 'pain', 'eau', 'lait', 'cafe', 'the', 'sucre', 'sel', 'riz', 'pate', 'oeuf', 'fromage', 'beurre', 'viande', 'fruit', 'legume', 'soupe', 'salade', 'miel', 'chocolat', 'gateau', 'pizza', 'jus', 'vin', 'biere', 'noix', 'amande', 'fraise', 'banane', 'citron',
  'table', 'chaise', 'porte', 'fenetre', 'lit', 'armoire', 'miroir', 'tapis', 'rideau', 'canape', 'lampe', 'bureau', 'cuisine', 'salon', 'douche', 'cle', 'sac', 'boite', 'verre', 'bol', 'four', 'frigo', 'poele', 'assiette', 'couteau', 'fourchette', 'cuillere', 'serviette', 'balai', 'savon',
  'livre', 'stylo', 'ecran', 'route', 'pont', 'ville', 'village', 'avion', 'train', 'velo', 'voiture', 'bateau', 'moto', 'bus', 'camion', 'fusée', 'moteur', 'vitesse', 'tel', 'ordi', 'clavier', 'souris', 'montre', 'outil', 'marteau', 'scie', 'vis', 'clou', 'colle', 'papier',
  'joie', 'paix', 'amour', 'espoir', 'force', 'esprit', 'raison', 'action', 'travail', 'succes', 'vie', 'mort', 'temps', 'heure', 'minute', 'seconde', 'jour', 'nuit', 'matin', 'soir', 'midi', 'nord', 'sud', 'est', 'ouest', 'droit', 'gauche', 'centre', 'but', 'nom',
  'tete', 'corps', 'bras', 'main', 'doigt', 'jambe', 'pied', 'dos', 'coeur', 'sang', 'peau', 'os', 'nerf', 'oeil', 'nez', 'bouche', 'oreille', 'cheveu', 'voix', 'souffle', 'rire', 'pleur', 'sommeil', 'reve', 'idee', 'sens', 'gout', 'odeur', 'faim', 'soif',
  'musique', 'danse', 'peinture', 'cinema', 'theatre', 'poeme', 'histoire', 'chant', 'piano', 'guitare', 'violon', 'tambour', 'trompette', 'harpe', 'flute', 'orgue', 'cloche', 'rythme', 'son', 'note', 'film', 'page', 'musee', 'art', 'dessin', 'image', 'photo', 'couleur', 'forme',
  'espace', 'atome', 'photon', 'onde', 'masse', 'poids', 'metal', 'acier', 'fer', 'cuivre', 'platine', 'plastique', 'code', 'web', 'site', 'app', 'bug', 'data', 'cloud', 'pixel', 'octet', 'bit', 'hertz', 'volt', 'watt',
  'marche', 'course', 'vol', 'nage', 'saut', 'cri', 'appel', 'jeu', 'sport', 'fight', 'choc', 'clic', 'zoom', 'scan', 'flux', 'bloc', 'lien', 'post', 'mail', 'chat', 'quiz', 'test', 'avis', 'plan', 'prix', 'gain', 'perte', 'choix', 'vue'
];

export function PasswordGenerator({ initialData, onStateChange }: { initialData?: any; onStateChange?: (state: any) => void }) {
  const [mode, setMode] = useState<'random' | 'passphrase'>(initialData?.mode || 'random');
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(initialData?.length || 16);
  const [wordCount, setWordCount] = useState(initialData?.wordCount || 4);
  const [capitalizeWords, setCapitalizeWords] = useState(initialData?.capitalizeWords ?? false);
  const [addNumber, setAddNumber] = useState(initialData?.addNumber ?? false);
  const [addSymbol, setAddSymbol] = useState(initialData?.addSymbol ?? false);
  const [includeUppercase, setIncludeUppercase] = useState(initialData?.includeUppercase ?? true);
  const [includeLowercase, setIncludeLowercase] = useState(initialData?.includeLowercase ?? true);
  const [includeNumbers, setIncludeNumbers] = useState(initialData?.includeNumbers ?? true);
  const [includeSymbols, setIncludeSymbols] = useState(initialData?.includeSymbols ?? true);
  const [excludeSimilar, setExcludeSimilar] = useState(initialData?.excludeSimilar ?? false);
  const [copied, setCopied] = useState(false);

  const getSecureRandomIndex = useCallback((range: number) => {
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
  }, []);

  const generatePassword = useCallback(() => {
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
        let word = WORDS[getSecureRandomIndex(WORDS.length)];
        if (capitalizeWords) {
          word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        selectedWords.push(word);
      }

      let res = selectedWords.join('-');
      if (addNumber) {
        res += getSecureRandomIndex(10);
      }
      if (addSymbol) {
        const symbols = '!@#$%^&*';
        res += symbols.charAt(getSecureRandomIndex(symbols.length));
      }
      setPassword(res);
    }
    setCopied(false);
  }, [mode, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, length, wordCount, capitalizeWords, addNumber, addSymbol, getSecureRandomIndex]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  useEffect(() => {
    onStateChange?.({
      mode, length, wordCount, capitalizeWords, addNumber, addSymbol,
      includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar
    });
  }, [mode, length, wordCount, capitalizeWords, addNumber, addSymbol, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, onStateChange]);

  const copyToClipboard = useCallback(() => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [password]);

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

  const handleDownload = () => {
    if (!password) return;
    const blob = new Blob([password], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mot-de-passe-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      // We allow Space for regeneration only if it doesn't interfere with standard accessibility
      // Native behavior for Space on buttons is to activate them.
      // If no interactive element is focused (except body), we can use Space.
      const isBodyFocused = document.activeElement === document.body;

      if ((e.key.toLowerCase() === 'r') || (e.code === 'Space' && isBodyFocused)) {
        e.preventDefault();
        generatePassword();
      } else if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        copyToClipboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [generatePassword, copyToClipboard]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-end items-center gap-2 px-1">
        <button
          onClick={handleDownload}
          disabled={!password}
          className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
        >
          <Download className="w-3 h-3" /> Télécharger
        </button>
        <button
          onClick={handleClear}
          disabled={!password}
          className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none"
        >
          <Trash2 className="w-3 h-3" /> Effacer
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode('random')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              mode === 'random'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            <Key className="w-4 h-4" /> Aléatoire
          </button>
          <button
            onClick={() => setMode('passphrase')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
              className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              title="Régénérer (R)"
              aria-label="Régénérer le mot de passe"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
            <button
              onClick={copyToClipboard}
              className={`px-8 py-4 rounded-2xl transition-all active:scale-95 flex items-center gap-2 font-black text-lg border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                  : 'bg-white text-slate-900 border-transparent hover:bg-slate-100'
              }`}
              title="Copier (C)"
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
                <label htmlFor="password-length" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Longueur</label>
                <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{length}</span>
              </div>
              <input
                id="password-length"
                type="range"
                min="4"
                max="64"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="word-count" className="text-xs font-black uppercase tracking-widest text-slate-400 cursor-pointer">Nombre de mots</label>
                <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{wordCount}</span>
              </div>
              <input
                id="word-count"
                type="range"
                min="2"
                max="10"
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
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
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Capitaliser', state: capitalizeWords, setState: setCapitalizeWords },
                  { label: 'Ajouter Chiffre', state: addNumber, setState: setAddNumber },
                  { label: 'Ajouter Symbole', state: addSymbol, setState: setAddSymbol },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => opt.setState(!opt.state)}
                    aria-pressed={opt.state}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
                      opt.state
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="font-bold text-xs">{opt.label}</span>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      opt.state ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {opt.state && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Le mode <strong>Mémorable</strong> (Passphrase) génère une suite de mots aléatoires séparés par des tirets. Ces mots de passe sont souvent plus faciles à retenir tout en restant très sécurisés grâce à leur longueur.
                </p>
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
